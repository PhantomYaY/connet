import React from 'react';
import styled from 'styled-components';

const InlineLoader = ({ size = 'medium', text = '', className = '' }) => {
  const sizeConfig = {
    small: { width: '24px', height: '24px', fontSize: '12px' },
    medium: { width: '32px', height: '32px', fontSize: '14px' },
    large: { width: '48px', height: '48px', fontSize: '16px' }
  };

  const config = sizeConfig[size];

  return (
    <LoaderContainer className={className}>
      <SpinnerContainer style={{ width: config.width, height: config.height }}>
        <Spinner />
      </SpinnerContainer>
      {text && <LoaderText style={{ fontSize: config.fontSize }}>{text}</LoaderText>}
    </LoaderContainer>
  );
};

const LoaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
`;

const SpinnerContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const Spinner = styled.div`
  width: 100%;
  height: 100%;
  border: 3px solid rgba(59, 130, 246, 0.15);
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  .dark & {
    border: 3px solid rgba(96, 165, 250, 0.15);
    border-top: 3px solid #60a5fa;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoaderText = styled.span`
  color: rgba(71, 85, 105, 0.8);
  font-weight: 500;
  
  .dark & {
    color: rgba(148, 163, 184, 0.8);
  }
`;

export default InlineLoader;
