import styled, { keyframes } from 'styled-components';

// Enhanced animations with better easing
export const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

export const slideIn = keyframes`
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

export const scaleIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

export const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

export const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`;

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

// Enhanced glass morphism effect
const glassCard = (isDarkMode, intensity = 'medium') => {
  const opacities = {
    light: isDarkMode ? 0.1 : 0.7,
    medium: isDarkMode ? 0.15 : 0.85,
    strong: isDarkMode ? 0.25 : 0.95
  };
  
  return `
    background: ${isDarkMode
      ? `rgba(15, 23, 42, ${opacities[intensity]})`
      : `rgba(255, 255, 255, ${opacities[intensity]})`
    };
    backdrop-filter: blur(${intensity === 'strong' ? '24px' : '20px'});
    border-radius: 1.5rem;
    border: 1px solid ${isDarkMode
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(148, 163, 184, 0.15)'
    };
    box-shadow: ${isDarkMode
      ? '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
      : '0 20px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8)'
    };
  `;
};

// Main container with enhanced gradient
export const PostDetailContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode
    ? `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%),
        linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)
      `
    : `
        radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
        linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)
      `
  };
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(215.4 16.3% 26.9%)'
  };
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow-x: hidden;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.$isDarkMode
      ? 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23334155" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
      : 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e2e8f0" fill-opacity="0.4"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
    };
    pointer-events: none;
    z-index: 0;
  }
`;

// Enhanced sticky header with blur effect
export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 2rem;
  ${props => glassCard(props.$isDarkMode, 'strong')}
  position: sticky;
  top: 0;
  z-index: 200;
  margin: 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
  animation: ${fadeIn} 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      ${props => props.$isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.2)'} 50%, 
      transparent 100%
    );
  }
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  ${props => glassCard(props.$isDarkMode, 'medium')}
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}, 
      transparent
    );
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: ${props => props.$isDarkMode
      ? '0 12px 35px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      : '0 12px 35px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.9)'
    };

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }
`;

export const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

export const CommunityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)'
  };
  color: ${props => props.$isDarkMode
    ? 'hsl(217.2 91.2% 70%)'
    : 'hsl(217.2 91.2% 50%)'
  };
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(59, 130, 246, 0.3)'
    : 'rgba(59, 130, 246, 0.2)'
  };
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      ${props => props.$isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)'}, 
      transparent
    );
  }
`;

// Enhanced content container
export const ContentContainer = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  animation: ${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
    gap: 2rem;
  }
`;

// Enhanced post container with better visual hierarchy
export const PostContainer = styled.article`
  ${props => glassCard(props.$isDarkMode, 'medium')}
  overflow: hidden;
  position: relative;
  animation: ${scaleIn} 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
      #3b82f6 0%, 
      #8b5cf6 25%, 
      #06b6d4 50%, 
      #10b981 75%, 
      #f59e0b 100%
    );
  }
`;

export const PostHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2rem 0 2rem;
  margin-bottom: 1.5rem;
  position: relative;

  @media (max-width: 768px) {
    padding: 1.5rem 1.5rem 0 1.5rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

export const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const AuthorAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg,
    #667eea 0%,
    #764ba2 25%,
    #f093fb 50%,
    #f5576c 75%,
    #4facfe 100%
  );
  border: 2px solid ${props => props.$isDarkMode
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
`;

export const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const AuthorName = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  padding: ${props => props.$clickable ? '0.375rem 0.75rem' : '0'};
  border-radius: ${props => props.$clickable ? '0.75rem' : '0'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  ${props => props.$clickable && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${props.$isDarkMode
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05))'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(99, 102, 241, 0.03))'
      };
      border-radius: 0.75rem;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      color: ${props.$isDarkMode
        ? 'hsl(217.2 91.2% 65%)'
        : 'hsl(217.2 91.2% 45%)'
      };
      transform: translateY(-2px);
      
      &::before {
        opacity: 1;
      }
    }
  `}

  svg {
    color: ${props => props.$isDarkMode ? '#22c55e' : '#16a34a'};
    filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.3));
  }
