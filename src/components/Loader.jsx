// src/components/Loader.jsx
import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="loader-square" />
        ))}
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f8fafc;
  color: #0f172a;

  .dark & {
    background: #0f172a;
    color: white;
  }

  .loader {
    position: relative;
    width: 96px;
    height: 96px;
    transform: rotate(45deg);
  }

  .loader-square {
    position: absolute;
    top: 0;
    left: 0;
    width: 28px;
    height: 28px;
    margin: 2px;
    background: #3b82f6;
    animation: square-animation 10s ease-in-out infinite both;

    .dark & {
      background: #60a5fa;
    }
  }

  .loader-square:nth-of-type(1) { animation-delay: -1.4s; }
  .loader-square:nth-of-type(2) { animation-delay: -2.8s; }
  .loader-square:nth-of-type(3) { animation-delay: -4.2s; }
  .loader-square:nth-of-type(4) { animation-delay: -5.6s; }
  .loader-square:nth-of-type(5) { animation-delay: -7s; }
  .loader-square:nth-of-type(6) { animation-delay: -8.4s; }
  .loader-square:nth-of-type(7) { animation-delay: -9.8s; }

  @keyframes square-animation {
    0%, 10.5% { top: 0; left: 0; }
    12.5%, 23% { top: 0; left: 32px; }
    25%, 35.5% { top: 0; left: 64px; }
    37.5%, 48% { top: 32px; left: 64px; }
    50%, 60.5% { top: 32px; left: 32px; }
    62.5%, 73% { top: 64px; left: 32px; }
    75%, 85.5% { top: 64px; left: 0; }
    87.5%, 98% { top: 32px; left: 0; }
    100% { top: 0; left: 0; }
  }
`;

export default Loader;
