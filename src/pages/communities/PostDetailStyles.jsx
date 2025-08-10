import styled, { keyframes } from 'styled-components';

// Animations
export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// Base glass card mixin
const glassCard = (isDarkMode) => `
  background: ${isDarkMode
    ? 'rgba(30, 41, 59, 0.25)'
    : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  border: 1px solid ${isDarkMode
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(148, 163, 184, 0.2)'
  };
  box-shadow: ${isDarkMode
    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
    : '0 8px 32px rgba(0, 0, 0, 0.08)'
  };
`;

// Main container
export const PostDetailContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, #020617 0%, #030712 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
  };
  font-family: 'Inter', sans-serif;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(215.4 16.3% 26.9%)'
  };
  transition: background 0.3s ease, color 0.3s ease;
`;

// Header
export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(30, 41, 59, 0.25)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  position: sticky;
  top: 0;
  z-index: 100;
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: ${props => props.$isDarkMode
    ? 'rgba(30, 41, 59, 0.25)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: ${props => props.$isDarkMode
      ? 'rgba(30, 41, 59, 0.4)'
      : 'rgba(255, 255, 255, 0.95)'
    };
    box-shadow: ${props => props.$isDarkMode
      ? '0 8px 25px rgba(0, 0, 0, 0.3)'
      : '0 8px 25px rgba(0, 0, 0, 0.15)'
    };
  }
`;

export const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const CommunityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1))'
    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.08))'
  };
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(217.2 91.2% 59.8%)'
  };
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(59, 130, 246, 0.2)'
  };
`;

// Content Container
export const ContentContainer = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: ${fadeIn} 0.5s ease;
`;

// Post Container
export const PostContainer = styled.article`
  ${props => glassCard(props.$isDarkMode)}
  padding: 0;
  overflow: hidden;
`;

export const PostHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
  margin-bottom: 1rem;
`;

export const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const AuthorAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.1));
  border: 2px solid rgba(148, 163, 184, 0.2);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    border-color: rgba(148, 163, 184, 0.4);
  }
`;

export const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const AuthorName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  padding: ${props => props.$clickable ? '0.25rem 0.5rem' : '0'};
  border-radius: ${props => props.$clickable ? '0.5rem' : '0'};
  transition: all 0.2s ease;

  ${props => props.$clickable && `
    &:hover {
      background: ${props.$isDarkMode
        ? 'rgba(59, 130, 246, 0.15)'
        : 'rgba(59, 130, 246, 0.1)'
      };
      color: ${props.$isDarkMode
        ? 'hsl(217.2 91.2% 59.8%)'
        : 'hsl(217.2 91.2% 45%)'
      };
      transform: translateY(-1px);
    }
  `}
`;

export const PostTime = styled.time`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
`;

export const PostActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size === 'small' ? '32px' : '40px'};
  height: ${props => props.size === 'small' ? '32px' : '40px'};
  border-radius: 8px;
  border: none;
  background: rgba(148, 163, 184, 0.1);
  color: hsl(215 20.2% 65.1%);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(148, 163, 184, 0.2);
    color: hsl(210 40% 98%);
    transform: translateY(-1px);
  }
`;

// Post Content
export const PostContent = styled.div`
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;
`;

export const PostTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin: 0 0 1rem 0;
  line-height: 1.3;
`;

export const PostFlair = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: ${props => props.$color || '#6b7280'};
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

export const PostText = styled.div`
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 25%)'
  };
  line-height: 1.6;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  white-space: pre-wrap;
`;

// Media and poll components
export const MediaContainer = styled.div`
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
`;

export const MediaItem = styled.div`
  img {
    width: 100%;
    height: auto;
    max-height: 500px;
    object-fit: cover;
  }
`;

export const PollContainer = styled.div`
  margin: 1.5rem 0;
  padding: 1.5rem;
  ${glassCard}
`;

export const PollQuestion = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: hsl(210 40% 98%);
  margin: 0 0 1rem 0;
`;

export const PollOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

export const PollOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(90deg, 
    rgba(148, 163, 184, 0.2) 0%, 
    rgba(148, 163, 184, 0.2) ${props => props.$percentage}%, 
    transparent ${props => props.$percentage}%
  );
  border-radius: 8px;
  cursor: ${props => props.$voted ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$voted ? '' : 'rgba(148, 163, 184, 0.15)'};
  }