`;

export const PostTime = styled.time`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;

  &::before {
    content: '🕒';
    font-size: 0.75rem;
  }
`;

// Enhanced post content
export const PostContent = styled.div`
  padding: 0 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    padding: 0 1.5rem;
  }
`;

export const PostTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin: 0 0 1.5rem 0;
  line-height: 1.2;
  letter-spacing: -0.025em;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    : 'linear-gradient(135deg, #1e293b 0%, #475569 100%)'
  };
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const PostFlair = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: ${props => props.$color || '#6b7280'};
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

export const PostText = styled.div`
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 90%)'
    : 'hsl(222.2 84% 25%)'
  };
  line-height: 1.7;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  white-space: pre-wrap;
  font-weight: 400;
  letter-spacing: 0.01em;

  /* Enhanced typography */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* Better text rendering */
  text-rendering: optimizeLegibility;
  
  /* Handle long words gracefully */
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

// Enhanced media containers
export const MediaContainer = styled.div`
  margin: 2rem 0;
  border-radius: 16px;
  overflow: hidden;
  ${props => glassCard(props.$isDarkMode, 'light')}
  animation: ${scaleIn} 0.6s cubic-bezier(0.4, 0, 0.2, 1);
`;

export const MediaItem = styled.div`
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    max-height: 600px;
    object-fit: cover;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover img {
    transform: scale(1.02);
  }
`;

// Enhanced poll components
export const PollContainer = styled.div`
  margin: 2rem 0;
  padding: 2rem;
  ${props => glassCard(props.$isDarkMode, 'medium')}
  animation: ${scaleIn} 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &::before {
    content: '📊';
    position: absolute;
    top: 1rem;
    right: 1.5rem;
    font-size: 1.5rem;
    opacity: 0.7;
  }
`;

export const PollQuestion = styled.h4`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
  margin: 0 0 1.5rem 0;
  line-height: 1.3;
`;

export const PollOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

export const PollOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: ${props => {
    const percentage = props.$percentage || 0;
    const baseColor = props.$isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)';
    return `linear-gradient(90deg, 
      ${baseColor} 0%, 
      ${baseColor} ${percentage}%, 
      transparent ${percentage}%
    )`;
  }};
  border-radius: 12px;
  cursor: ${props => props.$voted ? 'default' : 'pointer'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)' 
    : 'rgba(148, 163, 184, 0.15)'
  };
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: ${props => props.$voted ? '' : (props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.15)' 
      : 'rgba(59, 130, 246, 0.12)'
    )};
    transform: ${props => props.$voted ? 'none' : 'translateX(4px)'};
    border-color: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.3)' 
      : 'rgba(59, 130, 246, 0.2)'
    };
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${props => props.$percentage || 0}%;
    background: linear-gradient(90deg, 
      rgba(59, 130, 246, 0.2) 0%, 
      rgba(99, 102, 241, 0.15) 100%
    );
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

export const PollOptionText = styled.span`
  font-weight: 600;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
  position: relative;
  z-index: 1;
`;

export const PollOptionStats = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  font-weight: 600;
  position: relative;
  z-index: 1;
`;

export const PollFooter = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  font-weight: 500;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)' 
    : 'rgba(148, 163, 184, 0.15)'
  };
`;

// Enhanced tags
export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 2rem 0;
`;

export const Tag = styled.span`
  padding: 0.25rem 0.75rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(148, 163, 184, 0.1)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 70%)' : 'hsl(222.2 84% 50%)'};
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.2)'
      : 'rgba(59, 130, 246, 0.15)'
    };
    color: ${props => props.$isDarkMode ? '#60a5fa' : '#3b82f6'};
    border-color: ${props => props.$isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)'};
  }

  &::before {
    content: '#';
    opacity: 0.6;
    margin-right: 0.25rem;
  }
`;

// Enhanced post footer
export const PostFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 2rem;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)'
    : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)'
  };
  border-top: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
`;

export const PostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

