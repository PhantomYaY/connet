import styled, { keyframes } from 'styled-components';

// Animations
export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

export const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Base glass card mixin
const glassCard = `
  background: rgba(30, 41, 59, 0.25);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

// Main container
export const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, #020617 0%, #030712 100%)'
    : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
  };
  font-family: 'Inter', sans-serif;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  position: relative;
  overflow-x: hidden;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #020617 0%, #030712 100%);
`;

export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(148, 163, 184, 0.3);
  border-top: 3px solid hsl(210 40% 98%);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

export const LoadingText = styled.div`
  color: hsl(210 40% 98%);
  font-size: 1.1rem;
  font-weight: 500;
`;

// Header components
export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  ${glassCard}
  border-radius: 0;
  position: sticky;
  top: 0;
  z-index: 100;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

export const HeaderCenter = styled.div`
  flex: 2;
  max-width: 600px;
  
  @media (max-width: 768px) {
    flex: 100%;
    order: 3;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  justify-content: flex-end;
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  ${glassCard}
  color: hsl(210 40% 98%);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(30, 41, 59, 0.4);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
`;

export const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: hsl(210 40% 98%);
  margin: 0;
`;

export const PageSubtitle = styled.p`
  font-size: 0.875rem;
  color: hsl(215 20.2% 65.1%);
  margin: 0;
  font-weight: 500;
`;

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  ${glassCard}
  transition: all 0.2s ease;
  color: hsl(215 20.2% 65.1%);
  
  &:focus-within {
    border-color: rgba(148, 163, 184, 0.3);
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.875rem;
  color: hsl(210 40% 98%);
  background: transparent;
  
  &::placeholder {
    color: hsl(215 20.2% 65.1%);
  }
`;

export const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size === 'small' ? '32px' : '40px'};
  height: ${props => props.size === 'small' ? '32px' : '40px'};
  border-radius: 8px;
  border: none;
  background: ${props => props.$active ? 'rgba(148, 163, 184, 0.2)' : 'rgba(30, 41, 59, 0.25)'};
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: ${props => props.$active ? 'hsl(210 40% 98%)' : 'hsl(215 20.2% 65.1%)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? 'rgba(148, 163, 184, 0.3)' : 'rgba(30, 41, 59, 0.4)'};
    transform: translateY(-1px);
  }
`;

export const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  ${glassCard}
  color: hsl(210 40% 98%);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
`;

// Filters
export const FiltersBar = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 2rem;
  ${glassCard}
  border-radius: 0;
  animation: ${slideUp} 0.3s ease;
`;

export const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(210 40% 98%);
`;

export const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 6px;
  ${glassCard}
  color: hsl(210 40% 98%);
  font-size: 0.875rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: rgba(148, 163, 184, 0.3);
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
  }
  
  option {
    background: hsl(217.2 32.6% 17.5%);
    color: hsl(210 40% 98%);
  }
`;

// Main content layout
export const MainContent = styled.main`
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

// Sidebar components
export const CommunitiesSidebar = styled.aside`
  ${glassCard}
  height: fit-content;
  position: sticky;
  top: 120px;
  transition: all 0.3s ease;
  
  ${props => props.$collapsed && `
    width: 60px;
  `}
  
  @media (max-width: 1200px) {
    order: 3;
    position: static;
  }
`;

export const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
`;

export const SidebarTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: hsl(210 40% 98%);
  margin: 0;
`;

export const SidebarActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const CommunitiesList = styled.div`
  padding: 1rem;
  max-height: 600px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(148, 163, 184, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
  }
`;

export const CommunityCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  ${props => props.$active && `
    background: rgba(148, 163, 184, 0.2);
    color: hsl(210 40% 98%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  `}
  
  &:hover {
    background: ${props => props.$active ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.1)'};
    transform: translateY(-1px);
  }
`;

export const CommunityIcon = styled.div`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

export const CommunityInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const CommunityName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
  color: hsl(210 40% 98%);
`;

export const CommunityStats = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  opacity: 0.8;
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: hsl(215 20.2% 65.1%);
  
  ${props => props.$online && `
    color: #10b981;
    font-weight: 500;
  `}
`;

export const CommunityActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const JoinButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: ${props => props.$joined ? '#10b981' : 'rgba(148, 163, 184, 0.2)'};
  color: ${props => props.$joined ? 'white' : 'hsl(215 20.2% 65.1%)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$joined ? '#059669' : 'rgba(148, 163, 184, 0.3)'};
    transform: scale(1.05);
  }
`;

// Posts feed
export const PostsFeed = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const PostCard = styled.article`
  ${glassCard}
  padding: 0;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.5s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    border-color: rgba(148, 163, 184, 0.3);
  }
`;

export const PinnedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
`;

export const PostHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
  margin-bottom: 1rem;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 1.5rem;
    right: 1.5rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.2), transparent);
  }
