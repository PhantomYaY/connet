import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { RotateCcw, Play, Pause, Trophy, Target } from 'lucide-react';

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('snakeHighScore') || '0');
  });
  const [speed, setSpeed] = useState(150);
  
  const gameLoopRef = useRef();

  // Generate random food position
  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  // Check collision with walls or self
  const checkCollision = useCallback((head, snakeBody) => {
    return (
      head.x < 0 || 
      head.x >= BOARD_SIZE || 
      head.y < 0 || 
      head.y >= BOARD_SIZE ||
      snakeBody.some(segment => segment.x === head.x && segment.y === head.y)
    );
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameRunning || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      head.x += direction.x;
      head.y += direction.y;

      if (checkCollision(head, newSnake)) {
        setGameOver(true);
        setGameRunning(false);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
          }
          return newScore;
        });
        setFood(generateFood());
        // Increase speed slightly
        setSpeed(prev => Math.max(prev - 2, 50));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameRunning, gameOver, checkCollision, generateFood, highScore]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameRunning && !gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setDirection(prev => prev.y !== 1 ? { x: 0, y: -1 } : prev);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setDirection(prev => prev.y !== -1 ? { x: 0, y: 1 } : prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setDirection(prev => prev.x !== 1 ? { x: -1, y: 0 } : prev);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setDirection(prev => prev.x !== -1 ? { x: 1, y: 0 } : prev);
          break;
        case ' ':
          e.preventDefault();
          toggleGame();
          break;
        case 'r':
          e.preventDefault();
          resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameRunning, gameOver]);

  // Game loop timer
  useEffect(() => {
    if (gameRunning && !gameOver) {
      gameLoopRef.current = setInterval(gameLoop, speed);
    } else {
      clearInterval(gameLoopRef.current);
    }

    return () => clearInterval(gameLoopRef.current);
  }, [gameLoop, gameRunning, gameOver, speed]);

  const startGame = () => {
    setGameRunning(true);
    setGameOver(false);
  };

  const pauseGame = () => {
    setGameRunning(false);
  };

  const toggleGame = () => {
    if (gameOver) {
      resetGame();
    } else {
      setGameRunning(!gameRunning);
    }
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameRunning(false);
    setGameOver(false);
    setScore(0);
    setSpeed(150);
  };

  return (
    <GameContainer>
      <GameHeader>
        <Title>🐍 Snake Game</Title>
        <Controls>
          <ScoreDisplay>
            <div>
              <Target size={16} />
              Score: {score}
            </div>
            <div>
              <Trophy size={16} />
              Best: {highScore}
            </div>
          </ScoreDisplay>
          <GameButtons>
            <GameButton onClick={toggleGame}>
              {gameRunning ? <Pause size={16} /> : <Play size={16} />}
              {gameOver ? 'Play Again' : gameRunning ? 'Pause' : 'Start'}
            </GameButton>
            <GameButton onClick={resetGame}>
              <RotateCcw size={16} />
              Reset
            </GameButton>
          </GameButtons>
        </Controls>
      </GameHeader>

      <GameBoard>
        {Array.from({ length: BOARD_SIZE }, (_, y) =>
          Array.from({ length: BOARD_SIZE }, (_, x) => {
            const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
            const isSnakeBody = snake.some(segment => segment.x === x && segment.y === y);
            const isFood = food.x === x && food.y === y;
            
            return (
              <Cell
                key={`${x}-${y}`}
                $isSnakeHead={isSnakeHead}
                $isSnakeBody={isSnakeBody && !isSnakeHead}
                $isFood={isFood}
              />
            );
          })
        )}
      </GameBoard>

      {gameOver && (
        <GameOverlay>
          <GameOverContent>
            <h2>Game Over! 🎮</h2>
            <p>Score: {score}</p>
            {score === highScore && score > 0 && (
              <p className="high-score">🎉 New High Score!</p>
            )}
            <GameButton onClick={resetGame}>
              <Play size={16} />
              Play Again
            </GameButton>
          </GameOverContent>
        </GameOverlay>
      )}

      <Instructions>
        <p><strong>Controls:</strong></p>
        <p>🔄 Arrow keys to move</p>
        <p>⏯️ Spacebar to pause/resume</p>
        <p>🔄 'R' to reset</p>
      </Instructions>
    </GameContainer>
  );
};

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
  height: 100vh;
  overflow: hidden;
  background: rgb(241 245 249);
  color: rgb(30 41 59);

  @media (prefers-color-scheme: dark) {
    background: rgb(15 23 42);
    color: rgb(248 250 252);
  }
