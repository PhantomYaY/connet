import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';

const GAME_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

const SnakeGame = ({ onClose }) => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('snakeHighScore') || '0');
  });

  const gameLoopRef = useRef();
  const gameContainerRef = useRef();

  const generateFood = useCallback((currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GAME_SIZE),
        y: Math.floor(Math.random() * GAME_SIZE)
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setIsPlaying(false);
  }, []);

  const startGame = useCallback(() => {
    setIsPlaying(true);
    gameContainerRef.current?.focus();
  }, []);

  const gameLoop = useCallback(() => {
    if (!isPlaying || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { 
        x: newSnake[0].x + direction.x, 
        y: newSnake[0].y + direction.y 
      };

      // Check wall collision
      if (head.x < 0 || head.x >= GAME_SIZE || head.y < 0 || head.y >= GAME_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        return currentSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setIsPlaying(false);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPlaying, generateFood, highScore]);

  const handleKeyPress = useCallback((e) => {
    if (!isPlaying) return;

    e.preventDefault();
    const { key } = e;

    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        setDirection(prev => prev.y === 1 ? prev : { x: 0, y: -1 });
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        setDirection(prev => prev.y === -1 ? prev : { x: 0, y: 1 });
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        setDirection(prev => prev.x === 1 ? prev : { x: -1, y: 0 });
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        setDirection(prev => prev.x === -1 ? prev : { x: 1, y: 0 });
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [isPlaying, onClose]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(gameLoop, 150);
    } else {
      clearInterval(gameLoopRef.current);
    }

    return () => clearInterval(gameLoopRef.current);
  }, [gameLoop, isPlaying, gameOver]);

  useEffect(() => {
    const gameContainer = gameContainerRef.current;
    if (gameContainer) {
      gameContainer.addEventListener('keydown', handleKeyPress);
      return () => gameContainer.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress]);

  return (
    <GameOverlay>
      <GameContainer
        ref={gameContainerRef}
        tabIndex={0}
        $isPlaying={isPlaying}
      >
        <GameHeader>
          <div>
            <GameTitle>🐍 Snake Game</GameTitle>
            <ScoreDisplay>
              Score: {score} | High Score: {highScore}
            </ScoreDisplay>
          </div>
          <CloseButton onClick={onClose}>×</CloseButton>
        </GameHeader>

        <GameBoard>
          {Array.from({ length: GAME_SIZE * GAME_SIZE }).map((_, index) => {
            const x = index % GAME_SIZE;
            const y = Math.floor(index / GAME_SIZE);
            const isSnake = snake.some(segment => segment.x === x && segment.y === y);
            const isFood = food.x === x && food.y === y;
            const isHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;

            return (
              <GameCell
                key={index}
                $isSnake={isSnake}
                $isFood={isFood}
                $isHead={isHead}
              />
            );
          })}
        </GameBoard>

        <GameControls>
          {!isPlaying && !gameOver && (
            <GameButton onClick={startGame}>
              🎮 Start Game
            </GameButton>
          )}
          
          {gameOver && (
            <div>
              <GameOverText>Game Over! ��</GameOverText>
              <GameButton onClick={resetGame}>
                🔄 Play Again
              </GameButton>
            </div>
          )}
          
          {isPlaying && (
            <ControlsHint>
              Use WASD or Arrow Keys to move • ESC to close
            </ControlsHint>
          )}
        </GameControls>
      </GameContainer>
    </GameOverlay>
  );
};

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
  50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); }
`;

// Styled Components
const GameOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const GameContainer = styled.div`
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px;
  border: 2px solid rgba(34, 197, 94, 0.3);
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  outline: none;
  
  ${props => props.$isPlaying && `
    border-color: rgba(34, 197, 94, 0.6);
    animation: ${glow} 2s ease-in-out infinite;
  `}
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
`;

const GameTitle = styled.h2`
  color: #22c55e;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
`;

const ScoreDisplay = styled.div`
  color: #e2e8f0;
  font-size: 0.875rem;
  font-family: monospace;
`;

const CloseButton = styled.button`
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #ef4444;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.4);
    transform: scale(1.1);
  }
`;

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(${GAME_SIZE}, 1fr);
  grid-template-rows: repeat(${GAME_SIZE}, 1fr);
  gap: 1px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 1.5rem;
  width: 400px;
  height: 400px;
`;

const GameCell = styled.div`
  background: ${props => {
    if (props.$isHead) return 'linear-gradient(135deg, #22c55e, #16a34a)';
    if (props.$isSnake) return '#22c55e';
    if (props.$isFood) return '#ef4444';
    return 'rgba(71, 85, 105, 0.3)';
  }};
  border-radius: ${props => props.$isFood ? '50%' : '2px'};
  transition: all 0.1s ease;
  
  ${props => props.$isFood && `
    animation: ${pulse} 1s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
  `}
  
  ${props => props.$isHead && `
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
  `}
`;

const GameControls = styled.div`
  text-align: center;
`;

const GameButton = styled.button`
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
  }
`;

const GameOverText = styled.div`
  color: #ef4444;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
`;

const ControlsHint = styled.div`
  color: #94a3b8;
  font-size: 0.75rem;
  margin-top: 1rem;
  font-family: monospace;
`;

export default SnakeGame;
