import React from 'react';
import styled, { keyframes } from 'styled-components';

const DotsLoader = ({ size = 'medium', text = '', className = '' }) => {
  const sizeConfig = {
    small: { dotSize: '6px', gap: '4px', fontSize: '12px' },
    medium: { dotSize: '8px', gap: '6px', fontSize: '14px' },
    large: { dotSize: '10px', gap: '8px', fontSize: '16px' }
  };

  const config = sizeConfig[size];

  return (
    <LoaderContainer className={className}>
      <DotsContainer style={{ gap: config.gap }}>
        <Dot style={{ width: config.dotSize, height: config.dotSize }} delay="0s" />
        <Dot style={{ width: config.dotSize, height: config.dotSize }} delay="0.2s" />
        <Dot style={{ width: config.dotSize, height: config.dotSize }} delay="0.4s" />
      </DotsContainer>
      {text && <LoaderText style={{ fontSize: config.fontSize }}>{text}</LoaderText>}
    </LoaderContainer>
  );
};

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
`;

const DotsContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Dot = styled.div`
  border-radius: 50%;
  background: #3b82f6;
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.delay};
  
  .dark & {
    background: #60a5fa;
  }
`;

const LoaderText = styled.span`
  color: rgba(71, 85, 105, 0.8);
  font-weight: 500;
  text-align: center;
  
  .dark & {
    color: rgba(148, 163, 184, 0.8);
  }
`;

export default DotsLoader;
