import React from 'react';
import styled from 'styled-components';

const LoadingSpinner = ({ 
  size = 20, 
  color = 'currentColor', 
  className = '',
  strokeWidth = 2 
}) => {
  return (
    <SpinnerSvg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </SpinnerSvg>
  );
};

const SpinnerSvg = styled.svg`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default LoadingSpinner;
