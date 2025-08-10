import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
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

const UltimateCommunitiesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Mock data - Enhanced communities
  const mockCommunities = useMemo(() => [
    {
      id: 'all',
      name: 'All Communities',
      displayName: 'All Communities',
      description: 'All posts from every community',
      members: 12547,
      onlineMembers: 1234,
      category: 'meta',
      privacy: 'public',
      icon: '🌐',
      banner: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      isJoined: true,
      isOfficial: true
    },
    {
      id: 'studytips',
      name: 'c/StudyTips',
      displayName: 'Study Tips & Techniques',
      description: 'Share and discover effective study methods, productivity hacks, and learning strategies.',
      members: 8432,
      onlineMembers: 892,
      category: 'study',
      privacy: 'public',
      icon: '📚',
      banner: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      isJoined: true,
      isOfficial: true,
      moderators: ['StudyGuru', 'LearningExpert'],
      rules: [
        'Be respectful and helpful',
        'Share evidence-based study methods',
        'No spam or self-promotion',
        'Use proper flairs for posts'
      ]
    },
    {
      id: 'notetaking',
      name: 'c/NoteTaking',
      displayName: 'Note-Taking Masters',
      description: 'Digital and analog note-taking systems, templates, and best practices.',
      members: 6234,
      onlineMembers: 543,
      category: 'productivity',
      privacy: 'public',
      icon: '✍��',
      banner: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      isJoined: true,
      moderators: ['NoteNinja', 'TemplateKing'],
      rules: [
        'Share original note-taking methods',
        'Credit template sources',
        'No pirated software discussion'
      ]
    },
    {
      id: 'flashcards',
      name: 'c/Flashcards',
      displayName: 'Flashcard Fanatics',
      description: 'Spaced repetition, Anki decks, and memory techniques for efficient learning.',
      members: 4567,
      onlineMembers: 321,
      category: 'memory',
      privacy: 'public',
      icon: '🃏',
      banner: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      isJoined: false,
      moderators: ['AnkiMaster', 'MemoryGuru']
    },
    {
      id: 'university',
      name: 'c/University',
      displayName: 'University Life',
      description: 'College tips, course discussions, and academic support for university students.',
      members: 15678,
      onlineMembers: 1876,
      category: 'academic',
      privacy: 'public',
      icon: '🎓',
      banner: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      isJoined: true,
      isOfficial: true
    },
    {
      id: 'productivity',
      name: 'c/Productivity',
      displayName: 'Productivity Hackers',
      description: 'Time management, workflow optimization, and life hacks for maximum efficiency.',
      members: 9876,
      onlineMembers: 1234,
      category: 'productivity',
      privacy: 'public',
      icon: '⚡',
      banner: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)',
      isJoined: true
    },
    {
      id: 'mathhelp',
      name: 'c/MathHelp',
      displayName: 'Mathematics Support',
      description: 'Get help with math problems, share solutions, and discuss mathematical concepts.',
      members: 3456,
      onlineMembers: 234,
      category: 'academic',
      privacy: 'public',
      icon: '📐',
      banner: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      isJoined: false
    },
    {
      id: 'coding',
      name: 'c/Coding',
      displayName: 'Coding & Programming',
      description: 'Programming tutorials, coding challenges, and software development discussions.',
      members: 12345,
      onlineMembers: 1567,
      category: 'technology',
      privacy: 'public',
      icon: '💻',
      banner: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      isJoined: true,
      isOfficial: true
    }
  ], []);

  // Mock posts with rich content
  const mockPosts = useMemo(() => [
    {
      id: 'post-1',
      title: 'The Ultimate Guide to Spaced Repetition: How I Memorized 10,000 Flashcards',
      content: `After 2 years of experimenting with different memory techniques, I've developed a system that helped me memorize over 10,000 flashcards with 95% retention rate.

**My System:**
1. **Optimal Intervals**: 1 day → 3 days → 1 week → 2 weeks → 1 month → 3 months
2. **Active Recall**: Always try to recall before looking at the answer
3. **Elaborative Interrogation**: Ask "why" and "how" questions
4. **Memory Palace**: For complex concepts, create vivid mental images

**Results:**
- 95% retention rate after 6 months
- 10,000+ cards mastered
- Study time reduced by 60%

What techniques work best for you? Share your experiences below! 👇`,
      author: {
        username: 'MemoryMaster',
        displayName: 'Memory Master',
        avatar: '🧠',
        reputation: 2847,
        badges: ['🏆 Top Contributor', '🔥 Study Streak: 365 days', '⭐ Verified Expert'],
        isVerified: true,
        isModerator: false
      },
      community: 'c/StudyTips',
      type: 'text',
      likes: 2847,
      dislikes: 23,
      comments: 156,
      views: 8934,
      shares: 89,
      awards: [
        { type: 'gold', count: 3 },
        { type: 'helpful', count: 12 },
        { type: 'mindblown', count: 7 }
      ],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      editedAt: null,
      isPinned: true,
      isLocked: false,
      flair: { text: 'Guide', color: '#10b981' },
      tags: ['spaced-repetition', 'flashcards', 'memory', 'anki', 'retention'],
      mediaAttachments: [],
      poll: null,
      isNSFW: false,
      spoilerWarning: false
    },
    {
      id: 'post-2',
      title: 'I just passed my medical school exams using only digital notes! AMA',
      content: `Just finished my final year med school exams and I'm excited to share that I did it all using digital note-taking! 

**My Setup:**
- iPad Pro + Apple Pencil for handwritten notes
- Notion for organizing everything
- Anki for spaced repetition
- GoodNotes for textbook annotations

**Why it worked:**
✅ Everything synced across devices
✅ Never lost notes again
✅ Could search through everything instantly
✅ Shared notes with study group easily

Ask me anything about my system! Happy to help fellow students make the switch 😊`,
      author: {
        username: 'MedStudent2024',
        displayName: 'Med Student 2024',
        avatar: '👩‍⚕️',
        reputation: 1234,
        badges: ['🎓 Graduate', '📱 Digital Native'],
        isVerified: false,
        isModerator: false
      },
      community: 'c/University',
      type: 'text',
      likes: 1456,
      dislikes: 12,
      comments: 89,
      views: 4567,
      shares: 45,
      awards: [
        { type: 'helpful', count: 8 },
        { type: 'celebration', count: 15 }
      ],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      flair: { text: 'Success Story', color: '#f59e0b' },
      tags: ['medical-school', 'digital-notes', 'ipad', 'notion', 'success'],
      isHot: true
    },
    {
      id: 'post-3',
      title: 'Poll: What\'s your biggest study challenge?',
      content: 'Trying to understand what the community struggles with most. Your input will help me create better content!',
      author: {
        username: 'StudyCoach',
        displayName: 'Study Coach Pro',
        avatar: '🎯',
        reputation: 3456,
        badges: ['👑 Community Leader', '🔥 100+ Helpful Posts'],
        isVerified: true,
        isModerator: true
      },
      community: 'c/StudyTips',
      type: 'poll',
      likes: 567,
      dislikes: 8,
      comments: 34,
      views: 2345,
      shares: 12,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      flair: { text: 'Poll', color: '#8b5cf6' },
      poll: {
        question: 'What\'s your biggest study challenge?',
        options: [
          { id: 1, text: 'Staying motivated', votes: 234 },
          { id: 2, text: 'Time management', votes: 189 },
          { id: 3, text: 'Information retention', votes: 156 },
          { id: 4, text: 'Note organization', votes: 123 },
          { id: 5, text: 'Exam anxiety', votes: 98 }
        ],
        totalVotes: 800,
        hasVoted: false,
        endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    },
    {
      id: 'post-4',
      title: 'Check out this mind map I made for organic chemistry!',
      content: 'Spent the weekend creating this comprehensive mind map for organic chemistry reactions. Thought it might help others studying for MCAT or organic chem courses!',
      author: {
        username: 'ChemNerd',
        displayName: 'Chemistry Nerd',
        avatar: '🧪',
        reputation: 892,
        badges: ['🧪 Science Enthusiast'],
        isVerified: false,
        isModerator: false
      },
      community: 'c/University',
      type: 'image',
      likes: 789,
      dislikes: 5,
      comments: 23,
      views: 1234,
      shares: 67,
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      flair: { text: 'Resource', color: '#3b82f6' },
      tags: ['chemistry', 'mind-map', 'mcat', 'organic-chemistry'],
      mediaAttachments: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
          caption: 'Organic Chemistry Reactions Mind Map'
        }
      ]
    },
    {
      id: 'post-5',
      title: 'Weekly Challenge: 30-Day Note-Taking Transformation',
      content: `🎯 **30-Day Challenge: Transform Your Note-Taking Game!**

Week 1: Foundation
- Days 1-3: Audit your current system
- Days 4-5: Choose your tools (digital/analog)
- Days 6-7: Set up your new system

Week 2: Implementation
- Practice active note-taking daily
- Experiment with different formats

Week 3: Optimization
- Review and refine your process
- Add visual elements and connections

Week 4: Mastery
- Teach someone else your system
- Plan for long-term sustainability

Who's joining me? Drop a 🙋‍♀️ in the comments!`,
      author: {
        username: 'NoteTakingPro',
        displayName: 'Note Taking Pro',
        avatar: '📝',
        reputation: 1876,
        badges: ['🏆 Challenge Creator', '📝 Note Expert'],
        isVerified: true,
        isModerator: false
      },
      community: 'c/NoteTaking',
      type: 'text',
      likes: 1234,
      dislikes: 7,
      comments: 178,
      views: 3456,
      shares: 89,
      awards: [
        { type: 'helpful', count: 23 },
        { type: 'motivational', count: 45 }
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      flair: { text: 'Challenge', color: '#ef4444' },
      tags: ['challenge', 'note-taking', '30-day', 'transformation'],
      isSticky: true
    }
  ], []);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCommunities(mockCommunities);
      setPosts(mockPosts);
    } catch (error) {
      toast({
        title: "Error loading communities",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtering and sorting
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Filter by community
    if (selectedCommunity !== 'all') {
      const community = communities.find(c => c.id === selectedCommunity);
      if (community) {
        filtered = filtered.filter(post => post.community === community.name);
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
  const handleReaction = useCallback((postId, type) => {
    setReactions(prev => ({
      ...prev,
      [postId]: prev[postId] === type ? null : type
    }));

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const currentReaction = reactions[postId];
        let likes = post.likes;
        let dislikes = post.dislikes;

        if (currentReaction === 'like') likes--;
        if (currentReaction === 'dislike') dislikes--;
        if (type === 'like' && currentReaction !== 'like') likes++;
        if (type === 'dislike' && currentReaction !== 'dislike') dislikes++;

        return { ...post, likes, dislikes };
      }
      return post;
    }));
  }, [reactions]);

  const handleBookmark = useCallback((postId) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(postId)) {
        newBookmarks.delete(postId);
        toast({ title: "Removed from bookmarks" });
      } else {
        newBookmarks.add(postId);
        toast({ title: "Added to bookmarks" });
      }
      return newBookmarks;
    });
  }, [toast]);

  const handleFollow = useCallback((communityId) => {
    setFollowing(prev => {
      const newFollowing = new Set(prev);
      if (newFollowing.has(communityId)) {
        newFollowing.delete(communityId);
        toast({ title: "Unfollowed community" });
      } else {
        newFollowing.add(communityId);
        toast({ title: "Following community" });
      }
      return newFollowing;
    });
  }, [toast]);

  const handleCreatePost = useCallback(() => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content",
        variant: "destructive"
      });
      return;
    }

    const community = communities.find(c => c.id === newPost.community) || communities[1];
    const createdPost = {
      id: `post-${Date.now()}`,
      title: newPost.title,
      content: newPost.content,
      author: {
        username: 'You',
        displayName: 'You',
        avatar: '👤',
        reputation: 0,
        badges: [],
        isVerified: false,
        isModerator: false
      },
      community: community.name,
      type: newPost.type,
      likes: 0,
      dislikes: 0,
      comments: 0,
      views: 0,
      shares: 0,
      awards: [],
      createdAt: new Date(),
      flair: newPost.flair ? { text: newPost.flair, color: '#6b7280' } : null,
      tags: newPost.tags,
      mediaAttachments: newPost.mediaFiles,
      poll: newPost.type === 'poll' ? {
        question: newPost.title,
        options: newPost.pollOptions.filter(opt => opt.trim()).map((text, index) => ({
          id: index + 1,
          text,
          votes: 0
        })),
        totalVotes: 0,
        hasVoted: false
      } : null,
      isNSFW: false
    };

    setPosts(prev => [createdPost, ...prev]);
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
      title: "Post Created!",
      description: "Your post has been shared with the community"
    });
  }, [newPost, communities, toast]);

  const handleCreateCommunity = useCallback(() => {
    if (!newCommunity.name.trim() || !newCommunity.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in community name and description",
        variant: "destructive"
      });
      return;
    }

    const createdCommunity = {
      id: newCommunity.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: `c/${newCommunity.name}`,
      displayName: newCommunity.name,
      description: newCommunity.description,
      members: 1,
      onlineMembers: 1,
      category: newCommunity.category,
      privacy: newCommunity.privacy,
      icon: '🆕',
      banner: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      isJoined: true,
      isOfficial: false,
      moderators: ['You'],
      rules: newCommunity.rules.filter(rule => rule.trim())
    };

    setCommunities(prev => [...prev, createdCommunity]);
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
      title: "Community Created!",
      description: `c/${newCommunity.name} has been created successfully`
    });
  }, [newCommunity, toast]);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading amazing communities...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </BackButton>
          <HeaderInfo>
            <PageTitle>Communities</PageTitle>
            <PageSubtitle>Connect • Share • Learn • Grow Together</PageSubtitle>
          </HeaderInfo>
        </HeaderLeft>
        
        <HeaderCenter>
          <SearchContainer>
            <Search size={18} />
            <SearchInput
              placeholder="Search communities, posts, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>
        </HeaderCenter>

        <HeaderActions>
          <IconButton onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
            <Filter size={18} />
          </IconButton>
          <IconButton onClick={() => setViewMode(viewMode === 'card' ? 'compact' : 'card')}>
            <Layers size={18} />
          </IconButton>
          <CreateButton onClick={() => setShowCreatePost(true)}>
            <Plus size={16} />
            Create Post
          </CreateButton>
        </HeaderActions>
      </Header>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <FiltersBar>
          <FilterGroup>
            <FilterLabel>Sort by:</FilterLabel>
            <FilterSelect value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
              <option value="hot">🔥 Hot</option>
              <option value="new">🆕 New</option>
              <option value="top">⭐ Top</option>
              <option value="controversial">⚡ Controversial</option>
            </FilterSelect>
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel>Type:</FilterLabel>
            <FilterSelect value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="text">📝 Text</option>
              <option value="image">🖼️ Images</option>
              <option value="video">🎥 Videos</option>
              <option value="poll">📊 Polls</option>
              <option value="link">���� Links</option>
            </FilterSelect>
          </FilterGroup>
        </FiltersBar>
      )}

      <MainContent>
        {/* Communities Sidebar */}
        <CommunitiesSidebar $collapsed={sidebarCollapsed}>
          <SidebarHeader>
            <SidebarTitle>Communities</SidebarTitle>
            <SidebarActions>
              <IconButton 
                size="small" 
                onClick={() => setShowCreateCommunity(true)}
                title="Create Community"
              >
                <Plus size={14} />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand" : "Collapse"}
              >
                {sidebarCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </IconButton>
            </SidebarActions>
          </SidebarHeader>
          
          {!sidebarCollapsed && (
            <CommunitiesList>
              {communities.map(community => (
                <CommunityCard
                  key={community.id}
                  $active={selectedCommunity === community.id}
                  $banner={community.banner}
                  onClick={() => setSelectedCommunity(community.id)}
                >
                  <CommunityIcon>{community.icon}</CommunityIcon>
                  <CommunityInfo>
                    <CommunityName>
                      {community.displayName}
                      {community.isOfficial && <Crown size={12} />}
                    </CommunityName>
                    <CommunityStats>
                      <StatItem>
                        <Users size={10} />
                        {formatNumber(community.members)}
                      </StatItem>
                      <StatItem $online>
                        <Activity size={10} />
                        {formatNumber(community.onlineMembers)}
                      </StatItem>
                    </CommunityStats>
                  </CommunityInfo>
                  {community.id !== 'all' && (
                    <CommunityActions>
                      <JoinButton
                        $joined={community.isJoined}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(community.id);
                        }}
                      >
                        {community.isJoined ? <Check size={12} /> : <Plus size={12} />}
                      </JoinButton>
                    </CommunityActions>
                  )}
                </CommunityCard>
              ))}
            </CommunitiesList>
          )}
        </CommunitiesSidebar>

        {/* Posts Feed */}
        <PostsFeed>
          {filteredAndSortedPosts.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>
                <Users size={48} />
              </EmptyStateIcon>
              <EmptyStateTitle>No posts found</EmptyStateTitle>
              <EmptyStateDescription>
                {searchQuery 
                  ? `No posts match "${searchQuery}"`
                  : "Be the first to start a conversation in this community!"
                }
              </EmptyStateDescription>
              <CreateButton onClick={() => setShowCreatePost(true)}>
                <Plus size={16} />
                Create First Post
              </CreateButton>
            </EmptyState>
          ) : (
            <PostsList>
              {filteredAndSortedPosts.map(post => (
                <PostCard
                  key={post.id}
                  $viewMode={viewMode}
                  $isPinned={post.isPinned}
                  $isSticky={post.isSticky}
                >
                  {(post.isPinned || post.isSticky) && (
                    <PinnedBadge>
                      <Pin size={12} />
                      {post.isPinned ? 'Pinned' : 'Announcement'}
                    </PinnedBadge>
                  )}

                  <PostHeader>
                    <CommunityBadge>
                      <Hash size={12} />
                      {post.community}
                    </CommunityBadge>
                    <PostMeta>
                      <AuthorInfo>
                        <AuthorAvatar>{post.author.avatar}</AuthorAvatar>
                        <AuthorName>
                          {post.author.displayName}
                          {post.author.isVerified && <Check size={12} />}
                          {post.author.isModerator && <Shield size={12} />}
                        </AuthorName>
                        <AuthorReputation>{formatNumber(post.author.reputation)}</AuthorReputation>
                      </AuthorInfo>
                      <PostTime>{formatTimeAgo(post.createdAt)}</PostTime>
                      {post.editedAt && <EditedBadge>edited</EditedBadge>}
                    </PostMeta>
                    <PostActions>
                      <IconButton size="small">
                        <MoreHorizontal size={14} />
                      </IconButton>
                    </PostActions>
                  </PostHeader>

                  <PostContent>
                    <PostTitle>
                      {post.type === 'poll' && <span>📊 </span>}
                      {post.type === 'image' && <span>🖼️ </span>}
                      {post.type === 'video' && <span>🎥 </span>}
                      {post.type === 'link' && <span>🔗 </span>}
                      {post.title}
                    </PostTitle>

                    {post.flair && (
                      <PostFlair $color={post.flair.color}>
                        {post.flair.text}
                      </PostFlair>
                    )}

                    <PostText $expanded={expandedPosts.has(post.id)}>
                      {post.content}
                    </PostText>

                    {post.content.length > 300 && (
                      <ExpandButton
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
                      </ExpandButton>
                    )}

                    {/* Media Attachments */}
                    {post.mediaAttachments?.length > 0 && (
                      <MediaContainer>
                        {post.mediaAttachments.map((media, index) => (
                          <MediaItem key={index}>
                            {media.type === 'image' && (
                              <img src={media.url} alt={media.caption} />
                            )}
                          </MediaItem>
                        ))}
                      </MediaContainer>
                    )}

                    {/* Poll */}
                    {post.poll && (
                      <PollContainer>
                        <PollQuestion>{post.poll.question}</PollQuestion>
                        <PollOptions>
                          {post.poll.options.map(option => {
                            const percentage = post.poll.totalVotes > 0 
                              ? (option.votes / post.poll.totalVotes) * 100 
                              : 0;
                            return (
                              <PollOption
                                key={option.id}
                                $percentage={percentage}
                                $voted={post.poll.hasVoted}
                              >
                                <PollOptionText>{option.text}</PollOptionText>
                                <PollOptionStats>
                                  <span>{percentage.toFixed(1)}%</span>
                                  <span>({option.votes} votes)</span>
                                </PollOptionStats>
                              </PollOption>
                            );
                          })}
                        </PollOptions>
                        <PollFooter>
                          <span>{formatNumber(post.poll.totalVotes)} total votes</span>
                          <span>Ends {formatTimeAgo(post.poll.endsAt)}</span>
                        </PollFooter>
                      </PollContainer>
                    )}

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <TagsContainer>
                        {post.tags.slice(0, 5).map(tag => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                        {post.tags.length > 5 && (
                          <Tag>+{post.tags.length - 5} more</Tag>
                        )}
                      </TagsContainer>
                    )}

                    {/* Author Badges */}
                    {post.author.badges?.length > 0 && (
                      <AuthorBadges>
                        {post.author.badges.slice(0, 2).map((badge, index) => (
                          <Badge key={index}>{badge}</Badge>
                        ))}
                      </AuthorBadges>
                    )}
                  </PostContent>

                  <PostFooter>
                    <PostStats>
                      <StatGroup>
                        <VoteButton
                          $active={reactions[post.id] === 'like'}
                          $type="like"
                          onClick={() => handleReaction(post.id, 'like')}
                        >
                          <ThumbsUp size={16} />
                          {formatNumber(post.likes)}
                        </VoteButton>
                        <VoteButton
                          $active={reactions[post.id] === 'dislike'}
                          $type="dislike"
                          onClick={() => handleReaction(post.id, 'dislike')}
                        >
                          <ThumbsDown size={16} />
                          {post.dislikes > 0 && formatNumber(post.dislikes)}
                        </VoteButton>
                      </StatGroup>

                      <ActionButton onClick={() => setSelectedPost(post)}>
                        <MessageSquare size={16} />
                        {formatNumber(post.comments)}
                      </ActionButton>

                      <ActionButton onClick={() => handleBookmark(post.id)}>
                        <Bookmark 
                          size={16} 
                          fill={bookmarks.has(post.id) ? 'currentColor' : 'none'} 
                        />
                      </ActionButton>

                      <ActionButton>
                        <Share2 size={16} />
                        {post.shares > 0 && formatNumber(post.shares)}
                      </ActionButton>

                      <StatItem>
                        <Eye size={14} />
                        {formatNumber(post.views)}
                      </StatItem>
                    </PostStats>

                    {/* Awards */}
                    {post.awards?.length > 0 && (
                      <AwardsList>
                        {post.awards.map((award, index) => (
                          <AwardBadge key={index}>
                            <Award size={12} />
                            {award.count}
                          </AwardBadge>
                        ))}
                      </AwardsList>
                    )}
                  </PostFooter>
                </PostCard>
              ))}
            </PostsList>
          )}
        </PostsFeed>

        {/* Trending Sidebar */}
        <TrendingSidebar>
          <TrendingSection>
            <SectionTitle>
              <Flame size={16} />
              Trending Topics
            </SectionTitle>
            <TrendingList>
              {['spaced-repetition', 'anki', 'note-taking', 'productivity', 'study-tips'].map((topic, index) => (
                <TrendingItem key={topic}>
                  <TrendingRank>#{index + 1}</TrendingRank>
                  <TrendingTopic>{topic}</TrendingTopic>
                  <TrendingCount>{Math.floor(Math.random() * 500) + 100} posts</TrendingCount>
                </TrendingItem>
              ))}
            </TrendingList>
          </TrendingSection>

          <TrendingSection>
            <SectionTitle>
              <Crown size={16} />
              Top Contributors
            </SectionTitle>
            <ContributorsList>
              {[
                { name: 'StudyGuru', rep: 5432, badge: '🏆' },
                { name: 'MemoryMaster', rep: 4321, badge: '🧠' },
                { name: 'NoteTaker', rep: 3210, badge: '📝' }
              ].map(contributor => (
                <ContributorItem key={contributor.name}>
                  <ContributorAvatar>{contributor.badge}</ContributorAvatar>
                  <ContributorInfo>
                    <ContributorName>{contributor.name}</ContributorName>
                    <ContributorRep>{formatNumber(contributor.rep)} rep</ContributorRep>
                  </ContributorInfo>
                </ContributorItem>
              ))}
            </ContributorsList>
          </TrendingSection>
        </TrendingSidebar>
      </MainContent>

      {/* Create Post Modal */}
      {showCreatePost && (
        <Modal>
          <ModalOverlay onClick={() => setShowCreatePost(false)} />
          <ModalContent $large>
            <ModalHeader>
              <ModalTitle>Create Amazing Post</ModalTitle>
              <CloseButton onClick={() => setShowCreatePost(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            
            <CreatePostForm>
              <FormSection>
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
                  <FormLabel>Post Type</FormLabel>
                  <PostTypeSelector>
                    {[
                      { type: 'text', icon: FileText, label: 'Text' },
                      { type: 'image', icon: ImageIcon, label: 'Image' },
                      { type: 'video', icon: Video, label: 'Video' },
                      { type: 'poll', icon: BarChart3, label: 'Poll' },
                      { type: 'link', icon: Link, label: 'Link' }
                    ].map(({ type, icon: Icon, label }) => (
                      <PostTypeButton
                        key={type}
                        $active={newPost.type === type}
                        onClick={() => setNewPost(prev => ({ ...prev, type }))}
                      >
                        <Icon size={16} />
                        {label}
                      </PostTypeButton>
                    ))}
                  </PostTypeSelector>
                </FormGroup>
              </FormSection>

              <FormGroup>
                <FormLabel>Title</FormLabel>
                <FormInput
                  placeholder="What's your post about?"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={300}
                />
                <CharCount>{newPost.title.length}/300</CharCount>
              </FormGroup>

              <FormGroup>
                <FormLabel>Content</FormLabel>
                <RichTextEditor
                  placeholder="Share your thoughts, experiences, or questions..."
                  value={newPost.content}
                  onChange={(value) => setNewPost(prev => ({ ...prev, content: value }))}
                />
              </FormGroup>

              {newPost.type === 'poll' && (
                <FormGroup>
                  <FormLabel>Poll Options</FormLabel>
                  {newPost.pollOptions.map((option, index) => (
                    <PollOptionInput key={index}>
                      <FormInput
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newPost.pollOptions];
                          newOptions[index] = e.target.value;
                          setNewPost(prev => ({ ...prev, pollOptions: newOptions }));
                        }}
                      />
                      {index > 1 && (
                        <RemoveButton
                          onClick={() => {
                            const newOptions = newPost.pollOptions.filter((_, i) => i !== index);
                            setNewPost(prev => ({ ...prev, pollOptions: newOptions }));
                          }}
                        >
                          <X size={14} />
                        </RemoveButton>
                      )}
                    </PollOptionInput>
                  ))}
                  {newPost.pollOptions.length < 6 && (
                    <AddOptionButton
                      onClick={() => setNewPost(prev => ({ 
                        ...prev, 
                        pollOptions: [...prev.pollOptions, ''] 
                      }))}
                    >
                      <Plus size={14} />
                      Add Option
                    </AddOptionButton>
                  )}
                </FormGroup>
              )}

              <FormSection>
                <FormGroup>
                  <FormLabel>Tags</FormLabel>
                  <TagInput>
                    <FormInput
                      placeholder="Add tags (separate with commas)"
                      value={newPost.tags.join(', ')}
                      onChange={(e) => setNewPost(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      }))}
                    />
                  </TagInput>
                  {newPost.tags.length > 0 && (
                    <TagPreview>
                      {newPost.tags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </TagPreview>
                  )}
                </FormGroup>

                <FormGroup>
                  <FormLabel>Flair</FormLabel>
                  <FormSelect
                    value={newPost.flair}
                    onChange={(e) => setNewPost(prev => ({ ...prev, flair: e.target.value }))}
                  >
                    <option value="">No flair</option>
                    <option value="Question">❓ Question</option>
                    <option value="Discussion">💬 Discussion</option>
                    <option value="Guide">📚 Guide</option>
                    <option value="Resource">📎 Resource</option>
                    <option value="Success Story">🎉 Success Story</option>
                  </FormSelect>
                </FormGroup>
              </FormSection>

              <PostOptions>
                <OptionCheckbox>
                  <input
                    type="checkbox"
                    checked={newPost.allowComments}
                    onChange={(e) => setNewPost(prev => ({ 
                      ...prev, 
                      allowComments: e.target.checked 
                    }))}
                  />
                  <label>Allow comments</label>
                </OptionCheckbox>
              </PostOptions>
            </CreatePostForm>

            <ModalActions>
              <CancelButton onClick={() => setShowCreatePost(false)}>
                Cancel
              </CancelButton>
              <SubmitButton onClick={handleCreatePost}>
                <Send size={16} />
                Create Post
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
            
            <CreateCommunityForm>
              <FormGroup>
                <FormLabel>Community Name</FormLabel>
                <CommunityNameInput>
                  <span>c/</span>
                  <FormInput
                    placeholder="CommunityName"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity(prev => ({ 
                      ...prev, 
                      name: e.target.value.replace(/[^a-zA-Z0-9]/g, '') 
                    }))}
                    maxLength={21}
                  />
                </CommunityNameInput>
              </FormGroup>

              <FormGroup>
                <FormLabel>Description</FormLabel>
                <FormTextarea
                  placeholder="What is your community about?"
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  rows={3}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Category</FormLabel>
                <FormSelect
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
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel>Privacy</FormLabel>
                <PrivacySelector>
                  {[
                    { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can view and join' },
                    { value: 'restricted', icon: Lock, label: 'Restricted', desc: 'Anyone can view, mods approve joins' },
                    { value: 'private', icon: Shield, label: 'Private', desc: 'Only approved members can view' }
                  ].map(({ value, icon: Icon, label, desc }) => (
                    <PrivacyOption key={value}>
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
                      <PrivacyLabel>
                        <Icon size={16} />
                        <div>
                          <div>{label}</div>
                          <small>{desc}</small>
                        </div>
                      </PrivacyLabel>
                    </PrivacyOption>
                  ))}
                </PrivacySelector>
              </FormGroup>
            </CreateCommunityForm>

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
    </PageContainer>
  );
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #020617 0%, #030712 100%);
  font-family: 'Inter', sans-serif;
  color: hsl(210 40% 98%);
  position: relative;
  overflow-x: hidden;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #020617 0%, #030712 100%);
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingText = styled.div`
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(30, 41, 59, 0.25);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const HeaderCenter = styled.div`
  flex: 2;
  max-width: 600px;
  
  @media (max-width: 768px) {
    flex: 100%;
    order: 3;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  justify-content: flex-end;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: rgba(30, 41, 59, 0.25);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: hsl(210 40% 98%);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(30, 41, 59, 0.4);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
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
  color: hsl(210 40% 98%);
  margin: 0;
`;

const PageSubtitle = styled.p`
  font-size: 0.875rem;
  color: hsl(215 20.2% 65.1%);
  margin: 0;
  font-weight: 500;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.25);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  transition: all 0.2s ease;
  color: hsl(215 20.2% 65.1%);

  &:focus-within {
    border-color: rgba(148, 163, 184, 0.3);
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
  }
