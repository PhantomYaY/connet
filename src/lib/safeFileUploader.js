// Safe file uploader - completely offline-first approach
class SafeFileUploader {
  constructor() {
    this.isGoogleAvailable = false; // Default to offline mode
    // No network calls in constructor to avoid NetworkError
  }

  // Remove network availability check to prevent NetworkError
  checkGoogleAvailability() {
    // Simply check if we're in a browser environment
    this.isGoogleAvailable = typeof window !== 'undefined' &&
                              typeof navigator !== 'undefined' &&
                              navigator.onLine;
    return this.isGoogleAvailable;
  }

  async processFiles(files) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const processedFile = await this.processFile(file);
        results.push(processedFile);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        errors.push({ file: file.name, error: error.message });
      }
    }

    return { results, errors };
  }

  async processFile(file) {
    // Always create a local version first
    const localFile = await this.createLocalFile(file);
    
    // If Google is available, try to enhance with drive features
    if (this.isGoogleAvailable) {
      try {
        return await this.enhanceWithGoogleDrive(localFile, file);
      } catch (error) {
        console.warn('Google Drive enhancement failed, using local version:', error);
        return localFile;
      }
    }
    
    return localFile;
  }

  async createLocalFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = {
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
          source: 'local-upload',
          isPublic: true, // Local files are accessible
          localFile: true
        };
        resolve(result);
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };

      // For supported file types, create data URL
      if (this.isSupportedType(file.type)) {
        reader.readAsDataURL(file);
      } else {
        // For unsupported types, create a placeholder
        resolve({
          id: `unsupported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          fileName: file.name,
          title: file.name,
          downloadURL: null,
          size: file.size,
          fileType: 'file',
          folderId: 'root',
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'local-upload',
          isPublic: false,
          localFile: true,
          unsupported: true
        });
      }
    });
  }

  async enhanceWithGoogleDrive(localFile, originalFile) {
    // No network calls - just add enhancement metadata
    return {
      ...localFile,
      enhanceable: true,
      enhanceMessage: 'Upload to Google Drive manually for better sharing'
    };
  }

  isSupportedType(mimeType) {
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    return supportedTypes.includes(mimeType) || mimeType.startsWith('image/');
  }

  getFileType(mimeType, fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return 'pdf';
    } else if (mimeType.includes('presentation') || ['ppt', 'pptx'].includes(extension)) {
      return 'ppt';
    } else if (mimeType.includes('document') || mimeType.includes('word') || ['doc', 'docx'].includes(extension)) {
      return 'doc';
    } else if (mimeType.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension)) {
      return 'xls';
    } else if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (mimeType === 'text/plain' || extension === 'txt') {
      return 'text';
    } else {
      return 'file';
    }
  }

  // Simple method to open Google Drive for manual upload
  openGoogleDriveForUpload() {
    const driveUrl = 'https://drive.google.com/drive/my-drive';
    window.open(driveUrl, '_blank', 'noopener,noreferrer');
    
    return {
      message: 'Google Drive opened in new tab. Upload your files there, then you can link them manually.',
      instructions: [
        '1. Upload your files to Google Drive',
        '2. Right-click the file and select "Get link"',
        '3. Change sharing to "Anyone with the link"',
        '4. Copy the link and paste it in the manual URL option'
      ]
    };
  }

  // Check if the uploader can function
  isAvailable() {
    return typeof window !== 'undefined' && 
           typeof FileReader !== 'undefined' &&
           typeof document !== 'undefined';
  }

  // Get user-friendly status
  getStatus() {
    if (!this.isAvailable()) {
      return { available: false, message: 'File upload not supported in this environment' };
    }

    return { available: true, message: 'Ready for local file upload' };
  }
}

// Create singleton instance
const safeFileUploader = new SafeFileUploader();

export default safeFileUploader;
