import React from 'react';
import styled from 'styled-components';
import LoadingSpinner from './LoadingSpinner';

const ModernLoader = () => {
  return (
    <LoaderWrapper>
      <LoadingSpinner size={48} color="#3b82f6" strokeWidth={3} />
    </LoaderWrapper>
  );
};

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);

  .dark & {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }

  .dark & svg {
    stroke: #60a5fa;
  }
`;

export default ModernLoader;