`;

const SearchInput = styled.input`
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

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size === 'small' ? '32px' : '40px'};
  height: ${props => props.size === 'small' ? '32px' : '40px'};
  border-radius: 8px;
  border: none;
  background: ${props => props.$active ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(107, 114, 128, 0.1)'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? 'linear-gradient(135deg, #5a67d8, #6b46c1)' : 'rgba(107, 114, 128, 0.2)'};
    transform: translateY(-1px);
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  }
`;

const FiltersBar = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${slideUp} 0.3s ease;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const MainContent = styled.main`
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

const CommunitiesSidebar = styled.aside`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const SidebarTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const SidebarActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CommunitiesList = styled.div`
  padding: 1rem;
  max-height: 600px;
  overflow-y: auto;
`;

const CommunityCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  ${props => props.$active && `
    background: ${props.$banner};
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  `}
  
  &:hover {
    background: ${props => props.$active ? props.$banner : 'rgba(0, 0, 0, 0.05)'};
    transform: translateY(-1px);
  }
`;

const CommunityIcon = styled.div`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const CommunityInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommunityName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
`;

const CommunityStats = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  opacity: 0.8;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  ${props => props.$online && `
    color: #10b981;
    font-weight: 500;
  `}
`;

const CommunityActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const JoinButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: ${props => props.$joined ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
  color: ${props => props.$joined ? '#10b981' : 'currentColor'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const PostsFeed = styled.div`
  min-height: 600px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const EmptyStateIcon = styled.div`
  color: #9ca3af;
  margin-bottom: 1rem;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
`;

const EmptyStateDescription = styled.p`
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  max-width: 400px;
`;

const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PostCard = styled.article`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  animation: ${fadeIn} 0.5s ease;
  
  ${props => (props.$isPinned || props.$isSticky) && `
    border-color: #fbbf24;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
  `}
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const PinnedBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  z-index: 10;
`;

const PostHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const CommunityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AuthorAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
`;

const AuthorName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const AuthorReputation = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
`;

const PostTime = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const EditedBadge = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
`;

const PostActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const PostContent = styled.div`
  padding: 1rem 1.5rem;
`;

const PostTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const NSFWBadge = styled.span`
  padding: 0.125rem 0.5rem;
  background: #ef4444;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const PostFlair = styled.div`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  border: 1px solid ${props => props.$color}40;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
`;

const PostText = styled.div`
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
  white-space: pre-wrap;
  
  ${props => !props.$expanded && `
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #667eea;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const MediaContainer = styled.div`
  margin: 1rem 0;
  border-radius: 12px;
  overflow: hidden;
`;

const MediaItem = styled.div`
  img {
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: cover;
  }
`;

const PollContainer = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const PollQuestion = styled.div`
  font-weight: 600;
  margin-bottom: 1rem;
  color: #374151;
`;

const PollOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const PollOption = styled.div`
  position: relative;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: ${props => props.$voted ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.$percentage}%;
    background: linear-gradient(135deg, #667eea20, #764ba220);
    border-radius: 8px;
    transition: width 0.5s ease;
  }
  
  &:hover {
    border-color: #667eea;
  }
`;

const PollOptionText = styled.div`
  position: relative;
  z-index: 1;
`;

const PollOptionStats = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const PollFooter = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #9ca3af;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const Tag = styled.span`
  padding: 0.25rem 0.5rem;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const AuthorBadges = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Badge = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
`;

const PostFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;

const PostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const VoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 8px;
  background: ${props => {
    if (props.$active) {
      return props.$type === 'like' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    }
    return 'rgba(0, 0, 0, 0.05)';
  }};
  color: ${props => {
    if (props.$active) {
      return props.$type === 'like' ? '#10b981' : '#ef4444';
    }
    return '#6b7280';
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: ${props => {
      if (props.$type === 'like') return 'rgba(16, 185, 129, 0.1)';
      return 'rgba(239, 68, 68, 0.1)';
    }};
    color: ${props => props.$type === 'like' ? '#10b981' : '#ef4444'};
    transform: translateY(-1px);
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    transform: translateY(-1px);
  }
`;

const AwardsList = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AwardBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const TrendingSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (max-width: 1200px) {
    display: none;
  }
`;

const TrendingSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 120px;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
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
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const TrendingRank = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
`;

const TrendingTopic = styled.div`
  flex: 1;
  font-weight: 500;
  color: #374151;
`;

const TrendingCount = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const ContributorsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ContributorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const ContributorAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
`;

const ContributorInfo = styled.div`
  flex: 1;
`;

const ContributorName = styled.div`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const ContributorRep = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
`;

// Modal Components
const Modal = styled.div`
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

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
`;

const ModalContent = styled.div`
  position: relative;
  width: 100%;
  max-width: ${props => props.$large ? '800px' : '600px'};
  max-height: 90vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: ${fadeIn} 0.3s ease;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #374151;
  }
`;

// Form Components
const CreatePostForm = styled.div`
  padding: 1.5rem;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
`;

const CreateCommunityForm = styled.div`
  padding: 1.5rem;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
`;

const FormSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const PostTypeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const PostTypeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$active ? '#667eea' : '#d1d5db'};
  border-radius: 8px;
  background: ${props => props.$active ? 'rgba(102, 126, 234, 0.1)' : 'white'};
  color: ${props => props.$active ? '#667eea' : '#6b7280'};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }
`;

const CharCount = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: right;
  margin-top: 0.25rem;
`;

const RichTextEditor = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const PollOptionInput = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const RemoveButton = styled.button`
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
  flex-shrink: 0;
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const AddOptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    color: #667eea;
  }
`;

const TagInput = styled.div`
  margin-bottom: 0.5rem;
`;

const TagPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const PostOptions = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  margin-top: 1rem;
`;

const OptionCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  label {
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
  }
`;

const CommunityNameInput = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  overflow: hidden;
  
  span {
    padding: 0.75rem 0.5rem 0.75rem 0.75rem;
    background: #f9fafb;
    color: #6b7280;
    font-weight: 500;
    border-right: 1px solid #e5e7eb;
  }
  
  input {
    flex: 1;
    padding: 0.75rem 0.75rem 0.75rem 0.5rem;
    border: none;
    outline: none;
    background: transparent;
  }
  
  &:focus-within {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const PrivacySelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PrivacyOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  input[type="radio"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

const PrivacyLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  flex: 1;
  
  div {
    font-size: 0.875rem;
    
    small {
      display: block;
      color: #9ca3af;
      font-size: 0.75rem;
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #5a67d8, #6b46c1);
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

export default UltimateCommunitiesPage;
