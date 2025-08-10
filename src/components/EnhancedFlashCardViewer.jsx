import React, { useState, useEffect, useCallback } from 'react';
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
  SkipForward,
  Clock,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Settings,
  BookOpen,
  Brain,
  Zap,
  RefreshCw
} from 'lucide-react';

const EnhancedFlashCardViewer = ({ flashcardsData, onClose, setName }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState('adaptive'); // 'adaptive', 'manual', 'auto', 'spaced'
  const [difficulty, setDifficulty] = useState('medium');
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(3000);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    streak: 0,
    maxStreak: 0,
    timeSpent: 0,
    startTime: Date.now()
  });
  const [cardStatuses, setCardStatuses] = useState({});
  const [cardDifficulties, setCardDifficulties] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [manualInteraction, setManualInteraction] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    try {
      let parsedCards = [];
      if (typeof flashcardsData === 'string') {
        const jsonMatch = flashcardsData.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedCards = JSON.parse(jsonMatch[0]);
        } else {
          parsedCards = parseFlashcardsFromText(flashcardsData);
        }
      } else if (Array.isArray(flashcardsData)) {
        parsedCards = flashcardsData;
      }
      
      setFlashcards(parsedCards);
      
      // Initialize card statuses and difficulties
      const initialStatuses = {};
      const initialDifficulties = {};
      parsedCards.forEach((_, index) => {
        initialStatuses[index] = 'new';
        initialDifficulties[index] = 'medium';
      });
      setCardStatuses(initialStatuses);
      setCardDifficulties(initialDifficulties);
    } catch (error) {
      console.error('Error parsing flashcards:', error);
      setFlashcards([{
        question: "Error parsing flashcards",
        answer: "Please try generating flashcards again."
      }]);
    }
  }, [flashcardsData]);

  // Smart card selection for spaced repetition
  const getNextCard = useCallback(() => {
    if (studyMode === 'spaced') {
      // Prioritize cards that need review
      const needReview = flashcards
        .map((_, index) => index)
        .filter(index => 
          !masteredCards.has(index) && 
          (cardStatuses[index] === 'incorrect' || cardStatuses[index] === 'new')
        );
      
      if (needReview.length > 0) {
        return needReview[Math.floor(Math.random() * needReview.length)];
      }
    }
    
    // Default: sequential or adaptive selection
    if (studyMode === 'adaptive') {
      const difficultCards = flashcards
        .map((_, index) => index)
        .filter(index => cardDifficulties[index] === 'hard' && !masteredCards.has(index));
      
      if (difficultCards.length > 0 && Math.random() < 0.4) {
        return difficultCards[Math.floor(Math.random() * difficultCards.length)];
      }
    }
    
    return (currentIndex + 1) % flashcards.length;
  }, [currentIndex, flashcards.length, studyMode, cardStatuses, cardDifficulties, masteredCards]);

  // Auto-play functionality with proper timing and manual interaction pause
  useEffect(() => {
    let timeout;
    if (isAutoPlaying && studyMode === 'auto' && !manualInteraction) {
      if (!isFlipped) {
        timeout = setTimeout(() => {
          setIsFlipped(true);
        }, autoPlaySpeed);
      } else {
        timeout = setTimeout(() => {
          handleNext();
        }, autoPlaySpeed * 1.5);
      }
    }
    return () => clearTimeout(timeout);
  }, [isAutoPlaying, isFlipped, currentIndex, autoPlaySpeed, studyMode, manualInteraction]);

  // Update session progress
  useEffect(() => {
    const totalCards = flashcards.length;
    const studiedCards = Object.values(cardStatuses).filter(status => status !== 'new').length;
    setSessionProgress(totalCards > 0 ? (studiedCards / totalCards) * 100 : 0);
  }, [cardStatuses, flashcards.length]);

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
    if (isAutoPlaying) {
      setManualInteraction(true);
      setTimeout(() => setManualInteraction(false), autoPlaySpeed * 2);
    }
  };

  const handleNext = () => {
    const nextIndex = getNextCard();
    setCurrentIndex(nextIndex);
    setIsFlipped(false);
    
    if (isAutoPlaying) {
      setManualInteraction(true);
      setTimeout(() => setManualInteraction(false), autoPlaySpeed * 2);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      if (isAutoPlaying) {
        setManualInteraction(true);
        setTimeout(() => setManualInteraction(false), autoPlaySpeed * 2);
      }
    }
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCardResponse = (response, difficultyLevel = 'medium') => {
    const newStats = { ...studyStats };
    
    // Update card status and difficulty
    setCardStatuses(prev => ({
      ...prev,
      [currentIndex]: response
    }));
    
    setCardDifficulties(prev => ({
      ...prev,
      [currentIndex]: difficultyLevel
    }));

    // Update statistics
    newStats[response] = newStats[response] + 1;
    
    if (response === 'correct') {
      newStats.streak += 1;
      newStats.maxStreak = Math.max(newStats.maxStreak, newStats.streak);
      
      // Mark as mastered if answered correctly multiple times
      if (cardStatuses[currentIndex] === 'correct') {
        setMasteredCards(prev => new Set([...prev, currentIndex]));
      }
    } else {
      newStats.streak = 0;
    }
    
    newStats.timeSpent = Date.now() - newStats.startTime;
    setStudyStats(newStats);

    setTimeout(() => handleNext(), 500);
  };

  const resetStudySession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyStats({ 
      correct: 0, 
      incorrect: 0, 
      skipped: 0, 
      streak: 0, 
      maxStreak: 0, 
      timeSpent: 0,
      startTime: Date.now()
    });
    setCardStatuses({});
    setCardDifficulties({});
    setMasteredCards(new Set());
    setShowStats(false);
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    if (studyMode !== 'auto') {
      setStudyMode('auto');
    }
  };

  const getScorePercentage = () => {
    const total = studyStats.correct + studyStats.incorrect;
    return total > 0 ? Math.round((studyStats.correct / total) * 100) : 0;
  };

  const getPerformanceLevel = () => {
    const score = getScorePercentage();
    if (score >= 90) return { level: 'Excellent', color: '#10b981', icon: Award };
    if (score >= 75) return { level: 'Good', color: '#3b82f6', icon: TrendingUp };
    if (score >= 60) return { level: 'Fair', color: '#f59e0b', icon: Target };
    return { level: 'Needs Practice', color: '#ef4444', icon: RefreshCw };
  };

  if (flashcards.length === 0) {
    return (
      <FlashCardContainer>
        <LoadingMessage>Loading flashcards...</LoadingMessage>
      </FlashCardContainer>
    );
  }

  if (showStats) {
    const performance = getPerformanceLevel();
    const PerformanceIcon = performance.icon;
    
    return (
      <FlashCardContainer>
        <StatsContainer>
          <StatsHeader>
            <PerformanceIcon size={48} color={performance.color} />
            <h2>Study Session Complete!</h2>
            <PerformanceBadge $color={performance.color}>
              {performance.level} - {getScorePercentage()}%
            </PerformanceBadge>
          </StatsHeader>
          
          <DetailedStats>
            <StatCategory>
              <h3>Performance</h3>
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
            </StatCategory>
            
            <StatCategory>
              <h3>Session Info</h3>
              <StatsGrid>
                <StatItem $type="streak">
                  <Zap size={24} />
                  <StatNumber>{studyStats.maxStreak}</StatNumber>
                  <StatLabel>Max Streak</StatLabel>
                </StatItem>
                <StatItem $type="time">
                  <Clock size={24} />
                  <StatNumber>{Math.round(studyStats.timeSpent / 60000)}</StatNumber>
                  <StatLabel>Minutes</StatLabel>
                </StatItem>
                <StatItem $type="mastered">
                  <Brain size={24} />
                  <StatNumber>{masteredCards.size}</StatNumber>
                  <StatLabel>Mastered</StatLabel>
                </StatItem>
              </StatsGrid>
            </StatCategory>
          </DetailedStats>
          
          <StatsActions>
            <ActionButton onClick={resetStudySession} $primary>
              <RotateCcw size={16} />
              Study Again
            </ActionButton>
            <ActionButton onClick={onClose}>
              Finish Session
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
          <HeaderStats>
            <StatBadge>
              <BookOpen size={14} />
              {setName || 'Flashcards'}
            </StatBadge>
            <StatBadge>
              <span className="counter">{currentIndex + 1} / {flashcards.length}</span>
            </StatBadge>
            <StatBadge $color="#10b981">
              <Zap size={14} />
              Streak: {studyStats.streak}
            </StatBadge>
          </HeaderStats>
          <ProgressContainer>
            <ProgressBar>
              <ProgressFill style={{ width: `${progress}%` }} />
            </ProgressBar>
            <ProgressStats>
              <span>Session: {Math.round(sessionProgress)}%</span>
              <span>Score: {getScorePercentage()}%</span>
            </ProgressStats>
          </ProgressContainer>
        </div>
        <div className="controls">
          <HeaderButton onClick={() => setShowSettings(!showSettings)} title="Settings">
            <Settings size={16} />
          </HeaderButton>
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

      {showSettings && (
        <SettingsPanel>
          <h3>Study Settings</h3>
          <SettingGroup>
            <label>Study Mode:</label>
            <ModeSelector>
              <ModeButton 
                onClick={() => setStudyMode('adaptive')} 
                $active={studyMode === 'adaptive'}
              >
                <Brain size={14} />
                Adaptive
              </ModeButton>
              <ModeButton 
                onClick={() => setStudyMode('spaced')} 
                $active={studyMode === 'spaced'}
              >
                <Clock size={14} />
                Spaced
              </ModeButton>
              <ModeButton 
                onClick={() => setStudyMode('manual')} 
                $active={studyMode === 'manual'}
              >
                Manual
              </ModeButton>
              <ModeButton 
                onClick={() => setStudyMode('auto')} 
                $active={studyMode === 'auto'}
              >
                Auto
              </ModeButton>
            </ModeSelector>
          </SettingGroup>
          
          {studyMode === 'auto' && (
            <SettingGroup>
              <label>Auto-play Speed: {autoPlaySpeed / 1000}s</label>
              <SpeedSlider
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={autoPlaySpeed}
                onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
              />
            </SettingGroup>
          )}
        </SettingsPanel>
      )}

      <CardContainer>
        <Card 
          onClick={handleFlip}
          $flipped={isFlipped}
          $status={cardStatuses[currentIndex]}
          $difficulty={cardDifficulties[currentIndex]}
        >
          <CardFront $flipped={isFlipped}>
            <CardLabel>Question</CardLabel>
            <CardContent>{currentCard.question}</CardContent>
            {!isFlipped && <FlipHint>Click to reveal answer</FlipHint>}
            <DifficultyIndicator $difficulty={cardDifficulties[currentIndex]} />
          </CardFront>
          <CardBack $flipped={isFlipped}>
            <div className="answer-section">
              <CardLabel>Answer</CardLabel>
              <CardContent>{currentCard.answer}</CardContent>
            </div>
            
            <ResponseActions>
              <h4>How did you do?</h4>
              <ResponseGrid>
                <ResponseButton 
                  onClick={(e) => { e.stopPropagation(); handleCardResponse('incorrect', 'hard'); }} 
                  $type="hard"
                >
                  <X size={16} />
                  Hard
                  <small>Show again soon</small>
                </ResponseButton>
                <ResponseButton 
                  onClick={(e) => { e.stopPropagation(); handleCardResponse('skipped', 'medium'); }} 
                  $type="medium"
                >
                  <SkipForward size={16} />
                  Medium
                  <small>Show again later</small>
                </ResponseButton>
                <ResponseButton 
                  onClick={(e) => { e.stopPropagation(); handleCardResponse('correct', 'easy'); }} 
                  $type="easy"
                >
                  <Check size={16} />
                  Easy
                  <small>Show less often</small>
                </ResponseButton>
              </ResponseGrid>
            </ResponseActions>
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
          <FooterButton onClick={() => setShowStats(true)} variant="secondary">
            <BarChart3 size={16} />
            View Stats
          </FooterButton>
        </div>

        <FooterButton onClick={handleNext}>
          Next
          <ChevronRight size={16} />
        </FooterButton>
      </FlashCardFooter>
    </FlashCardContainer>
  );
};

