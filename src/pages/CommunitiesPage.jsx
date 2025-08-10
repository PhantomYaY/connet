import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Heart, Share2, Plus, Users, TrendingUp, Clock, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { getCommunityPosts } from '../lib/firestoreService';
import { useToast } from '../components/ui/use-toast';

const CommunitiesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [reactions, setReactions] = useState({});

  const categories = [
    { id: 'all', label: 'All Posts', icon: Users },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'Recent', icon: Clock }
  ];

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const communityPosts = await getCommunityPosts();
      setPosts(communityPosts);
    } catch (error) {
      console.error('Error loading community data:', error);
      toast({
        title: "Error",
        description: "Failed to load community posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleReaction = (postId, type) => {
    setReactions(prev => ({
      ...prev,
      [postId]: prev[postId] === type ? null : type
    }));
  };

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content",
        variant: "destructive"
      });
      return;
    }

    const createdPost = {
      id: `post-${Date.now()}`,
      title: newPost.title,
      content: newPost.content,
      author: 'You',
      community: 'c/General',
      likes: 0,
      replies: 0,
      createdAt: new Date()
    };

    setPosts(prev => [createdPost, ...prev]);
    setShowCreatePost(false);
    setNewPost({ title: '', content: '' });
    toast({
      title: "Post Created!",
      description: "Your post has been shared with the community"
    });
  };

  const handleComment = (postId) => {
    // TODO: Implement comment functionality
    toast({
      title: "Coming Soon",
      description: "Comment functionality will be available soon!",
    });
  };

  const handleShare = (postId) => {
    // TODO: Implement share functionality
    toast({
      title: "Coming Soon",
      description: "Share functionality will be available soon!",
    });
  };

  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'trending') return post.likes > 5;
    if (selectedCategory === 'recent') {
      const postDate = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return postDate > dayAgo;
    }
    return true;
  });

  return (
    <PageWrapper>
      {/* Grid Background */}
      <div className="grid-background" />
      <div className="gradient-overlay" />

      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </BackButton>
          <HeaderInfo>
            <PageTitle>Communities</PageTitle>
            <PageSubtitle>Connect with fellow note-takers and learners</PageSubtitle>
          </HeaderInfo>
        </HeaderLeft>
        
        <HeaderActions>
          <ActionButton className="primary" onClick={() => setShowCreatePost(true)}>
            <Plus size={16} />
            Create Post
          </ActionButton>
        </HeaderActions>
      </Header>

      <Content>
        <CategoriesNav>
          {categories.map(category => {
            const IconComponent = category.icon;
            return (
              <CategoryButton
                key={category.id}
                $active={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
              >
                <IconComponent size={16} />
                {category.label}
              </CategoryButton>
            );
          })}
        </CategoriesNav>

        <PostsContainer>
          {loading ? (
            <LoadingState>
              <div className="spinner" />
              <p>Loading community posts...</p>
            </LoadingState>
          ) : filteredPosts.length === 0 ? (
            <EmptyState>
              <Users size={48} />
              <h3>No posts yet</h3>
              <p>Be the first to start a conversation in the community!</p>
              <ActionButton className="primary" onClick={() => setShowCreatePost(true)}>
                <Plus size={16} />
                Create First Post
              </ActionButton>
            </EmptyState>
          ) : (
            <PostsList>
              {filteredPosts.map(post => (
                <PostCard key={post.id}>
                  <PostHeader>
                    <AuthorInfo>
                      <AuthorAvatar>
                        {post.author?.charAt(0) || 'A'}
                      </AuthorAvatar>
                      <AuthorDetails>
                        <AuthorName>{post.author || 'Anonymous User'}</AuthorName>
                        <PostTime>{formatDate(post.createdAt)}</PostTime>
                      </AuthorDetails>
                    </AuthorInfo>
                  </PostHeader>

                  <PostContent>
                    <PostTitle>{post.title}</PostTitle>
                    <PostText>{post.content}</PostText>
                    {post.tags && post.tags.length > 0 && (
                      <PostTags>
                        {post.tags.map((tag, idx) => (
                          <Tag key={idx}>{tag}</Tag>
                        ))}
                      </PostTags>
                    )}
                  </PostContent>

                  <PostActions>
                    <ActionButton
                      onClick={() => handleReaction(post.id, 'like')}
                      style={{ color: reactions[post.id] === 'like' ? '#10b981' : '' }}
                    >
                      <ThumbsUp size={16} />
                      {post.likes || 0}
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleReaction(post.id, 'dislike')}
                      style={{ color: reactions[post.id] === 'dislike' ? '#ef4444' : '' }}
                    >
                      <ThumbsDown size={16} />
                      Dislike
                    </ActionButton>
                    <ActionButton onClick={() => handleComment(post.id)}>
                      <MessageSquare size={16} />
                      {post.replies || 0}
                    </ActionButton>
                    <ActionButton onClick={() => handleShare(post.id)}>
                      <Share2 size={16} />
                      Share
                    </ActionButton>
                  </PostActions>
                </PostCard>
              ))}
            </PostsList>
          )}
        </PostsContainer>
      </Content>

      {/* Simple Create Post Modal */}
      {showCreatePost && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>Create New Post</h3>
              <CloseButton onClick={() => setShowCreatePost(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Title</label>
              <input
                type="text"
                placeholder="Enter post title..."
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <label>Content</label>
              <textarea
                placeholder="What would you like to share?"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                rows={5}
              />
            </FormGroup>
            <ModalActions>
              <button onClick={() => setShowCreatePost(false)}>Cancel</button>
              <button onClick={handleCreatePost} className="primary">Create Post</button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  position: relative;
  
  .dark & {
    background: #0f172a;
  }

  .grid-background {
    position: absolute;
    inset: 0;
    background: 
      linear-gradient(to_right, #e2e8f0 1px, transparent 1px),
      linear-gradient(to_bottom, #e2e8f0 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.5;
    
    .dark & {
      background: 
        linear-gradient(to_right, #1e293b 1px, transparent 1px),
        linear-gradient(to_bottom, #1e293b 1px, transparent 1px);
    }
  }

  .gradient-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
    pointer-events: none;
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .dark & {
    background: rgba(15, 23, 42, 0.8);
    border-bottom: 1px solid rgba(51, 65, 85, 0.3);
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
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
    transform: translateX(-2px);
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
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
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid rgba(203, 213, 225, 0.5);
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;

  &:hover {
    background: rgba(59, 130, 246, 0.05);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }

  &.primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-color: transparent;
    color: white;

    &:hover {
      background: linear-gradient(135deg, #2563eb, #1e40af);
      transform: translateY(-1px);
    }
  }

  .dark & {
    border-color: rgba(51, 65, 85, 0.5);
    color: #d1d5db;

    &:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
      color: #60a5fa;
    }
  }
`;

const Content = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 10;
`;

const CategoriesNav = styled.nav`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(203, 213, 225, 0.3);
  
  .dark & {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(51, 65, 85, 0.3);
  }
`;

const CategoryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${props => props.$active ? 'rgba(59, 130, 246, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(59, 130, 246, 0.3)' : 'transparent'};
  border-radius: 8px;
  color: ${props => props.$active ? '#3b82f6' : '#6b7280'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: rgba(59, 130, 246, 0.05);
    color: #3b82f6;
  }

  .dark & {
    color: ${props => props.$active ? '#60a5fa' : '#9ca3af'};
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
      color: #60a5fa;
    }
  }
`;

const PostsContainer = styled.div`
  position: relative;
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
    border: 3px solid rgba(59, 130, 246, 0.2);
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

const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PostCard = styled.article`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1.5rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  .dark & {
    background: rgba(30, 41, 59, 0.25);
    border: 1px solid rgba(148, 163, 184, 0.15);
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.3);
    
    .dark & {
      background: rgba(30, 41, 59, 0.35);
    }
  }
`;

const PostHeader = styled.header`
  margin-bottom: 1rem;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const AuthorAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`;

const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  
  .dark & {
    color: #d1d5db;
  }
`;

const PostTime = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  
  .dark & {
    color: #9ca3af;
  }
`;

const PostContent = styled.div`
  margin-bottom: 1rem;
`;

const PostTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  
  .dark & {
    color: #f9fafb;
  }
`;

const PostText = styled.p`
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 1rem 0;
  
  .dark & {
    color: #d1d5db;
  }
`;

const PostTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  
  .dark & {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
  }
`;

const PostActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(203, 213, 225, 0.3);
  
  .dark & {
    border-top-color: rgba(51, 65, 85, 0.3);
  }
`;

// Modal Styled Components
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;

  .dark & {
    background: #1e293b;
    color: white;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;

  &:hover {
    background: #f3f4f6;
  }

  .dark & {
    &:hover {
      background: #374151;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;

    &:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .dark & {
      background: #374151;
      border-color: #4b5563;
      color: white;
    }
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;

  button {
    padding: 0.75rem 1.5rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;

    &.primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;

      &:hover {
        background: #2563eb;
      }
    }

    &:not(.primary) {
      background: white;

      &:hover {
        background: #f9fafb;
      }

      .dark & {
        background: #374151;
        color: white;
        border-color: #4b5563;

        &:hover {
          background: #475569;
        }
      }
    }
  }
`;

export default CommunitiesPage;