// Enhanced interactive buttons
export const VoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid ${props => {
    if (props.$active && props.$type === 'like') return '#10b981';
    if (props.$active && props.$type === 'dislike') return '#ef4444';
    return props.$isDarkMode ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.2)';
  }};
  border-radius: 6px;
  background: ${props => {
    if (props.$active && props.$type === 'like') return 'rgba(16, 185, 129, 0.1)';
    if (props.$active && props.$type === 'dislike') return 'rgba(239, 68, 68, 0.1)';
    return 'transparent';
  }};
  color: ${props => {
    if (props.$active && props.$type === 'like') return '#10b981';
    if (props.$active && props.$type === 'dislike') return '#ef4444';
    return props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)';
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  font-weight: 500;

  &:hover {
    background: ${props => {
      if (props.$type === 'like') return 'rgba(16, 185, 129, 0.1)';
      if (props.$type === 'dislike') return 'rgba(239, 68, 68, 0.1)';
      return props.$isDarkMode ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.05)';
    }};
    border-color: ${props => {
      if (props.$type === 'like') return '#10b981';
      if (props.$type === 'dislike') return '#ef4444';
      return props.$isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.4)';
    }};
    color: ${props => {
      if (props.$type === 'like') return '#10b981';
      if (props.$type === 'dislike') return '#ef4444';
      return props.$isDarkMode ? 'hsl(210 40% 80%)' : 'hsl(222.2 84% 30%)';
    }};
  }

  svg {
    transition: all 0.2s ease;
  }
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.25rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.2)' 
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 12px;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.05)' 
    : 'rgba(255, 255, 255, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)' 
    : 'hsl(222.2 84% 50%)'
  };
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'}, 
      transparent
    );
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-3px) scale(1.05);
    background: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.2)' 
      : 'rgba(59, 130, 246, 0.1)'
    };
    border-color: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.4)' 
      : 'rgba(59, 130, 246, 0.3)'
    };
    color: ${props => props.$isDarkMode ? '#60a5fa' : '#3b82f6'};
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }

  svg {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

export const AwardsList = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

export const AwardBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%);
  color: #f59e0b;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  border: 1px solid rgba(245, 158, 11, 0.3);
  animation: ${float} 3s ease-in-out infinite;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
    animation: ${shimmer} 2s infinite;
  }

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

// Enhanced comments section
export const CommentsSection = styled.section`
  ${props => glassCard(props.$isDarkMode, 'medium')}
  overflow: hidden;
  margin-top: 2rem;
  animation: ${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      #3b82f6 0%, 
      #8b5cf6 50%, 
      #06b6d4 100%
    );
  }
`;

export const CommentsHeader = styled.div`
  padding: 1.5rem 2rem 1rem 2rem;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
    : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.7) 100%)'
  };
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(148, 163, 184, 0.1)'
  };
  backdrop-filter: blur(10px);

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: ${props => props.$isDarkMode
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 4.9%)'
    };
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    &::before {
      content: '💬';
      font-size: 1rem;
      filter: ${props => props.$isDarkMode 
        ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))' 
        : 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))'
      };
    }
  }

  @media (max-width: 768px) {
    padding: 1.25rem 1.5rem 0.75rem 1.5rem;
  }
`;

export const AddCommentSection = styled.div`
  padding: 1.5rem 2rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.3)'
    : 'rgba(248, 250, 252, 0.6)'
  };
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.08)'
  };
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(15, 23, 42, 0.5)'
      : 'rgba(248, 250, 252, 0.8)'
    };
  }

  @media (max-width: 768px) {
    padding: 1.25rem 1.5rem;
  }
`;