// Animations
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Styled Components
const FlashCardContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const FlashCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  
  .info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
  }
  
  .controls {
    display: flex;
    gap: 0.5rem;
  }
`;

const HeaderStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  color: ${props => props.$color || 'white'};
  font-size: 0.875rem;
  font-weight: 500;
  
  .counter {
    font-weight: 600;
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProgressBar = styled.div`
  width: 300px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1e40af);
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const ProgressStats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
`;

const HeaderButton = styled.button`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: white;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  ${props => props.$active && `
    background: rgba(59, 130, 246, 0.8);
    border-color: rgba(59, 130, 246, 1);
  `}
`;

const SettingsPanel = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  
  h3 {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

const ModeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ModeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const SpeedSlider = styled.input`
  width: 100%;
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
  max-width: 700px;
  height: 450px;
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
  
  ${props => props.$status === 'correct' && `
    animation: ${pulse} 0.5s ease-in-out;
  `}
`;

const CardSide = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  padding: 2.5rem;
  
  .dark & {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const CardFront = styled(CardSide)`
  ${props => props.$flipped && 'transform: rotateY(180deg);'}
  position: relative;
`;

const CardBack = styled(CardSide)`
  transform: rotateY(180deg);
  ${props => props.$flipped && 'transform: rotateY(0deg);'}
