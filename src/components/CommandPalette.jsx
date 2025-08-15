import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import styled from 'styled-components';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  FilePlus,
  Star,
  FolderPlus,
  Save,
  Sun,
  Moon,
  Settings,
  Search,
  ArrowLeft,
  Trash2,
  Copy,
  FileText,
  Undo,
  Redo,
  Link,
  Image,
  Calendar,
  Clock,
  User,
  Users,
  MessageSquare,
  Heart,
  Bookmark,
  Download,
  Upload,
  Share2,
  Eye,
  EyeOff,
  Zap,
  Target,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  MoreHorizontal,
  Edit,
  RefreshCw,
  Home,
  Menu,
  X,
  Plus,
  Minus,
  ChevronRight,
  ExternalLink,
  Clipboard,
  Mail,
  MapPin,
  Globe,
  ExternalLink as GitHub,
  ExternalLink as Twitter,
  ExternalLink as Linkedin,
  ExternalLink as Instagram,
  ExternalLink as Youtube,
  Music,
  Video,
  Camera,
  Mic,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Power,
  Shield,
  Lock,
  Unlock,
  Key,
  Archive,
  Trash,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  Hash,
  CreditCard,
  ShoppingCart,
  Package,
  Car,
  Book,
  Bookmark as BookmarkAlt,
  Library,
  GraduationCap,
  Award,
  Trophy,
  Flag,
  Tag,
  Tags,
  Paperclip,
  Palette as PaintBucket,
  Palette,
  Brush,
  PenTool,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Layers,
  Layout,
  Sidebar,
  Sidebar as PanelLeft,
  Sidebar as PanelRight,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  RotateCw as FlipHorizontal,
  RotateCcw as FlipVertical,
  Move,
  MousePointer,
  Hand,
  Navigation,
  Map,
  MapPin as Locate,
  Navigation as Route,
  Headphones,
  Monitor,
  HardDrive,
  Database,
  Server,
  Cloud,
  CloudDownload,
  Upload as CloudUpload,
  Folder,
  FolderOpen,
  File,
  Files,
  Terminal,
  Command,
  Activity,
  BarChart,
  BarChart as PieChart,
  TrendingUp,
  TrendingDown,
  Timer,
  Bell,
  Sun as SunIcon,
  Moon as MoonIcon,
  Star as StarIcon,
  Sparkles,
  Zap as Flame,
  Droplet
} from 'lucide-react';

// Context for command palette
const CommandPaletteContext = createContext();

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
};

