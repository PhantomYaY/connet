import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Upload, Cloud, CheckCircle, AlertCircle, Loader2, X, ExternalLink } from 'lucide-react';
import safeFileUploader from '../lib/safeFileUploader';

const SmartFileUpload = ({ onFilesUploaded, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploaderStatus, setUploaderStatus] = useState(null);

  useEffect(() => {
    // Get uploader status on mount
    const status = safeFileUploader.getStatus();
    setUploaderStatus(status);
  }, []);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress([]);
    setCompleted([]);
    setErrors([]);

    const fileArray = Array.from(files);

    // Initialize progress tracking
    const initialProgress = fileArray.map(file => ({
      name: file.name,
      status: 'pending',
      progress: 0
    }));
    setUploadProgress(initialProgress);

    try {
      await uploadFiles(fileArray);
    } catch (error) {
      console.error('Upload process failed:', error);
      setErrors([{ file: 'System', error: error.message }]);
    }

    setUploading(false);
  };

  const uploadFiles = async (files) => {
    try {
      // Use the safe file uploader
      const { results, errors: uploadErrors } = await safeFileUploader.processFiles(files);

      // Update progress for each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const wasSuccessful = results.some(r => r.name === file.name);
        const hasError = uploadErrors.some(e => e.file === file.name);

        // Update progress
        setUploadProgress(prev => prev.map((item, index) =>
          index === i ? {
            ...item,
            status: hasError ? 'error' : 'uploading',
            progress: hasError ? 0 : 50
          } : item
        ));

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 200));

        // Final update
        setUploadProgress(prev => prev.map((item, index) =>
          index === i ? {
            ...item,
            status: hasError ? 'error' : 'completed',
            progress: hasError ? 0 : 100
          } : item
        ));
      }

      // Set results
      if (results.length > 0) {
        setCompleted(results);
        onFilesUploaded(results);
      }

      if (uploadErrors.length > 0) {
        setErrors(uploadErrors);
      }

    } catch (error) {
      console.error('File processing failed:', error);
      setErrors([{ file: 'System', error: 'Failed to process files' }]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <UploadContainer>
      <UploadHeader>
        <HeaderContent>
          <Upload size={24} color="#4285f4" />
          <div>
            <h3>Smart File Upload</h3>
            <p>{uploaderStatus?.message || 'Processing files for easy viewing'}</p>
          </div>
        </HeaderContent>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>
      </UploadHeader>

      <UploadArea
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        $uploading={uploading}
      >
        <UploadIcon>
          {uploading ? <Loader2 size={48} className="spin" /> : <Upload size={48} />}
        </UploadIcon>
        <UploadText>
          <strong>Drop files here or click to browse</strong>
          <span>Supports PDF, DOC, PPT, images and more</span>
        </UploadText>
        <FileInput
          type="file"
          multiple
          accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          onChange={(e) => handleFileUpload(e.target.files)}
          disabled={uploading}
        />
      </UploadArea>

      {uploadProgress.length > 0 && (
        <ProgressSection>
          <h4>Upload Progress</h4>
          {uploadProgress.map((item, index) => (
            <ProgressItem key={index} $status={item.status}>
              <ProgressIcon>
                {item.status === 'pending' && <Upload size={16} />}
                {item.status === 'uploading' && <Loader2 size={16} className="spin" />}
                {item.status === 'completed' && <CheckCircle size={16} />}
                {item.status === 'error' && <AlertCircle size={16} />}
              </ProgressIcon>
              <ProgressInfo>
                <ProgressName>{item.name}</ProgressName>
                <ProgressBar>
                  <ProgressFill $progress={item.progress} $status={item.status} />
                </ProgressBar>
              </ProgressInfo>
              <ProgressStatus>
                {item.status === 'pending' && 'Waiting...'}
                {item.status === 'uploading' && 'Uploading...'}
                {item.status === 'completed' && 'Done!'}
                {item.status === 'error' && 'Failed'}
              </ProgressStatus>
            </ProgressItem>
          ))}
        </ProgressSection>
      )}

      {completed.length > 0 && (
        <SuccessSection>
          <CheckCircle size={20} />
          <div>
            <strong>{completed.length} file(s) uploaded successfully!</strong>
            <div>Files are now available in your document viewer</div>
          </div>
        </SuccessSection>
      )}

      {errors.length > 0 && (
        <ErrorSection>
          <AlertCircle size={20} />
          <div>
            <strong>Some files failed to upload:</strong>
            {errors.map((error, index) => (
              <div key={index}>{error.file}: {error.error}</div>
            ))}
          </div>
        </ErrorSection>
      )}

      {completed.length > 0 && (
        <GoogleDriveSection>
          <Cloud size={20} />
          <div>
            <strong>Want better sharing?</strong>
            <div>Upload to Google Drive for public links and better viewing</div>
            <GoogleDriveButton
              onClick={() => {
                const result = safeFileUploader.openGoogleDriveForUpload();
                alert(result.message);
              }}
            >
              <ExternalLink size={14} />
              Open Google Drive
            </GoogleDriveButton>
          </div>
        </GoogleDriveSection>
      )}
    </UploadContainer>
  );
};

const UploadContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  .dark & {
    background: #1f2937;
    color: #e5e7eb;
  }
`;

const UploadHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;

  .dark & {
    border-color: #374151;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  h3 {
    margin: 0;
    font-size: 18px;
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

const UploadArea = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 48px 24px;
  cursor: ${props => props.$uploading ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  background: ${props => props.$uploading ? '#f9fafb' : 'transparent'};

  &:hover {
    border-color: #4285f4;
    background: rgba(66, 133, 244, 0.05);
  }

  .dark & {
    border-color: #4b5563;
    background: ${props => props.$uploading ? '#111827' : 'transparent'};

    &:hover {
      border-color: #60a5fa;
      background: rgba(96, 165, 250, 0.05);
    }
  }
`;

const UploadIcon = styled.div`
  color: #4285f4;
  margin-bottom: 16px;

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const UploadText = styled.div`
  text-align: center;

  strong {
    display: block;
    font-size: 16px;
    color: #1f2937;
    margin-bottom: 8px;

    .dark & {
      color: #e5e7eb;
    }
  }

  span {
    font-size: 14px;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }
  }
`;

const FileInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: inherit;
`;

const ProgressSection = styled.div`
  margin-top: 24px;

  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #1f2937;

    .dark & {
      color: #e5e7eb;
    }
  }
`;

const ProgressItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;

  .dark & {
    background: #111827;
  }
`;

const ProgressIcon = styled.div`
  color: ${props => {
    switch (props.theme.status) {
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      case 'uploading': return '#4285f4';
      default: return '#6b7280';
    }
  }};

  .spin {
    animation: spin 1s linear infinite;
  }
`;

const ProgressInfo = styled.div`
  flex: 1;
`;

const ProgressName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;

  .dark & {
    color: #e5e7eb;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;

  .dark & {
    background: #374151;
  }
`;

const ProgressFill = styled.div`
  width: ${props => props.$progress}%;
  height: 100%;
  background: ${props => {
    switch (props.$status) {
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#4285f4';
    }
  }};
  transition: width 0.3s ease;
`;

const ProgressStatus = styled.div`
  font-size: 12px;
  color: #6b7280;

  .dark & {
    color: #9ca3af;
  }
`;

const SuccessSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #15803d;
  margin-top: 16px;

  .dark & {
    background: #064e3b;
    border-color: #059669;
    color: #a7f3d0;
  }
`;

const ErrorSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  margin-top: 16px;

  .dark & {
    background: #7f1d1d;
    border-color: #b91c1c;
    color: #fca5a5;
  }
`;

const GoogleDriveSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0369a1;
  margin-top: 16px;

  .dark & {
    background: #0c4a6e;
    border-color: #0284c7;
    color: #bae6fd;
  }
`;

const GoogleDriveButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #4285f4;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #3367d6;
  }
`;

export default SmartFileUpload;
