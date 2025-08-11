// Enhanced Google Drive integration with automatic file upload
class GoogleDriveUploader {
  constructor() {
    this.isInitialized = false;
    this.accessToken = null;
    this.clientId = '1091311073095-8t3o7b8m5b5q9q7j4c0g8j1j2j3j4j5j.apps.googleusercontent.com'; // Demo client ID
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Use Google Identity Services (newer, more secure)
      await this.loadGoogleIdentity();
      this.isInitialized = true;
      console.log('Google Drive uploader initialized');
    } catch (error) {
      console.warn('Google Drive not available, falling back to manual mode:', error);
      throw error;
    }
  }

  loadGoogleIdentity() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.accounts) {
        resolve();
        return;
      }

      // Load Google Identity Services (CORS-safe)
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        try {
          // Initialize the token client
          this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (response) => {
              if (response.access_token) {
                this.accessToken = response.access_token;
              }
            },
          });
          resolve();
        } catch (error) {
          reject(new Error('Failed to initialize Google Identity: ' + error.message));
        }
      };
      
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  async requestAccess() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (this.accessToken) {
        resolve(this.accessToken);
        return;
      }

      try {
        this.tokenClient.callback = (response) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to get access token'));
          }
        };
        
        this.tokenClient.requestAccessToken();
      } catch (error) {
        reject(error);
      }
    });
  }

  async uploadFile(file, fileName = null) {
    try {
      const token = await this.requestAccess();
      const actualFileName = fileName || file.name;
      
      // Create metadata
      const metadata = {
        name: actualFileName,
        parents: ['root'] // Upload to root folder
      };

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
      formData.append('file', file);

      // Upload to Google Drive
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Make file public for viewing
      await this.makeFilePublic(result.id);
      
      // Return file info in our format
      return {
        id: result.id,
        name: result.name,
        fileName: result.name,
        title: result.name,
        downloadURL: this.createViewableUrl(result.id, file.type),
        size: file.size,
        fileType: this.getFileType(file.type, file.name),
        folderId: 'root',
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'google-drive-upload',
        driveFileId: result.id,
        isPublic: true
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async makeFilePublic(fileId) {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      if (!response.ok) {
        console.warn('Failed to make file public:', response.statusText);
      }
    } catch (error) {
      console.warn('Failed to make file public:', error);
    }
  }

  createViewableUrl(fileId, mimeType) {
    if (mimeType === 'application/pdf') {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return `https://docs.google.com/presentation/d/${fileId}/preview`;
    } else if (mimeType.includes('document') || mimeType.includes('word')) {
      return `https://docs.google.com/document/d/${fileId}/preview`;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
    } else if (mimeType.includes('image')) {
      return `https://drive.google.com/uc?id=${fileId}`;
    } else {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  getFileType(mimeType, fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return 'pdf';
    } else if (mimeType.includes('presentation') || ['ppt', 'pptx'].includes(extension)) {
      return 'ppt';
    } else if (mimeType.includes('document') || ['doc', 'docx'].includes(extension)) {
      return 'doc';
    } else if (mimeType.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension)) {
      return 'xls';
    } else if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return 'image';
    } else {
      return 'file';
    }
  }

  async uploadMultipleFiles(files) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file);
        results.push(result);
      } catch (error) {
        errors.push({ file: file.name, error: error.message });
      }
    }

    return { results, errors };
  }

  // Fallback for when Google APIs aren't available
  createFallbackFile(file) {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        resolve({
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          fileName: file.name,
          title: file.name,
          downloadURL: e.target.result,
          size: file.size,
          fileType: this.getFileType(file.type, file.name),
          folderId: 'root',
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'local-fallback',
          isPublic: false,
          localFile: true
        });
      };
      reader.readAsDataURL(file);
    });
  }

  isAvailable() {
    return typeof window !== 'undefined' && 
           typeof document !== 'undefined' &&
           navigator.onLine &&
           !this.isBlocked();
  }

  isBlocked() {
    // Check if we're in an environment that blocks Google APIs
    try {
      const testUrl = new URL('https://accounts.google.com');
      return false;
    } catch {
      return true;
    }
  }
}

// Create singleton instance
const googleDriveUploader = new GoogleDriveUploader();

export default googleDriveUploader;
