import React, { useState, useEffect, useCallback, memo } from 'react';
import styled, { keyframes } from 'styled-components';
import { Sparkles, Zap, Brain, MessageSquare } from 'lucide-react';

const OptimizedAIFloatingButton = memo(({ isVisible, onOpenSidebar, onQuickAction }) => {
  const [expanded, setExpanded] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  // Memoized quick actions to prevent recreating on each render
  const quickActions = React.useMemo(() => [
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'AI Chat',
      color: '#3b82f6',
      action: onOpenSidebar
    },
    {
      id: 'improve',
      icon: Sparkles,
      label: 'Improve Text',
      color: '#1e40af',
      action: () => onQuickAction?.('improve-writing')
    },
    {
      id: 'suggestions',
      icon: Brain,
      label: 'Get Ideas',
      color: '#06b6d4',
      action: () => onQuickAction?.('related-topics')
    }
  ], [onOpenSidebar, onQuickAction]);

  // Optimized pulse effect with reduced frequency
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 5000); // Reduced frequency for better performance
    
    return () => clearInterval(interval);
  }, [isVisible]);

  // Memoized click handlers
  const handleToggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleActionClick = useCallback((action) => {
    action.action?.();
    setExpanded(false);
  }, []);

  if (!isVisible) return null;

  return (
    <FloatingContainer>
      {expanded && (
        <QuickActionsMenu>
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <QuickActionButton
                key={action.id}
                style={{ 
                  '--delay': `${index * 100}ms`, 
                  '--color': action.color 
                }}
                onClick={() => handleActionClick(action)}
                title={action.label}
              >
                <IconComponent size={16} />
                <span className="label">{action.label}</span>
              </QuickActionButton>
            );
          })}
        </QuickActionsMenu>
      )}
      
      <MainButton
        onClick={handleToggleExpanded}
        className={`${pulseCount > 0 ? 'pulse' : ''} ${expanded ? 'expanded' : ''}`.trim()}
        title="AI Assistant"
      >
        <Zap size={20} />
        <span className="ai-text">AI</span>
      </MainButton>
    </FloatingContainer>
  );
});

// Optimized animations with better performance
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, 10px, 0) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

const FloatingContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  will-change: transform;

  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
  }
`;

const QuickActionsMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  animation: ${slideIn} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
`;

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${slideIn} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation-delay: var(--delay);
  animation-fill-mode: both;
  white-space: nowrap;
  cursor: pointer;
  will-change: transform, box-shadow;

  &:hover {
    transform: translate3d(0, -2px, 0);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
    background: rgba(255, 255, 255, 1);
  }

  .dark & {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(15, 23, 42, 1);
    }
  }

  .label {
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    .label {
      display: none;
    }
    padding: 0.75rem;
  }
`;

const MainButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: none;
  cursor: pointer;
  will-change: transform, box-shadow;

  &.pulse {
    animation: ${pulse} 2s ease-out;
  }

  &.expanded {
    transform: rotate(45deg);
    background: linear-gradient(135deg, #ef4444, #f59e0b);
  }

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
  }

  &.expanded:hover {
    transform: scale(1.05) rotate(45deg);
  }

  &:active {
    transform: scale(0.95);
  }

  &.expanded:active {
    transform: scale(0.95) rotate(45deg);
  }

  .ai-text {
    font-size: 0.7rem;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: absolute;
    bottom: 4px;
    right: 6px;
  }

  svg {
    color: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover::before {
    transform: translateX(100%);
  }
`;

OptimizedAIFloatingButton.displayName = 'OptimizedAIFloatingButton';

export default OptimizedAIFloatingButton;