export const CommentInput = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 1rem 1.25rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 12px;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.6)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  backdrop-filter: blur(15px);
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  margin-bottom: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus {
    outline: none;
    border-color: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.6)'
      : 'rgba(59, 130, 246, 0.5)'
    };
    box-shadow: 0 0 0 3px ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.2)'
      : 'rgba(59, 130, 246, 0.15)'
    }, 0 8px 25px ${props => props.$isDarkMode
      ? 'rgba(0, 0, 0, 0.3)'
      : 'rgba(0, 0, 0, 0.1)'
    };
    background: ${props => props.$isDarkMode
      ? 'rgba(15, 23, 42, 0.8)'
      : 'rgba(255, 255, 255, 0.95)'
    };
    transform: translateY(-2px);
  }

  &::placeholder {
    color: ${props => props.$isDarkMode
      ? 'hsl(215 20.2% 55%)'
      : 'hsl(222.2 84% 55%)'
    };
    font-style: italic;
  }
`;

export const CommentSubmitButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
`;

export const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, hsl(217.2 91.2% 59.8%) 0%, hsl(224.3 76.3% 48%) 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  font-weight: 700;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.2), 
      transparent
    );
    transition: left 0.5s;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, hsl(217.2 91.2% 55%) 0%, hsl(224.3 76.3% 44%) 100%);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(-1px) scale(1.02);
  }
`;

export const CancelButton = styled.button`
  padding: 0.875rem 1.75rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.3)' 
    : 'rgba(148, 163, 184, 0.2)'
  };
  border-radius: 10px;
  background: transparent;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)' 
    : 'hsl(222.2 84% 50%)'
  };
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  font-weight: 600;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)' 
      : 'rgba(148, 163, 184, 0.08)'
    };
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 85%)' 
      : 'hsl(222.2 84% 35%)'
    };
    border-color: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.4)' 
      : 'rgba(148, 163, 184, 0.3)'
    };
    transform: translateY(-2px);
  }
`;

// Enhanced comments list
export const CommentsList = styled.div`
  padding: 0 2rem 2rem 2rem;

  @media (max-width: 768px) {
    padding: 0 1.5rem 1.5rem 1.5rem;
  }
`;

export const CommentItem = styled.div`
  padding: 1.25rem;
  margin-left: ${props => props.$depth * 1.5}rem;
  border-left: ${props => props.$depth > 0
    ? props.$isDarkMode
      ? '3px solid rgba(59, 130, 246, 0.4)'
      : '3px solid rgba(59, 130, 246, 0.3)'
    : 'none'
  };
  margin-bottom: 1.25rem;
  border-radius: 16px;
  background: ${props => {
    const baseOpacity = props.$depth % 2 === 0 ? 0.04 : 0.08;
    return props.$isDarkMode
      ? `rgba(148, 163, 184, ${baseOpacity + 0.02})`
      : `rgba(148, 163, 184, ${baseOpacity})`;
  }};
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.08)'
  };
  animation: ${slideIn} 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.15)'
      : 'rgba(148, 163, 184, 0.12)'
    };
    border-color: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.25)'
      : 'rgba(148, 163, 184, 0.2)'
    };
    transform: translateX(4px);
    box-shadow: ${props => props.$isDarkMode
      ? '0 8px 30px rgba(0, 0, 0, 0.3)'
      : '0 8px 30px rgba(0, 0, 0, 0.1)'
    };
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 4px;
    background: ${props => props.$depth > 0
      ? props.$isDarkMode
        ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.8), rgba(99, 102, 241, 0.4))'
        : 'linear-gradient(180deg, rgba(59, 130, 246, 0.6), rgba(99, 102, 241, 0.3))'
      : 'none'
    };
    border-radius: 0 16px 16px 0;
  }

  @media (max-width: 768px) {
    margin-left: ${props => props.$depth * 1}rem;
    padding: 1rem;
  }
`;

export const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

export const CommentContent = styled.div`
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 90%)'
    : 'hsl(222.2 84% 25%)'
  };
  line-height: 1.6;
  font-size: 0.9375rem;
  margin-bottom: 1rem;
  white-space: pre-wrap;
  padding: 0.5rem 0;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* Enhanced typography */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  
  /* Handle long words gracefully */
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
`;

export const CommentFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
`;

export const CommentStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

export const CommentTime = styled.time`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 55%)'
    : 'hsl(222.2 84% 45%)'
  };
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &::before {
    content: '⏰';
    font-size: 0.625rem;
  }
`;

