import React from 'react';
import styled, { keyframes } from 'styled-components';

const SkeletonLoader = ({ 
  variant = 'text', 
  width = '100%', 
  height = '20px',
  rows = 1,
  avatar = false,
  className = '' 
}) => {
  if (variant === 'card') {
    return (
      <CardSkeleton className={className}>
        {avatar && <AvatarSkeleton />}
        <CardContent>
          <SkeletonLine $width="80%" $height="16px" />
          <SkeletonLine $width="60%" $height="14px" />
          <SkeletonLine $width="40%" $height="12px" />
        </CardContent>
      </CardSkeleton>
    );
  }

  if (variant === 'list') {
    return (
      <ListSkeleton className={className}>
        {Array.from({ length: rows }).map((_, index) => (
          <ListItem key={index}>
            {avatar && <AvatarSkeleton $small />}
            <div>
              <SkeletonLine $width="70%" $height="16px" />
              <SkeletonLine $width="40%" $height="12px" />
            </div>
          </ListItem>
        ))}
      </ListSkeleton>
    );
  }

  if (variant === 'editor') {
    return (
      <EditorSkeleton className={className}>
        <SkeletonLine $width="60%" $height="32px" />
        <SkeletonLine $width="100%" $height="16px" />
        <SkeletonLine $width="90%" $height="16px" />
        <SkeletonLine $width="80%" $height="16px" />
        <SkeletonLine $width="70%" $height="16px" />
      </EditorSkeleton>
    );
  }

  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonLine 
          key={index}
          $width={width} 
          $height={height}
          style={{ marginBottom: index < rows - 1 ? '8px' : '0' }}
        />
      ))}
    </div>
  );
};

// Animations
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
`;

// Styled Components
const SkeletonLine = styled.div`
  width: ${props => props.$width};
  height: ${props => props.$height};
  background: linear-gradient(90deg, #f0f0f0 25%, rgba(255, 255, 255, 0.5) 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
  position: relative;
  overflow: hidden;

  .dark & {
    background: linear-gradient(90deg, #374151 25%, rgba(75, 85, 99, 0.5) 50%, #374151 75%);
    background-size: 200px 100%;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 25%, rgba(255, 255, 255, 0.4) 50%, transparent 75%);
    animation: ${shimmer} 2s infinite linear;

    .dark & {
      background: linear-gradient(90deg, transparent 25%, rgba(156, 163, 175, 0.3) 50%, transparent 75%);
    }
  }
`;

const CardSkeleton = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  animation: ${pulse} 2s ease-in-out infinite;

  .dark & {
    background: rgba(75, 85, 99, 0.3);
    border-color: rgba(156, 163, 175, 0.1);
  }
`;

const CardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AvatarSkeleton = styled.div`
  width: ${props => props.$small ? '32px' : '48px'};
  height: ${props => props.$small ? '32px' : '48px'};
  border-radius: 50%;
  background: linear-gradient(90deg, #e5e7eb 25%, rgba(255, 255, 255, 0.5) 50%, #e5e7eb 75%);
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  flex-shrink: 0;

  .dark & {
    background: linear-gradient(90deg, #4b5563 25%, rgba(107, 114, 128, 0.5) 50%, #4b5563 75%);
    background-size: 200px 100%;
  }
`;

const ListSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  animation: ${pulse} 2s ease-in-out infinite;

  .dark & {
    background: rgba(75, 85, 99, 0.2);
  }

  > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const EditorSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  animation: ${pulse} 2s ease-in-out infinite;

  .dark & {
    background: rgba(75, 85, 99, 0.3);
  }
`;

export default SkeletonLoader;
