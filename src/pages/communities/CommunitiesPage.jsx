import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Plus,
  Users,
  Clock,
  Search,
  Filter,
  Settings,
  Pin,
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
  BarChart3,
  TrendingUp,
  Eye,
  Share2
} from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import { useTheme } from '../../context/ThemeContext';
import OptimizedModernLoader from '../../components/OptimizedModernLoader';
import UserContextMenu from '../../components/UserContextMenu';
import styled from 'styled-components';
import {
  getCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityPostsReal,
  createCommunityPost,
  likePost,
  dislikePost,
  createConversation,
  getUserProfile,
  sendFriendRequest,
  getUserPostReactions,
  setUserReaction,
  savePost,
  unsavePost,
  isPostSaved
} from '../../lib/firestoreService';
import { auth } from '../../lib/firebase';

const CommunitiesPage = () => {
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
  const [viewMode, setViewMode] = useState('card');
  const [activeTab, setActiveTab] = useState('all'); // all, joined, saved, trending
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // User context menu state
  const [userContextMenu, setUserContextMenu] = useState(null);
  
  // Create post state
  const [newPost, setNewPost] = useState({
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
  
  // Create community state
  const [newCommunity, setNewCommunity] = useState({
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

  // Mock trending topics
  const trendingTopics = [
    { name: 'TypeScript tips for API clients', posts: 45, category: 'Developers' },
    { name: 'Q3 growth experiments', posts: 32, category: 'Marketing' },
    { name: 'Redesign feedback thread', posts: 28, category: 'Design' }
  ];

  // Mock discover communities with colors
  const discoverCommunities = [
    { name: 'Design', color: '#EC4899', memberCount: '12.5k' },
    { name: 'Developers', color: '#3B82F6', memberCount: '8.2k' },
    { name: 'Marketing', color: '#10B981', memberCount: '6.1k' },
    { name: 'Data Science', color: '#8B5CF6', memberCount: '4.3k' },
    { name: 'Product', color: '#F59E0B', memberCount: '3.8k' },
    { name: 'AI & ML', color: '#6366F1', memberCount: '2.9k' },
    { name: 'Photography', color: '#EF4444', memberCount: '2.1k' },
    { name: 'Gaming', color: '#D946EF', memberCount: '1.8k' }
  ];

  const initializeData = useCallback(async () => {
    try {
      setLoading(true);

      // Load basic data with individual error handling
      let communitiesData = [];
      let postsData = [];

      try {
        communitiesData = await getCommunities();
        setIsOfflineMode(false);
      } catch (error) {
        console.error('Error loading communities:', error);
        setIsOfflineMode(true);
        // Provide fallback community data
        communitiesData = [
          {
            id: 'developers',
            name: 'Developers',
            displayName: 'Developers',
            description: 'A community for developers',
            icon: '💻',
            members: 1234,
            onlineMembers: 56,
            isJoined: false,
            isOfficial: true
          }
        ];
      }

      try {
        postsData = await getCommunityPostsReal();
        if (!isOfflineMode) setIsOfflineMode(false);
      } catch (error) {
        console.error('Error loading posts:', error);
        setIsOfflineMode(true);
        // Provide fallback post data
        postsData = [
          {
            id: 'welcome-post',
            title: 'Welcome to Communities!',
            content: 'This is a demo post. Please check your internet connection to load real content.',
            community: 'Developers',
            communityId: 'developers',
            author: {
              uid: 'demo',
              displayName: 'Community Bot',
              avatar: '🤖'
            },
            createdAt: new Date(),
            likes: 0,
            dislikes: 0,
            comments: 0,
            tags: ['welcome'],
            type: 'text'
          }
        ];
      }

      setCommunities(communitiesData);
      setPosts(postsData);

      // Load user-specific data if authenticated
      if (auth.currentUser && postsData.length > 0) {
        try {
          const postIds = postsData.map(post => post.id);
          const userReactions = await getUserPostReactions(postIds);
          setReactions(userReactions);
        } catch (error) {
          console.warn('Error loading user reactions:', error);
          // Continue without reactions
        }

        try {
          const postIds = postsData.map(post => post.id);
          const bookmarkChecks = await Promise.all(
            postIds.slice(0, 10).map(async (postId) => {
              try {
                const isSaved = await isPostSaved(postId);
                return { postId, isSaved };
              } catch (error) {
                console.warn('Error checking bookmark status for post:', postId, error);
                return { postId, isSaved: false };
              }
            })
          );

          const bookmarkedPosts = new Set(
            bookmarkChecks.filter(check => check.isSaved).map(check => check.postId)
          );
          setBookmarks(bookmarkedPosts);
        } catch (error) {
          console.warn('Error loading bookmarks:', error);
          // Continue without bookmarks
        }
      }
    } catch (error) {
      console.error('Critical error in initializeData:', error);
      setTimeout(() => {
        toast({
          title: "🚫 Network Error",
          description: "Unable to load community data. Please check your internet connection and try refreshing the page.",
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
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 220),
      y: rect.bottom + 10
    };

    setUserContextMenu({ user: author, position });
  }, []);

  const handleFriendRequest = useCallback(async (user) => {
    try {
      await sendFriendRequest(user.uid || user.authorId);

      toast({
        title: "👋 Friend Request Sent!",
        description: `Friend request sent to ${user.displayName}`,
        variant: "success"
      });
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
    // Check if we're online before attempting to load data
    if (!navigator.onLine) {
      toast({
        title: "🔌 Offline",
        description: "You're currently offline. Please check your internet connection.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    initializeData();
  }, [initializeData, toast]);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Back online - reloading data');
      initializeData();
    };

    const handleOffline = () => {
      console.log('🔴 Gone offline');
      toast({
        title: "🔌 Connection Lost",
        description: "You've gone offline. Some features may not work properly.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initializeData, toast]);

  // Filtering and sorting
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Filter by tab
    if (activeTab === 'joined') {
      filtered = filtered.filter(post => 
        communities.some(c => c.id === post.communityId && c.isJoined)
      );
    } else if (activeTab === 'saved') {
      filtered = filtered.filter(post => bookmarks.has(post.id));
    } else if (activeTab === 'trending') {
      filtered = filtered.filter(post => post.likes > 10);
    }

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
  }, [posts, selectedCommunity, selectedSort, selectedFilter, searchQuery, communities, activeTab, bookmarks]);

  // Event handlers
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

      const updatedPosts = await getCommunityPostsReal();
      setPosts(updatedPosts);

    } catch (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: "❌ Reaction Failed",
        description: "Couldn't update your reaction. Please try again.",
        variant: "destructive"
      });

      setReactions(prev => ({
        ...prev,
        [postId]: reactions[postId]
      }));
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
        toast({ title: "🔖 Bookmark Removed", description: "Post removed from your bookmarks", variant: "default" });
      } else {
        await savePost(postId);
        toast({ title: "⭐ Bookmarked!", description: "Post saved to your bookmarks", variant: "success" });
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
        title: "❌ Bookmark Failed",
        description: "Couldn't update your bookmark. Please try again.",
        variant: "destructive"
      });
    }
  }, [bookmarks, toast]);

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

      await createCommunityPost(postData);
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
  }, [newPost, communities, toast, initializeData]);

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

  return (
    <PageContainer $isDarkMode={isDarkMode}>
      {/* Modern Header */}
      <Header $isDarkMode={isDarkMode}>
        <HeaderLeft>
          <BackButton $isDarkMode={isDarkMode} onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
            Back
          </BackButton>
          <HeaderTitle $isDarkMode={isDarkMode}>Community Feed</HeaderTitle>
        </HeaderLeft>

        <HeaderCenter>
          <SearchContainer $isDarkMode={isDarkMode}>
            <Search size={16} />
            <SearchInput
              $isDarkMode={isDarkMode}
              placeholder="Search the community feed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>
        </HeaderCenter>

        <HeaderRight>
          {isOfflineMode && (
            <OfflineBanner $isDarkMode={isDarkMode}>
              🔌 Offline Mode
            </OfflineBanner>
          )}

          <TabsContainer>
            {['All', 'Trending'].map((tab) => (
              <Tab
                key={tab}
                $active={activeTab === tab.toLowerCase()}
                $isDarkMode={isDarkMode}
                onClick={() => setActiveTab(tab.toLowerCase())}
              >
                {tab}
              </Tab>
            ))}
          </TabsContainer>

          <CreatePostButton $isDarkMode={isDarkMode} onClick={() => setShowCreatePost(true)}>
            <Plus size={16} />
            Create post
          </CreatePostButton>
        </HeaderRight>
      </Header>

      <MainContainer>
        {/* Main Content */}
        <ContentArea>
          {filteredAndSortedPosts.length === 0 ? (
            <EmptyState $isDarkMode={isDarkMode}>
              <Users size={64} />
              <h3>No posts yet</h3>
              <p>Be the first to start a conversation in this community!</p>
              <CreatePostButton onClick={() => setShowCreatePost(true)}>
                <Plus size={16} />
                Create Post
              </CreatePostButton>
            </EmptyState>
          ) : (
            <PostsList>
              {filteredAndSortedPosts.map(post => (
                <PostCard
                  key={post.id}
                  $isDarkMode={isDarkMode}
                  onClick={() => navigate(`/communities/post/${post.id}`)}
                >
                  <PostHeader>
                    <CommunityInfo>
                      <CommunityDot 
                        $color={discoverCommunities.find(c => 
                          c.name.toLowerCase().includes(post.community?.toLowerCase() || '')
                        )?.color || '#6366F1'}
                      />
                      <CommunityName $isDarkMode={isDarkMode}>
                        {post.community}
                      </CommunityName>
                      <CategoryTag $isDarkMode={isDarkMode}>
                        {post.flair?.text || 'Discussion'}
                      </CategoryTag>
                      <PostTime $isDarkMode={isDarkMode}>
                        • {formatTimeAgo(post.createdAt)}
                      </PostTime>
                    </CommunityInfo>
                    <PostActions>
                      <SubscribeButton 
                        $subscribed={communities.find(c => c.id === post.communityId)?.isJoined}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(post.communityId);
                        }}
                      >
                        {communities.find(c => c.id === post.communityId)?.isJoined ? 'Unsubscribe' : 'Subscribe'}
                      </SubscribeButton>
                    </PostActions>
                  </PostHeader>

                  <PostContent>
                    <PostTitle $isDarkMode={isDarkMode}>
                      {post.title}
                    </PostTitle>
                    <PostText $isDarkMode={isDarkMode}>
                      {post.content}
                    </PostText>
                    
                    <AuthorInfo>
                      by{' '}
                      <AuthorName
                        $isDarkMode={isDarkMode}
                        onClick={(e) => handleUserClick(post.author, e)}
                      >
                        @{post.author.displayName}
                      </AuthorName>
                    </AuthorInfo>
                  </PostContent>

                  <PostFooter>
                    <PostStats>
                      <StatButton
                        $active={reactions[post.id] === 'like'}
                        $type="like"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(post.id, 'like');
                        }}
                      >
                        <ThumbsUp size={16} />
                        {formatNumber(post.likes)}
                      </StatButton>

                      <StatButton
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/communities/post/${post.id}`);
                        }}
                      >
                        <MessageSquare size={16} />
                        {formatNumber(post.comments)}
                      </StatButton>

                      <StatButton
                        $active={bookmarks.has(post.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmark(post.id);
                        }}
                      >
                        <Bookmark
                          size={16}
                          fill={bookmarks.has(post.id) ? 'currentColor' : 'none'}
                        />
                        Save
                      </StatButton>
                    </PostStats>

                    <PostDropdown>
                      <DropdownButton $isDarkMode={isDarkMode}>
                        <ChevronDown size={16} />
                      </DropdownButton>
                    </PostDropdown>
                  </PostFooter>
                </PostCard>
              ))}
            </PostsList>
          )}
        </ContentArea>

        {/* Right Sidebar */}
        <Sidebar $isDarkMode={isDarkMode}>
          {/* Trending Section */}
          <SidebarSection>
            <SidebarTitle $isDarkMode={isDarkMode}>
              <TrendingUp size={16} />
              Trending
              <TopPostsLabel>Top posts</TopPostsLabel>
            </SidebarTitle>
            <TrendingList>
              {trendingTopics.map((topic, index) => (
                <TrendingItem key={index} $isDarkMode={isDarkMode}>
                  <TrendingDot />
                  <TrendingContent>
                    <TrendingName $isDarkMode={isDarkMode}>{topic.name}</TrendingName>
                    <TrendingMeta $isDarkMode={isDarkMode}>
                      {topic.category} • {topic.posts} posts
                    </TrendingMeta>
                  </TrendingContent>
                </TrendingItem>
              ))}
            </TrendingList>
          </SidebarSection>

          {/* Discover Communities */}
          <SidebarSection>
            <SidebarTitle $isDarkMode={isDarkMode}>
              Discover communities
              <TapToJoinLabel>Tap to join</TapToJoinLabel>
            </SidebarTitle>
            <CommunitiesGrid>
              {discoverCommunities.map((community, index) => (
                <CommunityCircle
                  key={index}
                  $color={community.color}
                  onClick={() => handleFollow(community.id)}
                  title={`${community.name} - ${community.memberCount} members`}
                >
                  {community.name.charAt(0)}
                </CommunityCircle>
              ))}
            </CommunitiesGrid>
          </SidebarSection>

          {/* Joined Communities */}
          <SidebarSection>
            <SidebarTitle $isDarkMode={isDarkMode}>
              Joined communities
              <JoinedCountLabel>1 joined</JoinedCountLabel>
            </SidebarTitle>
            <JoinedList>
              <JoinedItem $isDarkMode={isDarkMode}>
                <CommunityCircle $color="#3B82F6">D</CommunityCircle>
                <JoinedName $isDarkMode={isDarkMode}>Developers</JoinedName>
                <LeaveButton $isDarkMode={isDarkMode}>Leave</LeaveButton>
              </JoinedItem>
            </JoinedList>
          </SidebarSection>

          {/* My Space */}
          <SidebarSection>
            <SidebarTitle $isDarkMode={isDarkMode}>
              My space
              <YoursLabel>Yours</YoursLabel>
            </SidebarTitle>
            <MySpaceList>
              <MySpaceItem $isDarkMode={isDarkMode}>
                <FileText size={16} />
                My Posts
              </MySpaceItem>
              <MySpaceItem $isDarkMode={isDarkMode}>
                <Users size={16} />
                My Communities
              </MySpaceItem>
              <MySpaceItem $isDarkMode={isDarkMode}>
                <Plus size={16} />
                Create Community
              </MySpaceItem>
            </MySpaceList>
          </SidebarSection>
        </Sidebar>
      </MainContainer>

      {/* Create Post Modal */}
      {showCreatePost && (
        <Modal>
          <ModalOverlay onClick={() => setShowCreatePost(false)} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Create Post</ModalTitle>
              <CloseButton onClick={() => setShowCreatePost(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            
            <CreatePostForm>
              <FormGroup>
                <FormLabel>Community</FormLabel>
                <FormSelect
                  value={newPost.community}
                  onChange={(e) => setNewPost(prev => ({ ...prev, community: e.target.value }))}
                >
                  <option value="">Choose a community</option>
                  {communities.filter(c => c.id !== 'all').map(community => (
                    <option key={community.id} value={community.id}>
                      {community.icon} {community.displayName}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel>Title</FormLabel>
                <FormInput
                  placeholder="What's your post about?"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={300}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Content</FormLabel>
                <FormTextarea
                  placeholder="Share your thoughts, experiences, or questions..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              </FormGroup>
            </CreatePostForm>

            <ModalActions>
              <CancelButton onClick={() => setShowCreatePost(false)}>
                Cancel
              </CancelButton>
              <SubmitButton onClick={handleCreatePost}>
                <Send size={16} />
                Post
              </SubmitButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* User Context Menu */}
      {userContextMenu && (
        <UserContextMenu
          user={userContextMenu.user}
          position={userContextMenu.position}
          onClose={closeUserContextMenu}
          onFriendRequest={handleFriendRequest}
          isDarkMode={isDarkMode}
        />
      )}
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode 
    ? 'linear-gradient(to bottom, #0f172a, #1e293b)'
    : 'linear-gradient(to bottom, #f8fafc, #f1f5f9)'
  };
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.95)'
    : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 200px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin: 0;
`;

const HeaderCenter = styled.div`
  flex: 1;
  max-width: 500px;
  margin: 0 2rem;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };
  border-radius: 12px;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 25%)'
  };
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.875rem;
  
  &::placeholder {
    color: ${props => props.$isDarkMode 
      ? 'hsl(215 20.2% 65.1%)'
      : 'hsl(222.2 84% 35%)'
    };
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const OfflineBanner = styled.div`
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const TabsContainer = styled.div`
  display: flex;
  align-items: center;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  border-radius: 8px;
  padding: 0.25rem;
`;

const Tab = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  background: ${props => props.$active 
    ? (props.$isDarkMode ? '#3b82f6' : '#3b82f6')
    : 'transparent'
  };
  color: ${props => props.$active 
    ? 'white'
    : (props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(215 20.2% 50%)')
  };

  &:hover {
    background: ${props => props.$active 
      ? (props.$isDarkMode ? '#2563eb' : '#2563eb')
      : (props.$isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.05)')
    };
  }
`;

const CreatePostButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
`;

const MainContainer = styled.div`
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
  align-items: flex-start;
`;

const ContentArea = styled.div`
  flex: 1;
  max-width: 800px;
`;

const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PostCard = styled.div`
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.95)'
    : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$isDarkMode 
      ? '0 20px 40px rgba(0, 0, 0, 0.3)'
      : '0 20px 40px rgba(0, 0, 0, 0.1)'
    };
    border-color: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.3)'
      : 'rgba(59, 130, 246, 0.2)'
    };
  }
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CommunityInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const CommunityDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.$color};
`;

const CommunityName = styled.span`
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
`;

const CategoryTag = styled.span`
  padding: 0.25rem 0.5rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(59, 130, 246, 0.2)'
    : 'rgba(59, 130, 246, 0.1)'
  };
  color: #3b82f6;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const PostTime = styled.span`
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
`;

const PostActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SubscribeButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$subscribed ? '#ef4444' : '#3b82f6'};
  background: ${props => props.$subscribed ? 'transparent' : '#3b82f6'};
  color: ${props => props.$subscribed ? '#ef4444' : 'white'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$subscribed ? '#ef4444' : '#2563eb'};
    color: white;
  }
`;

const PostContent = styled.div`
  margin-bottom: 1rem;
`;

const PostTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
`;

const PostText = styled.p`
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
`;

const AuthorInfo = styled.div`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
`;

const AuthorName = styled.span`
  color: #3b82f6;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const PostFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };
`;

const PostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$active 
    ? (props.$type === 'like' ? '#10b981' : '#3b82f6')
    : (props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(215 20.2% 50%)')
  };
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
  }
`;

const PostDropdown = styled.div`
  position: relative;
`;

const DropdownButton = styled.button`
  padding: 0.5rem;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
  }
`;

const Sidebar = styled.div`
  width: 300px;
  position: sticky;
  top: 6rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SidebarSection = styled.div`
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.95)'
    : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };
  border-radius: 12px;
  padding: 1.5rem;
`;

const SidebarTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin-bottom: 1rem;
  gap: 0.5rem;
`;

const TopPostsLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  margin-left: auto;
`;

const TapToJoinLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  margin-left: auto;
`;

const JoinedCountLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  margin-left: auto;
`;

const YoursLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  margin-left: auto;
`;

const TrendingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TrendingItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
  }
`;

const TrendingDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  margin-top: 0.5rem;
  flex-shrink: 0;
`;

const TrendingContent = styled.div`
  flex: 1;
`;

const TrendingName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  line-height: 1.3;
  margin-bottom: 0.25rem;
`;

const TrendingMeta = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
`;

const CommunitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
`;

const CommunityCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const JoinedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const JoinedItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
  }
`;

const JoinedName = styled.span`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
`;

const LeaveButton = styled.button`
  padding: 0.25rem 0.5rem;
  border: 1px solid #ef4444;
  background: transparent;
  color: #ef4444;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #ef4444;
    color: white;
  }
`;

const MySpaceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MySpaceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };

  h3 {
    margin: 1rem 0 0.5rem 0;
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }

  p {
    margin-bottom: 2rem;
    line-height: 1.5;
  }
`;

// Modal styles
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const ModalContent = styled.div`
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.95)'
    : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(20px);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1001;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
  }
`;

const CreatePostForm = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  overflow-y: auto;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
`;

const FormSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.875rem;
  outline: none;

  &:focus {
    border-color: #3b82f6;
  }
`;

const FormInput = styled.input`
  padding: 0.75rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.875rem;
  outline: none;

  &:focus {
    border-color: #3b82f6;
  }

  &::placeholder {
    color: ${props => props.$isDarkMode 
      ? 'hsl(215 20.2% 65.1%)'
      : 'hsl(215 20.2% 50%)'
    };
  }
`;

const FormTextarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.875rem;
  outline: none;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;

  &:focus {
    border-color: #3b82f6;
  }

  &::placeholder {
    color: ${props => props.$isDarkMode 
      ? 'hsl(215 20.2% 65.1%)'
      : 'hsl(215 20.2% 50%)'
    };
  }
`;

const ModalActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  background: transparent;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
  }
`;

export default CommunitiesPage;
