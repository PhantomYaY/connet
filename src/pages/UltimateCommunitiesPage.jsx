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
import * as S from './UltimateCommunitiesPageStyles';

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
      icon: '✍️',
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
      <S.LoadingContainer>
        <S.LoadingSpinner />
        <S.LoadingText>Loading amazing communities...</S.LoadingText>
      </S.LoadingContainer>
    );
  }

  return (
    <S.PageContainer>
      {/* Header */}
      <S.Header>
        <S.HeaderLeft>
          <S.BackButton onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </S.BackButton>
          <S.HeaderInfo>
            <S.PageTitle>Communities</S.PageTitle>
            <S.PageSubtitle>Connect • Share • Learn • Grow Together</S.PageSubtitle>
          </S.HeaderInfo>
        </S.HeaderLeft>
        
        <S.HeaderCenter>
          <S.SearchContainer>
            <Search size={18} />
            <S.SearchInput
              placeholder="Search communities, posts, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </S.SearchContainer>
        </S.HeaderCenter>

        <S.HeaderActions>
          <S.IconButton onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
            <Filter size={18} />
          </S.IconButton>
          <S.IconButton onClick={() => setViewMode(viewMode === 'card' ? 'compact' : 'card')}>
            <Layers size={18} />
          </S.IconButton>
          <S.CreateButton onClick={() => setShowCreatePost(true)}>
            <Plus size={16} />
            Create Post
          </S.CreateButton>
        </S.HeaderActions>
      </S.Header>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <S.FiltersBar>
          <S.FilterGroup>
            <S.FilterLabel>Sort by:</S.FilterLabel>
            <S.FilterSelect value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
              <option value="hot">🔥 Hot</option>
              <option value="new">🆕 New</option>
              <option value="top">⭐ Top</option>
              <option value="controversial">⚡ Controversial</option>
            </S.FilterSelect>
          </S.FilterGroup>
          
          <S.FilterGroup>
            <S.FilterLabel>Type:</S.FilterLabel>
            <S.FilterSelect value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
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
        <S.CommunitiesSidebar $collapsed={sidebarCollapsed}>
          <S.SidebarHeader>
            <S.SidebarTitle>Communities</S.SidebarTitle>
            <S.SidebarActions>
              <S.IconButton 
                size="small" 
                onClick={() => setShowCreateCommunity(true)}
                title="Create Community"
              >
                <Plus size={14} />
              </S.IconButton>
              <S.IconButton 
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
              {communities.map(community => (
                <S.CommunityCard
                  key={community.id}
                  $active={selectedCommunity === community.id}
                  $banner={community.banner}
                  onClick={() => setSelectedCommunity(community.id)}
                >
                  <S.CommunityIcon>{community.icon}</S.CommunityIcon>
                  <S.CommunityInfo>
                    <S.CommunityName>
                      {community.displayName}
                      {community.isOfficial && <Crown size={12} />}
                    </S.CommunityName>
                    <S.CommunityStats>
                      <S.StatItem>
                        <Users size={10} />
                        {formatNumber(community.members)}
                      </S.StatItem>
                      <S.StatItem $online>
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
              ))}
            </S.CommunitiesList>
          )}
        </S.CommunitiesSidebar>

        {/* Posts Feed */}
        <S.PostsFeed>
          {filteredAndSortedPosts.length === 0 ? (
            <S.EmptyState>
              <S.EmptyStateIcon>
                <Users size={48} />
              </S.EmptyStateIcon>
              <S.EmptyStateTitle>No posts found</S.EmptyStateTitle>
              <S.EmptyStateDescription>
                {searchQuery 
                  ? `No posts match "${searchQuery}"`
                  : "Be the first to start a conversation in this community!"
                }
              </S.EmptyStateDescription>
              <S.CreateButton onClick={() => setShowCreatePost(true)}>
                <Plus size={16} />
                Create First Post
              </S.CreateButton>
            </S.EmptyState>
          ) : (
            <S.PostsList>
              {filteredAndSortedPosts.map(post => (
                <S.PostCard
                  key={post.id}
                  $viewMode={viewMode}
                  $isPinned={post.isPinned}
                  $isSticky={post.isSticky}
                >
                  {(post.isPinned || post.isSticky) && (
                    <S.PinnedBadge>
                      <Pin size={12} />
                      {post.isPinned ? 'Pinned' : 'Announcement'}
                    </S.PinnedBadge>
                  )}

                  <S.PostHeader>
                    <S.CommunityBadge>
                      <Hash size={12} />
                      {post.community}
                    </S.CommunityBadge>
                    <S.PostMeta>
                      <S.AuthorInfo>
                        <S.AuthorAvatar>{post.author.avatar}</S.AuthorAvatar>
                        <S.AuthorName>
                          {post.author.displayName}
                          {post.author.isVerified && <Check size={12} />}
                          {post.author.isModerator && <Shield size={12} />}
                        </S.AuthorName>
                        <S.AuthorReputation>{formatNumber(post.author.reputation)}</S.AuthorReputation>
                      </S.AuthorInfo>
                      <S.PostTime>{formatTimeAgo(post.createdAt)}</S.PostTime>
                      {post.editedAt && <S.EditedBadge>edited</S.EditedBadge>}
                    </S.PostMeta>
                    <S.PostActions>
                      <S.IconButton size="small">
                        <MoreHorizontal size={14} />
                      </S.IconButton>
                    </S.PostActions>
                  </S.PostHeader>

                  <S.PostContent>
                    <S.PostTitle>
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

                    <S.PostText $expanded={expandedPosts.has(post.id)}>
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

                  <S.PostFooter>
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
            <S.TrendingList>
              {['spaced-repetition', 'anki', 'note-taking', 'productivity', 'study-tips'].map((topic, index) => (
                <S.TrendingItem key={topic}>
                  <S.TrendingRank>#{index + 1}</S.TrendingRank>
                  <S.TrendingTopic>{topic}</S.TrendingTopic>
                  <S.TrendingCount>{Math.floor(Math.random() * 500) + 100} posts</S.TrendingCount>
                </S.TrendingItem>
              ))}
            </S.TrendingList>
          </S.TrendingSection>

          <S.TrendingSection>
            <S.SectionTitle>
              <Crown size={16} />
              Top Contributors
            </S.SectionTitle>
            <S.ContributorsList>
              {[
                { name: 'StudyGuru', rep: 5432, badge: '🏆' },
                { name: 'MemoryMaster', rep: 4321, badge: '🧠' },
                { name: 'NoteTaker', rep: 3210, badge: '📝' }
              ].map(contributor => (
                <S.ContributorItem key={contributor.name}>
                  <S.ContributorAvatar>{contributor.badge}</S.ContributorAvatar>
                  <S.ContributorInfo>
                    <S.ContributorName>{contributor.name}</S.ContributorName>
                    <S.ContributorRep>{formatNumber(contributor.rep)} rep</S.ContributorRep>
                  </S.ContributorInfo>
                </S.ContributorItem>
              ))}
            </S.ContributorsList>
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