// Command definitions based on context
const getCommands = (location, editor, navigate, setIsDarkMode, isDarkMode) => {
  const isNotePage = location.pathname === '/page';
  const isDashboard = location.pathname === '/dashboard';
  const isSettings = location.pathname === '/settings';
  const isCommunities = location.pathname === '/communities';
  const isAllNotes = location.pathname === '/all-notes';
  const isFavorites = location.pathname === '/favorites';

  let commands = [];

  // 🏠 Navigation & Pages
  const navigationCommands = [
    {
      id: 'go-home',
      label: 'Go to Dashboard',
      icon: <Home size={16} />,
      section: '🏠 Navigation',
      shortcut: 'Ctrl+H',
      action: () => navigate('/dashboard')
    },
    {
      id: 'new-note',
      label: 'Create New Note',
      icon: <FilePlus size={16} />,
      section: '🏠 Navigation',
      shortcut: 'Ctrl+N',
      action: () => navigate('/page')
    },
    {
      id: 'all-notes',
      label: 'Show All Notes',
      icon: <FileText size={16} />,
      section: '🏠 Navigation',
      shortcut: 'Ctrl+A',
      action: () => navigate('/all-notes')
    },
    {
      id: 'favorites',
      label: 'Show Favorites',
      icon: <Star size={16} />,
      section: '🏠 Navigation',
      shortcut: 'Ctrl+F',
      action: () => navigate('/favorites')
    },
    {
      id: 'shared-notes',
      label: 'Show Shared Notes',
      icon: <Share2 size={16} />,
      section: '🏠 Navigation',
      action: () => navigate('/shared-notes')
    },
    {
      id: 'communities',
      label: 'Communities',
      icon: <Users size={16} />,
      section: '🏠 Navigation',
      shortcut: 'Ctrl+U',
      action: () => navigate('/communities')
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: <CreditCard size={16} />,
      section: '🏠 Navigation',
      action: () => navigate('/flashcards')
    },
    {
      id: 'whiteboard',
      label: 'Whiteboard',
      icon: <PenTool size={16} />,
      section: '🏠 Navigation',
      action: () => navigate('/whiteboard')
    },
    {
      id: 'friends',
      label: 'Friends',
      icon: <Users size={16} />,
      section: '🏠 Navigation',
      action: () => navigate('/friends')
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare size={16} />,
      section: '🏠 Navigation',
      action: () => navigate('/messages')
    },
    {
      id: 'profile',
      label: 'View Profile',
      icon: <User size={16} />,
      section: '🏠 Navigation',
      action: () => navigate('/profile')
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: <Settings size={16} />,
      section: '🏠 Navigation',
      shortcut: 'Ctrl+,',
      action: () => navigate('/settings')
    }
  ];

  // 🤖 AI & Productivity
  const aiCommands = [
    {
      id: 'ai-assistant',
      label: 'Open AI Assistant',
      icon: <Sparkles size={16} />,
      section: '🤖 AI & Productivity',
      shortcut: 'Ctrl+J',
      action: () => {
        const event = new CustomEvent('openAIAssistant');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'ai-summarize',
      label: 'AI Summarize Text',
      icon: <Target size={16} />,
      section: '🤖 AI & Productivity',
      action: () => {
        const event = new CustomEvent('aiSummarize');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'ai-improve',
      label: 'AI Improve Writing',
      icon: <Edit size={16} />,
      section: '🤖 AI & Productivity',
      action: () => {
        const event = new CustomEvent('aiImprove');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'ai-translate',
      label: 'AI Translate',
      icon: <Globe size={16} />,
      section: '🤖 AI & Productivity',
      action: () => {
        const event = new CustomEvent('aiTranslate');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'ai-flashcards',
      label: 'Generate Flashcards',
      icon: <CreditCard size={16} />,
      section: '🤖 AI & Productivity',
      action: () => {
        const event = new CustomEvent('generateFlashcards');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'ai-quiz',
      label: 'Generate Quiz',
      icon: <HelpCircle size={16} />,
      section: '🤖 AI & Productivity',
      action: () => {
        const event = new CustomEvent('generateQuiz');
        window.dispatchEvent(event);
      }
    }
  ];

  // 📁 Organization & Folders
  const organizationCommands = [
    {
      id: 'new-folder',
      label: 'Create New Folder',
      icon: <FolderPlus size={16} />,
      section: '📁 Organization',
      shortcut: 'Ctrl+Shift+N',
      action: () => {
        const event = new CustomEvent('createFolder');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'organize-notes',
      label: 'Auto-Organize Notes',
      icon: <Layout size={16} />,
      section: '📁 Organization',
      action: () => {
        const event = new CustomEvent('autoOrganize');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'bulk-move',
      label: 'Bulk Move Notes',
      icon: <Move size={16} />,
      section: '📁 Organization',
      action: () => {
        const event = new CustomEvent('bulkMove');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'add-tags',
      label: 'Add Tags',
      icon: <Tags size={16} />,
      section: '📁 Organization',
      shortcut: 'Ctrl+T',
      action: () => {
        const event = new CustomEvent('addTags');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'archive-notes',
      label: 'Archive Selected',
      icon: <Archive size={16} />,
      section: '📁 Organization',
      action: () => {
        const event = new CustomEvent('archiveNotes');
        window.dispatchEvent(event);
      }
    }
  ];

  // 🔍 Search & Filter
  const searchCommands = [
    {
      id: 'global-search',
      label: 'Global Search',
      icon: <Search size={16} />,
      section: '🔍 Search & Filter',
      shortcut: 'Ctrl+Shift+F',
      action: () => {
        const event = new CustomEvent('globalSearch');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'filter-by-date',
      label: 'Filter by Date',
      icon: <Calendar size={16} />,
      section: '🔍 Search & Filter',
      action: () => {
        const event = new CustomEvent('filterByDate');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'filter-by-tag',
      label: 'Filter by Tag',
      icon: <Tag size={16} />,
      section: '🔍 Search & Filter',
      action: () => {
        const event = new CustomEvent('filterByTag');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'sort-notes',
      label: 'Sort Notes',
      icon: <SortAsc size={16} />,
      section: '🔍 Search & Filter',
      action: () => {
        const event = new CustomEvent('sortNotes');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'search-content',
      label: 'Search in Content',
      icon: <FileText size={16} />,
      section: '🔍 Search & Filter',
      shortcut: 'Ctrl+Shift+G',
      action: () => {
        const event = new CustomEvent('searchContent');
        window.dispatchEvent(event);
      }
    }
  ];

  // 📤 Export & Share
  const exportCommands = [
    {
      id: 'export-pdf',
      label: 'Export as PDF',
      icon: <Download size={16} />,
      section: '📤 Export & Share',
      shortcut: 'Ctrl+E',
      action: () => {
        const event = new CustomEvent('exportPDF');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'export-markdown',
      label: 'Export as Markdown',
      icon: <Code size={16} />,
      section: '📤 Export & Share',
      action: () => {
        const event = new CustomEvent('exportMarkdown');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'export-docx',
      label: 'Export as Word Document',
      icon: <FileText size={16} />,
      section: '📤 Export & Share',
      action: () => {
        const event = new CustomEvent('exportDOCX');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'share-link',
      label: 'Share Link',
      icon: <Link size={16} />,
      section: '📤 Export & Share',
      shortcut: 'Ctrl+Shift+L',
      action: () => {
        const event = new CustomEvent('shareLink');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'share-email',
      label: 'Share via Email',
      icon: <Mail size={16} />,
      section: '📤 Export & Share',
      action: () => {
        const event = new CustomEvent('shareEmail');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'copy-as-html',
      label: 'Copy as HTML',
      icon: <Code size={16} />,
      section: '📤 Export & Share',
      action: () => {
        const event = new CustomEvent('copyHTML');
        window.dispatchEvent(event);
      }
    }
  ];

  // ⚙️ Settings & Preferences
  const settingsCommands = [
    {
      id: 'toggle-theme',
      label: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: isDarkMode ? <Sun size={16} /> : <Moon size={16} />,
      section: '⚙️ Settings',
      shortcut: 'Ctrl+Shift+T',
      action: () => setIsDarkMode(!isDarkMode)
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      icon: <Sidebar size={16} />,
      section: '⚙️ Settings',
      shortcut: 'Ctrl+B',
      action: () => {
        const event = new CustomEvent('toggleSidebar');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'focus-mode',
      label: 'Toggle Focus Mode',
      icon: <Eye size={16} />,
      section: '⚙️ Settings',
      shortcut: 'Ctrl+Shift+F',
      action: () => {
        const event = new CustomEvent('toggleFocusMode');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'zen-mode',
      label: 'Toggle Zen Mode',
      icon: <EyeOff size={16} />,
      section: '⚙️ Settings',
      shortcut: 'F11',
      action: () => {
        const event = new CustomEvent('toggleZenMode');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'toggle-spellcheck',
      label: 'Toggle Spellcheck',
      icon: <CheckCircle size={16} />,
      section: '⚙️ Settings',
      action: () => {
        const event = new CustomEvent('toggleSpellcheck');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'change-font',
      label: 'Change Font',
      icon: <Type size={16} />,
      section: '⚙️ Settings',
      action: () => {
        const event = new CustomEvent('changeFont');
        window.dispatchEvent(event);
      }
    }
  ];

  // 🚀 Quick Actions
  const quickActionCommands = [
    {
      id: 'quick-capture',
      label: 'Quick Capture',
      icon: <Zap size={16} />,
      section: '🚀 Quick Actions',
      shortcut: 'Ctrl+Q',
      action: () => {
        const event = new CustomEvent('quickCapture');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'refresh-page',
      label: 'Refresh',
      icon: <RefreshCw size={16} />,
      section: '🚀 Quick Actions',
      shortcut: 'Ctrl+R',
      action: () => window.location.reload()
    },
    {
      id: 'copy-current-url',
      label: 'Copy Current URL',
      icon: <Link size={16} />,
      section: '🚀 Quick Actions',
      action: () => {
        navigator.clipboard.writeText(window.location.href);
      }
    },
    {
      id: 'toggle-fullscreen',
      label: 'Toggle Fullscreen',
      icon: <Maximize size={16} />,
      section: '🚀 Quick Actions',
      shortcut: 'F11',
      action: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    },
    {
      id: 'print-page',
      label: 'Print Page',
      icon: <FileText size={16} />,
      section: '🚀 Quick Actions',
      shortcut: 'Ctrl+P',
      action: () => window.print()
    }
  ];

  // 👥 Community & Social
  const communityCommands = [
    {
      id: 'create-post',
      label: 'Create Community Post',
      icon: <Plus size={16} />,
      section: '👥 Community',
      action: () => navigate('/communities/create-post')
    },
    {
      id: 'join-community',
      label: 'Join Community',
      icon: <Users size={16} />,
      section: '👥 Community',
      action: () => {
        const event = new CustomEvent('joinCommunity');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'send-message',
      label: 'Send Message',
      icon: <MessageSquare size={16} />,
      section: '👥 Community',
      shortcut: 'Ctrl+M',
      action: () => navigate('/messages')
    },
    {
      id: 'add-friend',
      label: 'Add Friend',
      icon: <Plus size={16} />,
      section: '👥 Community',
      action: () => {
        const event = new CustomEvent('addFriend');
        window.dispatchEvent(event);
      }
    }
  ];

  // 🔧 Developer Tools
  const devCommands = [
    {
      id: 'open-devtools',
      label: 'Open Developer Tools',
      icon: <Terminal size={16} />,
      section: '🔧 Developer',
      shortcut: 'F12',
      action: () => {
        // This will only work in development
        if (process.env.NODE_ENV === 'development') {
          window.open('', '', 'width=800,height=600');
        }
      }
    },
    {
      id: 'view-source',
      label: 'View Page Source',
      icon: <Code size={16} />,
      section: '🔧 Developer',
      shortcut: 'Ctrl+U',
      action: () => {
        const newWindow = window.open();
        newWindow.document.write('<pre>' + document.documentElement.outerHTML.replace(/</g, '&lt;') + '</pre>');
      }
    },
    {
      id: 'clear-cache',
      label: 'Clear Cache',
      icon: <Trash2 size={16} />,
      section: '🔧 Developer',
      action: () => {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    }
  ];

  // 📝 Note-specific commands (only when on note page)
  const noteCommands = isNotePage ? [
    {
      id: 'save-note',
      label: 'Save Note',
      icon: <Save size={16} />,
      section: '📝 Note Actions',
      shortcut: 'Ctrl+S',
      action: () => {
        const event = new CustomEvent('saveNote');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'delete-note',
      label: 'Delete Current Note',
      icon: <Trash2 size={16} />,
      section: '�� Note Actions',
      destructive: true,
      action: () => {
        const event = new CustomEvent('deleteNote');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'duplicate-note',
      label: 'Duplicate Note',
      icon: <Copy size={16} />,
      section: '📝 Note Actions',
      shortcut: 'Ctrl+D',
      action: () => {
        const event = new CustomEvent('duplicateNote');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'star-note',
      label: 'Add to Favorites',
      icon: <Star size={16} />,
      section: '📝 Note Actions',
      shortcut: 'Ctrl+Shift+S',
      action: () => {
        const event = new CustomEvent('starNote');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'add-to-folder',
      label: 'Move to Folder',
      icon: <Folder size={16} />,
      section: '📝 Note Actions',
      action: () => {
        const event = new CustomEvent('moveToFolder');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'word-count',
      label: 'Show Word Count',
      icon: <Hash size={16} />,
      section: '📝 Note Actions',
      action: () => {
        const event = new CustomEvent('showWordCount');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'reading-time',
      label: 'Show Reading Time',
      icon: <Clock size={16} />,
      section: '📝 Note Actions',
      action: () => {
        const event = new CustomEvent('showReadingTime');
        window.dispatchEvent(event);
      }
    }
  ] : [];

  // ✏️ Text formatting commands (only when editor is available)
  const formatCommands = editor ? [
    {
      id: 'format-bold',
      label: 'Toggle Bold',
      icon: <Bold size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+B',
      active: editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run()
    },
    {
      id: 'format-italic',
      label: 'Toggle Italic',
      icon: <Italic size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+I',
      active: editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run()
    },
    {
      id: 'format-underline',
      label: 'Toggle Underline',
      icon: <Underline size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+U',
      active: editor.isActive('underline'),
      action: () => editor.chain().focus().toggleUnderline().run()
    },
    {
      id: 'format-strike',
      label: 'Toggle Strikethrough',
      icon: <Strikethrough size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+Shift+X',
      active: editor.isActive('strike'),
      action: () => editor.chain().focus().toggleStrike().run()
    },
    {
      id: 'format-h1',
      label: 'Heading 1',
      icon: <Heading1 size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+1',
      active: editor.isActive('heading', { level: 1 }),
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      id: 'format-h2',
      label: 'Heading 2',
      icon: <Heading2 size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+2',
      active: editor.isActive('heading', { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      id: 'format-h3',
      label: 'Heading 3',
      icon: <Heading3 size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+3',
      active: editor.isActive('heading', { level: 3 }),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      id: 'format-paragraph',
      label: 'Normal Text',
      icon: <FileText size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+0',
      active: editor.isActive('paragraph'),
      action: () => editor.chain().focus().setParagraph().run()
    },
    {
      id: 'format-bullet-list',
      label: 'Bullet List',
      icon: <List size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+Shift+8',
      active: editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run()
    },
    {
      id: 'format-ordered-list',
      label: 'Numbered List',
      icon: <ListOrdered size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+Shift+7',
      active: editor.isActive('orderedList'),
      action: () => editor.chain().focus().toggleOrderedList().run()
    },
    {
      id: 'format-blockquote',
      label: 'Quote Block',
      icon: <Quote size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+Shift+9',
      active: editor.isActive('blockquote'),
      action: () => editor.chain().focus().toggleBlockquote().run()
    },
    {
      id: 'format-code-block',
      label: 'Code Block',
      icon: <Code size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+Shift+C',
      action: () => {
        const event = new CustomEvent('insertCodeBlock');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'insert-link',
      label: 'Insert Link',
      icon: <Link size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+K',
      action: () => {
        const event = new CustomEvent('insertLink');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'insert-image',
      label: 'Insert Image',
      icon: <Image size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+Shift+I',
      action: () => {
        const event = new CustomEvent('insertImage');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'insert-table',
      label: 'Insert Table',
      icon: <Grid size={16} />,
      section: '✏️ Text Formatting',
      action: () => {
        const event = new CustomEvent('insertTable');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'insert-divider',
      label: 'Insert Horizontal Rule',
      icon: <Minus size={16} />,
      section: '✏️ Text Formatting',
      shortcut: 'Ctrl+Shift+-',
      action: () => {
        const event = new CustomEvent('insertDivider');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'align-left',
      label: 'Align Left',
      icon: <AlignLeft size={16} />,
      section: '✏️ Text Formatting',
      action: () => {
        const event = new CustomEvent('alignLeft');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'align-center',
      label: 'Align Center',
      icon: <AlignCenter size={16} />,
      section: '✏️ Text Formatting',
      action: () => {
        const event = new CustomEvent('alignCenter');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'align-right',
      label: 'Align Right',
      icon: <AlignRight size={16} />,
      section: '✏️ Text Formatting',
      action: () => {
        const event = new CustomEvent('alignRight');
        window.dispatchEvent(event);
      }
    },
    {
      id: 'edit-undo',
      label: 'Undo',
      icon: <Undo size={16} />,
      section: '✏️ Edit Actions',
      shortcut: 'Ctrl+Z',
      disabled: !editor.can().undo(),
      action: () => editor.chain().focus().undo().run()
    },
    {
      id: 'edit-redo',
      label: 'Redo',
      icon: <Redo size={16} />,
      section: '✏️ Edit Actions',
      shortcut: 'Ctrl+Y',
      disabled: !editor.can().redo(),
      action: () => editor.chain().focus().redo().run()
    }
  ] : [];

  // 📋 Clipboard & Data
  const clipboardCommands = [
    {
      id: 'copy-page-title',
      label: 'Copy Page Title',
      icon: <Copy size={16} />,
      section: '📋 Clipboard',
      action: () => {
        navigator.clipboard.writeText(document.title);
      }
    },
    {
      id: 'copy-selection',
      label: 'Copy Selected Text',
      icon: <Clipboard size={16} />,
      section: '📋 Clipboard',
      shortcut: 'Ctrl+C',
      action: () => {
        document.execCommand('copy');
      }
    },
    {
      id: 'paste-plain',
      label: 'Paste as Plain Text',
      icon: <FileText size={16} />,
      section: '📋 Clipboard',
      shortcut: 'Ctrl+Shift+V',
      action: () => {
        const event = new CustomEvent('pastePlain');
        window.dispatchEvent(event);
      }
    }
  ];

  // 🌐 External Links
  const externalCommands = [
    {
      id: 'open-github',
      label: 'Open GitHub',
      icon: <GitHub size={16} />,
      section: '🌐 External Links',
      action: () => window.open('https://github.com', '_blank')
    },
    {
      id: 'open-stackoverflow',
      label: 'Open Stack Overflow',
      icon: <ExternalLink size={16} />,
      section: '🌐 External Links',
      action: () => window.open('https://stackoverflow.com', '_blank')
    },
    {
      id: 'open-docs',
      label: 'Open Documentation',
      icon: <Book size={16} />,
      section: '🌐 External Links',
      action: () => window.open('https://docs.example.com', '_blank')
    }
  ];

  // Build final command list based on context
  commands = [
    ...navigationCommands,
    ...aiCommands,
    ...organizationCommands,
    ...searchCommands,
    ...exportCommands,
    ...settingsCommands,
    ...quickActionCommands,
    ...communityCommands,
    ...devCommands,
    ...noteCommands,
    ...formatCommands,
    ...clipboardCommands,
    ...externalCommands
  ];

  return commands;
};

export const CommandPaletteProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [editor, setEditor] = useState(null);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, setIsDarkMode } = useTheme();

  const commands = getCommands(location, editor, navigate, setIsDarkMode, isDarkMode);
  
  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.section.toLowerCase().includes(query.toLowerCase()) ||
    (cmd.shortcut && cmd.shortcut.toLowerCase().includes(query.toLowerCase()))
  );

  const openPalette = () => {
    setIsOpen(true);
    setQuery('');
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closePalette = () => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const executeCommand = (command) => {
    if (command.disabled) return;
    command.action();
    closePalette();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Open palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }

      // Quick shortcuts that work without opening palette
      if ((e.ctrlKey || e.metaKey) && !isOpen) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            navigate('/dashboard');
            return;
          case 'n':
            e.preventDefault();
            navigate('/page');
            return;
          case 'j':
            e.preventDefault();
            const aiEvent = new CustomEvent('openAIAssistant');
            window.dispatchEvent(aiEvent);
            return;
          case 'b':
            if (e.shiftKey) return; // Let Ctrl+Shift+B work normally
            e.preventDefault();
            const sidebarEvent = new CustomEvent('toggleSidebar');
            window.dispatchEvent(sidebarEvent);
            return;
          case 'f':
            if (!e.shiftKey) {
              e.preventDefault();
              navigate('/favorites');
              return;
            }
            break;
          case 't':
            if (e.shiftKey) {
              e.preventDefault();
              setIsDarkMode(!isDarkMode);
              return;
            }
            break;
          case 'q':
            e.preventDefault();
            const captureEvent = new CustomEvent('quickCapture');
            window.dispatchEvent(captureEvent);
            return;
        }
      }

      if (!isOpen) return;

      // Navigation within palette
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowDown':
        case 'Tab':
          setActiveIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          if (filteredCommands.length > 0) {
            executeCommand(filteredCommands[activeIndex]);
          }
          break;
        case 'Escape':
          closePalette();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, activeIndex, navigate, isDarkMode, setIsDarkMode]);

  // Auto-scroll active item into view
  useEffect(() => {
    const activeElement = itemRefs.current[activeIndex];
    if (activeElement) {
      activeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [activeIndex]);

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const registerEditor = (editorInstance) => {
    setEditor(editorInstance);
  };

  const value = {
    isOpen,
    openPalette,
    closePalette,
    registerEditor
  };

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {isOpen && (
        <PaletteModal onClick={closePalette}>
          <PaletteContainer onClick={(e) => e.stopPropagation()}>
            <SearchSection>
              <SearchIcon>⌘</SearchIcon>
              <SearchInput
                ref={inputRef}
                placeholder="Type a command, shortcut, or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <ClearButton onClick={() => setQuery('')}>
                  ✕
                </ClearButton>
              )}
            </SearchSection>

            <ResultsSection>
              {filteredCommands.length === 0 ? (
                <EmptyState>
                  <div>No commands found for "{query}"</div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
                    Try searching for actions like "create", "export", "theme", or "ai"
                  </div>
                </EmptyState>
              ) : (
                <>
                  {[...new Set(filteredCommands.map(cmd => cmd.section))].map(section => (
                    <SectionGroup key={section}>
                      <SectionTitle>{section}</SectionTitle>
                      {filteredCommands
                        .filter(cmd => cmd.section === section)
                        .map((cmd) => {
                          const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                          return (
                            <CommandItem
                              key={cmd.id}
                              ref={el => itemRefs.current[globalIndex] = el}
                              $active={globalIndex === activeIndex}
                              $destructive={cmd.destructive}
                              $disabled={cmd.disabled}
                              onMouseEnter={() => setActiveIndex(globalIndex)}
                              onClick={() => executeCommand(cmd)}
                            >
                              <ItemLeft $active={cmd.active}>
                                <ItemIcon $active={cmd.active}>
                                  {cmd.icon}
                                </ItemIcon>
                                <ItemLabel>{cmd.label}</ItemLabel>
                              </ItemLeft>
                              
                              <ItemRight>
                                {cmd.active && <ActiveBadge>●</ActiveBadge>}
                                {cmd.shortcut && <Shortcut>{cmd.shortcut}</Shortcut>}
                              </ItemRight>
                            </CommandItem>
                          );
                        })}
                    </SectionGroup>
                  ))}
                </>
              )}
            </ResultsSection>

            <Footer>
              <FooterHint>
                <kbd>↑↓</kbd> Navigate <kbd>Tab</kbd> Next <kbd>Enter</kbd> Execute <kbd>Esc</kbd> Close
              </FooterHint>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>
                {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''} available
              </div>
            </Footer>
          </PaletteContainer>
        </PaletteModal>
      )}
    </CommandPaletteContext.Provider>
  );
};

// Styled Components (keeping the existing styles)
const PaletteModal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  animation: fadeIn 0.15s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const PaletteContainer = styled.div`
  background: #ffffff;
  width: 100%;
  max-width: 650px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  border: 1px solid #e2e8f0;
  animation: slideIn 0.15s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  
  .dark & {
    border-bottom-color: #334155;
  }
`;

const SearchIcon = styled.span`
  font-size: 18px;
  margin-right: 12px;
  color: #64748b;
  
  .dark & {
    color: #94a3b8;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #1e293b;
  
  &::placeholder {
    color: #94a3b8;
  }
  
  .dark & {
    color: #e2e8f0;
    
    &::placeholder {
      color: #64748b;
    }
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: #f1f5f9;
    color: #64748b;
  }
  
  .dark &:hover {
    background: #334155;
    color: #94a3b8;
  }
`;

const ResultsSection = styled.div`
  max-height: 450px;
  overflow-y: auto;
  padding: 8px 0;
`;

const SectionGroup = styled.div`
  margin-bottom: 8px;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 8px 24px 6px;
  
  .dark & {
    color: #94a3b8;
  }
`;

const CommandItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.1s ease;
  background: ${props => props.$active ? '#f8fafc' : 'transparent'};
  color: ${props => {
    if (props.$disabled) return '#94a3b8';
    if (props.$destructive) return '#ef4444';
    return '#1e293b';
  }};
  
  &:hover {
    background: ${props => props.$disabled ? 'transparent' : '#f8fafc'};
  }
  
  .dark & {
    background: ${props => props.$active ? '#334155' : 'transparent'};
    color: ${props => {
      if (props.$disabled) return '#64748b';
      if (props.$destructive) return '#f87171';
      return '#e2e8f0';
    }};
    
    &:hover {
      background: ${props => props.$disabled ? 'transparent' : '#334155'};
    }
  }
`;

const ItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ItemIcon = styled.div`
  color: ${props => props.$active ? '#3b82f6' : 'inherit'};
  display: flex;
  align-items: center;
`;

const ItemLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const ItemRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActiveBadge = styled.span`
  color: #3b82f6;
  font-size: 12px;
`;

const Shortcut = styled.kbd`
  font-size: 11px;
  background: #f1f5f9;
  color: #64748b;
  padding: 4px 6px;
  border-radius: 4px;
  font-family: inherit;
  font-weight: 500;
  
  .dark & {
    background: #475569;
    color: #cbd5e1;
  }
`;

const Footer = styled.div`
  padding: 12px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .dark & {
    border-top-color: #334155;
    background: #0f172a;
  }
`;

const FooterHint = styled.div`
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 12px;
  
  kbd {
    background: #e2e8f0;
    color: #475569;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
  }
  
  .dark & {
    color: #94a3b8;
    
    kbd {
      background: #475569;
      color: #cbd5e1;
    }
  }
`;

const EmptyState = styled.div`
  padding: 40px 24px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
  
  .dark & {
    color: #94a3b8;
  }
`;

export default CommandPaletteProvider;
