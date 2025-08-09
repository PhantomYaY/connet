import React from 'react';
import styled, { keyframes } from 'styled-components';

const ModernLoader = () => {
  return (
    <LoaderWrapper>
      <LoaderContainer>
        <Dot1 />
        <Dot2 />
        <Dot3 />
      </LoaderContainer>
    </LoaderWrapper>
  );
};

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  
  .dark & {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
`;

const Dot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  animation: ${bounce} 1.4s infinite ease-in-out;
  
  .dark & {
    background: #60a5fa;
  }
`;

const Dot1 = styled(Dot)`
  animation-delay: -0.32s;
`;

const Dot2 = styled(Dot)`
  animation-delay: -0.16s;
`;

const Dot3 = styled(Dot)`
  animation-delay: 0s;
`;

const LoaderText = styled.p`
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  
  .dark & {
    color: #94a3b8;
  }
`;

export default ModernLoader;
