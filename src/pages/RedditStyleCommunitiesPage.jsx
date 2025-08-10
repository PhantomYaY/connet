import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageSquare, 
  ThumbsUp,
  ThumbsDown,
  Share2, 
  Plus, 
  Users, 
  TrendingUp, 
  Clock,
  Flame,
  BookOpen,
  Award,
  Pin,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  ChevronUp,
  ChevronDown,
  Reply,
  Heart,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { getCommunityPosts } from '../lib/firestoreService';
import { useToast } from '../components/ui/use-toast';

const RedditStyleCommunitiesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState('hot');
  const [selectedCommunity, setSelectedCommunity] = useState('all');
  const [votedPosts, setVotedPosts] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    community: 'studytips',
    flair: 'Discussion'
  });

  // Mock data for demonstration
  const [mockPosts] = useState([
    {
      id: 'post-1',
      title: 'How to effectively use spaced repetition for long-term retention?',
      content: 'I\'ve been struggling with remembering information long-term. I heard about spaced repetition but I\'m not sure how to implement it effectively. Any tips?',
      author: 'StudyNinja',
      community: 'c/StudyTips',
      likes: 247,
      dislikes: 12,
      comments: 34,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isPinned: false,
      flair: 'Question',
      tags: ['spaced-repetition', 'memory', 'study-tips'],
      type: 'text'
    },
    {
      id: 'post-2',
      title: 'My note-taking system that helped me ace medical school',
      content: 'After 4 years of trial and error, I\'ve developed a note-taking system that combines Cornell notes with mind mapping. Here\'s how it works...',
      author: 'MedStudent2024',
      community: 'c/NoteNinja',
      likes: 1204,
      dislikes: 23,
      comments: 89,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      isPinned: true,
      flair: 'Success Story',
      tags: ['cornell-notes', 'mind-mapping', 'medical-school'],
      type: 'text'
    },
    {
      id: 'post-3',
      title: 'Digital vs Physical flashcards: A comprehensive comparison',
      content: 'I spent 6 months using only digital flashcards and 6 months using only physical ones. Here are my findings...',
      author: 'FlashcardGuru',
      community: 'c/Flashcards',
      likes: 582,
      dislikes: 31,
      comments: 67,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      isPinned: false,
      flair: 'Research',
      tags: ['digital', 'physical', 'comparison'],
      type: 'text'
    },
    {
      id: 'post-4',
      title: 'PSA: Remember to take breaks! Pomodoro technique saved my sanity',
      content: 'Just a reminder that taking regular breaks is crucial for effective learning. The Pomodoro technique has been a game-changer for me.',
      author: 'BreakTaker',
      community: 'c/StudyTips',
      likes: 156,
      dislikes: 5,
      comments: 23,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      isPinned: false,
      flair: 'PSA',
      tags: ['pomodoro', 'breaks', 'productivity'],
      type: 'text'
    }
  ]);

  const communities = [
    { id: 'all', name: 'All Communities', members: '12.5k', icon: Users },
    { id: 'studytips', name: 'c/StudyTips', members: '3.2k', icon: BookOpen },
    { id: 'noteninja', name: 'c/NoteNinja', members: '2.8k', icon: Award },
    { id: 'flashcards', name: 'c/Flashcards', members: '1.9k', icon: Flame },
  ];

  const sortOptions = [
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Clock },
    { id: 'top', label: 'Top', icon: TrendingUp },
    { id: 'rising', label: 'Rising', icon: ArrowUp }
  ];

  useEffect(() => {
    loadCommunityData();
  }, [selectedSort, selectedCommunity]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from your API based on sort and community
      setTimeout(() => {
        setPosts(mockPosts);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading community data:', error);
      toast({
        title: "Error",
        description: "Failed to load community posts",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleReaction = (postId, reactionType) => {
    setVotedPosts(prev => ({
      ...prev,
      [postId]: reactionType === votedPosts[postId] ? null : reactionType
    }));

    // Update post reactions (in real app, this would be an API call)
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        const currentReaction = votedPosts[postId];
        const newReaction = reactionType === currentReaction ? null : reactionType;

        let likes = post.likes;
        let dislikes = post.dislikes;

        if (currentReaction === 'like') likes--;
        if (currentReaction === 'dislike') dislikes--;
        if (newReaction === 'like') likes++;
        if (newReaction === 'dislike') dislikes++;

        return { ...post, likes, dislikes };
      }
      return post;
    }));
  };

  const getNetScore = (post) => post.likes - post.dislikes;

  const formatScore = (score) => {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toString();
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageWrapper>
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </BackButton>
          <HeaderInfo>
            <PageTitle>Communities</PageTitle>
            <PageSubtitle>Connect • Share • Learn Together</PageSubtitle>
          </HeaderInfo>
        </HeaderLeft>
        
        <HeaderActions>
          <SearchBox>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search posts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBox>
          <CreateButton onClick={() => setShowCreatePost(true)}>
            <Plus size={16} />
            Create Post
          </CreateButton>
        </HeaderActions>
      </Header>

      <MainContent>
        <Sidebar>
          <SidebarSection>
            <SectionTitle>Communities</SectionTitle>
            <CommunityList>
              {communities.map(community => {
                const IconComponent = community.icon;
                return (
                  <CommunityItem 
                    key={community.id}
                    $active={selectedCommunity === community.id}
                    onClick={() => setSelectedCommunity(community.id)}
                  >
                    <IconComponent size={18} />
                    <CommunityInfo>
                      <CommunityName>{community.name}</CommunityName>
                      <MemberCount>{community.members} members</MemberCount>
                    </CommunityInfo>
                  </CommunityItem>
                );
              })}
            </CommunityList>
          </SidebarSection>
          
          <SidebarSection>
            <SectionTitle>Quick Actions</SectionTitle>
            <QuickActions>
              <QuickAction onClick={() => setShowCreatePost(true)}>
                <Plus size={16} />
                Create Post
              </QuickAction>
              <QuickAction>
                <Users size={16} />
                Join Community
              </QuickAction>
            </QuickActions>
          </SidebarSection>
        </Sidebar>

        <ContentArea>
          <SortBar>
            <SortOptions>
              {sortOptions.map(option => {
                const IconComponent = option.icon;
                return (
                  <SortButton
                    key={option.id}
                    $active={selectedSort === option.id}
                    onClick={() => setSelectedSort(option.id)}
                  >
                    <IconComponent size={16} />
                    {option.label}
                  </SortButton>
                );
              })}
            </SortOptions>
            <FilterButton>
              <Filter size={16} />
              Filter
            </FilterButton>
          </SortBar>

          <PostsList>
            {loading ? (
              <LoadingState>
                <div className="spinner" />
                <p>Loading posts...</p>
              </LoadingState>
            ) : filteredPosts.length === 0 ? (
              <EmptyState>
                <Users size={48} />
                <h3>No posts found</h3>
                <p>Be the first to start a conversation!</p>
                <CreateButton onClick={() => setShowCreatePost(true)}>
                  <Plus size={16} />
                  Create First Post
                </CreateButton>
              </EmptyState>
            ) : (
              filteredPosts.map(post => (
                <PostCard key={post.id} $isPinned={post.isPinned}>
                  {post.isPinned && (
                    <PinnedBadge>
                      <Pin size={14} />
                      Pinned
                    </PinnedBadge>
                  )}
                  
                  <PostMain>
                    <ReactionSection>
                      <ReactionButton
                        $reacted={votedPosts[post.id] === 'like'}
                        $type="like"
                        onClick={() => handleReaction(post.id, 'like')}
                      >
                        <ThumbsUp size={16} />
                      </ReactionButton>
                      <ReactionScore $reacted={votedPosts[post.id]}>
                        {formatScore(getNetScore(post))}
                      </ReactionScore>
                      <ReactionButton
                        $reacted={votedPosts[post.id] === 'dislike'}
                        $type="dislike"
                        onClick={() => handleReaction(post.id, 'dislike')}
                      >
                        <ThumbsDown size={16} />
                      </ReactionButton>
                    </ReactionSection>

                    <PostContent>
                      <PostHeader>
                        <PostMeta>
                          <CommunityLink>{post.community}</CommunityLink>
                          <PostAuthor>u/{post.author}</PostAuthor>
                          <PostTime>{formatTimeAgo(post.createdAt)}</PostTime>
                          {post.flair && <PostFlair $type={post.flair}>{post.flair}</PostFlair>}
                        </PostMeta>
                        <MoreButton>
                          <MoreHorizontal size={16} />
                        </MoreButton>
                      </PostHeader>

                      <PostTitle>{post.title}</PostTitle>
                      
                      <PostText $expanded={expandedPosts[post.id]}>
                        {post.content}
                      </PostText>
                      
                      {post.content.length > 200 && (
                        <ExpandButton onClick={() => togglePostExpansion(post.id)}>
                          {expandedPosts[post.id] ? (
                            <>
                              <ChevronUp size={14} />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} />
                              Show more
                            </>
                          )}
                        </ExpandButton>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <PostTags>
                          {post.tags.map((tag, idx) => (
                            <Tag key={idx}>#{tag}</Tag>
                          ))}
                        </PostTags>
                      )}

                      <PostActions>
                        <ActionButton>
                          <MessageSquare size={16} />
                          {post.comments} Comments
                        </ActionButton>
                        <ActionButton>
                          <Share2 size={16} />
                          Share
                        </ActionButton>
                        <ActionButton>
                          <Bookmark size={16} />
                          Save
                        </ActionButton>
                        <ActionButton>
                          <Heart size={16} />
                          Award
                        </ActionButton>
                      </PostActions>
                    </PostContent>
                  </PostMain>
                </PostCard>
              ))
            )}
          </PostsList>
        </ContentArea>

        <RightSidebar>
          <SidebarCard>
            <CardHeader>
              <h3>Community Rules</h3>
            </CardHeader>
            <RulesList>
              <Rule>1. Be respectful and helpful</Rule>
              <Rule>2. Stay on topic</Rule>
              <Rule>3. No spam or self-promotion</Rule>
              <Rule>4. Use appropriate flairs</Rule>
              <Rule>5. Search before posting</Rule>
            </RulesList>
          </SidebarCard>

          <SidebarCard>
            <CardHeader>
              <h3>Trending Topics</h3>
            </CardHeader>
            <TrendingList>
              <TrendingItem>
                <TrendingRank>1</TrendingRank>
                <TrendingTag>#spaced-repetition</TrendingTag>
                <TrendingCount>245 posts</TrendingCount>
              </TrendingItem>
              <TrendingItem>
                <TrendingRank>2</TrendingRank>
                <TrendingTag>#cornell-notes</TrendingTag>
                <TrendingCount>189 posts</TrendingCount>
              </TrendingItem>
              <TrendingItem>
                <TrendingRank>3</TrendingRank>
                <TrendingTag>#pomodoro</TrendingTag>
                <TrendingCount>156 posts</TrendingCount>
              </TrendingItem>
            </TrendingList>
          </SidebarCard>
        </RightSidebar>
      </MainContent>
    </PageWrapper>
  );
};

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  
  .dark & {
    background: #0f172a;
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .dark & {
    background: #1e293b;
    border-bottom-color: #334155;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
    color: #334155;
  }
  
  .dark & {
    background: #334155;
    border-color: #475569;
    color: #cbd5e1;
    
    &:hover {
      background: #475569;
      color: #e2e8f0;
    }
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  
  .dark & {
    color: #f9fafb;
  }
`;

const PageSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  
  .dark & {
    color: #9ca3af;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  min-width: 250px;
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.875rem;
    color: #374151;
    
    .dark & {
      color: #d1d5db;
    }
    
    &::placeholder {
      color: #9ca3af;
    }
  }
  
  .dark & {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ff4500;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e03900;
    transform: translateY(-1px);
  }
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (max-width: 1200px) {
    order: 3;
  }
`;

const SidebarSection = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  
  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  
  .dark & {
    color: #d1d5db;
  }
`;

const CommunityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CommunityItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background: ${props => props.$active ? '#f1f5f9' : 'transparent'};
  color: ${props => props.$active ? '#3b82f6' : '#6b7280'};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;

  &:hover {
    background: #f8fafc;
    color: #374151;
  }
  
  .dark & {
    background: ${props => props.$active ? '#334155' : 'transparent'};
    color: ${props => props.$active ? '#60a5fa' : '#9ca3af'};
    
    &:hover {
      background: #334155;
      color: #d1d5db;
    }
  }
`;

const CommunityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const CommunityName = styled.span`
  font-weight: 500;
  font-size: 0.875rem;
`;

const MemberCount = styled.span`
  font-size: 0.75rem;
  opacity: 0.7;
`;

const QuickActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const QuickAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;

  &:hover {
    background: #f1f5f9;
    border-color: #d1d5db;
  }
  
  .dark & {
    background: #334155;
    border-color: #475569;
    color: #d1d5db;
    
    &:hover {
      background: #475569;
    }
  }
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SortBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  
  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const SortOptions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.$active ? '#3b82f6' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  border: 1px solid ${props => props.$active ? '#3b82f6' : 'transparent'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: ${props => props.$active ? '#2563eb' : '#f8fafc'};
    color: ${props => props.$active ? 'white' : '#374151'};
  }
  
  .dark & {
    color: ${props => props.$active ? 'white' : '#9ca3af'};
    
    &:hover {
      background: ${props => props.$active ? '#2563eb' : '#334155'};
      color: ${props => props.$active ? 'white' : '#d1d5db'};
    }
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: #6b7280;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;

  &:hover {
    background: #f8fafc;
    color: #374151;
  }
  
  .dark & {
    color: #9ca3af;
    border-color: #475569;
    
    &:hover {
      background: #334155;
      color: #d1d5db;
    }
  }
`;

const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PostCard = styled.article`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;
  
  ${props => props.$isPinned && `
    border-color: #10b981;
    background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
    
    .dark & {
      background: linear-gradient(135deg, #064e3b 0%, #1e293b 100%);
      border-color: #059669;
    }
  `}

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const PinnedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #10b981;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const PostMain = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
`;

const VoteSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const VoteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: ${props => {
    if (props.$voted) {
      return props.$type === 'up' ? '#ff4500' : '#7c3aed';
    }
    return '#9ca3af';
  }};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$type === 'up' ? '#fef2f2' : '#f3f4f6'};
    color: ${props => props.$type === 'up' ? '#dc2626' : '#7c3aed'};
  }
  
  .dark & {
    &:hover {
      background: ${props => props.$type === 'up' ? '#7f1d1d' : '#581c87'};
    }
  }
`;

const VoteScore = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => {
    if (props.$voted === 'up') return '#ff4500';
    if (props.$voted === 'down') return '#7c3aed';
    return '#374151';
  }};
  
  .dark & {
    color: ${props => {
      if (props.$voted === 'up') return '#ff4500';
      if (props.$voted === 'down') return '#7c3aed';
      return '#d1d5db';
    }};
  }
`;

const PostContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  
  .dark & {
    color: #9ca3af;
  }
`;

const CommunityLink = styled.span`
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
  
  .dark & {
    color: #60a5fa;
  }
`;

const PostAuthor = styled.span`
  font-weight: 500;
`;

const PostTime = styled.span``;

const PostFlair = styled.span`
  padding: 0.125rem 0.5rem;
  background: ${props => {
    switch (props.$type) {
      case 'Question': return '#dbeafe';
      case 'Success Story': return '#dcfce7';
      case 'Research': return '#fef3c7';
      case 'PSA': return '#fce7f3';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'Question': return '#1e40af';
      case 'Success Story': return '#166534';
      case 'Research': return '#92400e';
      case 'PSA': return '#be185d';
      default: return '#374151';
    }
  }};
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const MoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .dark & {
    &:hover {
      background: #374151;
      color: #d1d5db;
    }
  }
`;

const PostTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  cursor: pointer;
  
  &:hover {
    color: #3b82f6;
  }
  
  .dark & {
    color: #f9fafb;
    
    &:hover {
      color: #60a5fa;
    }
  }
`;

const PostText = styled.p`
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 1rem 0;
  
  ${props => !props.$expanded && `
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
  
  .dark & {
    color: #d1d5db;
  }
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #3b82f6;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;

  &:hover {
    text-decoration: underline;
  }
  
  .dark & {
    color: #60a5fa;
  }
`;

const PostTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #e2e8f0;
  }
  
  .dark & {
    background: #334155;
    color: #cbd5e1;
    
    &:hover {
      background: #475569;
    }
  }
`;

const PostActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  border-radius: 4px;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .dark & {
    color: #9ca3af;
    
    &:hover {
      background: #374151;
      color: #d1d5db;
    }
  }
`;

const RightSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (max-width: 1200px) {
    display: none;
  }
`;

const SidebarCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  
  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const CardHeader = styled.div`
  margin-bottom: 1rem;
  
  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
    
    .dark & {
      color: #d1d5db;
    }
  }
`;

const RulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Rule = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  
  .dark & {
    color: #9ca3af;
  }
`;

const TrendingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TrendingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TrendingRank = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
`;

const TrendingTag = styled.span`
  color: #3b82f6;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
  
  .dark & {
    color: #60a5fa;
  }
`;

const TrendingCount = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: auto;
  
  .dark & {
    color: #9ca3af;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  p {
    color: #6b7280;
    font-size: 0.875rem;
    
    .dark & {
      color: #9ca3af;
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  
  svg {
    color: #9ca3af;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
    
    .dark & {
      color: #d1d5db;
    }
  }
  
  p {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
    
    .dark & {
      color: #9ca3af;
    }
  }
`;

export default RedditStyleCommunitiesPage;
