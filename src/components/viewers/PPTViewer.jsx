import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Square, Download, Maximize2, X, Grid3X3, List } from 'lucide-react';
import styled from 'styled-components';

const PPTViewer = ({ fileUrl, fileName, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState('slide'); // 'slide', 'grid', 'notes'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoPlayInterval, setAutoPlayInterval] = useState(null);

  useEffect(() => {
    if (fileUrl) {
      // Validate the URL before trying to load it
      if (fileUrl.startsWith('http') || (fileUrl.startsWith('data:') && fileUrl.length > 30)) {
        setIsLoading(false);
        setError(null);
        // Estimate slides count (this would be dynamic with real PPT parsing)
        setTotalSlides(10);
      } else {
        setIsLoading(false);
        setError('Invalid or missing PowerPoint URL');
      }
    } else {
      setIsLoading(false);
      setError('No PowerPoint URL provided');
    }
  }, [fileUrl]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => {
          if (prev < totalSlides) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 3000); // Auto-advance every 3 seconds
      setAutoPlayInterval(interval);
    } else {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        setAutoPlayInterval(null);
      }
    }

    return () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    };
  }, [isPlaying, totalSlides]);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => Math.max(1, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => Math.min(totalSlides, prev + 1));
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentSlide(1);
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'presentation.pptx';
      link.click();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleViewMode = () => {
    const modes = ['slide', 'grid', 'notes'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  if (error) {
    return (
      <ViewerContainer $isFullscreen={isFullscreen}>
        <ViewerHeader>
          <HeaderTitle>PowerPoint Viewer - Error</HeaderTitle>
          <HeaderActions>
            <ActionButton onClick={onClose}>
              <X size={16} />
              Close
            </ActionButton>
          </HeaderActions>
        </ViewerHeader>
        <ErrorContainer>
          <h3>Unable to load PowerPoint</h3>
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
        <HeaderTitle>PowerPoint Viewer - {fileName}</HeaderTitle>
        <HeaderActions>
          <ActionButton onClick={handlePlay} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </ActionButton>
          <ActionButton onClick={handleStop} title="Stop">
            <Square size={16} />
          </ActionButton>
          <ActionButton onClick={toggleViewMode} title="View Mode">
            {viewMode === 'grid' ? <Grid3X3 size={16} /> : <List size={16} />}
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
            <p>Loading PowerPoint...</p>
          </LoadingContainer>
        ) : viewMode === 'slide' ? (
          <SlideContainer>
            <SlideFrame
              src={`${fileUrl}#page=${currentSlide}`}
              title={`${fileName} - Slide ${currentSlide}`}
              onError={() => setError('Failed to load PowerPoint slide')}
              onLoad={() => setError(null)}
            />
            {isPlaying && (
              <PlayingIndicator>
                <Play size={20} />
                <span>Playing</span>
              </PlayingIndicator>
            )}
          </SlideContainer>
        ) : viewMode === 'grid' ? (
          <GridContainer>
            {Array.from({ length: totalSlides }, (_, i) => i + 1).map(slideNum => (
              <GridSlide
                key={slideNum}
                $isActive={slideNum === currentSlide}
                onClick={() => setCurrentSlide(slideNum)}
              >
                <SlideFrame
                  src={`${fileUrl}#page=${slideNum}`}
                  title={`Slide ${slideNum}`}
                />
                <SlideNumber>{slideNum}</SlideNumber>
              </GridSlide>
            ))}
          </GridContainer>
        ) : (
          <NotesContainer>
            <NotesSlide>
              <SlideFrame
                src={`${fileUrl}#page=${currentSlide}`}
                title={`${fileName} - Slide ${currentSlide}`}
              />
            </NotesSlide>
            <NotesPanel>
              <NotesTitle>Speaker Notes - Slide {currentSlide}</NotesTitle>
              <NotesContent>
                <p>Speaker notes for slide {currentSlide} would appear here.</p>
                <p>This is a placeholder for the actual notes that would be extracted from the PowerPoint file.</p>
              </NotesContent>
            </NotesPanel>
          </NotesContainer>
        )}
      </ViewerContent>

      <ViewerFooter>
        <SlideNavigation>
          <ActionButton onClick={handlePrevSlide} disabled={currentSlide <= 1}>
            <ChevronLeft size={16} />
          </ActionButton>
          <SlideInfo>
            Slide {currentSlide} of {totalSlides}
          </SlideInfo>
          <ActionButton onClick={handleNextSlide} disabled={currentSlide >= totalSlides}>
            <ChevronRight size={16} />
          </ActionButton>
        </SlideNavigation>
        
        <SlideProgress>
          <ProgressBar>
            <ProgressFill $progress={(currentSlide / totalSlides) * 100} />
          </ProgressBar>
          <ProgressText>{Math.round((currentSlide / totalSlides) * 100)}%</ProgressText>
        </SlideProgress>
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
  background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
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

const ViewerContent = styled.div`
  flex: 1;
  display: flex;
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
  width: 100%;

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid #ea580c;
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
  width: 100%;

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
    background: #ea580c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: #d97706;
    }
  }
`;

const SlideContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
`;

const SlideFrame = styled.iframe`
  width: 100%;
  height: 100%;
  max-width: 800px;
  max-height: 600px;
  border: none;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
`;

const PlayingIndicator = styled.div`
  position: absolute;
  top: 30px;
  right: 30px;
  background: rgba(234, 88, 12, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 0.6; }
  }
`;

const GridContainer = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
  overflow-y: auto;
`;

const GridSlide = styled.div`
  aspect-ratio: 16/9;
  border: 2px solid ${props => props.$isActive ? '#ea580c' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: #ea580c;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(234, 88, 12, 0.3);
  }

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    pointer-events: none;
  }
`;

const SlideNumber = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
`;

const NotesContainer = styled.div`
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
`;

const NotesSlide = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;

  iframe {
    width: 100%;
    height: 100%;
    max-width: 600px;
    max-height: 450px;
    border: none;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
`;

const NotesPanel = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
`;

const NotesTitle = styled.h4`
  margin: 0 0 12px 0;
  color: #ea580c;
  font-size: 14px;
  font-weight: 600;
`;

const NotesContent = styled.div`
  color: #e5e5e5;
  font-size: 13px;
  line-height: 1.5;

  p {
    margin: 0 0 8px 0;
  }
`;

const ViewerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const SlideNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SlideInfo = styled.span`
  color: #e5e5e5;
  font-size: 12px;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
`;

const SlideProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProgressBar = styled.div`
  width: 150px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  width: ${props => props.$progress}%;
  height: 100%;
  background: linear-gradient(90deg, #d97706, #ea580c);
  transition: width 0.3s ease;
`;

const ProgressText = styled.span`
  color: #e5e5e5;
  font-size: 11px;
  font-weight: 500;
  min-width: 35px;
`;

export default PPTViewer;
