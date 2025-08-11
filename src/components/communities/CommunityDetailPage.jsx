import React, { useState, useEffect, useCallback } from 'react';
import Avatar from '../ui/Avatar';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown,
  Plus,
  Users,
  MessageSquare,
  Bookmark,
  Award,
  Flag,
  Shield,
  Crown,
  Hash,
  AtSign,
  Calendar,
  MapPin,
  Globe,
  Lock,
  Check,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Settings,
  UserPlus,
  Bell,
  BellOff,
  Star,
  Activity,
  BarChart3,
  TrendingUp,
  PinIcon as Pin,
  X,
  Save
} from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useTheme } from '../../context/ThemeContext';
import OptimizedModernLoader from '../OptimizedModernLoader';
import styled from 'styled-components';
import * as S from '../../pages/communities/CommunityDetailStyles';
import {
  getCommunities,
  getCommunityPostsReal,
  joinCommunity,
  leaveCommunity,
  getUserPostReactions,
  setUserReaction,
  likePost,
  dislikePost,
  savePost,
  unsavePost,
  isPostSaved,
  canEditCommunity,
  updateCommunity,
  updateCommunityIcon
} from '../../lib/firestoreService';
import { auth } from '../../lib/firebase';

const CommunityDetailPage = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode } = useTheme();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedSort, setSelectedSort] = useState('hot');
  const [reactions, setReactions] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  const [isJoined, setIsJoined] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [canEdit, setCanEdit] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    description: '',
    icon: '',
    rules: []
  });

  useEffect(() => {
    loadCommunityData();
    loadCommunityPosts();
    checkEditPermissions();
  }, [communityId]);

  const checkEditPermissions = async () => {
    if (!communityId) return;
    try {
      const canUserEdit = await canEditCommunity(communityId);
      setCanEdit(canUserEdit);
    } catch (error) {
      console.error('Error checking edit permissions:', error);
      setCanEdit(false);
    }
  };

  const handleUpdateCommunity = async () => {
    try {
      await updateCommunity(communityId, {
        displayName: editForm.displayName,
        description: editForm.description,
        icon: editForm.icon,
        rules: editForm.rules.filter(rule => rule.trim())
      });

      toast({
        title: "✅ Community Updated",
        description: "Community details have been successfully updated",
        variant: "success"
      });

      setShowEditModal(false);
      await loadCommunityData(); // Refresh community data
    } catch (error) {
      console.error('Error updating community:', error);
      toast({
        title: "❌ Update Failed",
        description: error.message || "Failed to update community",
        variant: "destructive"
      });
    }
  };

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const communities = await getCommunities();
      const foundCommunity = communities.find(c => c.id === communityId);
      
      if (!foundCommunity) {
        throw new Error('Community not found');
      }
      
      setCommunity(foundCommunity);
      setIsJoined(foundCommunity.isJoined || false);

      // Initialize edit form with current data
      setEditForm({
        displayName: foundCommunity.displayName || '',
        description: foundCommunity.description || '',
        icon: foundCommunity.icon || '',
        rules: foundCommunity.rules || []
      });
    } catch (error) {
      console.error('Error loading community:', error);
      toast({
        title: "Error",
        description: "Failed to load community. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityPosts = async () => {
    try {
      setPostsLoading(true);
      const allPosts = await getCommunityPostsReal();
      
      // Filter posts for this community
      const communityPosts = allPosts.filter(post => 
        post.communityId === communityId || 
        post.community === communityId ||
        post.community === community?.name ||
        post.community === community?.displayName
      );

      // Sort posts based on selected sort
      const sortedPosts = sortPosts(communityPosts, selectedSort);
      setPosts(sortedPosts);

      // Load user reactions if authenticated
      if (auth.currentUser && sortedPosts.length > 0) {
        const postIds = sortedPosts.map(post => post.id);
        const userReactions = await getUserPostReactions(postIds);
        setReactions(userReactions);

        // Load bookmarks
        const bookmarkChecks = await Promise.all(
          postIds.slice(0, 10).map(async (postId) => {
            try {
              const isSaved = await isPostSaved(postId);
              return { postId, isSaved };
            } catch (error) {
              return { postId, isSaved: false };
            }
          })
        );

        const bookmarkedPosts = new Set(
          bookmarkChecks.filter(check => check.isSaved).map(check => check.postId)
        );
        setBookmarks(bookmarkedPosts);
      }
    } catch (error) {
      console.error('Error loading community posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPostsLoading(false);
    }
  };

  const sortPosts = (postsToSort, sortType) => {
    return [...postsToSort].sort((a, b) => {
      switch (sortType) {
        case 'hot':
          return (b.likes - b.dislikes + b.comments * 2) - (a.likes - a.dislikes + a.comments * 2);
        case 'new':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'top':
          return (b.likes - b.dislikes) - (a.likes - a.dislikes);
        case 'controversial':
          return (Math.min(a.likes, a.dislikes) / Math.max(a.likes + a.dislikes, 1)) - 
                 (Math.min(b.likes, b.dislikes) / Math.max(b.likes + b.dislikes, 1));
        default:
          return 0;
      }
    });
  };

  const handleSortChange = (newSort) => {
    setSelectedSort(newSort);
    const sortedPosts = sortPosts(posts, newSort);
    setPosts(sortedPosts);
  };

  const handleJoinCommunity = async () => {
    try {
      if (!auth.currentUser) {
        toast({
          title: "Sign in required",
          description: "You need to sign in to join communities.",
          variant: "warning"
        });
        return;
      }

      if (isJoined) {
        await leaveCommunity(communityId);
        setIsJoined(false);
        toast({
          title: "Left community",
          description: `You've left ${community.displayName}`,
          variant: "default"
        });
      } else {
        await joinCommunity(communityId);
        setIsJoined(true);
        toast({
          title: "Joined community!",
          description: `Welcome to ${community.displayName}!`,
          variant: "success"
        });
      }

      // Reload community data to get updated member count
      await loadCommunityData();
    } catch (error) {
      console.error('Error joining/leaving community:', error);
      toast({
        title: "Error",
        description: "Failed to update membership. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReaction = useCallback(async (postId, type) => {
    try {
      if (!auth.currentUser) {
        toast({
          title: "Sign in required",
          description: "You need to sign in to react to posts.",
          variant: "warning"
        });
        return;
      }

      const currentReaction = reactions[postId];
      const newReaction = currentReaction === type ? null : type;
      
      setReactions(prev => ({
        ...prev,
        [postId]: newReaction
      }));

      const actualReaction = await setUserReaction(postId, 'post', type);
      setReactions(prev => ({
        ...prev,
        [postId]: actualReaction
      }));

      if (type === 'like') {
        await likePost(postId);
      } else if (type === 'dislike') {
        await dislikePost(postId);
      }

      await loadCommunityPosts();
    } catch (error) {
      console.error('Error updating reaction:', error);
      setReactions(prev => ({
        ...prev,
        [postId]: reactions[postId]
      }));
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive"
      });
    }
  }, [reactions, toast]);

  const handleBookmark = useCallback(async (postId) => {
    try {
      if (!auth.currentUser) {
        toast({
          title: "Sign in required",
          description: "You need to sign in to save posts.",
          variant: "warning"
        });
        return;
      }

      const currentlyBookmarked = bookmarks.has(postId);
      
      setBookmarks(prev => {
        const newBookmarks = new Set(prev);
        if (currentlyBookmarked) {
          newBookmarks.delete(postId);
        } else {
          newBookmarks.add(postId);
        }
        return newBookmarks;
      });

      if (currentlyBookmarked) {
        await unsavePost(postId);
        toast({ title: "Bookmark removed", description: "Post removed from your bookmarks", variant: "default" });
      } else {
        await savePost(postId);
        toast({ title: "Bookmarked!", description: "Post saved to your bookmarks", variant: "success" });
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      setBookmarks(prev => {
        const newBookmarks = new Set(prev);
        if (bookmarks.has(postId)) {
          newBookmarks.add(postId);
        } else {
          newBookmarks.delete(postId);
        }
        return newBookmarks;
      });
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive"
      });
    }
  }, [bookmarks, toast]);

  const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0';
    const numValue = Number(num);
    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}k`;
    return numValue.toString();
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'unknown';

    let jsDate;
    try {
      if (date.toDate) {
        jsDate = date.toDate();
      } else if (date instanceof Date) {
        jsDate = date;
      } else {
        jsDate = new Date(date);
      }

      if (isNaN(jsDate.getTime())) {
        return 'unknown';
      }

      const now = new Date();
      const diffMs = now - jsDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return jsDate.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'unknown';
    }
  };

  if (loading) {
    return <OptimizedModernLoader />;
  }

  if (!community) {
    return (
      <S.ErrorContainer $isDarkMode={isDarkMode}>
        <h2>Community not found</h2>
        <p>The community you're looking for doesn't exist or has been removed.</p>
        <S.BackButton onClick={() => navigate('/communities')}>
          <ArrowLeft size={16} />
          Back to Communities
        </S.BackButton>
      </S.ErrorContainer>
    );
  }

  return (
    <S.CommunityContainer $isDarkMode={isDarkMode}>
      {/* Header */}
      <S.Header $isDarkMode={isDarkMode}>
        <S.BackButton onClick={() => navigate('/communities')}>
          <ArrowLeft size={20} />
        </S.BackButton>
        <S.HeaderInfo>
          <S.CommunityIcon $banner={community.banner}>
            {community.icon}
          </S.CommunityIcon>
          <S.CommunityDetails>
            <S.CommunityTitle $isDarkMode={isDarkMode}>
              {community.displayName}
              {community.isOfficial && <Crown size={16} />}
            </S.CommunityTitle>
            <S.CommunityName $isDarkMode={isDarkMode}>
              {community.name}
            </S.CommunityName>
          </S.CommunityDetails>
        </S.HeaderInfo>
        <S.HeaderActions>
          {canEdit && (
            <S.JoinButton onClick={() => setShowEditModal(true)}>
              <Settings size={16} />
              Edit Community
            </S.JoinButton>
          )}
          <S.JoinButton $joined={isJoined} onClick={handleJoinCommunity}>
            {isJoined ? (
              <>
                <Check size={16} />
                Joined
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Join
              </>
            )}
          </S.JoinButton>
        </S.HeaderActions>
      </S.Header>

      {/* Community Info */}
      <S.CommunityInfo $isDarkMode={isDarkMode}>
        <S.CommunityDescription $isDarkMode={isDarkMode}>
          {community.description}
        </S.CommunityDescription>
        
        <S.CommunityStats>
          <S.StatItem $isDarkMode={isDarkMode}>
            <Users size={16} />
            <span>{formatNumber(community.memberCount || community.members?.length || 0)} members</span>
          </S.StatItem>
          <S.StatItem $isDarkMode={isDarkMode}>
            <Activity size={16} />
            <span>{formatNumber(community.onlineMembers || 0)} online</span>
          </S.StatItem>
          <S.StatItem $isDarkMode={isDarkMode}>
            <Calendar size={16} />
            <span>Created {formatTimeAgo(community.createdAt)}</span>
          </S.StatItem>
        </S.CommunityStats>

        {community.rules && community.rules.length > 0 && (
          <S.CommunityRules $isDarkMode={isDarkMode}>
            <h4>Community Rules</h4>
            <ul>
              {community.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </S.CommunityRules>
        )}
      </S.CommunityInfo>

      {/* Sort Controls */}
      <S.SortControls $isDarkMode={isDarkMode}>
        <S.SortButton 
          $active={selectedSort === 'hot'} 
          onClick={() => handleSortChange('hot')}
        >
          🔥 Hot
        </S.SortButton>
        <S.SortButton 
          $active={selectedSort === 'new'} 
          onClick={() => handleSortChange('new')}
        >
          🆕 New
        </S.SortButton>
        <S.SortButton 
          $active={selectedSort === 'top'} 
          onClick={() => handleSortChange('top')}
        >
          ⭐ Top
        </S.SortButton>
        <S.SortButton 
          $active={selectedSort === 'controversial'} 
          onClick={() => handleSortChange('controversial')}
        >
          ⚡ Controversial
        </S.SortButton>
      </S.SortControls>

      {/* Posts */}
      <S.PostsContainer>
        {postsLoading ? (
          <S.LoadingMessage>Loading posts...</S.LoadingMessage>
        ) : posts.length === 0 ? (
          <S.EmptyState $isDarkMode={isDarkMode}>
            <MessageSquare size={64} />
            <h3>No posts yet</h3>
            <p>Be the first to start a conversation in {community.displayName}!</p>
          </S.EmptyState>
        ) : (
          <S.PostsList>
            {posts.map(post => (
              <S.PostCard
                key={post.id}
                $isDarkMode={isDarkMode}
                onClick={() => navigate(`/communities/post/${post.id}`)}
              >
                <S.PostHeader>
                  <S.AuthorInfo>
                    <Avatar
                      user={post.author}
                      size="md"
                      isDarkMode={isDarkMode}
                      clickable={false}
                    />
                    <S.AuthorName $isDarkMode={isDarkMode}>
                      {post.author.displayName}
                      {post.author.isVerified && <Check size={12} />}
                      {post.author.isModerator && <Shield size={12} />}
                    </S.AuthorName>
                    <S.PostTime $isDarkMode={isDarkMode}>
                      {formatTimeAgo(post.createdAt)}
                    </S.PostTime>
                  </S.AuthorInfo>
                </S.PostHeader>

                <S.PostContent>
                  <S.PostTitle $isDarkMode={isDarkMode}>
                    {post.type === 'poll' && <span>📊 </span>}
                    {post.type === 'image' && <span>🖼️ </span>}
                    {post.type === 'video' && <span>🎥 </span>}
                    {post.type === 'link' && <span>🔗 </span>}
                    {post.title}
                  </S.PostTitle>

                  {post.flair && (
                    <S.PostFlair $color={post.flair.color}>
                      {post.flair.text}
                    </S.PostFlair>
                  )}

                  <S.PostText $isDarkMode={isDarkMode} $expanded={expandedPosts.has(post.id)}>
                    {post.content}
                  </S.PostText>

                  {post.content.length > 300 && (
                    <S.ExpandButton
                      onClick={(e) => {
                        e.stopPropagation();
                        const newExpanded = new Set(expandedPosts);
                        if (newExpanded.has(post.id)) {
                          newExpanded.delete(post.id);
                        } else {
                          newExpanded.add(post.id);
                        }
                        setExpandedPosts(newExpanded);
                      }}
                    >
                      {expandedPosts.has(post.id) ? (
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
                    </S.ExpandButton>
                  )}
                </S.PostContent>

                <S.PostFooter $isDarkMode={isDarkMode}>
                  <S.PostStats>
                    <S.VoteButton
                      $active={reactions[post.id] === 'like'}
                      $type="like"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(post.id, 'like');
                      }}
                    >
                      <ThumbsUp size={16} />
                      {formatNumber(post.likes)}
                    </S.VoteButton>
                    <S.VoteButton
                      $active={reactions[post.id] === 'dislike'}
                      $type="dislike"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(post.id, 'dislike');
                      }}
                    >
                      <ThumbsDown size={16} />
                      {post.dislikes > 0 && formatNumber(post.dislikes)}
                    </S.VoteButton>

                    <S.ActionButton onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/communities/post/${post.id}`);
                    }}>
                      <MessageSquare size={16} />
                      {formatNumber(post.comments)}
                    </S.ActionButton>

                    <S.ActionButton onClick={(e) => {
                      e.stopPropagation();
                      handleBookmark(post.id);
                    }}>
                      <Bookmark
                        size={16}
                        fill={bookmarks.has(post.id) ? 'currentColor' : 'none'}
                      />
                      {bookmarks.has(post.id) ? 'Saved' : 'Save'}
                    </S.ActionButton>
                  </S.PostStats>

                  {post.awards?.length > 0 && (
                    <S.AwardsList>
                      {post.awards.map((award, index) => (
                        <S.AwardBadge key={index}>
                          <Award size={12} />
                          {award.count}
                        </S.AwardBadge>
                      ))}
                    </S.AwardsList>
                  )}
                </S.PostFooter>
              </S.PostCard>
            ))}
          </S.PostsList>
        )}
      </S.PostsContainer>

      {/* Edit Community Modal */}
      {showEditModal && (
        <EditModal>
          <EditModalOverlay onClick={() => setShowEditModal(false)} />
          <EditModalContent>
            <EditModalHeader>
              <h2>Edit Community</h2>
              <CloseButton onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </CloseButton>
            </EditModalHeader>

            <EditForm>
              <FormGroup>
                <FormLabel>Community Icon</FormLabel>
                <IconPicker>
                  {['🏘️', '💻', '🎨', '📚', '🎮', '🍕', '⚽', '🎵', '📷', '🌟'].map(emoji => (
                    <IconOption
                      key={emoji}
                      $selected={editForm.icon === emoji}
                      onClick={() => setEditForm(prev => ({ ...prev, icon: emoji }))}
                    >
                      {emoji}
                    </IconOption>
                  ))}
                </IconPicker>
              </FormGroup>

              <FormGroup>
                <FormLabel>Display Name</FormLabel>
                <FormInput
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Community display name"
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Description</FormLabel>
                <FormTextarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your community..."
                  rows={4}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Community Rules</FormLabel>
                {editForm.rules.map((rule, index) => (
                  <RuleInput key={index}>
                    <FormInput
                      value={rule}
                      onChange={(e) => {
                        const newRules = [...editForm.rules];
                        newRules[index] = e.target.value;
                        setEditForm(prev => ({ ...prev, rules: newRules }));
                      }}
                      placeholder={`Rule ${index + 1}`}
                    />
                    <RemoveRuleButton
                      onClick={() => {
                        const newRules = editForm.rules.filter((_, i) => i !== index);
                        setEditForm(prev => ({ ...prev, rules: newRules }));
                      }}
                    >
                      <X size={16} />
                    </RemoveRuleButton>
                  </RuleInput>
                ))}
                <AddRuleButton
                  onClick={() => setEditForm(prev => ({ ...prev, rules: [...prev.rules, ''] }))}
                >
                  <Plus size={16} />
                  Add Rule
                </AddRuleButton>
              </FormGroup>
            </EditForm>

            <EditModalActions>
              <CancelButton onClick={() => setShowEditModal(false)}>
                Cancel
              </CancelButton>
              <SaveButton onClick={handleUpdateCommunity}>
                <Save size={16} />
                Save Changes
              </SaveButton>
            </EditModalActions>
          </EditModalContent>
        </EditModal>
      )}
    </S.CommunityContainer>
  );
};

// Styled components for edit modal
const EditModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EditModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
`;

const EditModalContent = styled.div`
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)'
  };
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  z-index: 1001;
`;

const EditModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
    margin: 0;
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(148, 163, 184, 0.08)'
    };
    color: ${props => props.$isDarkMode ? 'hsl(210 40% 85%)' : 'hsl(222.2 84% 30%)'};
  }
`;

const EditForm = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
`;

const FormInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'};
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormTextarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'};
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const IconPicker = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  gap: 0.5rem;
`;

const IconOption = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid ${props => props.$selected ? '#3b82f6' : 'transparent'};
  background: ${props => props.$selected
    ? 'rgba(59, 130, 246, 0.1)'
    : props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(148, 163, 184, 0.05)'
  };
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
`;

const RuleInput = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const RemoveRuleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const AddRuleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px dashed ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.3)'
    : 'rgba(148, 163, 184, 0.4)'
  };
  border-radius: 8px;
  background: transparent;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }
`;

const EditModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.3)'
    : 'rgba(148, 163, 184, 0.4)'
  };
  border-radius: 8px;
  background: transparent;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(148, 163, 184, 0.08)'
    };
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    transform: translateY(-1px);
  }
`;

export default CommunityDetailPage;