`;

export const CommunityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1));
  color: hsl(210 40% 98%);
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(148, 163, 184, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.2));
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

export const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  margin-left: 1rem;
`;

export const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const AuthorAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.1));
  border: 2px solid rgba(148, 163, 184, 0.2);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    border-color: rgba(148, 163, 184, 0.4);
  }
`;

export const AuthorName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(210 40% 98%);
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const AuthorReputation = styled.span`
  font-size: 0.75rem;
  color: hsl(215 20.2% 65.1%);
  font-weight: normal;
`;

export const PostTime = styled.time`
  font-size: 0.75rem;
  color: hsl(215 20.2% 65.1%);
`;

export const EditedBadge = styled.span`
  font-size: 0.75rem;
  color: hsl(215 20.2% 65.1%);
  font-style: italic;
`;

export const PostActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

// Post content
export const PostContent = styled.div`
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;
`;

export const PostTitle = styled.h2`
  font-size: 1.375rem;
  font-weight: 700;
  color: hsl(210 40% 98%);
  margin: 0 0 1rem 0;
  line-height: 1.3;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: rgba(148, 163, 184, 0.8);
  }
`;

export const PostFlair = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: ${props => props.$color || '#6b7280'};
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
`;

export const PostText = styled.div`
  color: hsl(210 40% 98%);
  line-height: 1.6;
  font-size: 0.9375rem;
  
  ${props => !props.$expanded && `
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

export const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: none;
  border: none;
  color: hsl(215 20.2% 65.1%);
  cursor: pointer;
  font-size: 0.875rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: hsl(210 40% 98%);
  }
`;

// Media and poll components
export const MediaContainer = styled.div`
  margin: 1rem 0;
  border-radius: 12px;
  overflow: hidden;
`;

export const MediaItem = styled.div`
  img {
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: cover;
  }
`;

export const PollContainer = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  ${glassCard}
`;

export const PollQuestion = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: hsl(210 40% 98%);
  margin: 0 0 1rem 0;
`;

export const PollOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

export const PollOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(90deg, 
    rgba(148, 163, 184, 0.2) 0%, 
    rgba(148, 163, 184, 0.2) ${props => props.$percentage}%, 
    transparent ${props => props.$percentage}%
  );
  border-radius: 8px;
  cursor: ${props => props.$voted ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$voted ? '' : 'rgba(148, 163, 184, 0.1)'};
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
  font-size: 0.75rem;
  color: hsl(215 20.2% 65.1%);
`;

// Tags and badges
export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
`;

export const Tag = styled.span`
  padding: 0.25rem 0.5rem;
  background: rgba(148, 163, 184, 0.2);
  color: hsl(215 20.2% 65.1%);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

export const AuthorBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 0.5rem 0;
`;

export const Badge = styled.span`
  padding: 0.125rem 0.375rem;
  background: rgba(148, 163, 184, 0.2);
  color: hsl(215 20.2% 65.1%);
  border-radius: 3px;
  font-size: 0.625rem;
  font-weight: 500;
`;

// Post footer
export const PostFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  background: rgba(148, 163, 184, 0.05);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  margin-top: 1rem;
`;

export const PostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const StatGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const VoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
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
  position: relative;

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

  &:active {
    transform: translateY(0);
  }
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
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

  &:active {
    transform: translateY(0);
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
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
`;

// Trending sidebar
export const TrendingSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (max-width: 1200px) {
    order: 2;
  }
`;

export const TrendingSection = styled.div`
  ${glassCard}
  padding: 1.5rem;
`;

export const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: hsl(210 40% 98%);
  margin: 0 0 1rem 0;
`;

export const TrendingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const TrendingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(148, 163, 184, 0.1);
  }
`;

export const TrendingRank = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: hsl(215 20.2% 65.1%);
  min-width: 20px;
`;

export const TrendingTopic = styled.div`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(210 40% 98%);
`;

export const TrendingCount = styled.div`
  font-size: 0.75rem;
  color: hsl(215 20.2% 65.1%);
`;

export const ContributorsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const ContributorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(148, 163, 184, 0.1);
  }
`;

export const ContributorAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: rgba(148, 163, 184, 0.2);
`;

export const ContributorInfo = styled.div`
  flex: 1;
`;

export const ContributorName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(210 40% 98%);
`;

export const ContributorRep = styled.div`
  font-size: 0.75rem;
  color: hsl(215 20.2% 65.1%);
`;

// Empty state
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 3rem;
  text-align: center;
  ${glassCard}
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
      rgba(148, 163, 184, 0.05) 0%,
      rgba(148, 163, 184, 0.02) 50%,
      rgba(148, 163, 184, 0.05) 100%
    );
    z-index: -1;
  }
`;

export const EmptyStateIcon = styled.div`
  margin-bottom: 2rem;
  color: hsl(215 20.2% 65.1%);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(148, 163, 184, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    z-index: -1;
  }