`;

const CardLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CardContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 1.4rem;
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
  opacity: 0.7;
`;

const DifficultyIndicator = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$difficulty) {
      case 'easy': return '#10b981';
      case 'hard': return '#ef4444';
      default: return '#f59e0b';
    }
  }};
`;

const ResponseActions = styled.div`
  margin-top: 1.5rem;
  
  h4 {
    color: #374151;
    margin: 0 0 1rem 0;
    font-size: 1rem;
    text-align: center;
    
    .dark & {
      color: #d1d5db;
    }
  }
`;

const ResponseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
`;

const ResponseButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
  
  small {
    font-size: 0.75rem;
    opacity: 0.8;
    font-weight: 400;
  }
  
  ${props => {
    switch (props.$type) {
      case 'hard':
        return `
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
          
          &:hover {
            background: rgba(239, 68, 68, 0.2);
            transform: translateY(-2px);
          }
        `;
      case 'medium':
        return `
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #d97706;
          
          &:hover {
            background: rgba(245, 158, 11, 0.2);
            transform: translateY(-2px);
          }
        `;
      case 'easy':
        return `
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #059669;
          
          &:hover {
            background: rgba(16, 185, 129, 0.2);
            transform: translateY(-2px);
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
    gap: 0.75rem;
  }
`;

const FooterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #3b82f6, #1e40af);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }
  ` : props.variant === 'secondary' ? `
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.2);
    
    &:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.2);
      transform: translateY(-1px);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  max-width: 800px;
  margin: 0 auto;
`;

const StatsHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h2 {
    color: white;
    font-size: 2.5rem;
    margin: 1rem 0;
    font-weight: 700;
  }
`;

const PerformanceBadge = styled.div`
  display: inline-block;
  background: ${props => props.$color}20;
  border: 2px solid ${props => props.$color};
  color: ${props => props.$color};
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: 600;
`;

const DetailedStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  margin-bottom: 3rem;
`;

const StatCategory = styled.div`
  h3 {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    text-align: center;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
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
        return `border-color: rgba(245, 158, 11, 0.5); color: #f59e0b;`;
      case 'streak':
        return `border-color: rgba(168, 85, 247, 0.5); color: #a855f7;`;
      case 'time':
        return `border-color: rgba(59, 130, 246, 0.5); color: #3b82f6;`;
      case 'mastered':
        return `border-color: rgba(16, 185, 129, 0.5); color: #10b981;`;
      default:
        return '';
    }
  }}
`;

const StatNumber = styled.div`
  font-size: 2.2rem;
  font-weight: bold;
  margin: 0.5rem 0;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
`;

const StatsActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #3b82f6, #1e40af);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(59, 130, 246, 0.4);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
  `}
`;

export default EnhancedFlashCardViewer;
