import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  createNote,
  updateNote,
  getNote,
  deleteNote,
  getFolders,
  getRootFolder,
  ensureRootFolder,
  getNotes,
  getSharedNote,
  updateSharedNote,
  subscribeToSharedNote
} from '../lib/firestoreService';
import { auth } from '../lib/firebase';
import { useToast } from '../components/ui/use-toast';
import OptimizedWordEditor from '../components/OptimizedWordEditor';
import Sidebar from '../components/Sidebar';
import FolderSelector from '../components/FolderSelector';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft,
  Trash2,
  Star,
  Menu,
  Clock,
  Sun,
  Moon,
  Save,
  Share2,
  Download,
  Eye,
  EyeOff,
  Bookmark,
  Tag,
  MoreHorizontal,
  FileText,
  Calendar,
  User,
  Sparkles,
  Focus,
  PanelLeftClose,
  PanelLeft,
  Users
} from 'lucide-react';
import { initializeNetworkErrorHandler, handleNetworkError } from '../lib/networkErrorHandler';
import OptimizedModernLoader from '../components/OptimizedModernLoader';
import AISidebar from '../components/AISidebar';
import CollaborativeCursors from '../components/CollaborativeCursors';
import useCollaboration from '../hooks/useCollaboration';
import ShareNoteModal from '../components/ShareNoteModal';
import SnakeGame from '../components/SnakeGame';
import { aiService } from '../lib/aiService';

const EnhancedNotePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isDarkMode, setIsDarkMode } = useTheme();
  
  // Note state
  const [note, setNote] = useState({
    title: '',
    content: '',
    folderId: '',
    pinned: false,
    tags: []
  });
  
  // UI state
  const [isEdit, setIsEdit] = useState(false);
  const [folders, setFolders] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [aiReadingTime, setAiReadingTime] = useState(null);
  const [lastModified, setLastModified] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharedNote, setIsSharedNote] = useState(false);
  const [originalOwnerId, setOriginalOwnerId] = useState(null);
  const [showSnakeGame, setShowSnakeGame] = useState(false);

  const noteId = searchParams.get('id');
  const ownerId = searchParams.get('owner');

  const autoSaveTimeoutRef = useRef(null);
  const editorRef = useRef(null);

  // Collaboration features
  const {
    collaborators,
    cursors,
    isCollaborating,
    updateCursor,
    shareContentChange,
    joinCollaboration
  } = useCollaboration(noteId);

  // Memoized computed values for performance
  const wordCountAndReadingTime = useMemo(() => {
    const words = note.content.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(words / 250);
    return { words, readingTime };
  }, [note.content]);

  // Enhanced auto-save with better UX
  const handleAutoSave = useCallback(async (content) => {
    if (!note.title && !content.trim()) return;

    setSaving(true);
    try {
      const noteData = {
        ...note,
        content,
        updatedAt: new Date().toISOString()
      };

      if (isEdit && noteId) {
        if (isSharedNote && originalOwnerId) {
          // Update shared note
          await updateSharedNote(noteId, noteData, originalOwnerId);
        } else {
          // Update own note
          await updateNote(noteId, noteData);
        }
      } else if (note.title || content.trim()) {
        const newNote = await createNote({
          ...noteData,
          title: note.title || 'Untitled'
        });

        if (!isEdit) {
          setIsEdit(true);
          const url = new URL(window.location);
          url.searchParams.set('id', newNote.id);
          window.history.replaceState({}, '', url);
        }
      }

      setLastModified(new Date());
      
      // Update word count and reading time
      const words = content.split(/\s+/).filter(word => word.length > 0).length;
      setWordCount(words);
      setReadingTime(Math.ceil(words / 250));

      // Calculate AI-powered reading time for content with sufficient length
      if (content.trim().length > 100) {
        try {
          const aiTimeResult = await aiService.calculateReadingTime(content);
          // Only set if we got a valid result
          if (aiTimeResult && aiTimeResult.estimatedMinutes) {
            setAiReadingTime(aiTimeResult);
          } else {
            setAiReadingTime(null);
          }
        } catch (error) {
          // Don't log warnings for expected scenarios like missing AI keys
          if (error.message !== 'AI_NO_KEYS') {
            console.warn('AI reading time calculation failed:', error);
          }
          setAiReadingTime(null);
        }
      } else {
        setAiReadingTime(null);
      }
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Your changes might not be saved.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [note, isEdit, noteId, toast]);

  // Load note data
  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        await ensureRootFolder();
        
        const [foldersData, notesData] = await Promise.all([
          getFolders(),
          getNotes()
        ]);
        
        setFolders(foldersData);
        setAllNotes(notesData);

        if (noteId) {
          let noteData = null;

          if (ownerId) {
            // This is a shared note
            noteData = await getSharedNote(noteId, ownerId);
            if (noteData) {
              setIsSharedNote(true);
              setOriginalOwnerId(ownerId);
            }
          } else {
            // This is a regular note
            noteData = await getNote(noteId);
          }

          if (noteData) {
            setNote(noteData);
            setIsEdit(true);
            const lastModifiedDate = noteData.updatedAt ?
              (typeof noteData.updatedAt === 'string' ? new Date(noteData.updatedAt) : noteData.updatedAt.toDate()) :
              new Date();
            setLastModified(lastModifiedDate);

            // Calculate initial stats immediately
            const content = noteData.content || '';
            const words = content.split(/\s+/).filter(word => word.length > 0).length;
            setWordCount(words);
            setReadingTime(Math.ceil(words / 250));

            // Calculate AI-powered reading time for existing content
            if (content.trim().length > 100) {
              try {
                const aiTimeResult = await aiService.calculateReadingTime(content);
                // Only set if we got a valid result
                if (aiTimeResult && aiTimeResult.estimatedMinutes) {
                  setAiReadingTime(aiTimeResult);
                } else {
                  setAiReadingTime(null);
                }
              } catch (error) {
                // Don't log warnings for expected scenarios like missing AI keys
                if (error.message !== 'AI_NO_KEYS') {
                  console.warn('AI reading time calculation failed:', error);
                }
                setAiReadingTime(null);
              }
            } else {
              setAiReadingTime(null);
            }

            // Set up real-time subscription for shared notes
            if (isSharedNote && originalOwnerId) {
              const unsubscribe = subscribeToSharedNote(noteId, originalOwnerId, (updatedNote) => {
                if (updatedNote) {
                  setNote(updatedNote);
                  setLastModified(updatedNote.updatedAt ? new Date(updatedNote.updatedAt) : new Date());
                }
              });

              // Clean up subscription on component unmount
              return () => unsubscribe();
            }
          }
        }
      } catch (error) {
        handleNetworkError(error, toast);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [noteId, navigate, toast]);

  // Handle content changes
  const handleContentChange = useCallback((content) => {
    setNote(prev => ({ ...prev, content }));

    // Share content changes in real-time when collaborating
    if (isCollaborating && content !== note.content) {
      shareContentChange({
        content,
        timestamp: Date.now(),
        userId: auth.currentUser?.uid
      });
    }
  }, [isCollaborating, shareContentChange, note.content]);

  // Handle title changes
  const handleTitleChange = useCallback((e) => {
    const title = e.target.value;
    setNote(prev => ({ ...prev, title }));

    // Hidden Easter egg: Snake game for new notes with :play() title
    if (title.toLowerCase().trim() === ':play()' && !isEdit) {
      setShowSnakeGame(true);
    }
  }, [isEdit]);

  // Enhanced save function
  const handleSave = useCallback(async () => {
    if (!note.title && !note.content.trim()) {
      toast({
        title: "Nothing to save",
        description: "Please add a title or content to save the note.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit && noteId) {
        if (isSharedNote && originalOwnerId) {
          // Save shared note
          await updateSharedNote(noteId, note, originalOwnerId);
          toast({
            title: "Note saved",
            description: "Your changes have been saved successfully.",
          });
        } else {
          // Save own note
          await updateNote(noteId, note);
          toast({
            title: "Note saved",
            description: "Your changes have been saved successfully.",
          });
        }
      } else {
        const newNote = await createNote({
          ...note,
          title: note.title || 'Untitled'
        });
        setIsEdit(true);
        const url = new URL(window.location);
        url.searchParams.set('id', newNote.id);
        window.history.replaceState({}, '', url);

        toast({
          title: "Note created",
          description: "Your new note has been created successfully.",
        });
      }
      setLastModified(new Date());
    } catch (error) {
      handleNetworkError(error, toast);
    } finally {
      setSaving(false);
    }
  }, [note, isEdit, noteId, isSharedNote, originalOwnerId, toast]);

  // Toggle pin status
  const handleTogglePin = useCallback(async () => {
    if (!noteId) return;
    
    try {
      const newPinnedState = !note.pinned;
      await updateNote(noteId, { pinned: newPinnedState });
      setNote(prev => ({ ...prev, pinned: newPinnedState }));
      
      toast({
        title: newPinnedState ? "Note pinned" : "Note unpinned",
        description: newPinnedState ? "Note has been pinned to top" : "Note has been unpinned",
      });
    } catch (error) {
      handleNetworkError(error, toast);
    }
  }, [noteId, note.pinned, toast]);

  // Delete note
  const handleDelete = useCallback(async () => {
    if (!noteId || !window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await deleteNote(noteId);
      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully.",
      });
      navigate('/dashboard');
    } catch (error) {
      handleNetworkError(error, toast);
    }
  }, [noteId, navigate, toast]);

  // Export note as PDF
  const handleExport = useCallback(() => {
    const currentDate = new Date().toLocaleDateString();
    const readingTimeText = aiReadingTime ?
      `${aiReadingTime.estimatedMinutes} min read (AI-calculated)` :
      `${readingTime} min read`;

    // Create a styled HTML document for PDF export
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${note.title || 'Untitled'}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #ffffff;
          }

          .header {
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
          }

          .title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1e40af;
            margin: 0 0 0.5rem 0;
          }

          .metadata {
            display: flex;
            gap: 1rem;
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
          }

          .metadata-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }

          .content {
            font-size: 1rem;
            line-height: 1.8;
          }

          .content h1 {
            font-size: 2rem;
            font-weight: 600;
            color: #1e40af;
            margin: 2rem 0 1rem 0;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5rem;
          }

          .content h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e40af;
            margin: 1.5rem 0 0.75rem 0;
          }

          .content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #374151;
            margin: 1.25rem 0 0.5rem 0;
          }

          .content p {
            margin: 0 0 1rem 0;
          }

          .content blockquote {
            border-left: 4px solid #3b82f6;
            margin: 1rem 0;
            padding: 0.5rem 1rem;
            background: #f8fafc;
            font-style: italic;
          }

          .content code {
            background: #f1f5f9;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
          }

          .content pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
          }

          .content ul, .content ol {
            margin: 0 0 1rem 0;
            padding-left: 1.5rem;
          }

          .content li {
            margin: 0.25rem 0;
          }

          .content strong {
            font-weight: 600;
            color: #1f2937;
          }

          .content em {
            font-style: italic;
            color: #4b5563;
          }

          .footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            font-size: 0.75rem;
            color: #9ca3af;
            text-align: center;
          }

          @media print {
            body {
              padding: 1rem;
            }

            .header {
              border-bottom: 2px solid #3b82f6;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${note.title || 'Untitled'}</h1>
          <div class="metadata">
            <div class="metadata-item">📄 ${wordCount} words</div>
            <div class="metadata-item">⏱�� ${readingTimeText}</div>
            <div class="metadata-item">📅 ${currentDate}</div>
          </div>
        </div>

        <div class="content">
          ${note.content || '<p>No content available.</p>'}
        </div>

        <div class="footer">
          Generated from Connected Notes
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing/PDF save
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }, [note, wordCount, readingTime, aiReadingTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey)) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'b':
            e.preventDefault();
            setShowSidebar(prev => !prev);
            break;
          case 'f':
            e.preventDefault();
            setIsFocusMode(prev => !prev);
            break;
          case 'e':
            if (e.shiftKey) {
              e.preventDefault();
              handleExport();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleExport]);

  // Handle AI assistant from navbar and internal events
  useEffect(() => {
    const handleOpenAI = () => setShowAISidebar(true);
    const handleOpenAIChat = () => {
      setShowAISidebar(true);
      // Set chat as active tab in sidebar when opened from navbar
      setTimeout(() => {
        const aiSidebar = document.querySelector('[data-tab-container]');
        if (aiSidebar) {
          const chatTab = aiSidebar.querySelector('[data-tab="chat"]');
          if (chatTab) chatTab.click();
        }
      }, 100);
    };

    // Handle collaborative content changes from other users
    const handleCollaborativeContentChange = (event) => {
      const change = event.detail;
      if (change.userId !== auth.currentUser?.uid && change.content) {
        // Update note content from other collaborator
        setNote(prev => ({
          ...prev,
          content: change.content
        }));
      }
    };

    window.addEventListener('openAIAssistant', handleOpenAI);
    window.addEventListener('openAIChat', handleOpenAIChat);
    window.addEventListener('collaborativeContentChange', handleCollaborativeContentChange);

    return () => {
      window.removeEventListener('openAIAssistant', handleOpenAI);
      window.removeEventListener('openAIChat', handleOpenAIChat);
      window.removeEventListener('collaborativeContentChange', handleCollaborativeContentChange);
    };
  }, []);

  if (loading) return <OptimizedModernLoader />;

  return (
    <PageContainer $focusMode={isFocusMode} $fullscreen={isFullscreen}>
      {/* Enhanced Header */}
      <Header $focusMode={isFocusMode} role="banner">
        <HeaderLeft>
          <IconButton
            onClick={() => navigate('/dashboard')}
            title="Back to dashboard"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </IconButton>

          {!isFocusMode && (
            <IconButton
              onClick={() => setShowSidebar(prev => !prev)}
              title="Toggle sidebar"
              aria-label={showSidebar ? "Close sidebar" : "Open sidebar"}
              aria-expanded={showSidebar}
              $active={showSidebar}
            >
              {showSidebar ? <PanelLeftClose size={20} aria-hidden="true" /> : <PanelLeft size={20} aria-hidden="true" />}
            </IconButton>
          )}

          <TitleInput
            type="text"
            placeholder="Untitled document..."
            value={note.title}
            onChange={handleTitleChange}
            $focusMode={isFocusMode}
            aria-label="Document title"
            aria-describedby="title-help"
          />
          <span id="title-help" className="sr-only">
            Enter the title for your document
          </span>
        </HeaderLeft>

        <HeaderActions $focusMode={isFocusMode}>
          {!isFocusMode && (
            <>
              <StatusIndicator>
                {saving && (
                  <SaveStatus>
                    <div className="spinner" />
                    Saving...
                  </SaveStatus>
                )}
                {!saving && lastModified && (
                  <LastSaved>
                    <Clock size={12} />
                    {lastModified instanceof Date ? lastModified.toLocaleTimeString() : 'Recently saved'}
                  </LastSaved>
                )}
                {isCollaborating && (
                  <CollaborationStatus>
                    <Users size={12} />
                    {collaborators.length} collaborating
                  </CollaborationStatus>
                )}
                {noteId && !isCollaborating && (
                  <CollaborationStatus>
                    <Users size={12} />
                    Ready for collaboration
                  </CollaborationStatus>
                )}
              </StatusIndicator>

              {!isSharedNote && (
                <IconButton
                  onClick={() => setShowShareModal(true)}
                  title="Share note"
                  $active={note.shared}
                >
                  <Share2 size={18} />
                </IconButton>
              )}

              <IconButton onClick={handleTogglePin} title="Pin note" $active={note.pinned}>
                <Star size={18} fill={note.pinned ? 'currentColor' : 'none'} />
              </IconButton>

              <IconButton
                onClick={() => setShowAISidebar(true)}
                title="AI Assistant"
                $active={showAISidebar}
              >
                <Sparkles size={18} />
              </IconButton>


              <IconButton onClick={handleExport} title="Export as PDF (Ctrl+Shift+E)">
                <Download size={18} />
              </IconButton>

              <IconButton onClick={handleSave} title="Save (Ctrl+S)" disabled={saving}>
                <Save size={18} />
              </IconButton>
            </>
          )}

          <IconButton 
            onClick={() => setIsFocusMode(prev => !prev)} 
            title="Focus mode (Ctrl+F)"
            $active={isFocusMode}
          >
            <Focus size={18} />
          </IconButton>

          {isEdit && (
            <IconButton onClick={handleDelete} title="Delete note" $danger>
              <Trash2 size={18} />
            </IconButton>
          )}
        </HeaderActions>
      </Header>

      {/* Document Metadata */}
      {showMetadata && !isFocusMode && (
        <MetadataPanel>
          <MetadataItem>
            <User size={14} />
            <span>{auth.currentUser?.displayName || auth.currentUser?.email}</span>
          </MetadataItem>
          <MetadataItem>
            <FileText size={14} />
            <span>{wordCount} words</span>
          </MetadataItem>
          <MetadataItem title={aiReadingTime ? `AI Analysis: ${aiReadingTime.contentType} content (${aiReadingTime.complexity} complexity) - ${aiReadingTime.adjustmentFactor}` : 'Standard calculation: ~250 words/minute'}>
            <Clock size={14} />
            <span>
              {aiReadingTime ? `${aiReadingTime.estimatedMinutes} min read` : `${readingTime} min read`}
              {aiReadingTime && <span style={{ marginLeft: '4px', fontSize: '0.8em', opacity: 0.7 }}>✨</span>}
            </span>
          </MetadataItem>
          {(note.collaborators && note.collaborators.length > 0) && (
            <MetadataItem>
              <Users size={14} />
              <span>
                {isSharedNote ? 'Shared with you' : `Shared with ${note.collaborators.length} ${note.collaborators.length === 1 ? 'person' : 'people'}`}
              </span>
            </MetadataItem>
          )}
          {note.lastEditBy && note.lastEditBy.uid !== auth.currentUser?.uid && (
            <MetadataItem>
              <User size={14} />
              <span>Last edited by {note.lastEditBy.displayName}</span>
            </MetadataItem>
          )}
          {lastModified && (
            <MetadataItem>
              <Calendar size={14} />
              <span>Modified {lastModified instanceof Date ? lastModified.toLocaleDateString() : 'Recently'}</span>
            </MetadataItem>
          )}
        </MetadataPanel>
      )}

      {/* Main Content */}
      <MainContent>
        {/* Sidebar */}
        {showSidebar && !isFocusMode && (
          <SidebarContainer>
            <Sidebar
              open={showSidebar}
              onClose={() => setShowSidebar(false)}
            />
          </SidebarContainer>
        )}

        {/* Editor */}
        <EditorContainer $sidebarOpen={showSidebar && !isFocusMode} $focusMode={isFocusMode}>
          <OptimizedWordEditor
            ref={editorRef}
            content={note.content}
            onChange={handleContentChange}
            onAutoSave={handleAutoSave}
            onCursorMove={(position) => {
              if (isCollaborating) {
                updateCursor(position);
              }
            }}
          />

          {/* Collaborative cursors overlay */}
          {isCollaborating && (
            <CollaborativeCursors editorRef={editorRef} />
          )}
        </EditorContainer>
      </MainContent>

      {/* AI Sidebar */}
      <AISidebar
        isOpen={showAISidebar}
        onClose={() => setShowAISidebar(false)}
        notes={allNotes}
        currentNote={note}
        selectedText=""
        onApplyText={(text) => {
          setNote(prev => ({ ...prev, content: prev.content + text }));
        }}
        onUpdateNote={(updatedNote) => {
          setNote(updatedNote);
          // Force editor update
          handleContentChange(updatedNote.content);
        }}
      />

      {/* Share Modal */}
      <ShareNoteModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        note={note}
        onNoteUpdate={async () => {
          // Refresh note data to show updated collaborators
          if (noteId) {
            try {
              let noteData = null;
              if (isSharedNote && originalOwnerId) {
                noteData = await getSharedNote(noteId, originalOwnerId);
              } else {
                noteData = await getNote(noteId);
              }
              if (noteData) {
                setNote(noteData);
              }
            } catch (error) {
              console.error('Error refreshing note:', error);
            }
          }
        }}
      />

    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme?.isDark ?
    'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' :
    'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
  overflow: hidden;
  position: ${props => props.$fullscreen ? 'fixed' : 'relative'};
  top: ${props => props.$fullscreen ? '0' : 'auto'};
  left: ${props => props.$fullscreen ? '0' : 'auto'};
  right: ${props => props.$fullscreen ? '0' : 'auto'};
  bottom: ${props => props.$fullscreen ? '0' : 'auto'};
  z-index: ${props => props.$fullscreen ? '9999' : '1'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.$focusMode ? '0.75rem 1rem' : '1rem 1.5rem'};
  border-bottom: 1px solid ${props => props.theme?.isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'};
  background: ${props => props.theme?.isDark ?
    'rgba(30, 41, 59, 0.8)' :
    'rgba(255, 255, 255, 0.9)'};
  backdrop-filter: blur(20px) saturate(180%);
  position: sticky;
  top: 0;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.theme?.isDark ?
    '0 4px 24px rgba(0, 0, 0, 0.1)' :
    '0 4px 24px rgba(0, 0, 0, 0.05)'};

  &:hover {
    box-shadow: ${props => props.theme?.isDark ?
      '0 8px 32px rgba(0, 0, 0, 0.15)' :
      '0 8px 32px rgba(0, 0, 0, 0.08)'};
  }

  @media (max-width: 768px) {
    padding: ${props => props.$focusMode ? '0.5rem 0.75rem' : '0.75rem 1rem'};
    flex-wrap: nowrap;
    gap: 0.5rem;
  }

  @media (max-width: 640px) {
    padding: 0.5rem 0.75rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: ${props => props.$focusMode ? '0.6' : '1'};
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }

  @media (max-width: 768px) {
    gap: 0.25rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  @media (max-width: 640px) {
    gap: 0.25rem;

    /* Hide less important buttons on very small screens */
    > button:nth-child(n+4) {
      display: none;
    }
  }

  @media (max-width: 480px) {
    /* Show only essential buttons */
    > button:nth-child(n+3) {
      display: none;
    }
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: ${props =>
    props.$active ?
      (props.$danger ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)') :
      props.theme?.isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.08)'
  };
  color: ${props =>
    props.$active ?
      '#ffffff' :
      (props.$danger ? '#ef4444' : props.theme?.isDark ? '#e2e8f0' : '#475569')
  };
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.$active ?
    '0 4px 12px rgba(59, 130, 246, 0.25)' :
    '0 2px 4px rgba(0, 0, 0, 0.1)'};
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.theme?.isDark ?
      'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' :
      'radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)'};
    transform: scale(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    background: ${props =>
      props.$danger ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
      props.$active ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' :
      props.theme?.isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.15)'
    };
    color: ${props => props.$danger || props.$active ? '#ffffff' : 'inherit'};
    transform: translateY(-2px) scale(1.05);
    box-shadow: ${props => props.$active ?
      '0 8px 24px rgba(59, 130, 246, 0.35)' :
      '0 8px 16px rgba(0, 0, 0, 0.15)'};

    &::before {
      transform: scale(1);
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    &:hover {
      transform: none;
    }
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  @media (max-width: 640px) {
    width: 30px;
    height: 30px;

    &:hover {
      transform: translateY(-1px) scale(1.02);
    }
  }

  /* Touch-friendly sizing for mobile */
  @media (max-width: 480px) {
    min-width: 40px;
    min-height: 40px;
    width: 40px;
    height: 40px;
  }
`;

const TitleInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: ${props => props.$focusMode ? '1.25rem' : '1.5rem'};
  font-weight: 700;
  color: ${props => props.theme?.isDark ? '#f1f5f9' : '#1e293b'};
  outline: none;
  padding: 0.5rem 0;
  min-width: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &::placeholder {
    color: ${props => props.theme?.isDark ? '#64748b' : '#94a3b8'};
    transition: opacity 0.2s ease;
  }

  &:focus {
    background: ${props => props.theme?.isDark ?
      'rgba(51, 65, 85, 0.4)' :
      'rgba(241, 245, 249, 0.7)'};
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    box-shadow: ${props => props.theme?.isDark ?
      '0 0 0 3px rgba(59, 130, 246, 0.1)' :
      '0 0 0 3px rgba(59, 130, 246, 0.1)'};
    transform: scale(1.01);

    &::placeholder {
      opacity: 0.6;
    }
  }

  &:hover:not(:focus) {
    background: ${props => props.theme?.isDark ?
      'rgba(51, 65, 85, 0.2)' :
      'rgba(241, 245, 249, 0.3)'};
    border-radius: 6px;
    padding: 0.5rem 0.5rem;
  }

  @media (max-width: 768px) {
    font-size: ${props => props.$focusMode ? '1.1rem' : '1.25rem'};
    padding: 0.4rem 0;
  }

  @media (max-width: 640px) {
    font-size: 1.1rem;
    padding: 0.3rem 0;

    &:focus {
      padding: 0.4rem 0.5rem;
      transform: none;
    }

    &:hover:not(:focus) {
      padding: 0.3rem 0.25rem;
    }
  }

  @media (max-width: 480px) {
    font-size: 1rem;

    &::placeholder {
      font-size: 0.9rem;
    }
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.5rem;
`;

const SaveStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #f59e0b;

  .spinner {
    width: 12px;
    height: 12px;
    border: 1px solid currentColor;
    border-top: 1px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LastSaved = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #10b981;
`;

const MetadataPanel = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: ${props => props.theme?.isDark ? '#0f172a' : '#f8fafc'};
  border-bottom: 1px solid ${props => props.theme?.isDark ? '#1e293b' : '#e2e8f0'};
  font-size: 0.875rem;
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${props => props.theme?.isDark ? '#94a3b8' : '#64748b'};
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const SidebarContainer = styled.div`
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid ${props => props.theme?.isDark ? '#1e293b' : '#e2e8f0'};
  overflow-y: auto;
`;

const EditorContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-left: ${props => props.$sidebarOpen && !props.$focusMode ? '0' : '0'};
  transition: margin 0.3s ease;
  position: relative;
`;

const CollaborationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #22c55e;
  font-weight: 500;
  margin-left: 8px;
  padding: 4px 8px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%);
  border-radius: 16px;
  border: 1px solid rgba(34, 197, 94, 0.3);
  backdrop-filter: blur(10px);
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
    background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.2), transparent);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
  }

  .dark & {
    color: #4ade80;
    background: linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0.05) 100%);
    border-color: rgba(74, 222, 128, 0.3);

    &::before {
      background: linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.2), transparent);
    }
  }
`;

export default EnhancedNotePage;