`;

export const PollOptionText = styled.span`
  font-weight: 500;
  color: hsl(210 40% 98%);
`;

export const PollOptionStats = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: hsl(215 20.2% 65.1%);
`;

export const PollFooter = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: hsl(215 20.2% 65.1%);
`;

// Tags
export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1.5rem 0;
`;

export const Tag = styled.span`
  padding: 0.375rem 0.75rem;
  background: rgba(148, 163, 184, 0.2);
  color: hsl(215 20.2% 65.1%);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
`;

// Post Footer
export const PostFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.05)'
    : 'rgba(148, 163, 184, 0.08)'
  };
  border-top: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.15)'
  };
`;

export const PostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const VoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  background: ${props => {
    if (props.$active && props.$type === 'like') return 'rgba(16, 185, 129, 0.15)';
    if (props.$active && props.$type === 'dislike') return 'rgba(239, 68, 68, 0.15)';
    return 'rgba(148, 163, 184, 0.05)';
  }};
  color: ${props => {
    if (props.$active && props.$type === 'like') return '#10b981';
    if (props.$active && props.$type === 'dislike') return '#ef4444';
    return 'hsl(215 20.2% 65.1%)';
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    transform: translateY(-1px);
    background: ${props => {
      if (props.$type === 'like') return 'rgba(16, 185, 129, 0.2)';
      if (props.$type === 'dislike') return 'rgba(239, 68, 68, 0.2)';
      return 'rgba(148, 163, 184, 0.15)';
    }};
    border-color: ${props => {
      if (props.$type === 'like') return 'rgba(16, 185, 129, 0.3)';
      if (props.$type === 'dislike') return 'rgba(239, 68, 68, 0.3)';
      return 'rgba(148, 163, 184, 0.3)';
    }};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.05);
  color: hsl(215 20.2% 65.1%);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    transform: translateY(-1px);
    background: rgba(148, 163, 184, 0.15);
    border-color: rgba(148, 163, 184, 0.3);
    color: hsl(210 40% 98%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export const AwardsList = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const AwardBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
`;

// Comments Section
export const CommentsSection = styled.section`
  ${props => glassCard(props.$isDarkMode)}
  padding: 0;
  overflow: hidden;
  margin-top: 1.5rem;
  animation: ${fadeIn} 0.5s ease;
`;

export const CommentsHeader = styled.div`
  padding: 1rem 1.25rem 0.75rem 1.25rem;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(30, 41, 59, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)'
  };
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: ${props => props.$isDarkMode
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 4.9%)'
    };
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &::before {
      content: '💬';
      font-size: 0.875rem;
    }
  }
`;

export const AddCommentSection = styled.div`
  padding: 1rem 1.25rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(30, 41, 59, 0.2)'
    : 'rgba(248, 250, 252, 0.5)'
  };
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(148, 163, 184, 0.1)'
  };
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(30, 41, 59, 0.3)'
      : 'rgba(248, 250, 252, 0.8)'
    };
  }
`;

export const CommentInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem 1.25rem;
  border: 2px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 12px;
  background: ${props => props.$isDarkMode
    ? 'rgba(30, 41, 59, 0.3)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  backdrop-filter: blur(10px);
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.9375rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  margin-bottom: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.6)'
      : 'rgba(59, 130, 246, 0.5)'
    };
    box-shadow: 0 0 0 4px ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.15)'
      : 'rgba(59, 130, 246, 0.1)'
    };
    background: ${props => props.$isDarkMode
      ? 'rgba(30, 41, 59, 0.5)'
      : 'rgba(255, 255, 255, 0.95)'
    };
    transform: translateY(-1px);
  }

  &::placeholder {
    color: ${props => props.$isDarkMode
      ? 'hsl(215 20.2% 65.1%)'
      : 'hsl(222.2 84% 50%)'
    };
    font-style: italic;
  }
`;

export const CommentSubmitButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

export const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, hsl(217.2 91.2% 59.8%) 0%, hsl(224.3 76.3% 48%) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, hsl(217.2 91.2% 55%) 0%, hsl(224.3 76.3% 44%) 100%);
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }
`;

export const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  background: transparent;
  color: hsl(215 20.2% 65.1%);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: rgba(148, 163, 184, 0.1);
    color: hsl(210 40% 98%);
  }
