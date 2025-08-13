import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Plus,
  Users,
  Search,
  Bookmark,
  X,
  ChevronDown,
  Send,
  FileText,
  TrendingUp
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
  isPostSaved,
  syncPostCommentCounts,
  getSavedPosts
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
  const [showMyCommunities, setShowMyCommunities] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [activeTab, setActiveTab] = useState('all'); // all, joined, saved, trending
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState([]);

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

  // Get trending topics from actual posts
  const getTrendingTopics = () => {
    return posts
      .filter(post => post.likes > 5) // Posts with more than 5 likes
      .sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2)) // Sort by engagement
      .slice(0, 3)
      .map(post => ({
        name: post.title,
        posts: post.likes + post.comments,
        category: post.community || 'General',
        id: post.id
      }));
  };

  // Generate colors for communities
  const communityColors = ['#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#6366F1', '#EF4444', '#D946EF'];

  const getDiscoverCommunities = () => {
    return communities
      .filter(c => c.id !== 'all' && !c.isJoined)
      .slice(0, 8)
      .map((community, index) => ({
        ...community,
        color: communityColors[index % communityColors.length],
        memberCount: formatNumber(community.members || community.memberCount || 0)
      }));
  };

  const getJoinedCommunities = () => {
    const joined = communities.filter(c => c.id !== 'all' && c.isJoined);
    console.log('🏘️ Joined communities:', joined.length, joined.map(c => c.displayName || c.name));
    return joined;
  };

  const initializeData = useCallback(async () => {
    try {
      setLoading(true);

      // Test basic connectivity
      console.log('🔍 Testing connectivity...');

      // Load basic data with individual error handling
      let communitiesData = [];
      let postsData = [];

      try {
        communitiesData = await getCommunities();
        console.log('���� Loaded communities:', communitiesData.length, 'communities');
        console.log('🏘️ Joined communities:', communitiesData.filter(c => c.isJoined).map(c => c.displayName || c.name));

        // Sync comment counts for posts (run silently in background)
        syncPostCommentCounts().catch(error => {
          console.warn('⚠️ Failed to sync comment counts:', error);
        });

        setIsOfflineMode(false);
      } catch (error) {
        console.error('Error loading communities:', error);

        // Check if it's a network error
        if (error.message && (error.message.includes('NetworkError') || error.message.includes('fetch'))) {
          console.log('🔴 Network connectivity issue detected');
          toast({
            title: "🌐 Network Issue",
            description: "Unable to connect to the server. Using offline mode.",
            variant: "destructive"
          });
        }

        setIsOfflineMode(true);
        // Provide fallback community data
        const currentUserId = auth.currentUser?.uid;
        communitiesData = [
          {
            id: 'python',
            name: 'Python',
            displayName: 'Python',
            description: 'A community for Python developers',
            members: 1234,
            onlineMembers: 56,
            isJoined: true, // User has posts in Python, so they should be joined
            isOfficial: true
          },
          {
            id: 'dsa',
            name: 'Dsa',
            displayName: 'Dsa',
            description: 'Data Structures and Algorithms',
            members: 890,
            onlineMembers: 34,
            isJoined: false,
            isOfficial: false
          }
        ];
      }

      try {
        postsData = await getCommunityPostsReal();
        if (!isOfflineMode) setIsOfflineMode(false);
      } catch (error) {
        console.error('Error loading posts:', error);
        setIsOfflineMode(true);
        // Provide fallback post data matching real communities
        const currentUserId = auth.currentUser?.uid;
        postsData = [
          {
            id: 'python-post',
            title: 'Welcome to Python Community!',
            content: 'Share your Python projects, ask questions, and connect with fellow Python developers.',
            community: 'Python',
            communityId: 'python',
            author: {
              uid: currentUserId || 'demo',
              displayName: auth.currentUser?.displayName || 'Community Bot',
              avatar: '🤖'
            },
            createdAt: new Date(),
            likes: 12,
            dislikes: 0,
            comments: 3,
            tags: ['python', 'welcome'],
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
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      setIsOfflineMode(true);

      setTimeout(() => {
        toast({
          title: "🚫 Network Error",
          description: `Unable to load community data: ${error.message || 'Unknown error'}. Click the offline banner to retry.`,
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

    // Log auth state for debugging
    console.log('🔐 Auth state:', auth.currentUser ? 'Authenticated' : 'Not authenticated');

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
    if (activeTab === 'trending') {
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
      if (searchQuery.startsWith('author:')) {
        // Filter by author ID
        const authorId = searchQuery.replace('author:', '');
        filtered = filtered.filter(post =>
          post.author?.uid === authorId || post.authorId === authorId
        );
      } else {
        // Regular text search
        filtered = filtered.filter(post =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
    }

    // Filter by type
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'saved') {
        // Show only saved posts
        filtered = filtered.filter(post => savedPostIds.includes(post.id));
      } else {
        filtered = filtered.filter(post => post.type === selectedFilter);
      }
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
  }, [posts, selectedCommunity, selectedSort, selectedFilter, searchQuery, communities, activeTab, bookmarks, savedPostIds]);

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
    if (isJoining) return; // Prevent multiple simultaneous joins

    try {
      if (!auth.currentUser) {
        toast({
          title: "🔐 Sign In Required",
          description: "Please sign in to join communities",
          variant: "warning"
        });
        return;
      }

      setIsJoining(true);
      const community = communities.find(c => c.id === communityId);
      const isCurrentlyJoined = community?.isJoined;

      console.log('🏘️ Community join/leave attempt:', {
        communityId,
        communityName: community?.displayName || community?.name,
        currentlyJoined: isCurrentlyJoined,
        userId: auth.currentUser.uid,
        communityMembers: community?.members,
        communityMemberCount: community?.memberCount
      });

      if (isCurrentlyJoined) {
        await leaveCommunity(communityId);
        toast({
          title: "👋 Left Community",
          description: `You've left ${community?.displayName || community?.name}`,
          variant: "default"
        });
      } else {
        await joinCommunity(communityId);
        toast({
          title: "🎉 Welcome!",
          description: `You've joined ${community?.displayName || community?.name}!`,
          variant: "success"
        });
      }

      // Reload communities to get updated membership status
      console.log('🔄 Reloading communities after membership change...');
      const updatedCommunities = await getCommunities();
      setCommunities(updatedCommunities);

      // Log the updated state
      const updatedCommunity = updatedCommunities.find(c => c.id === communityId);
      console.log('✅ Updated community state:', {
        communityId,
        isJoined: updatedCommunity?.isJoined,
        memberCount: updatedCommunity?.members?.length || updatedCommunity?.memberCount,
        members: updatedCommunity?.members
      });

      // Force a re-render to update the UI
      setTimeout(() => {
        console.log('🔄 Re-checking joined communities...');
        const joinedCount = updatedCommunities.filter(c => c.isJoined).length;
        console.log('🏘️ Total joined communities:', joinedCount);
      }, 100);

    } catch (error) {
      console.error('Error updating community membership:', error);
      toast({
        title: "❌ Membership Error",
        description: "Couldn't update your community membership. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  }, [communities, toast, isJoining]);

  const handleCreatePost = useCallback(async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: "⚠️ Missing Content",
        description: "Please add both a title and content for your post",
        variant: "warning"
      });
      return;
    }

    setIsCreatingPost(true);
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

      // Auto-join the community if not already joined
      const isCommunityJoined = communities.find(c => c.id === community.id)?.isJoined;
      if (!isCommunityJoined) {
        try {
          await joinCommunity(community.id);
          console.log('🎉 Auto-joined community after posting:', community.displayName || community.name);
        } catch (error) {
          console.warn('Failed to auto-join community:', error);
        }
      }

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
    } finally {
      setIsCreatingPost(false);
    }
  }, [newPost, communities, toast, initializeData, isCreatingPost]);

  const handleCreateCommunity = useCallback(async () => {
    if (!newCommunity.name.trim() || !newCommunity.description.trim()) {
      toast({
        title: "⚠️ Complete Details",
        description: "Please provide both community name and description",
        variant: "warning"
      });
      return;
    }

    if (!auth.currentUser) {
      toast({
        title: "🔐 Authentication Required",
        description: "Please sign in to create a community",
        variant: "warning"
      });
      return;
    }

    setIsCreatingCommunity(true);
    try {
      const communityData = {
        name: newCommunity.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        displayName: newCommunity.name,
        description: newCommunity.description,
        category: newCommunity.category,
        privacy: newCommunity.privacy,
        banner: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        isOfficial: false,
        rules: newCommunity.rules.filter(rule => rule.trim()),
        allowImages: true,
        allowVideos: true,
        allowPolls: true
      };

      const newCommunity = await createCommunity(communityData);

      // The user is automatically a member when creating a community (handled in createCommunity)
      console.log('🎉 Community created and auto-joined:', newCommunity.displayName);

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
        title: "🎊 Community Created!",
        description: `Welcome to c/${newCommunity.name}! You're automatically a member and can start building your community.`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error creating community:', error);
      toast({
        title: "❌ Creation Failed",
        description: "Couldn't create your community. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCommunity(false);
    }
  }, [newCommunity, toast, initializeData, isCreatingCommunity]);

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
              placeholder={searchQuery.startsWith('author:') ? 'Showing your posts...' : 'Search the community feed...'}
              value={searchQuery.startsWith('author:') ? '' : searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                  e.target.blur();
                }
              }}
              aria-label="Search communities and posts"
            />
            {searchQuery && (
              <ClearSearchButton
                $isDarkMode={isDarkMode}
                onClick={() => {
                  setSearchQuery('');
                  toast({
                    title: "🔍 Search Cleared",
                    description: "Showing all posts",
                    variant: "default"
                  });
                }}
              >
                <X size={14} />
              </ClearSearchButton>
            )}
          </SearchContainer>
        </HeaderCenter>

        <HeaderRight>
          {isOfflineMode && (
            <OfflineBanner $isDarkMode={isDarkMode} onClick={() => {
              console.log('🔄 Retrying connection...');
              setIsOfflineMode(false);
              initializeData();
            }}>
              🔌 Offline Mode - Click to retry
            </OfflineBanner>
          )}

          {searchQuery.startsWith('author:') && (
            <MyPostsBanner $isDarkMode={isDarkMode}>
              📝 My Posts
            </MyPostsBanner>
          )}

          <TabsContainer $isDarkMode={isDarkMode}>
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

          <CreatePostButton $isDarkMode={isDarkMode} onClick={() => navigate('/communities/create-post')}>
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
              <h3>
                {searchQuery.startsWith('author:')
                  ? "No posts found"
                  : "No posts yet"
                }
              </h3>
              <p>
                {searchQuery.startsWith('author:')
                  ? "You haven't created any posts yet. Share your thoughts with the community!"
                  : "Be the first to start a conversation in this community!"
                }
              </p>
              <CreatePostButton onClick={() => navigate('/communities/create-post')}>
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
                        $color={(() => {
                          const communityIndex = communities.findIndex(c =>
                            c.id === post.communityId ||
                            c.name === post.community ||
                            c.displayName === post.community
                          );
                          return communityColors[communityIndex % communityColors.length] || '#6366F1';
                        })()}
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
          <SidebarSection $isDarkMode={isDarkMode}>
            <SidebarTitle $isDarkMode={isDarkMode}>
              <TrendingUp size={16} />
              Trending
              <TopPostsLabel $isDarkMode={isDarkMode}>Top posts</TopPostsLabel>
            </SidebarTitle>
            <TrendingList>
              {getTrendingTopics().length === 0 ? (
                <EmptyTrending $isDarkMode={isDarkMode}>
                  No trending posts yet. Posts with high engagement will appear here!
                </EmptyTrending>
              ) : (
                getTrendingTopics().map((topic) => (
                  <TrendingItem
                    key={topic.id}
                    $isDarkMode={isDarkMode}
                    onClick={() => navigate(`/communities/post/${topic.id}`)}
                  >
                    <TrendingDot $isDarkMode={isDarkMode} />
                    <TrendingContent>
                      <TrendingName $isDarkMode={isDarkMode}>{topic.name}</TrendingName>
                      <TrendingMeta $isDarkMode={isDarkMode}>
                        {topic.category} • {topic.posts} engagement
                      </TrendingMeta>
                    </TrendingContent>
                  </TrendingItem>
                ))
              )}
            </TrendingList>
          </SidebarSection>

          {/* Discover Communities */}
          <SidebarSection $isDarkMode={isDarkMode}>
            <SidebarTitle $isDarkMode={isDarkMode}>
              Discover communities
              <TapToJoinLabel $isDarkMode={isDarkMode}>Tap to join</TapToJoinLabel>
            </SidebarTitle>
            <CommunitiesGrid>
              {getDiscoverCommunities().map((community) => (
                <CommunityCircle
                  key={community.id}
                  $color={community.color}
                  onClick={(e) => {
                    e.preventDefault();
                    // Join the community directly
                    handleFollow(community.id);
                  }}
                  title={`${community.displayName || community.name} - ${community.memberCount} members - Click to join`}
                  aria-label={`Join ${community.displayName || community.name} community`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFollow(community.id);
                    }
                  }}
                  $loading={isJoining}
                >
                  {isJoining ? '⏳' : (community.icon || (community.displayName || community.name).charAt(0).toUpperCase())}
                </CommunityCircle>
              ))}
            </CommunitiesGrid>
          </SidebarSection>

          {/* Joined Communities */}
          <SidebarSection $isDarkMode={isDarkMode} data-section="joined-communities">
            <SidebarTitle $isDarkMode={isDarkMode}>
              Joined communities
              <JoinedCountLabel $isDarkMode={isDarkMode}>{getJoinedCommunities().length} joined</JoinedCountLabel>
            </SidebarTitle>
            <JoinedList>
              {getJoinedCommunities().length === 0 ? (
                <EmptyJoined $isDarkMode={isDarkMode}>
                  No communities joined yet. Discover communities above to get started!
                </EmptyJoined>
              ) : (
                getJoinedCommunities().map((community, index) => (
                  <JoinedItem
                    key={community.id}
                    $isDarkMode={isDarkMode}
                    onClick={() => navigate(`/communities/${community.id}`)}
                    $clickable={true}
                  >
                    <CommunityCircle $color={communityColors[index % communityColors.length]}>
                      {community.icon || (community.displayName || community.name).charAt(0).toUpperCase()}
                    </CommunityCircle>
                    <JoinedName $isDarkMode={isDarkMode}>
                      {community.displayName || community.name}
                    </JoinedName>
                    <LeaveButton
                      $isDarkMode={isDarkMode}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation when clicking Leave
                        handleFollow(community.id);
                      }}
                    >
                      Leave
                    </LeaveButton>
                  </JoinedItem>
                ))
              )}
            </JoinedList>
          </SidebarSection>

          {/* My Space */}
          <SidebarSection $isDarkMode={isDarkMode}>
            <SidebarTitle $isDarkMode={isDarkMode}>
              My space
              <YoursLabel $isDarkMode={isDarkMode}>Yours</YoursLabel>
            </SidebarTitle>
            <MySpaceList>
              <MySpaceItem
                $isDarkMode={isDarkMode}
                onClick={() => {
                  // Filter to show only user's posts
                  setActiveTab('all');
                  setSelectedFilter('all');
                  setSelectedCommunity('all');
                  if (auth.currentUser) {
                    toast({
                      title: "📝 My Posts",
                      description: `Showing posts by ${auth.currentUser.displayName || 'you'}`,
                      variant: "default"
                    });
                    // Set a flag to filter by current user
                    setSearchQuery(`author:${auth.currentUser.uid}`);
                  }
                }}
              >
                <FileText size={16} />
                My Posts
              </MySpaceItem>
              <MySpaceItem
                $isDarkMode={isDarkMode}
                onClick={async () => {
                  // Show saved posts
                  try {
                    const postIds = await getSavedPosts();
                    setSavedPostIds(postIds);

                    // Update filter to show saved posts
                    setActiveTab('all');
                    setSelectedFilter('saved');
                    setSelectedCommunity('all');
                    setSearchQuery('');

                    const savedCount = posts.filter(post => postIds.includes(post.id)).length;
                    toast({
                      title: "🔖 Saved Posts",
                      description: `Found ${savedCount} saved posts`,
                      variant: "default"
                    });
                  } catch (error) {
                    console.error('Error loading saved posts:', error);
                    toast({
                      title: "❌ Error",
                      description: "Failed to load saved posts",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Bookmark size={16} />
                Saved Posts
              </MySpaceItem>
              <MySpaceItem
                $isDarkMode={isDarkMode}
                onClick={() => {
                  const joinedCommunities = getJoinedCommunities();
                  if (joinedCommunities.length === 0) {
                    toast({
                      title: "🏘️ No Communities Yet",
                      description: "You haven't joined any communities. Discover communities below to get started!",
                      variant: "default"
                    });
                  } else {
                    setShowMyCommunities(true);
                  }
                }}
              >
                <Users size={16} />
                My Communities ({getJoinedCommunities().length})
              </MySpaceItem>
              <MySpaceItem
                $isDarkMode={isDarkMode}
                onClick={() => navigate('/communities/create')}
              >
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

            <CreatePostForm $isDarkMode={isDarkMode}>
              <FormGroup>
                <FormLabel>
                  🏘️ Community
                  <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                </FormLabel>
                <FormSelect
                  value={newPost.community}
                  onChange={(e) => setNewPost(prev => ({ ...prev, community: e.target.value }))}
                  required
                >
                  <option value="">Choose a community to post in...</option>
                  {communities.filter(c => c.id !== 'all').map(community => (
                    <option key={community.id} value={community.id}>
                      {community.icon} {community.displayName}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  📝 Title
                  <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                </FormLabel>
                <FormInput
                  placeholder="What's your post about? Make it engaging..."
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={300}
                  required
                />
                <div style={{
                  fontSize: '0.75rem',
                  color: isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)',
                  textAlign: 'right',
                  marginTop: '0.25rem'
                }}>
                  {newPost.title.length}/300 characters
                </div>
              </FormGroup>

              <FormGroup>
                <FormLabel>💭 Content</FormLabel>
                <FormTextarea
                  placeholder="Share your thoughts, experiences, or questions... Be detailed and helpful to the community!"
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                />
                <div style={{
                  fontSize: '0.75rem',
                  color: isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)',
                  textAlign: 'right',
                  marginTop: '0.25rem'
                }}>
                  {newPost.content.length} characters
                </div>
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

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <Modal>
          <ModalOverlay onClick={() => setShowCreateCommunity(false)} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Create New Community</ModalTitle>
              <CloseButton onClick={() => setShowCreateCommunity(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>

            <CreatePostForm $isDarkMode={isDarkMode}>
              <FormGroup>
                <FormLabel>
                  🏘️ Community Name
                  <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                </FormLabel>
                <FormInput
                  placeholder="CommunityName (no spaces, special characters)"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity(prev => ({
                    ...prev,
                    name: e.target.value.replace(/[^a-zA-Z0-9]/g, '')
                  }))}
                  maxLength={21}
                  required
                />
                <div style={{
                  fontSize: '0.75rem',
                  color: isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)',
                  textAlign: 'right',
                  marginTop: '0.25rem'
                }}>
                  {newCommunity.name.length}/21 characters
                </div>
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  📝 Description
                  <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                </FormLabel>
                <FormTextarea
                  placeholder="Describe what your community is about, what topics it covers, and what kind of discussions you want to encourage..."
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  rows={4}
                  required
                />
                <div style={{
                  fontSize: '0.75rem',
                  color: isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)',
                  textAlign: 'right',
                  marginTop: '0.25rem'
                }}>
                  {newCommunity.description.length} characters
                </div>
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  📊 Category
                  <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                </FormLabel>
                <FormSelect
                  value={newCommunity.category}
                  onChange={(e) => setNewCommunity(prev => ({
                    ...prev,
                    category: e.target.value
                  }))}
                  required
                >
                  <option value="">Choose a category...</option>
                  <option value="study">��� Study & Learning</option>
                  <option value="productivity">⚡ Productivity</option>
                  <option value="academic">🎓 Academic</option>
                  <option value="technology">💻 Technology</option>
                  <option value="general">💬 General Discussion</option>
                </FormSelect>
              </FormGroup>
            </CreatePostForm>

            <ModalActions>
              <CancelButton onClick={() => setShowCreateCommunity(false)}>
                Cancel
              </CancelButton>
              <SubmitButton onClick={handleCreateCommunity}>
                <Plus size={16} />
                Create Community
              </SubmitButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* My Communities Modal */}
      {showMyCommunities && (
        <Modal>
          <ModalOverlay onClick={() => setShowMyCommunities(false)} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>My Communities ({getJoinedCommunities().length})</ModalTitle>
              <CloseButton onClick={() => setShowMyCommunities(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>

            <MyCommunitiesContent $isDarkMode={isDarkMode}>
              {getJoinedCommunities().length === 0 ? (
                <EmptyCommunitiesState $isDarkMode={isDarkMode}>
                  <Users size={48} />
                  <h3>No Communities Yet</h3>
                  <p>You haven't joined any communities. Explore the discover section to find communities that interest you!</p>
                </EmptyCommunitiesState>
              ) : (
                <CommunitiesList>
                  {getJoinedCommunities().map((community, index) => (
                    <CommunityModalItem
                      key={community.id}
                      $isDarkMode={isDarkMode}
                      onClick={() => {
                        navigate(`/communities/${community.id}`);
                        setShowMyCommunities(false);
                      }}
                    >
                      <CommunityCircle $color={communityColors[index % communityColors.length]}>
                        {community.icon || (community.displayName || community.name).charAt(0).toUpperCase()}
                      </CommunityCircle>
                      <CommunityModalInfo>
                        <CommunityModalName $isDarkMode={isDarkMode}>
                          {community.displayName || community.name}
                        </CommunityModalName>
                        <CommunityModalDescription $isDarkMode={isDarkMode}>
                          {community.description || 'No description available'}
                        </CommunityModalDescription>
                        <CommunityModalStats $isDarkMode={isDarkMode}>
                          <span>{formatNumber(community.members?.length || community.memberCount || 0)} members</span>
                          <span>•</span>
                          <span>{formatNumber(community.onlineMembers || 0)} online</span>
                        </CommunityModalStats>
                      </CommunityModalInfo>
                      <CommunityModalActions>
                        <LeaveButton
                          $isDarkMode={isDarkMode}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollow(community.id);
                          }}
                        >
                          Leave
                        </LeaveButton>
                      </CommunityModalActions>
                    </CommunityModalItem>
                  ))}
                </CommunitiesList>
              )}
            </MyCommunitiesContent>

            <ModalActions>
              <SubmitButton onClick={() => setShowMyCommunities(false)}>
                Close
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
  scroll-behavior: smooth;

  /* Custom scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.3) rgba(30, 41, 59, 0.1)'
      : 'rgba(0, 0, 0, 0.2) rgba(248, 250, 252, 0.1)'
    };
  }

  *::-webkit-scrollbar {
    width: 6px;
  }

  *::-webkit-scrollbar-track {
    background: ${props => props.$isDarkMode
      ? 'rgba(30, 41, 59, 0.1)'
      : 'rgba(248, 250, 252, 0.1)'
    };
  }

  *::-webkit-scrollbar-thumb {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.3)'
      : 'rgba(0, 0, 0, 0.2)'
    };
    border-radius: 3px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.5)'
      : 'rgba(0, 0, 0, 0.3)'
    };
  }
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

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
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

  @media (max-width: 768px) {
    max-width: 100%;
    margin: 0;
    order: 1;
  }
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

const ClearSearchButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.2)'
      : 'rgba(0, 0, 0, 0.1)'
    };
    color: ${props => props.$isDarkMode
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
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
  cursor: pointer;
  transition: all 0.2s ease;
  animation: pulse 2s infinite;

  &:hover {
    background: #d97706;
    transform: scale(1.05);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const MyPostsBanner = styled.div`
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
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
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  position: relative;
  background: ${props => props.$active
    ? (props.$isDarkMode
        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      )
    : 'transparent'
  };
  color: ${props => props.$active
    ? 'white'
    : (props.$isDarkMode ? 'hsl(210 40% 85%)' : 'hsl(215 20.2% 45%)')
  };
  border: 1px solid ${props => props.$active
    ? 'transparent'
    : (props.$isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.15)')
  };

  &:hover {
    background: ${props => props.$active
      ? (props.$isDarkMode
          ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
          : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
        )
      : (props.$isDarkMode
          ? 'rgba(59, 130, 246, 0.15)'
          : 'rgba(59, 130, 246, 0.08)'
        )
    };
    color: ${props => props.$active
      ? 'white'
      : (props.$isDarkMode ? 'hsl(210 40% 95%)' : 'hsl(217.2 91.2% 50%)')
    };
    border-color: ${props => props.$active
      ? 'transparent'
      : (props.$isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)')
    };
    transform: translateY(-1px);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:hover {
    background: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);

    &::before {
      width: 300px;
      height: 300px;
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const MainContainer = styled.div`
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
  align-items: flex-start;

  @media (max-width: 1024px) {
    flex-direction: column;
    padding: 1rem;
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    gap: 1rem;
  }
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
    background: linear-gradient(
      90deg,
      transparent,
      ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'},
      transparent
    );
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-3px) scale(1.01);
    box-shadow: ${props => props.$isDarkMode
      ? '0 25px 50px rgba(0, 0, 0, 0.4)'
      : '0 25px 50px rgba(0, 0, 0, 0.15)'
    };
    border-color: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.4)'
      : 'rgba(59, 130, 246, 0.3)'
    };

    &::before {
      left: 100%;
    }
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

  @media (max-width: 1024px) {
    position: static;
    width: 100%;
    top: auto;
    order: -1;
  }

  @media (max-width: 768px) {
    gap: 1rem;
  }
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
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.$isDarkMode
      ? '0 10px 20px rgba(0, 0, 0, 0.2)'
      : '0 10px 20px rgba(0, 0, 0, 0.05)'
    };
  }
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
    transform: translateX(2px);
  }
`;

const EmptyTrending = styled.div`
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  line-height: 1.4;
  background: ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.05)'
    : 'rgba(0, 0, 0, 0.02)'
  };
  border-radius: 8px;
  border: 1px dashed ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(0, 0, 0, 0.1)'
  };
`;

const TrendingDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.$isDarkMode ? '#10b981' : '#059669'};
  margin-top: 0.5rem;
  flex-shrink: 0;
  box-shadow: ${props => props.$isDarkMode
    ? '0 0 8px rgba(16, 185, 129, 0.3)'
    : '0 0 6px rgba(5, 150, 105, 0.2)'
  };
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: scale(1.15) rotate(5deg);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(1.05);
  }

  &:focus {
    outline: 2px solid ${props => props.$color};
    outline-offset: 2px;
  }

  ${props => props.$loading && `
    animation: pulse 2s infinite;
    cursor: not-allowed;
  `}

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const JoinedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EmptyJoined = styled.div`
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  line-height: 1.4;
  background: ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.05)'
    : 'rgba(0, 0, 0, 0.02)'
  };
  border-radius: 8px;
  border: 1px dashed ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(0, 0, 0, 0.1)'
  };
`;

const JoinedItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
    ${props => props.$clickable && `
      transform: translateX(2px);
    `}
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
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)'
    : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)'
  };
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  margin: 0 2rem;
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
  padding: 0.875rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 10px;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  backdrop-filter: blur(10px);
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.$isDarkMode
      ? 'rgba(15, 23, 42, 0.95)'
      : 'rgba(255, 255, 255, 0.95)'
    };
    transform: translateY(-1px);
  }

  &::placeholder {
    color: ${props => props.$isDarkMode
      ? 'hsl(215 20.2% 55%)'
      : 'hsl(222.2 84% 55%)'
    };
  }
`;

const FormTextarea = styled.textarea`
  padding: 0.875rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 10px;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  backdrop-filter: blur(10px);
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  transition: all 0.2s ease;
  min-height: 120px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.$isDarkMode
      ? 'rgba(15, 23, 42, 0.95)'
      : 'rgba(255, 255, 255, 0.95)'
    };
    transform: translateY(-1px);
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

// My Communities Modal Styled Components
const MyCommunitiesContent = styled.div`
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
`;

const EmptyCommunitiesState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
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
    line-height: 1.5;
    margin: 0;
  }
`;

const CommunitiesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommunityModalItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.05)'
      : 'rgba(0, 0, 0, 0.02)'
    };
    transform: translateY(-1px);
    box-shadow: ${props => props.$isDarkMode
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)'
    };
  }
`;

const CommunityModalInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommunityModalName = styled.h4`
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
`;

const CommunityModalDescription = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const CommunityModalStats = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
`;

const CommunityModalActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export default CommunitiesPage;
