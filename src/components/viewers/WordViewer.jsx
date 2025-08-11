import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Download, Maximize2, X, FileText, Search, BookOpen, Eye } from 'lucide-react';
import styled from 'styled-components';

const WordViewer = ({ fileUrl, fileName, onClose }) => {
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('document'); // 'document', 'reading', 'outline'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (fileUrl) {
      // Validate the URL before trying to load it
      if (fileUrl.startsWith('http') || (fileUrl.startsWith('data:') && fileUrl.length > 30)) {
        setIsLoading(false);
        setError(null);
        // Estimate page count (this would be dynamic with real document parsing)
        setTotalPages(5);
      } else {
        setIsLoading(false);
        setError('Invalid or missing Word document URL');
      }
    } else {
      setIsLoading(false);
      setError('No Word document URL provided');
    }
  }, [fileUrl]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'document.docx';
      link.click();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleViewMode = () => {
    const modes = ['document', 'reading', 'outline'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // In a real implementation, this would search through the document content
  };

  if (error) {
    return (
      <ViewerContainer $isFullscreen={isFullscreen}>
        <ViewerHeader>
          <HeaderTitle>Word Viewer - Error</HeaderTitle>
          <HeaderActions>
            <ActionButton onClick={onClose}>
              <X size={16} />
              Close
            </ActionButton>
          </HeaderActions>
        </ViewerHeader>
        <ErrorContainer>
          <h3>Unable to load Word document</h3>
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
        <HeaderTitle>Word Viewer - {fileName}</HeaderTitle>
        <HeaderActions>
          <SearchContainer>
            <SearchIcon>
              <Search size={14} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search document..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </SearchContainer>
          <ActionButton onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={16} />
          </ActionButton>
          <ZoomLevel>{Math.round(scale * 100)}%</ZoomLevel>
          <ActionButton onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={16} />
          </ActionButton>
          <ActionButton onClick={toggleViewMode} title="View Mode">
            {viewMode === 'document' ? <FileText size={16} /> : 
             viewMode === 'reading' ? <BookOpen size={16} /> : <Eye size={16} />}
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
            <p>Loading Word document...</p>
          </LoadingContainer>
        ) : viewMode === 'document' ? (
          <DocumentContainer>
            <DocumentFrame
              src={fileUrl}
              title={fileName}
              $scale={scale}
              onError={() => setError('Failed to load Word document')}
              onLoad={() => setError(null)}
            />
          </DocumentContainer>
        ) : viewMode === 'reading' ? (
          <ReadingContainer $scale={scale}>
            <ReadingContent>
              <DocumentHeader>
                <h1>Sample Document Title</h1>
                <p className="subtitle">This is a preview of the Word document content</p>
              </DocumentHeader>
              
              <DocumentBody>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
                  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
                  quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                
                <h2>Section 1: Introduction</h2>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                  eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
                  sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                
                <h2>Section 2: Main Content</h2>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
                  doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
                  veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                </p>
                
                <ul>
                  <li>First bullet point</li>
                  <li>Second bullet point</li>
                  <li>Third bullet point</li>
                </ul>
                
                <h2>Section 3: Conclusion</h2>
                <p>
                  Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, 
                  sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
                </p>
              </DocumentBody>
            </ReadingContent>
          </ReadingContainer>
        ) : (
          <OutlineContainer>
            <OutlinePanel>
              <OutlineTitle>Document Outline</OutlineTitle>
              <OutlineList>
                <OutlineItem level={1} active={currentPage === 1} onClick={() => setCurrentPage(1)}>
                  1. Introduction
                </OutlineItem>
                <OutlineItem level={2} active={currentPage === 2} onClick={() => setCurrentPage(2)}>
                  1.1 Background
                </OutlineItem>
                <OutlineItem level={2} active={currentPage === 3} onClick={() => setCurrentPage(3)}>
                  1.2 Objectives
                </OutlineItem>
                <OutlineItem level={1} active={currentPage === 4} onClick={() => setCurrentPage(4)}>
                  2. Main Content
                </OutlineItem>
                <OutlineItem level={2} active={currentPage === 5} onClick={() => setCurrentPage(5)}>
                  2.1 Analysis
                </OutlineItem>
                <OutlineItem level={1}>
                  3. Conclusion
                </OutlineItem>
              </OutlineList>
            </OutlinePanel>
            <OutlineContent>
              <DocumentFrame
                src={`${fileUrl}#page=${currentPage}`}
                title={fileName}
                $scale={scale}
              />
            </OutlineContent>
          </OutlineContainer>
        )}
      </ViewerContent>

      <ViewerFooter>
        <FooterInfo>
          <span>View: {viewMode}</span>
          {searchTerm && <span>Search: "{searchTerm}"</span>}
        </FooterInfo>
        <FooterStats>
          <span>Page {currentPage} of {totalPages}</span>
          <span>•</span>
          <span>Zoom: {Math.round(scale * 100)}%</span>
        </FooterStats>
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
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: white;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 8px;
  color: rgba(255, 255, 255, 0.7);
  z-index: 1;
`;

const SearchInput = styled.input`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 8px 6px 28px;
  border-radius: 6px;
  font-size: 12px;
  width: 150px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ZoomLevel = styled.span`
  color: white;
  font-size: 12px;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
`;

const ViewerContent = styled.div`
  flex: 1;
  display: flex;
  background: #f8f9fa;
  overflow: hidden;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 16px;
  width: 100%;

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top: 3px solid #2563eb;
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
    color: #666;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 16px;
  text-align: center;
  padding: 40px;
  width: 100%;

  h3 {
    margin: 0;
    color: #ef4444;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  button {
    background: #2563eb;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: #1d4ed8;
    }
  }
`;

const DocumentContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #e5e7eb;
`;

const DocumentFrame = styled.iframe`
  width: ${props => props.$scale * 100}%;
  height: ${props => props.$scale * 100}%;
  max-width: 100%;
  max-height: 100%;
  border: none;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
`;

const ReadingContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  background: white;
  font-size: ${props => props.$scale * 16}px;
  line-height: 1.6;
`;

const ReadingContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
`;

const DocumentHeader = styled.div`
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 20px;
  margin-bottom: 30px;

  h1 {
    margin: 0 0 10px 0;
    color: #1f2937;
    font-size: 2em;
    font-weight: 700;
  }

  .subtitle {
    margin: 0;
    color: #6b7280;
    font-size: 1.1em;
    font-style: italic;
  }
`;

const DocumentBody = styled.div`
  color: #374151;

  h2 {
    color: #1f2937;
    font-size: 1.5em;
    font-weight: 600;
    margin: 30px 0 15px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
  }

  p {
    margin: 0 0 15px 0;
    text-align: justify;
  }

  ul {
    margin: 15px 0;
    padding-left: 20px;
  }

  li {
    margin: 5px 0;
  }
`;

const OutlineContainer = styled.div`
  flex: 1;
  display: flex;
`;

const OutlinePanel = styled.div`
  width: 250px;
  background: #f3f4f6;
  border-right: 1px solid #d1d5db;
  overflow-y: auto;
`;

const OutlineTitle = styled.h4`
  margin: 0;
  padding: 16px;
  background: #e5e7eb;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid #d1d5db;
`;

const OutlineList = styled.div`
  padding: 8px 0;
`;

const OutlineItem = styled.div`
  padding: 8px 16px 8px ${props => 16 + (props.level - 1) * 16}px;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
  background: ${props => props.active ? '#dbeafe' : 'transparent'};
  border-left: ${props => props.active ? '3px solid #2563eb' : '3px solid transparent'};
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #1f2937;
  }
`;

const OutlineContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #e5e7eb;
`;

const ViewerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #e5e5e5;
  font-size: 11px;
`;

const FooterInfo = styled.div`
  display: flex;
  gap: 12px;
`;

const FooterStats = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export default WordViewer;
