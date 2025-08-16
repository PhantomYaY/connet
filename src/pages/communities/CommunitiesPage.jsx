import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Plus,
  Users,
  Search,
  Bookmark,
  X,
  FileText,
  TrendingUp,
  SortAsc,
  Flame,
  Clock,
  Star
} from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import { useTheme } from '../../context/ThemeContext';
import OptimizedModernLoader from '../../components/OptimizedModernLoader';
import {
  getCommunities,
  joinCommunity,
  leaveCommunity,
  getCommunityPostsReal,
  likePost,
  getUserPostReactions,
  setUserReaction,
  savePost,
  unsavePost,
  isPostSaved,
  getSavedPosts
} from '../../lib/firestoreService';
import { auth } from '../../lib/firebase';

const CommunitiesPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const sidebarOpen = outletContext.sidebarOpen || false;
  const { toast } = useToast() || {};
  const { isDarkMode } = useTheme() || {};

  // Main state
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState('hot');
  const [searchQuery, setSearchQuery] = useState('');
  
  // User interactions
  const [reactions, setReactions] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  
  // UI state
  const [activeTab, setActiveTab] = useState('all');
  const [isJoining, setIsJoining] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState([]);

  // Generate colors for communities
  const communityColors = ['#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#6366F1', '#EF4444', '#D946EF'];

  const initializeData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load data with fallbacks
      let communitiesData = [];
      let postsData = [];
      
      try {
        communitiesData = await getCommunities();
      } catch (error) {
        console.warn('Failed to load communities:', error);
        communitiesData = [];
      }
      
      try {
        postsData = await getCommunityPostsReal();
      } catch (error) {
        console.warn('Failed to load posts:', error);
        postsData = [];
      }

      setCommunities(communitiesData || []);
      setPosts(postsData || []);

      // Load user-specific data if authenticated
      if (auth.currentUser && postsData.length > 0) {
        try {
          const postIds = postsData.map(post => post.id);
          const userReactions = await getUserPostReactions(postIds);
          setReactions(userReactions || {});

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
        } catch (error) {
          console.warn('Error loading user reactions:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (toast) {
        toast({
          title: "Connection Error",
          description: "Unable to load community data. Please check your connection.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Filtering and sorting
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts || [];

    // Filter by tab
    if (activeTab === 'trending') {
      filtered = filtered.filter(post => (post.likes || 0) > 5);
    }

    // Filter by search query
    if (searchQuery) {
      if (searchQuery.startsWith('author:')) {
        const authorId = searchQuery.replace('author:', '');
        filtered = filtered.filter(post =>
          post.author?.uid === authorId || post.authorId === authorId
        );
      } else {
        filtered = filtered.filter(post =>
          (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (post.content || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    }

    // Sort posts
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'hot':
          return ((b.likes || 0) - (b.dislikes || 0) + (b.comments || 0) * 2) - 
                 ((a.likes || 0) - (a.dislikes || 0) + (a.comments || 0) * 2);
        case 'new':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'top':
          return ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0));
        default:
          return 0;
      }
    });

    return filtered;
  }, [posts, selectedSort, searchQuery, activeTab]);

  const handleReaction = useCallback(async (postId, type) => {
    try {
      if (!auth.currentUser) {
        if (toast) {
          toast({
            title: "Sign in required",
            description: "You need to sign in to react to posts.",
            variant: "warning"
          });
        }
        return;
      }

      const currentReaction = reactions[postId];
      const newReaction = currentReaction === type ? null : type;
      setReactions(prev => ({ ...prev, [postId]: newReaction }));

      await setUserReaction(postId, 'post', type);
      if (type === 'like') {
        await likePost(postId);
      }

      const updatedPosts = await getCommunityPostsReal();
      setPosts(updatedPosts || []);
    } catch (error) {
      console.error('Error updating reaction:', error);
      if (toast) {
        toast({
          title: "Reaction Failed",
          description: "Couldn't update your reaction. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [reactions, toast]);

  const handleBookmark = useCallback(async (postId) => {
    try {
      if (!auth.currentUser) {
        if (toast) {
          toast({
            title: "Sign in required",
            description: "You need to sign in to save posts.",
            variant: "warning"
          });
        }
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
        if (toast) {
          toast({ title: "Bookmark Removed", description: "Post removed from your bookmarks" });
        }
      } else {
        await savePost(postId);
        if (toast) {
          toast({ title: "Bookmarked!", description: "Post saved to your bookmarks" });
        }
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      if (toast) {
        toast({
          title: "Bookmark Failed",
          description: "Couldn't update your bookmark. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [bookmarks, toast]);

  const handleJoinCommunity = useCallback(async (communityId) => {
    if (isJoining) return;

    try {
      if (!auth.currentUser) {
        if (toast) {
          toast({
            title: "Sign In Required",
            description: "Please sign in to join communities",
            variant: "warning"
          });
        }
        return;
      }

      setIsJoining(true);
      const community = communities.find(c => c.id === communityId);
      const isCurrentlyJoined = community?.isJoined;

      if (isCurrentlyJoined) {
        await leaveCommunity(communityId);
        if (toast) {
          toast({
            title: "Left Community",
            description: `You've left ${community?.displayName || community?.name}`,
          });
        }
      } else {
        await joinCommunity(communityId);
        if (toast) {
          toast({
            title: "Welcome!",
            description: `You've joined ${community?.displayName || community?.name}!`,
            variant: "success"
          });
        }
      }

      const updatedCommunities = await getCommunities();
      setCommunities(updatedCommunities || []);
    } catch (error) {
      console.error('Error updating community membership:', error);
      if (toast) {
        toast({
          title: "Membership Error",
          description: "Couldn't update your community membership. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsJoining(false);
    }
  }, [communities, toast, isJoining]);

  const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0';
    const numValue = Number(num);
    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}k`;
    return numValue.toString();
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'unknown';

    try {
      let jsDate;
      if (date.toDate) {
        jsDate = date.toDate();
      } else if (date instanceof Date) {
        jsDate = date;
      } else {
        jsDate = new Date(date);
      }

      if (isNaN(jsDate.getTime())) return 'unknown';

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
      return 'unknown';
    }
  };

  const getJoinedCommunities = () => {
    return (communities || []).filter(c => c.id !== 'all' && c.isJoined);
  };

  const getDiscoverCommunities = () => {
    return (communities || [])
      .filter(c => c.id !== 'all' && !c.isJoined)
      .slice(0, 6)
      .map((community, index) => ({
        ...community,
        color: communityColors[index % communityColors.length]
      }));
  };

  if (loading) {
    return <OptimizedModernLoader />;
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]
        bg-[linear-gradient(to_right,theme(colors.slate.300)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.300)_1px,transparent_1px)]
        dark:bg-[linear-gradient(to_right,theme(colors.slate.800)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800)_1px,transparent_1px)]
        bg-[size:40px_40px]"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-400/10 via-blue-500/0 to-teal-400/10" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className={`flex items-center justify-between px-4 py-3 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-16"
        }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Communities</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search communities and posts..."
                value={searchQuery.startsWith('author:') ? '' : searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {['all', 'trending'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'all' ? 'All' : 'Trending'}
                  {tab === 'trending' && <Flame size={14} className="ml-1 inline" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate('/communities/create-post')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Create Post
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex gap-6 px-4 py-6 transition-all duration-300 ${
        sidebarOpen ? "ml-64" : "ml-16"
      }`}>
        {/* Posts Feed */}
        <div className="flex-1 max-w-2xl">
          {/* Sort Controls */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <SortAsc size={16} />
              Sort by:
            </div>
            <div className="flex bg-white/60 dark:bg-slate-800/60 rounded-lg p-1 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              {[
                { key: 'hot', label: 'Hot', icon: Flame },
                { key: 'new', label: 'New', icon: Clock },
                { key: 'top', label: 'Top', icon: Star }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedSort(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    selectedSort === key
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredAndSortedPosts.length === 0 ? (
              <div className="glass-card text-center py-12">
                <Users size={48} className="mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {searchQuery ? "No posts found" : "No posts yet"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {searchQuery 
                    ? "Try adjusting your search terms or filters."
                    : "Be the first to start a conversation in this community!"
                  }
                </p>
                <button
                  onClick={() => navigate('/communities/create-post')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus size={16} />
                  Create Post
                </button>
              </div>
            ) : (
              filteredAndSortedPosts.map(post => (
                <div
                  key={post.id}
                  className="glass-card hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: (() => {
                          const communityIndex = (communities || []).findIndex(c =>
                            c.id === post.communityId ||
                            c.name === post.community ||
                            c.displayName === post.community
                          );
                          return communityColors[communityIndex % communityColors.length] || '#6366F1';
                        })()
                      }}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {post.community || 'Unknown'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                      {post.flair?.text || 'Discussion'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      • {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>

                  {/* Post Content */}
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/communities/post/${post.id}`)}
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.title || 'Untitled Post'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                      {post.content || 'No content available'}
                    </p>
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-500 mb-4">
                    by @{post.author?.displayName || 'Unknown'}
                  </div>

                  {/* Post Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Like button clicked for post:', post.id);
                          handleReaction(post.id, 'like');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 cursor-pointer ${
                          reactions[post.id] === 'like'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={reactions[post.id] === 'like' ? 'Remove like' : 'Like this post'}
                        style={{ pointerEvents: 'auto' }}
                        data-no-edit="true"
                      >
                        <ThumbsUp size={14} />
                        {formatNumber(post.likes || 0)}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Comments button clicked for post:', post.id);
                          navigate(`/communities/post/${post.id}`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 cursor-pointer"
                        title="View comments"
                        style={{ pointerEvents: 'auto' }}
                        data-no-edit="true"
                      >
                        <MessageSquare size={14} />
                        {formatNumber(post.comments || 0)}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Bookmark button clicked for post:', post.id);
                          handleBookmark(post.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 cursor-pointer ${
                          bookmarks.has(post.id)
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={bookmarks.has(post.id) ? 'Remove bookmark' : 'Bookmark this post'}
                        style={{ pointerEvents: 'auto' }}
                        data-no-edit="true"
                      >
                        <Bookmark size={14} fill={bookmarks.has(post.id) ? 'currentColor' : 'none'} />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 space-y-6">
          {/* Trending Posts */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-orange-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Trending</h3>
            </div>
            <div className="space-y-3">
              {filteredAndSortedPosts
                .filter(post => (post.likes || 0) > 5)
                .slice(0, 3)
                .map((post, index) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/communities/post/${post.id}`)}
                  >
                    <div className="text-sm font-bold text-slate-400">#{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white text-sm line-clamp-1">
                        {post.title || 'Untitled'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {post.community || 'Unknown'} • {formatNumber((post.likes || 0) + (post.comments || 0))} engagement
                      </div>
                    </div>
                  </div>
                ))
              }
              {filteredAndSortedPosts.filter(post => (post.likes || 0) > 5).length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-500 text-sm">
                  No trending posts yet. Posts with high engagement will appear here!
                </div>
              )}
            </div>
          </div>

          {/* Discover Communities */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Discover Communities</h3>
              <span className="text-xs text-slate-500 dark:text-slate-500">Tap to join</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {getDiscoverCommunities().map((community) => (
                <button
                  key={community.id}
                  onClick={() => handleJoinCommunity(community.id)}
                  className="flex flex-col items-center p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all group"
                  disabled={isJoining}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mb-2 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: community.color }}
                  >
                    {community.icon || (community.displayName || community.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xs font-medium text-slate-900 dark:text-white text-center line-clamp-1">
                    {community.displayName || community.name || 'Unknown'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {formatNumber(community.members || 0)} members
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Joined Communities */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Your Communities</h3>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {getJoinedCommunities().length} joined
              </span>
            </div>
            <div className="space-y-2">
              {getJoinedCommunities().length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-500 text-sm">
                  No communities joined yet. Discover communities above to get started!
                </div>
              ) : (
                getJoinedCommunities().map((community, index) => (
                  <div
                    key={community.id}
                    className="flex items-center gap-3 p-2 bg-white/40 dark:bg-slate-800/40 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/communities/${community.id}`)}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: communityColors[index % communityColors.length] }}
                    >
                      {community.icon || (community.displayName || community.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                        {community.displayName || community.name || 'Unknown'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinCommunity(community.id);
                      }}
                      className="text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (auth.currentUser) {
                    setSearchQuery(`author:${auth.currentUser.uid}`);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <FileText size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">My Posts</span>
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const postIds = await getSavedPosts();
                    setSavedPostIds(postIds || []);
                    if (toast) {
                      toast({
                        title: "Saved Posts",
                        description: `Found ${(postIds || []).length} saved posts`,
                      });
                    }
                  } catch (error) {
                    if (toast) {
                      toast({
                        title: "Error",
                        description: "Failed to load saved posts",
                        variant: "destructive"
                      });
                    }
                  }
                }}
                className="w-full flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <Bookmark size={16} className="text-amber-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">Saved Posts</span>
              </button>
              
              <button
                onClick={() => navigate('/communities/create')}
                className="w-full flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <Plus size={16} className="text-green-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">Create Community</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunitiesPage;