`;

// Comments List
export const CommentsList = styled.div`
  padding: 0 1.5rem 1.5rem 1.5rem;
`;

export const CommentItem = styled.div`
  padding: 1.25rem;
  margin-left: ${props => props.$depth * 1.5}rem;
  border-left: ${props => props.$depth > 0
    ? props.$isDarkMode
      ? '3px solid rgba(59, 130, 246, 0.3)'
      : '3px solid rgba(59, 130, 246, 0.2)'
    : 'none'
  };
  margin-bottom: 1rem;
  border-radius: 12px;
  background: ${props => {
    const baseOpacity = props.$depth % 2 === 0 ? 0.03 : 0.06;
    return props.$isDarkMode
      ? `rgba(148, 163, 184, ${baseOpacity + 0.02})`
      : `rgba(148, 163, 184, ${baseOpacity})`;
  }};
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.08)'
  };
  animation: ${slideIn} 0.4s ease;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.12)'
      : 'rgba(148, 163, 184, 0.08)'
    };
    border-color: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.2)'
      : 'rgba(148, 163, 184, 0.15)'
    };
    transform: translateX(2px);
    box-shadow: ${props => props.$isDarkMode
      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
      : '0 4px 20px rgba(0, 0, 0, 0.08)'
    };
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background: ${props => props.$depth > 0
      ? props.$isDarkMode
        ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.2))'
        : 'linear-gradient(180deg, rgba(59, 130, 246, 0.4), rgba(59, 130, 246, 0.1))'
      : 'none'
    };
    border-radius: 0 12px 12px 0;
  }
`;

export const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

export const CommentActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const CommentContent = styled.div`
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  line-height: 1.7;
  font-size: 0.9375rem;
  margin-bottom: 1rem;
  white-space: pre-wrap;
  padding: 0.5rem 0;
  border-radius: 6px;
  transition: all 0.2s ease;

  /* Better text rendering */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Handle long words gracefully */
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

export const CommentFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const CommentStats = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const CommentTime = styled.time`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
`;

export const ReplyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 8px;
  background: ${props => props.$active
    ? props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.2)'
      : 'rgba(59, 130, 246, 0.1)'
    : props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.08)'
      : 'rgba(148, 163, 184, 0.05)'
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
  transition: all 0.2s ease;
  font-size: 0.8125rem;
  font-weight: 600;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.2)'
      : 'rgba(59, 130, 246, 0.1)'
    };
    color: ${props => props.$isDarkMode
      ? '#60a5fa'
      : '#3b82f6'
    };
    border-color: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.4)'
      : 'rgba(59, 130, 246, 0.3)'
    };
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }
`;

export const ReplyBox = styled.div`
  margin-top: 1rem;
  padding: 1.25rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(30, 41, 59, 0.4)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  border-radius: 12px;
  border: 2px solid ${props => props.$isDarkMode
    ? 'rgba(59, 130, 246, 0.3)'
    : 'rgba(59, 130, 246, 0.2)'
  };
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.3s ease;
  box-shadow: ${props => props.$isDarkMode
    ? '0 8px 32px rgba(0, 0, 0, 0.2)'
    : '0 8px 32px rgba(0, 0, 0, 0.06)'
  };

  &::before {
    content: '↳ Reply to comment';
    display: block;
    font-size: 0.75rem;
    color: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.8)'
      : 'rgba(59, 130, 246, 0.7)'
    };
    font-weight: 600;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

export const RepliesContainer = styled.div`
  margin-top: 1rem;
`;


export const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: hsl(215 20.2% 65.1%);
  font-size: 0.875rem;
`;

// Empty Comments State
export const EmptyComments = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 50%)'
  };

  svg {
    opacity: 0.6;
    margin-bottom: 1.5rem;
    filter: ${props => props.$isDarkMode
      ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))'
      : 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.2))'
    };
  }

  h4 {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${props => props.$isDarkMode
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
    margin: 0 0 0.75rem 0;
    background: ${props => props.$isDarkMode
      ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
    };
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    max-width: 300px;
    opacity: 0.8;
  }
`;

// Error State
export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
  }

  p {
    font-size: 1rem;
    color: hsl(215 20.2% 65.1%);
    margin: 0 0 2rem 0;
  }
`;
