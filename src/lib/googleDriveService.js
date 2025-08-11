// Google Drive Service for file management
class GoogleDriveService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    this.scopes = 'https://www.googleapis.com/auth/drive.file';
    this.isInitialized = false;
    this.isSignedIn = false;
    this.gapi = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Check if API keys are configured
    if (!this.apiKey || !this.clientId) {
      throw new Error('Google Drive API keys not configured. Please add VITE_GOOGLE_API_KEY and VITE_GOOGLE_CLIENT_ID to your environment variables.');
    }

    try {
      // Load Google API
      await this.loadGoogleAPI();
      
      // Initialize gapi
      await this.gapi.load('auth2:picker:client', async () => {
        await this.gapi.client.init({
          apiKey: this.apiKey,
          clientId: this.clientId,
          discoveryDocs: [this.discoveryDoc],
          scope: this.scopes
        });

        this.isInitialized = true;
        this.isSignedIn = this.gapi.auth2.getAuthInstance().isSignedIn.get();
        
        console.log('Google Drive API initialized');
      });
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      throw error;
    }
  }

  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        this.gapi = window.gapi;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.gapi = window.gapi;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      this.isSignedIn = true;
      return true;
    } catch (error) {
      console.error('Google Drive sign-in failed:', error);
      throw error;
    }
  }

  async signOut() {
    if (!this.isInitialized) return;

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.isSignedIn = false;
    } catch (error) {
      console.error('Google Drive sign-out failed:', error);
    }
  }

  getSignedInUser() {
    if (!this.isInitialized || !this.isSignedIn) return null;
    
    const authInstance = this.gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    const profile = user.getBasicProfile();
    
    return {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl()
    };
  }

  async uploadFile(file, fileName = null) {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google Drive');
    }

    const actualFileName = fileName || file.name;
    const metadata = {
      name: actualFileName,
      parents: ['appDataFolder'] // Store in app-specific folder
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Make file publicly accessible
      await this.makeFilePublic(result.id);
      
      // Get the public URL
      const publicUrl = await this.getPublicUrl(result.id);
      
      return {
        id: result.id,
        name: actualFileName,
        size: file.size,
        mimeType: file.type,
        downloadUrl: publicUrl,
        createdTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async makeFilePublic(fileId) {
    try {
      await this.gapi.client.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (error) {
      console.warn('Failed to make file public:', error);
    }
  }

  async getPublicUrl(fileId) {
    try {
      const response = await this.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'webViewLink,webContentLink'
      });

      const file = response.result;
      
      // For documents, use webViewLink and modify it for direct viewing
      if (file.webContentLink) {
        return file.webContentLink;
      } else if (file.webViewLink) {
        // Convert sharing link to direct link for preview
        return file.webViewLink.replace('/view?usp=sharing', '/preview');
      }
      
      return `https://drive.google.com/file/d/${fileId}/preview`;
    } catch (error) {
      console.error('Failed to get public URL:', error);
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  async deleteFile(fileId) {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google Drive');
    }

    try {
      await this.gapi.client.drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  async listFiles(maxResults = 10) {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google Drive');
    }

    try {
      const response = await this.gapi.client.drive.files.list({
        q: "parents in 'appDataFolder'",
        pageSize: maxResults,
        fields: 'files(id,name,size,mimeType,createdTime,webViewLink)'
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  // File picker for selecting existing files
  async pickFile() {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google Drive');
    }

    return new Promise((resolve, reject) => {
      const picker = new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.DOCS)
        .setOAuthToken(this.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token)
        .setDeveloperKey(this.apiKey)
        .setCallback((data) => {
          if (data.action === google.picker.Action.PICKED) {
            const file = data.docs[0];
            resolve({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              url: file.url
            });
          } else if (data.action === google.picker.Action.CANCEL) {
            resolve(null);
          }
        })
        .build();

      picker.setVisible(true);
    });
  }

  // Check quota and storage info
  async getStorageInfo() {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google Drive');
    }

    try {
      const response = await this.gapi.client.drive.about.get({
        fields: 'storageQuota'
      });

      const quota = response.result.storageQuota;
      return {
        limit: parseInt(quota.limit),
        usage: parseInt(quota.usage),
        usageInDrive: parseInt(quota.usageInDrive),
        available: parseInt(quota.limit) - parseInt(quota.usage)
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }
}

// Create singleton instance
const googleDriveService = new GoogleDriveService();

export default googleDriveService;
