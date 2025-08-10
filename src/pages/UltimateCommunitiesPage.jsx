import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Flame,
  Clock,
  Search,
  Filter,
  Settings,
  Pin,
  MoreHorizontal,
  Eye,
  Heart,
  Star,
  Bookmark,
  Award,
  Flag,
  Shield,
  Crown,
  Zap,
  Globe,
  Lock,
  Unlock,
  Hash,
  AtSign,
  Calendar,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
  Link,
  X,
  Check,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Reply,
  Edit3,
  Trash2,
  Send,
  Smile,
  Paperclip,
  Bold,
  Italic,
  List,
  Quote,
  Code,
  Camera,
  Gift,
  Target,
  Layers,
  Activity,
  BarChart3
} from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { useTheme } from '../context/ThemeContext';
import ModernLoader from '../components/ModernLoader';
import UserContextMenu from '../components/UserContextMenu';
import * as S from './UltimateCommunitiesPageStyles';
import {
  getCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityPostsReal,
  createCommunityPost,
  likePost,
  dislikePost,
  getTrendingPosts,
  createConversation,
  getUserProfile,
  sendFriendRequest
} from '../lib/firestoreService';

const UltimateCommunitiesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode } = useTheme();

  // Main state
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState('all');
  const [selectedSort, setSelectedSort] = useState('hot');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // User interactions
  const [reactions, setReactions] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  const [following, setFollowing] = useState(new Set());
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [selectedPost, setSelectedPost] = useState(null);
  
  // UI state
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // card, compact, detailed

  // User context menu state
  const [userContextMenu, setUserContextMenu] = useState(null); // { user, position }
  
  // Create post state
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    community: '',
    type: 'text', // text, image, video, link, poll
    tags: [],
    flair: '',
    allowComments: true,
    pollOptions: ['', ''],
    linkUrl: '',
    mediaFiles: []
  });
  
  // Create community state
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    rules: [''],
    category: 'study',
    privacy: 'public', // public, restricted, private
    allowImages: true,
    allowVideos: true,
    allowPolls: true,
    moderators: [],
    tags: []
  });

  // Firebase data will be loaded in useEffect

  const initializeData = useCallback(async () => {
    try {
      setLoading(true);

      // Load communities and posts from Firebase
      const [communitiesData, postsData] = await Promise.all([
        getCommunities(),
        getCommunityPostsReal()
      ]);

      setCommunities(communitiesData);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Delay toast to avoid setState during render
      setTimeout(() => {
        toast({
          title: "🚫 Connection Error",
          description: "Unable to load communities. Check your connection and try again.",
          variant: "destructive"
        });
      }, 0);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleUserClick = useCallback((author, event) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.target.getBoundingClientRect();
    const position = {
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 220), // Ensure menu doesn't go off-screen
      y: rect.bottom + 10
    };

    setUserContextMenu({ user: author, position });
  }, []);

  const handleMessage = useCallback(async (user) => {
    try {
      // Trigger the messaging modal
      window.dispatchEvent(new CustomEvent('openMessages'));

      toast({
        title: "💬 Messages Opened",
        description: `Start chatting with ${user.displayName}`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error opening messages:', error);
      toast({
        title: "❌ Error",
        description: "Failed to open messages. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleFriendRequest = useCallback(async (user) => {
    try {
      // Here you would normally use the user's actual ID
      // For now, we'll show a success message
      toast({
        title: "👋 Friend Request Sent!",
        description: `Friend request sent to ${user.displayName}`,
        variant: "success"
      });

      // In a real implementation:
      // await sendFriendRequest(user.uid);
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "❌ Request Failed",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const closeUserContextMenu = useCallback(() => {
    setUserContextMenu(null);
  }, []);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Filtering and sorting
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Filter by community
    if (selectedCommunity !== 'all') {
      const community = communities.find(c => c.id === selectedCommunity);
      if (community) {
        filtered = filtered.filter(post =>
          post.communityId === community.id ||
          post.community === community.name ||
          post.community === community.displayName
        );
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(post => post.type === selectedFilter);
    }

    // Sort posts
    filtered.sort((a, b) => {
      switch (selectedSort) {
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

    return filtered;
  }, [posts, selectedCommunity, selectedSort, selectedFilter, searchQuery, communities]);

  // Event handlers
  const handleReaction = useCallback(async (postId, type) => {
    try {
      const currentReaction = reactions[postId];

      // Update UI optimistically
      setReactions(prev => ({
        ...prev,
        [postId]: prev[postId] === type ? null : type
      }));

      // Update Firebase
      if (type === 'like') {
        await likePost(postId);
      } else if (type === 'dislike') {
        await dislikePost(postId);
      }

      // Reload posts to get updated counts
      const updatedPosts = await getCommunityPostsReal();
      setPosts(updatedPosts);

    } catch (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: "❌ Reaction Failed",
        description: "Couldn't update your reaction. Please try again.",
        variant: "destructive"
      });

      // Revert optimistic update on error
      setReactions(prev => ({
        ...prev,
        [postId]: reactions[postId]
      }));
    }
  }, [reactions, toast]);

  const handleBookmark = useCallback((postId) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(postId)) {
        newBookmarks.delete(postId);
        toast({ title: "🔖 Bookmark Removed", description: "Post removed from your bookmarks", variant: "default" });
      } else {
        newBookmarks.add(postId);
        toast({ title: "⭐ Bookmarked!", description: "Post saved to your bookmarks", variant: "success" });
      }
      return newBookmarks;
    });
  }, [toast]);

  const handleFollow = useCallback(async (communityId) => {
    try {
      const community = communities.find(c => c.id === communityId);
      const isCurrentlyJoined = community?.isJoined;

      if (isCurrentlyJoined) {
        await leaveCommunity(communityId);
        toast({ title: "👋 Left Community", description: "You've successfully left the community", variant: "default" });
      } else {
        await joinCommunity(communityId);
        toast({ title: "🎉 Welcome!", description: "You've joined the community successfully", variant: "success" });
      }

      // Reload communities to get updated status
      const updatedCommunities = await getCommunities();
      setCommunities(updatedCommunities);

    } catch (error) {
      console.error('Error updating community membership:', error);
      toast({
        title: "❌ Membership Error",
        description: "Couldn't update your community membership. Please try again.",
        variant: "destructive"
      });
    }
  }, [communities, toast]);

  const handleCreatePost = useCallback(async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: "⚠️ Missing Content",
        description: "Please add both a title and content for your post",
        variant: "warning"
      });
      return;
    }

    try {
      const community = communities.find(c => c.id === newPost.community) || communities[0];
      if (!community) {
        toast({
          title: "📍 Select Community",
          description: "Please choose a community to share your post",
          variant: "warning"
        });
        return;
      }

      const postData = {
        title: newPost.title,
        content: newPost.content,
        communityId: community.id,
        community: community.name || community.displayName,
        type: newPost.type,
        flair: newPost.flair ? { text: newPost.flair, color: '#6b7280' } : null,
        tags: newPost.tags,
        mediaAttachments: newPost.mediaFiles,
        allowComments: newPost.allowComments,
        poll: newPost.type === 'poll' ? {
          question: newPost.title,
          options: newPost.pollOptions.filter(opt => opt.trim()).map((text, index) => ({
            id: index + 1,
            text,
            votes: 0
          })),
          totalVotes: 0,
          hasVoted: false
        } : null
      };

      // Save to Firebase
      await createCommunityPost(postData);

      // Reload data from Firebase to get the updated list
      await initializeData();

      setShowCreatePost(false);
      setNewPost({
        title: '',
        content: '',
        community: '',
        type: 'text',
        tags: [],
        flair: '',
        allowComments: true,
        pollOptions: ['', ''],
        linkUrl: '',
        mediaFiles: []
      });

      toast({
        title: "🚀 Post Published!",
        description: "Your post is now live and visible to the community",
        variant: "success"
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "❌ Post Failed",
        description: "Couldn't publish your post. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  }, [newPost, communities, toast]);

  const handleCreateCommunity = useCallback(async () => {
    if (!newCommunity.name.trim() || !newCommunity.description.trim()) {
      toast({
        title: "⚠️ Complete Details",
        description: "Please provide both community name and description",
        variant: "warning"
      });
      return;
    }

    try {
      const communityData = {
        name: `c/${newCommunity.name}`,
        displayName: newCommunity.name,
        description: newCommunity.description,
        category: newCommunity.category,
        privacy: newCommunity.privacy,
        icon: '🆕',
        banner: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        isOfficial: false,
        rules: newCommunity.rules.filter(rule => rule.trim()),
        allowImages: true,
        allowVideos: true,
        allowPolls: true
      };

      // Save to Firebase
      await createCommunity(communityData);

      // Reload data from Firebase to get the updated list
      await initializeData();

      setShowCreateCommunity(false);
      setNewCommunity({
        name: '',
        description: '',
        rules: [''],
        category: 'study',
        privacy: 'public',
        allowImages: true,
        allowVideos: true,
        allowPolls: true,
        moderators: [],
        tags: []
      });

      toast({
        title: "🎊 Community Born!",
        description: `Welcome to c/${newCommunity.name}! Start building your community.`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error creating community:', error);
      toast({
        title: "❌ Creation Failed",
        description: "Couldn't create your community. Please try again.",
        variant: "destructive"
      });
    }
  }, [newCommunity, toast]);

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
      // Handle Firebase Timestamp objects
      if (date.toDate) {
        jsDate = date.toDate();
      } else if (date instanceof Date) {
        jsDate = date;
      } else {
        jsDate = new Date(date);
      }

      // Check if date is valid
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
    return <ModernLoader />;
  }

  return (
    <S.PageContainer $isDarkMode={isDarkMode}>
      {/* Header */}
      <S.Header $isDarkMode={isDarkMode}>
        <S.HeaderLeft>
          <S.BackButton $isDarkMode={isDarkMode} onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </S.BackButton>
          <S.HeaderInfo>
            <S.PageTitle $isDarkMode={isDarkMode}>Communities</S.PageTitle>
            <S.PageSubtitle $isDarkMode={isDarkMode}>Connect • Share • Learn • Grow</S.PageSubtitle>
          </S.HeaderInfo>
        </S.HeaderLeft>

        <S.HeaderActions>
          <S.SearchContainer $isDarkMode={isDarkMode}>
            <Search size={16} />
            <S.SearchInput
              $isDarkMode={isDarkMode}
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </S.SearchContainer>

          <S.IconButton
            $isDarkMode={isDarkMode}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="Filters"
          >
            <Filter size={16} />
          </S.IconButton>

          <S.CreateButton $isDarkMode={isDarkMode} onClick={() => setShowCreatePost(true)}>
            <Plus size={16} />
            Post
          </S.CreateButton>
        </S.HeaderActions>
      </S.Header>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <S.FiltersBar $isDarkMode={isDarkMode}>
          <S.FilterGroup>
            <S.FilterLabel $isDarkMode={isDarkMode}>Sort by:</S.FilterLabel>
            <S.FilterSelect $isDarkMode={isDarkMode} value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
              <option value="hot">🔥 Hot</option>
              <option value="new">🆕 New</option>
              <option value="top">⭐ Top</option>
              <option value="controversial">⚡ Controversial</option>
            </S.FilterSelect>
          </S.FilterGroup>

          <S.FilterGroup>
            <S.FilterLabel $isDarkMode={isDarkMode}>Type:</S.FilterLabel>
            <S.FilterSelect $isDarkMode={isDarkMode} value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="text">📝 Text</option>
              <option value="image">🖼️ Images</option>
              <option value="video">🎥 Videos</option>
              <option value="poll">📊 Polls</option>
              <option value="link">🔗 Links</option>
            </S.FilterSelect>
          </S.FilterGroup>
        </S.FiltersBar>
      )}

      <S.MainContent>
        {/* Communities Sidebar */}
        <S.CommunitiesSidebar $collapsed={sidebarCollapsed} $isDarkMode={isDarkMode}>
          <S.SidebarHeader $isDarkMode={isDarkMode}>
            <S.SidebarTitle $isDarkMode={isDarkMode}>Communities</S.SidebarTitle>
            <S.SidebarActions>
              <S.IconButton
                $isDarkMode={isDarkMode}
                size="small"
                onClick={() => setShowCreateCommunity(true)}
                title="Create Community"
              >
                <Plus size={14} />
              </S.IconButton>
              <S.IconButton
                $isDarkMode={isDarkMode}
                size="small"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand" : "Collapse"}
              >
                {sidebarCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </S.IconButton>
            </S.SidebarActions>
          </S.SidebarHeader>
          
          {!sidebarCollapsed && (
            <S.CommunitiesList>
              {communities.length === 0 ? (
                <div style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: 'hsl(215 20.2% 65.1%)',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏗️</div>
                  <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>No communities yet</div>
                  <div style={{ marginBottom: '1rem', lineHeight: '1.4' }}>
                    Be the first to create a community and bring people together!
                  </div>
                  <S.CreateButton
                    onClick={() => setShowCreateCommunity(true)}
                    style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                  >
                    <Plus size={12} />
                    Create Community
                  </S.CreateButton>
                </div>
              ) : (
                communities.map(community => (
                  <S.CommunityCard
                    key={community.id}
                    $active={selectedCommunity === community.id}
                    $banner={community.banner}
                    onClick={() => setSelectedCommunity(community.id)}
                  >
                    <S.CommunityIcon>{community.icon}</S.CommunityIcon>
                    <S.CommunityInfo>
                      <S.CommunityName $isDarkMode={isDarkMode}>
                        {community.displayName}
                        {community.isOfficial && <Crown size={12} />}
                      </S.CommunityName>
                      <S.CommunityStats>
                        <S.StatItem $isDarkMode={isDarkMode}>
                          <Users size={10} />
                          {formatNumber(community.members)}
                        </S.StatItem>
                        <S.StatItem $isDarkMode={isDarkMode} $online>
                          <Activity size={10} />
                          {formatNumber(community.onlineMembers)}
                        </S.StatItem>
                      </S.CommunityStats>
                    </S.CommunityInfo>
                    {community.id !== 'all' && (
                      <S.CommunityActions>
                        <S.JoinButton
                          $joined={community.isJoined}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollow(community.id);
                          }}
                        >
                          {community.isJoined ? <Check size={12} /> : <Plus size={12} />}
                        </S.JoinButton>
                      </S.CommunityActions>
                    )}
                  </S.CommunityCard>
                ))
              )}
            </S.CommunitiesList>
          )}
        </S.CommunitiesSidebar>

        {/* Posts Feed */}
        <S.PostsFeed>
          {filteredAndSortedPosts.length === 0 ? (
            <S.EmptyState>
              <S.EmptyStateIcon>
                <Users size={64} />
              </S.EmptyStateIcon>
              <S.EmptyStateTitle>
                {communities.length === 0 ? "Welcome to Communities!" : "No posts yet"}
              </S.EmptyStateTitle>
              <S.EmptyStateDescription>
                {searchQuery
                  ? `No posts match "${searchQuery}"`
                  : communities.length === 0
                    ? "Create your first community and start building an amazing learning environment together!"
                    : "Be the first to start a conversation in this community!"
                }
              </S.EmptyStateDescription>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {communities.length === 0 && (
                  <S.CreateButton onClick={() => setShowCreateCommunity(true)}>
                    <Plus size={16} />
                    Create First Community
                  </S.CreateButton>
                )}
                <S.CreateButton onClick={() => setShowCreatePost(true)}>
                  <Plus size={16} />
                  Create Post
                </S.CreateButton>
              </div>
            </S.EmptyState>
          ) : (
            <S.PostsList>
              {filteredAndSortedPosts.map(post => (
                <S.PostCard
                  key={post.id}
                  $viewMode={viewMode}
                  $isDarkMode={isDarkMode}
                >

                  <S.PostHeader>
                    <S.CommunityBadge $isDarkMode={isDarkMode}>
                      <Hash size={12} />
                      {post.community}
                    </S.CommunityBadge>
                    <S.PostMeta>
                      <S.AuthorInfo>
                        <S.AuthorAvatar>{post.author.avatar}</S.AuthorAvatar>
                        <S.AuthorName
                          $isDarkMode={isDarkMode}
                          $clickable={true}
                          onClick={(e) => handleUserClick(post.author, e)}
                          title={`Message ${post.author.displayName}`}
                          data-author-name={post.author.displayName}
                        >
                          {post.author.displayName}
                          {post.author.isVerified && <Check size={12} />}
                          {post.author.isModerator && <Shield size={12} />}
                        </S.AuthorName>
                        <S.AuthorReputation $isDarkMode={isDarkMode}>{formatNumber(post.author.reputation)}</S.AuthorReputation>
                      </S.AuthorInfo>
                      <S.PostTime $isDarkMode={isDarkMode}>{formatTimeAgo(post.createdAt)}</S.PostTime>
                      {post.editedAt && <S.EditedBadge $isDarkMode={isDarkMode}>edited</S.EditedBadge>}
                    </S.PostMeta>
                    <S.PostActions>
                      <S.IconButton size="small">
                        <MoreHorizontal size={14} />
                      </S.IconButton>
                    </S.PostActions>
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
                        onClick={() => {
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

                    {/* Media Attachments */}
                    {post.mediaAttachments?.length > 0 && (
                      <S.MediaContainer>
                        {post.mediaAttachments.map((media, index) => (
                          <S.MediaItem key={index}>
                            {media.type === 'image' && (
                              <img src={media.url} alt={media.caption} />
                            )}
                          </S.MediaItem>
                        ))}
                      </S.MediaContainer>
                    )}

                    {/* Poll */}
                    {post.poll && (
                      <S.PollContainer>
                        <S.PollQuestion>{post.poll.question}</S.PollQuestion>
                        <S.PollOptions>
                          {post.poll.options.map(option => {
                            const percentage = post.poll.totalVotes > 0 
                              ? (option.votes / post.poll.totalVotes) * 100 
                              : 0;
                            return (
                              <S.PollOption
                                key={option.id}
                                $percentage={percentage}
                                $voted={post.poll.hasVoted}
                              >
                                <S.PollOptionText>{option.text}</S.PollOptionText>
                                <S.PollOptionStats>
                                  <span>{percentage.toFixed(1)}%</span>
                                  <span>({option.votes} votes)</span>
                                </S.PollOptionStats>
                              </S.PollOption>
                            );
                          })}
                        </S.PollOptions>
                        <S.PollFooter>
                          <span>{formatNumber(post.poll.totalVotes)} total votes</span>
                          <span>Ends {formatTimeAgo(post.poll.endsAt)}</span>
                        </S.PollFooter>
                      </S.PollContainer>
                    )}

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <S.TagsContainer>
                        {post.tags.slice(0, 5).map(tag => (
                          <S.Tag key={tag}>{tag}</S.Tag>
                        ))}
                        {post.tags.length > 5 && (
                          <S.Tag>+{post.tags.length - 5} more</S.Tag>
                        )}
                      </S.TagsContainer>
                    )}

                    {/* Author Badges */}
                    {post.author.badges?.length > 0 && (
                      <S.AuthorBadges>
                        {post.author.badges.slice(0, 2).map((badge, index) => (
                          <S.Badge key={index}>{badge}</S.Badge>
                        ))}
                      </S.AuthorBadges>
                    )}
                  </S.PostContent>

                  <S.PostFooter $isDarkMode={isDarkMode}>
                    <S.PostStats>
                      <S.StatGroup>
                        <S.VoteButton
                          $active={reactions[post.id] === 'like'}
                          $type="like"
                          onClick={() => handleReaction(post.id, 'like')}
                        >
                          <ThumbsUp size={16} />
                          {formatNumber(post.likes)}
                        </S.VoteButton>
                        <S.VoteButton
                          $active={reactions[post.id] === 'dislike'}
                          $type="dislike"
                          onClick={() => handleReaction(post.id, 'dislike')}
                        >
                          <ThumbsDown size={16} />
                          {post.dislikes > 0 && formatNumber(post.dislikes)}
                        </S.VoteButton>
                      </S.StatGroup>

                      <S.ActionButton onClick={() => setSelectedPost(post)}>
                        <MessageSquare size={16} />
                        {formatNumber(post.comments)}
                      </S.ActionButton>

                      <S.ActionButton onClick={() => handleBookmark(post.id)}>
                        <Bookmark 
                          size={16} 
                          fill={bookmarks.has(post.id) ? 'currentColor' : 'none'} 
                        />
                      </S.ActionButton>

                      <S.ActionButton>
                        <Share2 size={16} />
                        {post.shares > 0 && formatNumber(post.shares)}
                      </S.ActionButton>

                      <S.StatItem>
                        <Eye size={14} />
                        {formatNumber(post.views)}
                      </S.StatItem>
                    </S.PostStats>

                    {/* Awards */}
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
        </S.PostsFeed>

        {/* Trending Sidebar */}
        <S.TrendingSidebar>
          <S.TrendingSection>
            <S.SectionTitle>
              <Flame size={16} />
              Trending Topics
            </S.SectionTitle>
            {posts.length === 0 ? (
              <div style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'hsl(215 20.2% 65.1%)',
                fontSize: '0.875rem'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                <div>No trending topics yet</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: '0.7' }}>
                  Create posts to see trending topics here
                </div>
              </div>
            ) : (
              <S.TrendingList>
                {/* Trending topics would be generated from actual posts */}
              </S.TrendingList>
            )}
          </S.TrendingSection>

        </S.TrendingSidebar>
      </S.MainContent>

      {/* Create Post Modal */}
      {showCreatePost && (
        <S.Modal>
          <S.ModalOverlay onClick={() => setShowCreatePost(false)} />
          <S.ModalContent $large>
            <S.ModalHeader>
              <S.ModalTitle>Create Amazing Post</S.ModalTitle>
              <S.CloseButton onClick={() => setShowCreatePost(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            
            <S.CreatePostForm>
              <S.FormSection>
                <S.FormGroup>
                  <S.FormLabel>Community</S.FormLabel>
                  <S.FormSelect
                    value={newPost.community}
                    onChange={(e) => setNewPost(prev => ({ ...prev, community: e.target.value }))}
                  >
                    <option value="">Choose a community</option>
                    {communities.filter(c => c.id !== 'all').map(community => (
                      <option key={community.id} value={community.id}>
                        {community.icon} {community.displayName}
                      </option>
                    ))}
                  </S.FormSelect>
                </S.FormGroup>

                <S.FormGroup>
                  <S.FormLabel>Post Type</S.FormLabel>
                  <S.PostTypeSelector>
                    {[
                      { type: 'text', icon: FileText, label: 'Text' },
                      { type: 'image', icon: ImageIcon, label: 'Image' },
                      { type: 'video', icon: Video, label: 'Video' },
                      { type: 'poll', icon: BarChart3, label: 'Poll' },
                      { type: 'link', icon: Link, label: 'Link' }
                    ].map(({ type, icon: Icon, label }) => (
                      <S.PostTypeButton
                        key={type}
                        $active={newPost.type === type}
                        onClick={() => setNewPost(prev => ({ ...prev, type }))}
                      >
                        <Icon size={16} />
                        {label}
                      </S.PostTypeButton>
                    ))}
                  </S.PostTypeSelector>
                </S.FormGroup>
              </S.FormSection>

              <S.FormGroup>
                <S.FormLabel>Title</S.FormLabel>
                <S.FormInput
                  placeholder="What's your post about?"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={300}
                />
                <S.CharCount>{newPost.title.length}/300</S.CharCount>
              </S.FormGroup>

              <S.FormGroup>
                <S.FormLabel>Content</S.FormLabel>
                <S.RichTextEditor
                  placeholder="Share your thoughts, experiences, or questions..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                />
              </S.FormGroup>

              {newPost.type === 'poll' && (
                <S.FormGroup>
                  <S.FormLabel>Poll Options</S.FormLabel>
                  {newPost.pollOptions.map((option, index) => (
                    <S.PollOptionInput key={index}>
                      <S.FormInput
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newPost.pollOptions];
                          newOptions[index] = e.target.value;
                          setNewPost(prev => ({ ...prev, pollOptions: newOptions }));
                        }}
                      />
                      {index > 1 && (
                        <S.RemoveButton
                          onClick={() => {
                            const newOptions = newPost.pollOptions.filter((_, i) => i !== index);
                            setNewPost(prev => ({ ...prev, pollOptions: newOptions }));
                          }}
                        >
                          <X size={14} />
                        </S.RemoveButton>
                      )}
                    </S.PollOptionInput>
                  ))}
                  {newPost.pollOptions.length < 6 && (
                    <S.AddOptionButton
                      onClick={() => setNewPost(prev => ({ 
                        ...prev, 
                        pollOptions: [...prev.pollOptions, ''] 
                      }))}
                    >
                      <Plus size={14} />
                      Add Option
                    </S.AddOptionButton>
                  )}
                </S.FormGroup>
              )}

              <S.FormSection>
                <S.FormGroup>
                  <S.FormLabel>Tags</S.FormLabel>
                  <S.TagInput>
                    <S.FormInput
                      placeholder="Add tags (separate with commas)"
                      value={newPost.tags.join(', ')}
                      onChange={(e) => setNewPost(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      }))}
                    />
                  </S.TagInput>
                  {newPost.tags.length > 0 && (
                    <S.TagPreview>
                      {newPost.tags.map(tag => (
                        <S.Tag key={tag}>{tag}</S.Tag>
                      ))}
                    </S.TagPreview>
                  )}
                </S.FormGroup>

                <S.FormGroup>
                  <S.FormLabel>Flair</S.FormLabel>
                  <S.FormSelect
                    value={newPost.flair}
                    onChange={(e) => setNewPost(prev => ({ ...prev, flair: e.target.value }))}
                  >
                    <option value="">No flair</option>
                    <option value="Question">❓ Question</option>
                    <option value="Discussion">💬 Discussion</option>
                    <option value="Guide">📚 Guide</option>
                    <option value="Resource">📎 Resource</option>
                    <option value="Success Story">🎉 Success Story</option>
                  </S.FormSelect>
                </S.FormGroup>
              </S.FormSection>

              <S.PostOptions>
                <S.OptionCheckbox>
                  <input
                    type="checkbox"
                    checked={newPost.allowComments}
                    onChange={(e) => setNewPost(prev => ({ 
                      ...prev, 
                      allowComments: e.target.checked 
                    }))}
                  />
                  <label>Allow comments</label>
                </S.OptionCheckbox>
              </S.PostOptions>
            </S.CreatePostForm>

            <S.ModalActions>
              <S.CancelButton onClick={() => setShowCreatePost(false)}>
                Cancel
              </S.CancelButton>
              <S.SubmitButton onClick={handleCreatePost}>
                <Send size={16} />
                Create Post
              </S.SubmitButton>
            </S.ModalActions>
          </S.ModalContent>
        </S.Modal>
      )}

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <S.Modal>
          <S.ModalOverlay onClick={() => setShowCreateCommunity(false)} />
          <S.ModalContent>
            <S.ModalHeader>
              <S.ModalTitle>Create New Community</S.ModalTitle>
              <S.CloseButton onClick={() => setShowCreateCommunity(false)}>
                <X size={20} />
              </S.CloseButton>
            </S.ModalHeader>
            
            <S.CreateCommunityForm>
              <S.FormGroup>
                <S.FormLabel>Community Name</S.FormLabel>
                <S.CommunityNameInput>
                  <span>c/</span>
                  <S.FormInput
                    placeholder="CommunityName"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity(prev => ({ 
                      ...prev, 
                      name: e.target.value.replace(/[^a-zA-Z0-9]/g, '') 
                    }))}
                    maxLength={21}
                  />
                </S.CommunityNameInput>
              </S.FormGroup>

              <S.FormGroup>
                <S.FormLabel>Description</S.FormLabel>
                <S.FormTextarea
                  placeholder="What is your community about?"
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  rows={3}
                />
              </S.FormGroup>

              <S.FormGroup>
                <S.FormLabel>Category</S.FormLabel>
                <S.FormSelect
                  value={newCommunity.category}
                  onChange={(e) => setNewCommunity(prev => ({ 
                    ...prev, 
                    category: e.target.value 
                  }))}
                >
                  <option value="study">📚 Study & Learning</option>
                  <option value="productivity">⚡ Productivity</option>
                  <option value="academic">🎓 Academic</option>
                  <option value="technology">💻 Technology</option>
                  <option value="general">💬 General Discussion</option>
                </S.FormSelect>
              </S.FormGroup>

              <S.FormGroup>
                <S.FormLabel>Privacy</S.FormLabel>
                <S.PrivacySelector>
                  {[
                    { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can view and join' },
                    { value: 'restricted', icon: Lock, label: 'Restricted', desc: 'Anyone can view, mods approve joins' },
                    { value: 'private', icon: Shield, label: 'Private', desc: 'Only approved members can view' }
                  ].map(({ value, icon: Icon, label, desc }) => (
                    <S.PrivacyOption key={value}>
                      <input
                        type="radio"
                        name="privacy"
                        value={value}
                        checked={newCommunity.privacy === value}
                        onChange={(e) => setNewCommunity(prev => ({ 
                          ...prev, 
                          privacy: e.target.value 
                        }))}
                      />
                      <S.PrivacyLabel>
                        <Icon size={16} />
                        <div>
                          <div>{label}</div>
                          <small>{desc}</small>
                        </div>
                      </S.PrivacyLabel>
                    </S.PrivacyOption>
                  ))}
                </S.PrivacySelector>
              </S.FormGroup>
            </S.CreateCommunityForm>

            <S.ModalActions>
              <S.CancelButton onClick={() => setShowCreateCommunity(false)}>
                Cancel
              </S.CancelButton>
              <S.SubmitButton onClick={handleCreateCommunity}>
                <Plus size={16} />
                Create Community
              </S.SubmitButton>
            </S.ModalActions>
          </S.ModalContent>
        </S.Modal>
      )}
    </S.PageContainer>
  );
};

export default UltimateCommunitiesPage;
