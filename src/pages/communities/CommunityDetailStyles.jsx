import styled from 'styled-components';

export const CommunityContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  };
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  padding: 1rem;
  overflow-x: hidden;
  transition: background 0.3s ease, color 0.3s ease;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.$isDarkMode ? '#334155' : '#e2e8f0'};
  margin-bottom: 1.5rem;
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(51, 65, 85, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  border: 1px solid ${props => props.$isDarkMode ? '#475569' : '#cbd5e1'};
  border-radius: 0.75rem;
  color: ${props => props.$isDarkMode ? '#cbd5e1' : '#475569'};
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(51, 65, 85, 0.8)'
      : 'rgba(248, 250, 252, 1)'
    };
    transform: translateY(-1px);
  }
`;

export const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  margin: 0 2rem;
`;

export const CommunityIcon = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: ${props => props.$banner || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

export const CommunityDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const CommunityTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const CommunityName = styled.p`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
  margin: 0;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const JoinButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$joined 
    ? props.$isDarkMode 
      ? 'rgba(34, 197, 94, 0.2)'
      : 'rgba(34, 197, 94, 0.1)'
    : props.$isDarkMode
      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
  };
  color: ${props => props.$joined 
    ? props.$isDarkMode ? '#22c55e' : '#16a34a'
    : '#ffffff'
  };
  border: ${props => props.$joined 
    ? `1px solid ${props.$isDarkMode ? '#22c55e' : '#16a34a'}`
    : 'none'
  };

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }
`;

export const CommunityInfo = styled.div`
  background: ${props => props.$isDarkMode 
    ? 'rgba(51, 65, 85, 0.3)'
    : 'rgba(255, 255, 255, 0.7)'
  };
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$isDarkMode ? '#475569' : '#e2e8f0'};
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

export const CommunityDescription = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${props => props.$isDarkMode ? '#cbd5e1' : '#475569'};
  margin-bottom: 1rem;
`;

export const CommunityStats = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
  font-size: 0.875rem;

  svg {
    color: ${props => props.$isDarkMode ? '#64748b' : '#94a3b8'};
  }
`;

export const CommunityRules = styled.div`
  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
    margin-bottom: 0.75rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 0.5rem 0;
      border-bottom: 1px solid ${props => props.$isDarkMode ? '#374151' : '#e5e7eb'};
      color: ${props => props.$isDarkMode ? '#cbd5e1' : '#4b5563'};
      font-size: 0.875rem;

      &:last-child {
        border-bottom: none;
      }
    }
  }
`;

export const SortControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(51, 65, 85, 0.3)'
    : 'rgba(255, 255, 255, 0.7)'
  };
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$isDarkMode ? '#475569' : '#e2e8f0'};
  border-radius: 0.75rem;
  overflow-x: auto;
`;

export const SortButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: ${props => props.$active 
    ? props.$isDarkMode 
      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    : 'transparent'
  };
  color: ${props => props.$active 
    ? '#ffffff'
    : props.$isDarkMode ? '#cbd5e1' : '#475569'
  };

  &:hover {
    background: ${props => props.$active 
      ? props.$isDarkMode 
        ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
        : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
      : props.$isDarkMode 
        ? 'rgba(59, 130, 246, 0.1)'
        : 'rgba(59, 130, 246, 0.05)'
    };
  }
`;

export const PostsContainer = styled.div`
  flex: 1;
`;

export const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};

  svg {
    opacity: 0.5;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: ${props => props.$isDarkMode ? '#cbd5e1' : '#475569'};
  }

  p {
    font-size: 1rem;
    line-height: 1.5;
  }
`;

export const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const PostCard = styled.div`
  background: ${props => props.$isDarkMode 
    ? 'rgba(51, 65, 85, 0.4)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$isDarkMode ? '#475569' : '#e2e8f0'};
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.$isDarkMode ? '#64748b' : '#cbd5e1'};
  }
`;

export const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

export const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const AuthorAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  color: white;
`;

export const AuthorName = styled.span`
  font-weight: 600;
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const PostTime = styled.span`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
`;

export const PostContent = styled.div`
  margin-bottom: 1rem;
`;

export const PostTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  margin-bottom: 0.75rem;
  line-height: 1.4;
`;

export const PostFlair = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.$color || '#3b82f6'};
  color: white;
  margin-bottom: 0.75rem;
`;

export const PostText = styled.p`
  color: ${props => props.$isDarkMode ? '#cbd5e1' : '#475569'};
  line-height: 1.6;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  max-height: ${props => props.$expanded ? 'none' : '4.5rem'};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: ${props => props.$expanded ? 'none' : '3'};
  -webkit-box-orient: vertical;
`;

export const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.$isDarkMode ? '#60a5fa' : '#3b82f6'};
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0;
  margin-bottom: 0.75rem;

  &:hover {
    text-decoration: underline;
  }
`;

export const PostFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.$isDarkMode ? '#374151' : '#e5e7eb'};
`;

export const PostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const VoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => 
    props.$active 
      ? props.$type === 'like' ? '#22c55e' : '#ef4444'
      : props.$isDarkMode ? '#475569' : '#d1d5db'
  };
  border-radius: 0.5rem;
  background: ${props => 
    props.$active 
      ? props.$type === 'like' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
      : 'transparent'
  };
  color: ${props => 
    props.$active 
      ? props.$type === 'like' ? '#22c55e' : '#ef4444'
      : props.$isDarkMode ? '#94a3b8' : '#6b7280'
  };
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => 
      props.$type === 'like' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
    };
    border-color: ${props => props.$type === 'like' ? '#22c55e' : '#ef4444'};
    color: ${props => props.$type === 'like' ? '#22c55e' : '#ef4444'};
  }

  svg {
    fill: ${props => props.$active ? 'currentColor' : 'none'};
  }
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.$isDarkMode ? '#475569' : '#d1d5db'};
  border-radius: 0.5rem;
  background: transparent;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#6b7280'};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
    border-color: #3b82f6;
    color: #3b82f6;
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
  padding: 0.25rem 0.5rem;
  background: ${props => props.$isDarkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.1)'};
  border: 1px solid #fbbf24;
  border-radius: 0.375rem;
  color: #fbbf24;
  font-size: 0.75rem;
  font-weight: 500;
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  }

  p {
    font-size: 1rem;
    margin-bottom: 2rem;
  }
`;
