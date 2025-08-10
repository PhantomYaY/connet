import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Star, 
  Check, 
  X, 
  Shuffle, 
  Play,
  Pause,
  SkipForward
} from 'lucide-react';

const FlashCardViewer = ({ flashcardsData, onClose }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState('manual'); // 'manual', 'auto', 'quiz'
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(3000);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0
  });
  const [cardStatuses, setCardStatuses] = useState({});
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    try {
      // Parse the flashcards data
      let parsedCards = [];
      if (typeof flashcardsData === 'string') {
        // Try to extract JSON from the response
        const jsonMatch = flashcardsData.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedCards = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: parse manually if it's not proper JSON
          parsedCards = parseFlashcardsFromText(flashcardsData);
        }
      } else if (Array.isArray(flashcardsData)) {
        parsedCards = flashcardsData;
      }
      
      setFlashcards(parsedCards);
      
      // Initialize card statuses
      const initialStatuses = {};
      parsedCards.forEach((_, index) => {
        initialStatuses[index] = 'new';
      });
      setCardStatuses(initialStatuses);
    } catch (error) {
      console.error('Error parsing flashcards:', error);
      // Create fallback cards
      setFlashcards([{
        question: "Error parsing flashcards",
        answer: "Please try generating flashcards again."
      }]);
    }
  }, [flashcardsData]);

  // Auto-play functionality with better timing
  useEffect(() => {
    let interval;
    if (isAutoPlaying && studyMode === 'auto') {
      interval = setInterval(() => {
        if (isFlipped) {
          // Only advance to next card after showing answer for longer
          handleNext();
        } else {
          // Show answer
          setIsFlipped(true);
        }
      }, isFlipped ? autoPlaySpeed * 1.5 : autoPlaySpeed); // Give more time to read answer
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, isFlipped, currentIndex, autoPlaySpeed, studyMode]);

  const parseFlashcardsFromText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const cards = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        cards.push({
          question: lines[i].replace(/^\d+\.\s*/, '').trim(),
          answer: lines[i + 1].trim()
        });
      }
    }
    
    return cards.length > 0 ? cards : [{
      question: "Sample Question",
      answer: "Sample Answer - Please generate new flashcards"
    }];
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setShowStats(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCardResponse = (response) => {
    setCardStatuses(prev => ({
      ...prev,
      [currentIndex]: response
    }));

    setStudyStats(prev => ({
      ...prev,
      [response]: prev[response] + 1
    }));

    setTimeout(() => handleNext(), 500);
  };

  const resetStudySession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyStats({ correct: 0, incorrect: 0, skipped: 0 });
    setCardStatuses({});
    setShowStats(false);
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    if (studyMode !== 'auto') {
      setStudyMode('auto');
    }
  };

  if (flashcards.length === 0) {
    return (
      <FlashCardContainer>
        <LoadingMessage>Loading flashcards...</LoadingMessage>
      </FlashCardContainer>
    );
  }

  if (showStats) {
    return (
      <FlashCardContainer>
        <StatsContainer>
          <StatsHeader>
            <h2>Study Session Complete!</h2>
            <p>Here's how you did:</p>
          </StatsHeader>
          <StatsGrid>
            <StatItem $type="correct">
              <Check size={24} />
              <StatNumber>{studyStats.correct}</StatNumber>
              <StatLabel>Correct</StatLabel>
            </StatItem>
            <StatItem $type="incorrect">
              <X size={24} />
              <StatNumber>{studyStats.incorrect}</StatNumber>
              <StatLabel>Incorrect</StatLabel>
            </StatItem>
            <StatItem $type="skipped">
              <SkipForward size={24} />
              <StatNumber>{studyStats.skipped}</StatNumber>
              <StatLabel>Skipped</StatLabel>
            </StatItem>
          </StatsGrid>
          <StatsActions>
            <ActionButton onClick={resetStudySession} $primary>
              <RotateCcw size={16} />
              Study Again
            </ActionButton>
            <ActionButton onClick={onClose}>
              Close
            </ActionButton>
          </StatsActions>
        </StatsContainer>
      </FlashCardContainer>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <FlashCardContainer>
      <FlashCardHeader>
        <div className="info">
          <span className="counter">{currentIndex + 1} / {flashcards.length}</span>
          <ProgressBar>
            <ProgressFill style={{ width: `${progress}%` }} />
          </ProgressBar>
        </div>
        <div className="controls">
          <HeaderButton onClick={handleShuffle} title="Shuffle cards">
            <Shuffle size={16} />
          </HeaderButton>
          <HeaderButton 
            onClick={toggleAutoPlay} 
            title={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
            $active={isAutoPlaying}
          >
            {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
          </HeaderButton>
          <HeaderButton onClick={onClose} title="Close flashcards">
            <X size={16} />
          </HeaderButton>
        </div>
      </FlashCardHeader>

      <StudyModeSelector>
        <ModeButton 
          onClick={() => setStudyMode('manual')} 
          $active={studyMode === 'manual'}
        >
          Manual
        </ModeButton>
        <ModeButton 
          onClick={() => setStudyMode('quiz')} 
          $active={studyMode === 'quiz'}
        >
          Quiz Mode
        </ModeButton>
        <ModeButton 
          onClick={() => setStudyMode('auto')} 
          $active={studyMode === 'auto'}
        >
          Auto Play
        </ModeButton>
      </StudyModeSelector>

      <CardContainer>
        <Card 
          onClick={handleFlip}
          $flipped={isFlipped}
          $status={cardStatuses[currentIndex]}
        >
          <CardFront $flipped={isFlipped}>
            <CardLabel>Question</CardLabel>
            <CardContent>{currentCard.question}</CardContent>
            {!isFlipped && <FlipHint>Click to reveal answer</FlipHint>}
          </CardFront>
          <CardBack $flipped={isFlipped}>
            <div className="answer-section">
              <CardLabel>Answer</CardLabel>
              <CardContent>{currentCard.answer}</CardContent>
            </div>
            {studyMode === 'quiz' && (
              <QuizActions>
                <QuizButton onClick={(e) => { e.stopPropagation(); handleCardResponse('correct'); }} $type="correct">
                  <Check size={16} />
                  Got it right
                </QuizButton>
                <QuizButton onClick={(e) => { e.stopPropagation(); handleCardResponse('incorrect'); }} $type="incorrect">
                  <X size={16} />
                  Got it wrong
                </QuizButton>
                <QuizButton onClick={(e) => { e.stopPropagation(); handleCardResponse('skipped'); }} $type="skip">
                  <SkipForward size={16} />
                  Skip
                </QuizButton>
              </QuizActions>
            )}
          </CardBack>
        </Card>
      </CardContainer>

      <FlashCardFooter>
        <FooterButton 
          onClick={handlePrevious} 
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={16} />
          Previous
        </FooterButton>
        
        <div className="center-controls">
          <FooterButton onClick={handleFlip} $primary>
            <RotateCcw size={16} />
            {isFlipped ? 'Show Question' : 'Show Answer'}
          </FooterButton>
        </div>

        <FooterButton 
          onClick={handleNext} 
          disabled={currentIndex === flashcards.length - 1}
        >
          Next
          <ChevronRight size={16} />
        </FooterButton>
      </FlashCardFooter>

      {studyMode === 'auto' && (
        <AutoPlayControls>
          <label>Speed: </label>
          <SpeedSlider
            type="range"
            min="1000"
            max="10000"
            step="500"
            value={autoPlaySpeed}
            onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
          />
          <span>{autoPlaySpeed / 1000}s</span>
        </AutoPlayControls>
      )}
    </FlashCardContainer>
  );
};

// Animations
const flipAnimation = keyframes`
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(180deg); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const FlashCardContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const FlashCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  .info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }
  
  .counter {
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  .controls {
    display: flex;
    gap: 0.5rem;
  }
`;

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1e40af);
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const HeaderButton = styled.button`
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  ${props => props.$active && `
    background: rgba(59, 130, 246, 0.8);
    border-color: rgba(59, 130, 246, 1);
  `}
`;

const StudyModeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  justify-content: center;
`;

const ModeButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  
  ${props => props.$active ? `
    background: rgba(59, 130, 246, 0.8);
    color: white;
    border: 1px solid rgba(59, 130, 246, 1);
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `}
`;

const CardContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;
`;

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  height: 400px;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  animation: ${slideIn} 0.5s ease-out;
  
  ${props => props.$flipped && `
    transform: rotateY(180deg);
  `}
  
  &:hover {
    transform: ${props => props.$flipped ? 'rotateY(180deg) scale(1.02)' : 'scale(1.02)'};
  }
`;

const CardSide = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  padding: 2rem;
  
  .dark & {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const CardFront = styled(CardSide)`
  ${props => props.$flipped && 'transform: rotateY(180deg);'}
`;

const CardBack = styled(CardSide)`
  transform: rotateY(180deg);
  ${props => props.$flipped && 'transform: rotateY(0deg);'}
`;

const CardLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CardContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 1.25rem;
  line-height: 1.6;
  color: #1f2937;
  
  .dark & {
    color: #f9fafb;
  }
`;

const FlipHint = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
  margin-top: 1rem;
`;

const QuizActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const QuizButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  ${props => {
    switch (props.$type) {
      case 'correct':
        return `
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #059669;
          
          &:hover {
            background: rgba(16, 185, 129, 0.2);
          }
        `;
      case 'incorrect':
        return `
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
          
          &:hover {
            background: rgba(239, 68, 68, 0.2);
          }
        `;
      case 'skip':
        return `
          background: rgba(107, 114, 128, 0.1);
          border: 1px solid rgba(107, 114, 128, 0.3);
          color: #6b7280;
          
          &:hover {
            background: rgba(107, 114, 128, 0.2);
          }
        `;
      default:
        return '';
    }
  }}
`;

const FlashCardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  
  .center-controls {
    display: flex;
    gap: 0.5rem;
  }
`;

const FooterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #3b82f6, #1e40af);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AutoPlayControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
`;

const SpeedSlider = styled.input`
  width: 200px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  font-size: 1.2rem;
`;

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const StatsHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h2 {
    color: white;
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  ${props => {
    switch (props.$type) {
      case 'correct':
        return `border-color: rgba(16, 185, 129, 0.5); color: #10b981;`;
      case 'incorrect':
        return `border-color: rgba(239, 68, 68, 0.5); color: #ef4444;`;
      case 'skipped':
        return `border-color: rgba(107, 114, 128, 0.5); color: #6b7280;`;
      default:
        return '';
    }
  }}
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin: 0.5rem 0;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
`;

const StatsActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #3b82f6, #1e40af);
    color: white;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `}
`;

export default FlashCardViewer;
