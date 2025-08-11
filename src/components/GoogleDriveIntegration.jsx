import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Cloud, Upload, User, LogOut, HardDrive, Check, AlertCircle, Loader2 } from 'lucide-react';
import googleDriveService from '../lib/googleDriveService';

const GoogleDriveIntegration = ({ onFilesUploaded, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeGoogleDrive();
  }, []);

  const initializeGoogleDrive = async () => {
    try {
      setIsLoading(true);
      await googleDriveService.initialize();
      
      // Check if already signed in
      if (googleDriveService.isSignedIn) {
        setIsConnected(true);
        setUser(googleDriveService.getSignedInUser());
        await loadStorageInfo();
      }
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
      if (error.message.includes('API keys not configured')) {
        setError('Google Drive integration is not configured. Please contact your administrator to set up API keys.');
      } else {
        setError('Failed to initialize Google Drive. Please check your internet connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await googleDriveService.signIn();
      setIsConnected(true);
      setUser(googleDriveService.getSignedInUser());
      await loadStorageInfo();
    } catch (error) {
      console.error('Sign-in failed:', error);
      setError('Failed to sign in to Google Drive. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleDriveService.signOut();
      setIsConnected(false);
      setUser(null);
      setStorageInfo(null);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await googleDriveService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.warn('Failed to load storage info:', error);
    }
  };

  const handleFileUpload = async (files) => {
    if (!isConnected) {
      setError('Please connect to Google Drive first');
      return;
    }

    try {
      setError(null);
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const uploadId = `upload-${Date.now()}-${index}`;
        
        // Add to uploading list
        setUploadingFiles(prev => [...prev, {
          id: uploadId,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'uploading'
        }]);

        try {
          // Upload to Google Drive
          const result = await googleDriveService.uploadFile(file);
          
          // Update status to completed
          setUploadingFiles(prev => prev.map(f => 
            f.id === uploadId 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          ));

          return {
            id: Date.now() + Math.random(), // Local ID for our app
            title: result.name,
            fileName: result.name,
            fileType: file.type || result.mimeType,
            downloadURL: result.downloadUrl,
            size: result.size,
            folderId: 'root',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'google-drive',
            driveFileId: result.id
          };
        } catch (error) {
          console.error('Upload failed for', file.name, error);
          
          // Update status to failed
          setUploadingFiles(prev => prev.map(f => 
            f.id === uploadId 
              ? { ...f, status: 'failed', error: error.message }
              : f
          ));
          
          throw error;
        }
      });

      const uploadedFiles = await Promise.allSettled(uploadPromises);
      const successfulUploads = uploadedFiles
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      if (successfulUploads.length > 0) {
        onFilesUploaded(successfulUploads);
        
        // Clear completed uploads after a delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.status !== 'completed'));
        }, 3000);
      }

      // Update storage info
      await loadStorageInfo();

    } catch (error) {
      console.error('Upload process failed:', error);
      setError('Upload failed. Please try again.');
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif';
    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileUpload(e.target.files);
      }
    };
    input.click();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderContent>
            <Cloud size={24} color="#4285f4" />
            <HeaderText>
              <h2>Google Drive Integration</h2>
              <p>Upload files directly to your Google Drive</p>
            </HeaderText>
          </HeaderContent>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <ModalContent>
          {error && (
            <ErrorMessage>
              <AlertCircle size={16} />
              {error}
            </ErrorMessage>
          )}

          {!isConnected ? (
            <SignInSection>
              <SignInContent>
                <Cloud size={48} color="#4285f4" />
                <h3>Connect to Google Drive</h3>
                <p>
                  Sign in to your Google account to upload files directly to Google Drive. 
                  Your files will be automatically hosted with shareable URLs.
                </p>
                <SignInButton onClick={handleSignIn} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Cloud size={16} />
                  )}
                  {isLoading ? 'Connecting...' : 'Connect Google Drive'}
                </SignInButton>
              </SignInContent>
            </SignInSection>
          ) : (
            <ConnectedSection>
              <UserInfo>
                <UserAvatar>
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user.name} />
                  ) : (
                    <User size={20} />
                  )}
                </UserAvatar>
                <UserDetails>
                  <UserName>{user?.name}</UserName>
                  <UserEmail>{user?.email}</UserEmail>
                </UserDetails>
                <SignOutButton onClick={handleSignOut}>
                  <LogOut size={14} />
                  Sign Out
                </SignOutButton>
              </UserInfo>

              {storageInfo && (
                <StorageInfo>
                  <StorageHeader>
                    <HardDrive size={16} />
                    Google Drive Storage
                  </StorageHeader>
                  <StorageBar>
                    <StorageUsed 
                      $percentage={(storageInfo.usage / storageInfo.limit) * 100}
                    />
                  </StorageBar>
                  <StorageText>
                    {formatBytes(storageInfo.usage)} of {formatBytes(storageInfo.limit)} used
                    ({formatBytes(storageInfo.available)} available)
                  </StorageText>
                </StorageInfo>
              )}

              <UploadSection>
                <UploadButton onClick={handleFileSelect}>
                  <Upload size={20} />
                  Select Files to Upload
                </UploadButton>
                <UploadHint>
                  Supported: PDF, PowerPoint, Word, Images
                </UploadHint>
              </UploadSection>

              {uploadingFiles.length > 0 && (
                <UploadProgress>
                  <h4>Upload Progress</h4>
                  {uploadingFiles.map((file) => (
                    <FileProgress key={file.id}>
                      <FileInfo>
                        <FileName>{file.name}</FileName>
                        <FileSize>{formatBytes(file.size)}</FileSize>
                      </FileInfo>
                      <FileStatus>
                        {file.status === 'uploading' && (
                          <StatusIcon>
                            <Loader2 size={14} className="spin" />
                          </StatusIcon>
                        )}
                        {file.status === 'completed' && (
                          <StatusIcon $success>
                            <Check size={14} />
                          </StatusIcon>
                        )}
                        {file.status === 'failed' && (
                          <StatusIcon $error>
                            <AlertCircle size={14} />
                          </StatusIcon>
                        )}
                        <StatusText $status={file.status}>
                          {file.status === 'uploading' && 'Uploading...'}
                          {file.status === 'completed' && 'Uploaded'}
                          {file.status === 'failed' && 'Failed'}
                        </StatusText>
                      </FileStatus>
                    </FileProgress>
                  ))}
                </UploadProgress>
              )}
            </ConnectedSection>
          )}
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  .dark & {
    background: #1f2937;
    color: #e5e7eb;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;

  .dark & {
    border-color: #374151;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderText = styled.div`
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;

    .dark & {
      color: #e5e7eb;
    }
  }

  p {
    margin: 4px 0 0 0;
    font-size: 14px;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .dark &:hover {
    background: #374151;
    color: #e5e7eb;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 20px;

  .dark & {
    background: #7f1d1d;
    border-color: #b91c1c;
    color: #fca5a5;
  }
`;

const SignInSection = styled.div`
  text-align: center;
`;

const SignInContent = styled.div`
  h3 {
    margin: 16px 0 8px 0;
    color: #1f2937;
    font-size: 18px;

    .dark & {
      color: #e5e7eb;
    }
  }

  p {
    margin: 0 0 24px 0;
    color: #6b7280;
    line-height: 1.5;

    .dark & {
      color: #9ca3af;
    }
  }
`;

const SignInButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #4285f4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 auto;

  &:hover:not(:disabled) {
    background: #3367d6;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ConnectedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;

  .dark & {
    background: #374151;
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dark & {
    background: #4b5563;
  }
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;

  .dark & {
    color: #e5e7eb;
  }
`;

const UserEmail = styled.div`
  color: #6b7280;
  font-size: 12px;

  .dark & {
    color: #9ca3af;
  }
`;

const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .dark & {
    border-color: #4b5563;
    color: #9ca3af;

    &:hover {
      background: #4b5563;
      border-color: #6b7280;
    }
  }
`;

const StorageInfo = styled.div`
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #e0f2fe;

  .dark & {
    background: #1e3a8a;
    border-color: #1e40af;
  }
`;

const StorageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0c4a6e;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;

  .dark & {
    color: #dbeafe;
  }
`;

const StorageBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e0f2fe;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;

  .dark & {
    background: #1e40af;
  }
`;

const StorageUsed = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #3b82f6);
  width: ${props => Math.min(props.$percentage, 100)}%;
  transition: width 0.3s ease;
`;

const StorageText = styled.div`
  color: #0f172a;
  font-size: 12px;

  .dark & {
    color: #e2e8f0;
  }
`;

const UploadSection = styled.div`
  text-align: center;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #059669;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 auto 8px auto;

  &:hover {
    background: #047857;
    transform: translateY(-1px);
  }
`;

const UploadHint = styled.div`
  color: #6b7280;
  font-size: 12px;

  .dark & {
    color: #9ca3af;
  }
`;

const UploadProgress = styled.div`
  h4 {
    margin: 0 0 12px 0;
    color: #1f2937;
    font-size: 14px;

    .dark & {
      color: #e5e7eb;
    }
  }
`;

const FileProgress = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 8px;

  .dark & {
    background: #374151;
  }
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;

  .dark & {
    color: #e5e7eb;
  }
`;

const FileSize = styled.div`
  font-size: 11px;
  color: #6b7280;

  .dark & {
    color: #9ca3af;
  }
`;

const FileStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatusIcon = styled.div`
  color: ${props => 
    props.$success ? '#059669' : 
    props.$error ? '#dc2626' : 
    '#6b7280'};

  .spin {
    animation: spin 1s linear infinite;
  }
`;

const StatusText = styled.div`
  font-size: 11px;
  color: ${props => 
    props.$status === 'completed' ? '#059669' : 
    props.$status === 'failed' ? '#dc2626' : 
    '#6b7280'};
  font-weight: 500;

  .dark & {
    color: ${props => 
      props.$status === 'completed' ? '#10b981' : 
      props.$status === 'failed' ? '#f87171' : 
      '#9ca3af'};
  }
`;

export default GoogleDriveIntegration;
