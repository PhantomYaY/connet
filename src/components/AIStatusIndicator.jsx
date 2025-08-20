// AI Status Indicator Component
// Shows the current status of AI services in the UI
import React from 'react';
import styled from 'styled-components';
import { Sparkles, AlertCircle, Loader } from 'lucide-react';
import { useAI } from '../hooks/useAI';

const AIStatusIndicator = ({ minimal = false, showText = true }) => {
  const { isAvailable, isLoading, availableServices } = useAI();

  if (minimal && !isLoading && !isAvailable) {
    return null; // Don't show anything if AI is not available in minimal mode
  }

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        icon: Loader,
        color: '#f59e0b',
        text: 'Loading AI...',
        description: 'Initializing AI services'
      };
    }

    if (isAvailable) {
      return {
        icon: Sparkles,
        color: '#10b981',
        text: 'AI Ready',
        description: `Available: ${availableServices.join(', ')}`
      };
    }

    return {
      icon: AlertCircle,
      color: '#6b7280',
      text: 'AI Unavailable',
      description: 'Configure API keys in Settings'
    };
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  if (minimal) {
    return (
      <MinimalIndicator $color={status.color} title={status.description}>
        <Icon size={14} className={isLoading ? 'animate-spin' : ''} />
      </MinimalIndicator>
    );
  }

  return (
    <StatusContainer $color={status.color}>
      <Icon size={16} className={isLoading ? 'animate-spin' : ''} />
      {showText && (
        <StatusText>
          <StatusTitle>{status.text}</StatusTitle>
          <StatusDescription>{status.description}</StatusDescription>
        </StatusText>
      )}
    </StatusContainer>
  );
};

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: ${props => props.$color};
  font-size: 0.75rem;
  backdrop-filter: blur(8px);
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const MinimalIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: ${props => props.$color};
  cursor: help;
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const StatusText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const StatusTitle = styled.div`
  font-weight: 600;
  font-size: 0.75rem;
`;

const StatusDescription = styled.div`
  font-size: 0.625rem;
  opacity: 0.8;
`;

export default AIStatusIndicator;
