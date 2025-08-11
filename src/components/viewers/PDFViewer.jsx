import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, RotateCw, Maximize2, X } from 'lucide-react';
import styled from 'styled-components';

const PDFViewer = ({ fileUrl, fileName, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // For now, we'll use an iframe approach since react-pdf requires additional setup
  // In production, you'd want to use react-pdf library for better control
  useEffect(() => {
    if (fileUrl) {
      // Validate the URL before trying to load it
      if (fileUrl.startsWith('http') || fileUrl.startsWith('data:application/pdf;base64,') && fileUrl.length > 30) {
        setIsLoading(false);
        setError(null);
      } else {
        setIsLoading(false);
        setError('Invalid or missing PDF URL');
      }
    } else {
      setIsLoading(false);
      setError('No PDF URL provided');
    }
  }, [fileUrl]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'document.pdf';
      link.click();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return (
      <ViewerContainer $isFullscreen={isFullscreen}>
        <ViewerHeader>
          <HeaderTitle>PDF Viewer - Error</HeaderTitle>
          <HeaderActions>
            <ActionButton onClick={onClose}>
              <X size={16} />
              Close
            </ActionButton>
          </HeaderActions>
        </ViewerHeader>
        <ErrorContainer>
          <h3>Unable to load PDF</h3>
          <p>{error}</p>
          <button onClick={() => window.open(fileUrl, '_blank')}>
            Open in new tab
          </button>
        </ErrorContainer>
      </ViewerContainer>
    );
  }

  return (
    <ViewerContainer $isFullscreen={isFullscreen}>
      <ViewerHeader>
        <HeaderTitle>PDF Viewer - {fileName}</HeaderTitle>
        <HeaderActions>
          <ActionButton onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={16} />
          </ActionButton>
          <ZoomLevel>{Math.round(scale * 100)}%</ZoomLevel>
          <ActionButton onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={16} />
          </ActionButton>
          <ActionButton onClick={handleRotate} title="Rotate">
            <RotateCw size={16} />
          </ActionButton>
          <ActionButton onClick={handleDownload} title="Download">
            <Download size={16} />
          </ActionButton>
          <ActionButton onClick={toggleFullscreen} title="Fullscreen">
            <Maximize2 size={16} />
          </ActionButton>
          <ActionButton onClick={onClose} title="Close">
            <X size={16} />
          </ActionButton>
        </HeaderActions>
      </ViewerHeader>

      <ViewerContent>
        {isLoading ? (
          <LoadingContainer>
            <div className="spinner"></div>
            <p>Loading PDF...</p>
          </LoadingContainer>
        ) : (
          <PDFContainer>
            <PDFFrame
              src={fileUrl}
              title={fileName}
              $scale={scale}
              $rotation={rotation}
              onError={() => setError('Failed to load PDF file')}
              onLoad={() => setError(null)}
            />
          </PDFContainer>
        )}
      </ViewerContent>

      <ViewerFooter>
        <PageNavigation>
          <ActionButton onClick={handlePrevPage} disabled={currentPage <= 1}>
            <ChevronLeft size={16} />
          </ActionButton>
          <PageInfo>
            Page {currentPage} of {totalPages}
          </PageInfo>
          <ActionButton onClick={handleNextPage} disabled={currentPage >= totalPages}>
            <ChevronRight size={16} />
          </ActionButton>
        </PageNavigation>
      </ViewerFooter>
    </ViewerContainer>
  );
};

const ViewerContainer = styled.div`
  position: ${props => props.$isFullscreen ? 'fixed' : 'relative'};
  top: ${props => props.$isFullscreen ? '0' : 'auto'};
  left: ${props => props.$isFullscreen ? '0' : 'auto'};
  right: ${props => props.$isFullscreen ? '0' : 'auto'};
  bottom: ${props => props.$isFullscreen ? '0' : 'auto'};
  width: ${props => props.$isFullscreen ? '100vw' : '100%'};
  height: ${props => props.$isFullscreen ? '100vh' : '600px'};
  background: #1a1a1a;
  border-radius: ${props => props.$isFullscreen ? '0' : '12px'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: ${props => props.$isFullscreen ? '9999' : '1'};
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const ViewerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #e5e5e5;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e5e5e5;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ZoomLevel = styled.span`
  color: #e5e5e5;
  font-size: 12px;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
`;

const ViewerContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  overflow: hidden;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #e5e5e5;
  gap: 16px;
  text-align: center;
  padding: 40px;

  h3 {
    margin: 0;
    color: #ef4444;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: #999;
    font-size: 14px;
  }

  button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: #2563eb;
    }
  }
`;

const PDFContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const PDFFrame = styled.iframe`
  width: ${props => props.$scale * 100}%;
  height: ${props => props.$scale * 100}%;
  border: none;
  background: white;
  transform: rotate(${props => props.$rotation}deg);
  transition: all 0.3s ease;
`;

const ViewerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const PageNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageInfo = styled.span`
  color: #e5e5e5;
  font-size: 12px;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
`;

export default PDFViewer;
