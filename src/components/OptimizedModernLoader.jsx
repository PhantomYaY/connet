import React, { memo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../context/ThemeContext';

const OptimizedModernLoader = memo(() => {
  // Safe theme access with fallback
  let isDarkMode = true; // Default to dark mode for loader
  try {
    const theme = useTheme();
    isDarkMode = theme?.isDarkMode ?? true;
  } catch (error) {
    // Theme context not available, use default
    isDarkMode = localStorage.getItem('theme') === 'dark' || true;
  }

  return (
    <LoaderContainer $isDarkMode={isDarkMode}>
      <LogoAnimation>
        <LogoText $isDarkMode={isDarkMode}>
          Connect<span>Ed</span>
        </LogoText>
        <LoadingBar $isDarkMode={isDarkMode}>
          <LoadingFill $isDarkMode={isDarkMode} />
        </LoadingBar>
      </LogoAnimation>
      <LoadingText $isDarkMode={isDarkMode}>Preparing your workspace...</LoadingText>
    </LoaderContainer>
  );
});

// Optimized animations with will-change and transform3d for GPU acceleration
const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fillAnimation = keyframes`
  0% { transform: translate3d(-100%, 0, 0); }
  100% { transform: translate3d(0%, 0, 0); }
`;

const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
  50% {
    opacity: 0.8;
    transform: scale3d(1.02, 1.02, 1);
  }
`;

const LoaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
  };
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  will-change: opacity;
`;

const LogoAnimation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  animation: ${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
`;

const LogoText = styled.h1`
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 900;
  color: white;
  margin: 0;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 25%, #dbeafe 50%, #bfdbfe 75%, #93c5fd 100%)'
    : 'linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 75%, #94a3b8 100%)'
  };
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${gradientShift} 3s ease-in-out infinite, ${pulse} 2s ease-in-out infinite;
  will-change: background-position, transform, opacity;
  text-align: center;

  span {
    background: linear-gradient(
      135deg,
      #3b82f6 0%,
      #1e40af 25%,
      #1d4ed8 50%,
      #1e3a8a 75%,
      #1e293b 100%
    );
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${gradientShift} 2s ease-in-out infinite reverse;
    will-change: background-position;
  }
`;

const LoadingBar = styled.div`
  width: 200px;
  height: 4px;
  background: ${props => props.$isDarkMode
    ? 'rgba(255, 255, 255, 0.2)'
    : 'rgba(71, 85, 105, 0.2)'
  };
  border-radius: 2px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  will-change: opacity;
`;

const LoadingFill = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 100%)'
    : 'linear-gradient(90deg, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0.8) 50%, rgba(59, 130, 246, 0) 100%)'
  };
  animation: ${fillAnimation} 1.5s ease-in-out infinite;
  will-change: transform;
`;

const LoadingText = styled.p`
  color: ${props => props.$isDarkMode
    ? 'rgba(255, 255, 255, 0.9)'
    : 'rgba(71, 85, 105, 0.8)'
  };
  font-size: 1rem;
  font-weight: 500;
  margin: 2rem 0 0 0;
  animation: ${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
  will-change: transform, opacity;
  text-align: center;
`;

OptimizedModernLoader.displayName = 'OptimizedModernLoader';

export default OptimizedModernLoader;
