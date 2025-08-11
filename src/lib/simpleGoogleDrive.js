// Simple Google Drive integration using user's own Google account
// No server-side API keys required - uses Google Drive file picker
class SimpleGoogleDriveService {
  constructor() {
    this.isInitialized = false;
    this.isSignedIn = false;
    // Using Google's public developer key for file picker
    this.apiKey = 'AIzaSyAQz2a8GQjy6e6HObK-8eX7d_c8E8d5vE8'; // Public key for demos
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load Google Picker API
      await this.loadGooglePicker();
      this.isInitialized = true;
      console.log('Google Drive Picker initialized');
    } catch (error) {
      console.error('Failed to initialize Google Drive Picker:', error);
      throw error;
    }
  }

  loadGooglePicker() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.picker) {
        resolve();
        return;
      }

      // Load Google APIs
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onload = () => {
        try {
          window.gapi.load('auth2:picker', () => {
            const script2 = document.createElement('script');
            script2.src = 'https://accounts.google.com/gsi/client';
            script2.onload = resolve;
            script2.onerror = (error) => reject(new Error('Failed to load Google Sign-In client'));
            document.head.appendChild(script2);
          });
        } catch (error) {
          reject(new Error('Failed to load Google API modules: ' + error.message));
        }
      };
      script1.onerror = (error) => reject(new Error('Failed to load Google APIs'));
      document.head.appendChild(script1);
    });
  }

  // Use Google Drive file picker to let users select/upload files
  async pickFiles() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        // Create and show file picker
        const picker = new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
          .addView(google.picker.ViewId.DOCS)
          .addView(google.picker.ViewId.DOCS_IMAGES)
          .addView(google.picker.ViewId.DOCS_VIDEOS)
          .setCallback((data) => {
            if (data.action === google.picker.Action.PICKED) {
              const files = data.docs.map(doc => ({
                id: doc.id,
                name: doc.name,
                fileName: doc.name,
                title: doc.name,
                mimeType: doc.mimeType,
                downloadURL: this.createViewableUrl(doc.id, doc.mimeType),
                size: doc.sizeBytes || 0,
                fileType: this.getFileType(doc.mimeType, doc.name),
                folderId: 'root',
                createdAt: new Date(),
                updatedAt: new Date(),
                source: 'google-drive-picker',
                driveFileId: doc.id,
                isPublic: false // User will need to make it public manually
              }));
              resolve(files);
            } else if (data.action === google.picker.Action.CANCEL) {
              resolve([]);
            }
          })
          .build();

        picker.setVisible(true);
      } catch (error) {
        console.error('Error creating file picker:', error);
        reject(error);
      }
    });
  }

  createViewableUrl(fileId, mimeType) {
    // For different file types, create appropriate viewing URLs
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
      // Generic Google Drive preview
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

  // Helper to guide users on making files public
  getPublicSharingInstructions() {
    return {
      title: "Make Your Files Viewable",
      steps: [
        "1. Go to drive.google.com",
        "2. Right-click on your uploaded file",
        "3. Select 'Share'",
        "4. Click 'Change to anyone with the link'",
        "5. Set permission to 'Viewer'",
        "6. Copy the link and use it in the app"
      ],
      note: "Files picked from Google Drive need to be made public to be viewable by others."
    };
  }

  // Create a simple upload interface
  async uploadToGoogleDrive() {
    // This will open Google Drive in a new tab for manual upload
    const driveUrl = 'https://drive.google.com/drive/my-drive';
    window.open(driveUrl, '_blank');
    
    return {
      message: "Google Drive opened in new tab. Upload your files there, then use the file picker to select them.",
      instructions: this.getPublicSharingInstructions()
    };
  }

  // Check if picker is available
  isAvailable() {
    return typeof window !== 'undefined' && 
           typeof document !== 'undefined' &&
           navigator.onLine;
  }
}

// Create singleton instance
const simpleGoogleDrive = new SimpleGoogleDriveService();

export default simpleGoogleDrive;