export const ReplyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 10px;
  background: ${props => props.$active
    ? props.$isDarkMode
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)'
    : props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.08)'
      : 'rgba(255, 255, 255, 0.8)'
  };
  color: ${props => props.$active
    ? props.$isDarkMode
      ? '#60a5fa'
      : '#3b82f6'
    : props.$isDarkMode
      ? 'hsl(215 20.2% 65.1%)'
      : 'hsl(222.2 84% 50%)'
  };
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.8125rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      ${props => props.$isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}, 
      transparent
    );
    transition: left 0.5s;
  }

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)'
    };
    color: ${props => props.$isDarkMode ? '#60a5fa' : '#3b82f6'};
    border-color: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.5)' 
      : 'rgba(59, 130, 246, 0.4)'
    };
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.25);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }
`;

export const ReplyBox = styled.div`
  margin-top: 1.25rem;
  padding: 1.5rem;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
    : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.7) 100%)'
  };
  border-radius: 16px;
  border: 2px solid ${props => props.$isDarkMode
    ? 'rgba(59, 130, 246, 0.4)'
    : 'rgba(59, 130, 246, 0.3)'
  };
  backdrop-filter: blur(15px);
  animation: ${fadeIn} 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$isDarkMode
    ? '0 12px 40px rgba(0, 0, 0, 0.3)'
    : '0 12px 40px rgba(0, 0, 0, 0.08)'
  };
  position: relative;

  &::before {
    content: '↳ Reply to comment';
    display: block;
    font-size: 0.75rem;
    color: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.9)'
      : 'rgba(59, 130, 246, 0.8)'
    };
    font-weight: 700;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.375rem 0.75rem;
    background: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.2)'
      : 'rgba(59, 130, 246, 0.1)'
    };
    border-radius: 6px;
    display: inline-block;
  }
`;

export const RepliesContainer = styled.div`
  margin-top: 1.25rem;
`;

export const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  font-size: 0.875rem;
  font-weight: 500;
  animation: ${pulse} 2s infinite;
`;

// Enhanced empty state
export const EmptyComments = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 50%)'
  };

  svg {
    opacity: 0.6;
    margin-bottom: 2rem;
    filter: ${props => props.$isDarkMode
      ? 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))'
      : 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))'
    };
    animation: ${float} 4s ease-in-out infinite;
  }

  h4 {
    font-size: 1.75rem;
    font-weight: 800;
    color: ${props => props.$isDarkMode
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
    margin: 0 0 1rem 0;
    background: ${props => props.$isDarkMode
      ? 'linear-gradient(135deg, #60a5fa 0%, #a855f7 50%, #06b6d4 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #0891b2 100%)'
    };
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    margin: 0;
    font-size: 1.125rem;
    line-height: 1.6;
    max-width: 400px;
    opacity: 0.8;
    font-weight: 500;
  }
`;

// Enhanced error state
export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 3rem 2rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };

  h2 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 1.5rem 0;
    background: ${props => props.$isDarkMode
      ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
      : 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)'
    };
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 1.125rem;
    color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
    margin: 0 0 2.5rem 0;
    max-width: 500px;
    line-height: 1.6;
  }
`;

// Action buttons with enhanced styles
export const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size === 'small' ? '36px' : '44px'};
  height: ${props => props.size === 'small' ? '36px' : '44px'};
  border-radius: 10px;
  border: none;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)' 
    : 'rgba(255, 255, 255, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)' 
    : 'hsl(222.2 84% 50%)'
  };
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)' 
    : 'rgba(148, 163, 184, 0.1)'
  };

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.2)' 
      : 'rgba(59, 130, 246, 0.1)'
    };
    color: ${props => props.$isDarkMode ? '#60a5fa' : '#3b82f6'};
    transform: translateY(-2px) scale(1.05);
    border-color: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.4)' 
      : 'rgba(59, 130, 246, 0.3)'
    };
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.2);
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }
`;

export const PostActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;
