import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Brain, Sparkles, Loader, Zap } from 'lucide-react';

const AILoadingIndicator = ({ 
  type = 'default', 
  message = 'Processing...', 
  size = 'medium',
  inline = false 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'chat': return Brain;
      case 'flashcards': return Sparkles;
      case 'analysis': return Zap;
      default: return Loader;
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'chat': return 'AI is thinking...';
      case 'flashcards': return 'Generating flashcards...';
      case 'analysis': return 'Analyzing content...';
      case 'summarize': return 'Creating summary...';
      case 'improve': return 'Improving writing...';
      default: return message;
    }
  };

  const Icon = getIcon();

  if (inline) {
    return (
      <InlineLoader $size={size}>
        <Icon className="spinning-icon" size={size === 'small' ? 14 : 16} />
        <span>{getMessage()}</span>
      </InlineLoader>
    );
  }

  return (
    <LoaderContainer $size={size}>
      <LoaderContent>
        <IconContainer $size={size}>
          <Icon className="spinning-icon" size={size === 'small' ? 20 : size === 'large' ? 32 : 24} />
          <SparkleContainer>
            <Sparkles className="sparkle sparkle-1" size={12} />
            <Sparkles className="sparkle sparkle-2" size={10} />
            <Sparkles className="sparkle sparkle-3" size={8} />
          </SparkleContainer>
        </IconContainer>
        <LoaderText $size={size}>{getMessage()}</LoaderText>
        <ProgressBar>
          <ProgressFill />
        </ProgressBar>
      </LoaderContent>
    </LoaderContainer>
  );
};

// Animations
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const sparkleFloat = keyframes`
  0%, 100% { 
    transform: translateY(0px) scale(1);
    opacity: 0.6;
  }
  50% { 
    transform: translateY(-10px) scale(1.2);
    opacity: 1;
  }
`;

const progressMove = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

// Styled Components
const LoaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => {
    switch (props.$size) {
      case 'small': return '1rem';
      case 'large': return '3rem 2rem';
      default: return '2rem';
    }
  }};
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  
  .dark & {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }
`;

const LoaderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
`;

const IconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .spinning-icon {
    color: #3b82f6;
    ${css`animation: ${spin} 2s linear infinite;`}
  }
`;

const SparkleContainer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  
  .sparkle {
    position: absolute;
    color: #a855f7;
    
    &.sparkle-1 {
      top: -5px;
      right: -5px;
      ${css`animation: ${sparkleFloat} 2s ease-in-out infinite;`}
      animation-delay: 0s;
    }
    
    &.sparkle-2 {
      bottom: -5px;
      left: -5px;
      ${css`animation: ${sparkleFloat} 2s ease-in-out infinite;`}
      animation-delay: 0.7s;
    }
    
    &.sparkle-3 {
      top: 50%;
      right: -8px;
      transform: translateY(-50%);
      ${css`animation: ${sparkleFloat} 2s ease-in-out infinite;`}
      animation-delay: 1.4s;
    }
  }
`;

const LoaderText = styled.div`
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return '0.875rem';
      case 'large': return '1.25rem';
      default: return '1rem';
    }
  }};
  font-weight: 500;
  color: #374151;
  ${css`animation: ${pulse} 2s ease-in-out infinite;`}
  
  .dark & {
    color: #d1d5db;
  }
`;

const ProgressBar = styled.div`
  width: 120px;
  height: 3px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 1.5px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 50%;
  background: linear-gradient(90deg, 
    transparent,
    rgba(59, 130, 246, 0.8),
    rgba(59, 130, 246, 1),
    rgba(59, 130, 246, 0.8),
    transparent
  );
  ${css`animation: ${progressMove} 1.5s ease-in-out infinite;`}
`;

const InlineLoader = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: ${props => props.$size === 'small' ? '0.25rem 0.5rem' : '0.5rem 0.75rem'};
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
  font-size: ${props => props.$size === 'small' ? '0.75rem' : '0.875rem'};
  font-weight: 500;
  color: #3b82f6;
  
  .spinning-icon {
    ${css`animation: ${spin} 1s linear infinite;`}
  }
  
  .dark & {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
  }
`;

export default AILoadingIndicator;
