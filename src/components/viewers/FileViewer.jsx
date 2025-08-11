import React, { useState, useEffect } from 'react';
import PDFViewer from './PDFViewer';
import PPTViewer from './PPTViewer';
import WordViewer from './WordViewer';
import FileHostingGuide from '../FileHostingGuide';
import styled from 'styled-components';
import { FileText, AlertCircle, X, Download, HelpCircle } from 'lucide-react';

const FileViewer = ({ file, onClose, isVisible }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHostingGuide, setShowHostingGuide] = useState(false);

  useEffect(() => {
    if (file && isVisible) {
      console.log('FileViewer received file:', file);

      // In a real implementation, you would:
      // 1. Check if the file has a downloadURL
      // 2. If not, generate a temporary URL or convert the file
      // 3. Handle authentication/permissions

      if (file.downloadURL) {
        console.log('File has downloadURL, setting fileUrl:', file.downloadURL);
        setFileUrl(file.downloadURL);
        setIsLoading(false);
        setError(null);
      } else {
        console.log('File missing downloadURL, showing error');
        // Don't set an invalid URL, just show error
        setFileUrl(null);
        setIsLoading(false);
        setError('File URL not available. Please upload the file with a valid URL to view it.');
      }
    }
  }, [file, isVisible]);

  const getFileType = (file) => {
    if (!file) return 'unknown';
    
    const fileType = file.fileType || file.type;
    const fileName = file.fileName || file.title || '';
    const extension = fileName.split('.').pop()?.toLowerCase();

    // Check by fileType first
    if (fileType) {
      if (fileType.includes('pdf') || fileType === 'pdf') return 'pdf';
      if (fileType.includes('powerpoint') || fileType.includes('presentation') || 
          fileType === 'ppt' || fileType === 'pptx') return 'ppt';
      if (fileType.includes('word') || fileType.includes('document') || 
          fileType === 'doc' || fileType === 'docx') return 'word';
    }

    // Fallback to extension
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'ppt':
      case 'pptx':
        return 'ppt';
      case 'doc':
      case 'docx':
        return 'word';
      default:
        return 'unknown';
    }
  };

  const renderViewer = () => {
    if (isLoading) {
      return (
        <LoadingContainer>
          <div className="spinner"></div>
          <p>Loading file...</p>
        </LoadingContainer>
      );
    }

    if (error || !file || !fileUrl) {
      return (
        <ErrorContainer>
          <AlertCircle size={48} />
          <h3>Unable to load file</h3>
          <p>{error || 'File not found'}</p>
          {!fileUrl && file && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '12px' }}>
                This file doesn't have a viewable URL. To view documents:
              </p>
              <ul style={{ fontSize: '13px', color: '#666', textAlign: 'left', maxWidth: '300px', marginBottom: '16px' }}>
                <li>Upload files with proper URLs</li>
                <li>Use cloud storage services (Google Drive, Dropbox, etc.)</li>
                <li>Host files on a web server</li>
              </ul>
              <ActionButton onClick={() => setShowHostingGuide(true)}>
                <HelpCircle size={16} />
                Free Hosting Guide
              </ActionButton>
            </div>
          )}
          {file?.downloadURL && (
            <ActionButton onClick={() => window.open(file.downloadURL, '_blank')}>
              <Download size={16} />
              Download File
            </ActionButton>
          )}
        </ErrorContainer>
      );
    }

    const fileType = getFileType(file);
    const fileName = file.fileName || file.title || 'Untitled';

    switch (fileType) {
      case 'pdf':
        return (
          <PDFViewer
            fileUrl={fileUrl}
            fileName={fileName}
            onClose={onClose}
          />
        );
      case 'ppt':
        return (
          <PPTViewer
            fileUrl={fileUrl}
            fileName={fileName}
            onClose={onClose}
          />
        );
      case 'word':
        return (
          <WordViewer
            fileUrl={fileUrl}
            fileName={fileName}
            onClose={onClose}
          />
        );
      default:
        return (
          <UnsupportedContainer>
            <FileText size={48} />
            <h3>Unsupported file type</h3>
            <p>
              File type "{fileType}" is not supported for preview.
              <br />
              Supported types: PDF, PowerPoint (PPT/PPTX), Word (DOC/DOCX)
            </p>
            {file?.downloadURL && (
              <ActionButton onClick={() => window.open(file.downloadURL, '_blank')}>
                <Download size={16} />
                Download File
              </ActionButton>
            )}
          </UnsupportedContainer>
        );
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <ViewerOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
        <ViewerContainer onClick={(e) => e.stopPropagation()}>
          {renderViewer()}
        </ViewerContainer>
      </ViewerOverlay>

      {showHostingGuide && (
        <FileHostingGuide onClose={() => setShowHostingGuide(false)} />
      )}
    </>
  );
};

const ViewerOverlay = styled.div`
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

const ViewerContainer = styled.div`
  width: 90vw;
  height: 85vh;
  max-width: 1200px;
  max-height: 800px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const LoadingContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  color: #e5e5e5;
  gap: 16px;

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #999;
  }
`;

const ErrorContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  color: #e5e5e5;
  gap: 16px;
  text-align: center;
  padding: 40px;

  svg {
    color: #ef4444;
  }

  h3 {
    margin: 0;
    color: #ef4444;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: #999;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const UnsupportedContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  color: #e5e5e5;
  gap: 16px;
  text-align: center;
  padding: 40px;

  svg {
    color: #f59e0b;
  }

  h3 {
    margin: 0;
    color: #f59e0b;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: #999;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const ActionButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default FileViewer;