`;

export const EmptyStateTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(210 40% 98%);
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, hsl(210 40% 98%), hsl(215 20.2% 65.1%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const EmptyStateDescription = styled.p`
  color: hsl(215 20.2% 65.1%);
  margin: 0 0 2.5rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 400px;
`;

// Modal components
export const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

export const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
`;

export const ModalContent = styled.div`
  position: relative;
  ${glassCard}
  width: 100%;
  max-width: ${props => props.$large ? '800px' : '600px'};
  max-height: 90vh;
  overflow-y: auto;
  animation: ${fadeIn} 0.3s ease;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(148, 163, 184, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 4px;
  }
`;

export const ModalHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
  margin-bottom: 1.5rem;
`;

export const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(210 40% 98%);
  margin: 0;
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba(148, 163, 184, 0.2);
  color: hsl(215 20.2% 65.1%);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(148, 163, 184, 0.3);
    color: hsl(210 40% 98%);
  }
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
  margin-top: 2rem;
`;

// Form components
export const CreatePostForm = styled.form`
  padding: 0 1.5rem;
`;

export const CreateCommunityForm = styled.form`
  padding: 0 1.5rem;
`;

export const FormSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

export const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(210 40% 98%);
  margin-bottom: 0.5rem;
`;

export const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  ${glassCard}
  color: hsl(210 40% 98%);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(148, 163, 184, 0.3);
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
  }
  
  &::placeholder {
    color: hsl(215 20.2% 65.1%);
  }
`;

export const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  ${glassCard}
  color: hsl(210 40% 98%);
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: rgba(148, 163, 184, 0.3);
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
  }
  
  &::placeholder {
    color: hsl(215 20.2% 65.1%);
  }
`;

export const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  ${glassCard}
  color: hsl(210 40% 98%);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(148, 163, 184, 0.3);
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
  }
  
  option {
    background: hsl(217.2 32.6% 17.5%);
    color: hsl(210 40% 98%);
  }
`;

export const PostTypeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const PostTypeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  background: ${props => props.$active ? 'rgba(148, 163, 184, 0.2)' : 'transparent'};
  color: ${props => props.$active ? 'hsl(210 40% 98%)' : 'hsl(215 20.2% 65.1%)'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  
  &:hover {
    background: rgba(148, 163, 184, 0.1);
    color: hsl(210 40% 98%);
  }
`;

export const CharCount = styled.div`
  font-size: 0.75rem;
  color: hsl(215 20.2% 65.1%);
  text-align: right;
  margin-top: 0.25rem;
`;

export const RichTextEditor = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  ${glassCard}
  color: hsl(210 40% 98%);
  font-size: 0.875rem;
  resize: vertical;
  min-height: 150px;
  transition: all 0.2s ease;
  font-family: inherit;
  line-height: 1.5;
  
  &:focus {
    outline: none;
    border-color: rgba(148, 163, 184, 0.3);
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
  }
  
  &::placeholder {
    color: hsl(215 20.2% 65.1%);
  }
`;

export const PollOptionInput = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`;

export const AddOptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  background: transparent;
  color: hsl(215 20.2% 65.1%);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  
  &:hover {
    background: rgba(148, 163, 184, 0.1);
    color: hsl(210 40% 98%);
    border-color: rgba(148, 163, 184, 0.5);
  }
`;

export const TagInput = styled.div`
  margin-bottom: 0.5rem;
`;

export const TagPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

export const PostOptions = styled.div`
  display: flex;
  gap: 1.5rem;
  margin: 1.5rem 0;
`;

export const OptionCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: hsl(210 40% 98%);
  }
  
  label {
    font-size: 0.875rem;
    color: hsl(210 40% 98%);
    cursor: pointer;
  }
`;

export const CommunityNameInput = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  ${glassCard}
  overflow: hidden;
  
  span {
    padding: 0.75rem;
    background: rgba(148, 163, 184, 0.1);
    color: hsl(215 20.2% 65.1%);
    font-weight: 600;
    font-size: 0.875rem;
    border-right: 1px solid rgba(148, 163, 184, 0.15);
  }
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: none;
    background: transparent;
    color: hsl(210 40% 98%);
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
    }
    
    &::placeholder {
      color: hsl(215 20.2% 65.1%);
    }
  }
`;

export const PrivacySelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const PrivacyOption = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  
  input[type="radio"] {
    margin-top: 0.25rem;
    accent-color: hsl(210 40% 98%);
  }
`;

export const PrivacyLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  
  div {
    div {
      font-size: 0.875rem;
      font-weight: 600;
      color: hsl(210 40% 98%);
      margin-bottom: 0.25rem;
    }
    
    small {
      font-size: 0.75rem;
      color: hsl(215 20.2% 65.1%);
    }
  }
`;

export const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  ${glassCard}
  color: hsl(210 40% 98%);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.4);
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  background: transparent;
  color: hsl(215 20.2% 65.1%);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(148, 163, 184, 0.1);
    color: hsl(210 40% 98%);
  }
`;