`;

const GameHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 500px;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  color: rgb(30 41 59);

  @media (prefers-color-scheme: dark) {
    color: rgb(248 250 252);
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
`;

const ScoreDisplay = styled.div`
  display: flex;
  gap: 12px;
  font-size: 0.9rem;
  font-weight: 600;

  div {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(16px);
    padding: 6px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgb(30 41 59);

    @media (prefers-color-scheme: dark) {
      background: rgba(30 41 59, 0.6);
      color: rgb(248 250 252);
      border-color: rgba(30 41 59, 0.3);
    }
  }
`;

const GameButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const GameButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgb(30 41 59);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  @media (prefers-color-scheme: dark) {
    background: rgba(30 41 59, 0.6);
    color: rgb(248 250 252);
    border-color: rgba(30 41 59, 0.3);

    &:hover {
      background: rgba(30 41 59, 0.8);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
`;

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(${BOARD_SIZE}, 1fr);
  grid-template-rows: repeat(${BOARD_SIZE}, 1fr);
  gap: 1px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 400px;
  height: 400px;

  @media (prefers-color-scheme: dark) {
    background: rgba(30 41 59, 0.6);
    border-color: rgba(30 41 59, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
`;

const Cell = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 3px;
  transition: all 0.1s ease;

  ${props => {
    if (props.$isSnakeHead) {
      return `
        background: linear-gradient(45deg, rgb(34 197 94), rgb(74 222 128));
        box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
        border: 1px solid rgb(34 197 94);
      `;
    }
    if (props.$isSnakeBody) {
      return `
        background: linear-gradient(45deg, rgb(74 222 128), rgb(134 239 172));
        box-shadow: 0 1px 2px rgba(74, 222, 128, 0.2);
      `;
    }
    if (props.$isFood) {
      return `
        background: radial-gradient(circle, rgb(239 68 68), rgb(248 113 113));
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
        border: 1px solid rgb(239 68 68);
        animation: pulse 1s infinite alternate;
      `;
    }
    return `
      background: rgba(148, 163, 184, 0.1);

      @media (prefers-color-scheme: dark) {
        background: rgba(71, 85, 105, 0.1);
      }
    `;
  }}

  @keyframes pulse {
    from { transform: scale(0.9); }
    to { transform: scale(1.1); }
  }
`;

const GameOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const GameOverContent = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgb(30 41 59);

  h2 {
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0 0 16px 0;
  }

  p {
    font-size: 1.1rem;
    margin: 8px 0;
    font-weight: 600;
  }

  .high-score {
    color: rgb(234 179 8);
    font-weight: bold;
    animation: glow 1s infinite alternate;
  }

  @media (prefers-color-scheme: dark) {
    background: rgba(30 41 59, 0.9);
    color: rgb(248 250 252);
    border-color: rgba(30 41 59, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  @keyframes glow {
    from { opacity: 0.8; }
    to { opacity: 1; }
  }
`;

const Instructions = styled.div`
  text-align: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 400px;

  p {
    margin: 3px 0;
    font-size: 0.8rem;
    color: rgb(30 41 59);
  }

  strong {
    font-size: 0.85rem;
    color: rgb(79 70 229);
    font-weight: 700;
  }

  @media (prefers-color-scheme: dark) {
    background: rgba(30 41 59, 0.6);
    border-color: rgba(30 41 59, 0.3);

    p {
      color: rgb(248 250 252);
    }

    strong {
      color: rgb(129 140 248);
    }
  }
`;

export default SnakeGame;
