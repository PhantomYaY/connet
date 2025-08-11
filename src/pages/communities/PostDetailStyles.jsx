import styled from 'styled-components';

// Main container - minimal and clean
export const PostDetailContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode
    ? 'hsl(222.2 84% 4.9%)'
    : 'hsl(0 0% 100%)'
  };
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  transition: background-color 0.2s ease;
`;

// Minimal header
export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: ${props => props.$isDarkMode
    ? 'hsl(222.2 84% 4.9%)'
    : 'hsl(0 0% 100%)'
  };
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
  position: sticky;
  top: 0;
  z-index: 100;
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
  background: transparent;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'hsl(217.2 32.6% 17.5%)'
      : 'hsl(210 40% 98%)'
    };
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
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 50%)'
  };
`;

// Content container
export const ContentContainer = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1rem;
  }
`;

// Post container - minimal
export const PostContainer = styled.article`
  background: ${props => props.$isDarkMode
    ? 'hsl(222.2 84% 4.9%)'
    : 'hsl(0 0% 100%)'
  };
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
  border-radius: 8px;
  overflow: hidden;
`;

export const PostHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    padding: 1rem 1rem 0 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

export const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const AuthorName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};

  ${props => props.$clickable && `
    &:hover {
      color: ${props.$isDarkMode
        ? 'hsl(217.2 91.2% 65%)'
        : 'hsl(217.2 91.2% 45%)'
      };
    }
  `}

  svg {
    color: ${props => props.$isDarkMode ? '#22c55e' : '#16a34a'};
  }
`;

export const PostTime = styled.time`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 50%)'
  };
  font-weight: 500;
`;

// Post content
export const PostContent = styled.div`
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

export const PostTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  margin: 0 0 1rem 0;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

export const PostFlair = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: ${props => props.$color || '#6b7280'};
  color: white;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
`;

export const PostText = styled.div`
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 80%)'
    : 'hsl(222.2 84% 30%)'
  };
  line-height: 1.6;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  white-space: pre-wrap;
  word-wrap: break-word;

  @media (max-width: 768px) {
    font-size: 0.9375rem;
  }
`;

// Media containers
export const MediaContainer = styled.div`
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
`;

export const MediaItem = styled.div`
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    max-height: 500px;
    object-fit: cover;
  }
`;

// Poll components
export const PollContainer = styled.div`
  margin: 1rem 0;
  padding: 1.5rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode
    ? 'hsl(222.2 84% 4.9%)'
    : 'hsl(0 0% 100%)'
  };
`;

export const PollQuestion = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'};
  margin: 0 0 1rem 0;
  line-height: 1.4;
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
  padding: 0.75rem;
  background: ${props => {
    const percentage = props.$percentage || 0;
    const baseColor = props.$isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)';
    return `linear-gradient(90deg, 
      ${baseColor} 0%, 
      ${baseColor} ${percentage}%, 
      transparent ${percentage}%
    )`;
  }};
  border-radius: 6px;
  cursor: ${props => props.$voted ? 'default' : 'pointer'};
  transition: background-color 0.15s ease;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'hsl(217.2 32.6% 17.5%)' 
    : 'hsl(214.3 31.8% 91.4%)'
  };
  position: relative;
  
  &:hover {
    background: ${props => props.$voted ? '' : (props.$isDarkMode 
      ? 'hsl(217.2 32.6% 17.5%)' 
      : 'hsl(210 40% 98%)'
    )};
  }
`;

export const PollOptionText = styled.span`
  font-weight: 500;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'};
  position: relative;
  z-index: 1;
`;

export const PollOptionStats = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  font-weight: 500;
  position: relative;
  z-index: 1;
`;

export const PollFooter = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  font-weight: 500;
  padding-top: 0.75rem;
  border-top: 1px solid ${props => props.$isDarkMode 
    ? 'hsl(217.2 32.6% 17.5%)' 
    : 'hsl(214.3 31.8% 91.4%)'
  };
`;

// Tags
export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
`;

export const Tag = styled.span`
  padding: 0.125rem 0.5rem;
  background: ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(210 40% 98%)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 70%)' : 'hsl(222.2 84% 50%)'};
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
  transition: background-color 0.15s ease;
  cursor: pointer;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'hsl(217.2 32.6% 20%)'
      : 'hsl(210 40% 95%)'
    };
  }

  &::before {
    content: '#';
    opacity: 0.6;
    margin-right: 0.125rem;
  }
`;

// Post footer
export const PostFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 1rem;
  }
`;

export const PostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

// Interactive buttons - minimal
export const VoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid ${props => {
    if (props.$active && props.$type === 'like') return '#10b981';
    if (props.$active && props.$type === 'dislike') return '#ef4444';
    return props.$isDarkMode ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)';
  }};
  border-radius: 4px;
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
  transition: all 0.15s ease;
  font-size: 0.75rem;
  font-weight: 500;

  &:hover {
    background: ${props => {
      if (props.$type === 'like') return 'rgba(16, 185, 129, 0.1)';
      if (props.$type === 'dislike') return 'rgba(239, 68, 68, 0.1)';
      return props.$isDarkMode ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(210 40% 98%)';
    }};
  }
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'hsl(217.2 32.6% 17.5%)' 
    : 'hsl(214.3 31.8% 91.4%)'
  };
  border-radius: 4px;
  background: transparent;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)' 
    : 'hsl(222.2 84% 50%)'
  };
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.75rem;
  font-weight: 500;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'hsl(217.2 32.6% 17.5%)' 
      : 'hsl(210 40% 98%)'
    };
  }
`;

export const AwardsList = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const AwardBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(245, 158, 11, 0.2);
`;

// Comments section - minimal
export const CommentsSection = styled.section`
  background: ${props => props.$isDarkMode
    ? 'hsl(222.2 84% 4.9%)'
    : 'hsl(0 0% 100%)'
  };
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
  border-radius: 8px;
  overflow: hidden;
`;

export const CommentsHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: ${props => props.$isDarkMode
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 4.9%)'
    };
    margin: 0;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

export const AddCommentSection = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

export const CommentInput = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
  border-radius: 6px;
  background: ${props => props.$isDarkMode
    ? 'hsl(222.2 84% 4.9%)'
    : 'hsl(0 0% 100%)'
  };
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  margin-bottom: 0.75rem;
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$isDarkMode
      ? 'hsl(217.2 91.2% 59.8%)'
      : 'hsl(217.2 91.2% 59.8%)'
    };
  }

  &::placeholder {
    color: ${props => props.$isDarkMode
      ? 'hsl(215 20.2% 55%)'
      : 'hsl(222.2 84% 55%)'
    };
  }
`;

export const CommentSubmitButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
`;

export const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: hsl(217.2 91.2% 59.8%);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  font-size: 0.75rem;
  font-weight: 500;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: hsl(217.2 91.2% 55%);
  }
`;

export const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'hsl(217.2 32.6% 17.5%)' 
    : 'hsl(214.3 31.8% 91.4%)'
  };
  border-radius: 4px;
  background: transparent;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)' 
    : 'hsl(222.2 84% 50%)'
  };
  cursor: pointer;
  transition: background-color 0.15s ease;
  font-size: 0.75rem;
  font-weight: 500;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'hsl(217.2 32.6% 17.5%)' 
      : 'hsl(210 40% 98%)'
    };
  }
`;

// Comments list
export const CommentsList = styled.div`
  padding: 0 1.5rem 1.5rem 1.5rem;

  @media (max-width: 768px) {
    padding: 0 1rem 1rem 1rem;
  }
`;

export const CommentItem = styled.div`
  padding: 1rem;
  margin-left: ${props => props.$depth * 1.5}rem;
  border-left: ${props => props.$depth > 0
    ? props.$isDarkMode
      ? '2px solid hsl(217.2 32.6% 17.5%)'
      : '2px solid hsl(214.3 31.8% 91.4%)'
    : 'none'
  };
  margin-bottom: 0.75rem;
  border-radius: 6px;
  background: ${props => props.$isDarkMode
    ? 'hsl(222.2 84% 4.9%)'
    : 'hsl(0 0% 100%)'
  };
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
  transition: background-color 0.15s ease;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'hsl(217.2 32.6% 10%)'
      : 'hsl(210 40% 98%)'
    };
  }

  @media (max-width: 768px) {
    margin-left: ${props => props.$depth * 1}rem;
    padding: 0.75rem;
  }
`;

export const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

export const CommentContent = styled.div`
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 80%)'
    : 'hsl(222.2 84% 30%)'
  };
  line-height: 1.5;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

export const CommentFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

export const CommentStats = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

export const CommentTime = styled.time`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 55%)'
    : 'hsl(222.2 84% 45%)'
  };
  font-weight: 500;
`;

export const ReplyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
  border-radius: 4px;
  background: ${props => props.$active
    ? props.$isDarkMode
      ? 'hsl(217.2 91.2% 59.8%)'
      : 'hsl(217.2 91.2% 59.8%)'
    : 'transparent'
  };
  color: ${props => props.$active
    ? 'white'
    : props.$isDarkMode
      ? 'hsl(215 20.2% 65.1%)'
      : 'hsl(222.2 84% 50%)'
  };
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.75rem;
  font-weight: 500;

  &:hover {
    background: ${props => props.$active
      ? props.$isDarkMode
        ? 'hsl(217.2 91.2% 55%)'
        : 'hsl(217.2 91.2% 55%)'
      : props.$isDarkMode
        ? 'hsl(217.2 32.6% 17.5%)'
        : 'hsl(210 40% 98%)'
    };
  }
`;

export const ReplyBox = styled.div`
  margin-top: 0.75rem;
  padding: 1rem;
  background: ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 10%)'
    : 'hsl(210 40% 98%)'
  };
  border-radius: 6px;
  border: 1px solid ${props => props.$isDarkMode
    ? 'hsl(217.2 32.6% 17.5%)'
    : 'hsl(214.3 31.8% 91.4%)'
  };
`;

export const RepliesContainer = styled.div`
  margin-top: 0.75rem;
`;

export const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  font-size: 0.875rem;
  font-weight: 500;
`;

// Empty state
export const EmptyComments = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 50%)'
  };

  svg {
    opacity: 0.5;
    margin-bottom: 1rem;
  }

  h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${props => props.$isDarkMode
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 4.9%)'
    };
    margin: 0 0 0.5rem 0;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    opacity: 0.7;
  }
`;

// Error state
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
    : 'hsl(222.2 84% 4.9%)'
  };

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  p {
    font-size: 1rem;
    color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
    margin: 0 0 1.5rem 0;
    max-width: 400px;
    line-height: 1.5;
  }
`;

// Action buttons
export const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size === 'small' ? '32px' : '36px'};
  height: ${props => props.size === 'small' ? '32px' : '36px'};
  border-radius: 4px;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'hsl(217.2 32.6% 17.5%)' 
    : 'hsl(214.3 31.8% 91.4%)'
  };
  background: transparent;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)' 
    : 'hsl(222.2 84% 50%)'
  };
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'hsl(217.2 32.6% 17.5%)' 
      : 'hsl(210 40% 98%)'
    };
  }
`;

export const PostActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;
