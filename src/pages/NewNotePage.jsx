import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createNote,
  updateNote,
  getNote,
  deleteNote,
  getFolders,
  getRootFolder,
  ensureRootFolder
} from '../lib/firestoreService';
import { auth } from '../lib/firebase';
import { useToast } from '../components/ui/use-toast';
import WordEditor from '../components/WordEditor';
import Sidebar from '../components/Sidebar';
import FolderSelector from '../components/FolderSelector';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Trash2, Star, Menu, Clock, Sun, Moon } from 'lucide-react';
import { initializeNetworkErrorHandler, handleNetworkError } from '../lib/networkErrorHandler';
import Loader from '../components/Loader';

const NewNotePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isDarkMode, setIsDarkMode } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default
  const [note, setNote] = useState({
    title: '',
    content: '',
    pinned: false,
    folderId: 'root'
  });
  const [folders, setFolders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  
  const noteId = searchParams.get('id');

  // Initialize network error handler
  React.useEffect(() => {
    initializeNetworkErrorHandler(toast);
  }, [toast]);

  // Load note data and folders
  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }

      setLoading(true);
      // Auto-hide sidebar when opening a note
      setSidebarOpen(false);

      try {
        // Ensure root folder exists
        await ensureRootFolder();

        // Load folders
        const userFolders = await getFolders();
        setFolders(userFolders);

        // If we have a note ID, load the note
        if (noteId) {
          const noteData = await getNote(noteId);
          if (noteData) {
            setNote({
              title: noteData.title || '',
              content: noteData.content || '',
              pinned: noteData.pinned || false,
              folderId: noteData.folderId || 'root'
            });
            setIsEditing(true);
          } else {
            toast({
              title: "Error",
              description: "Note not found",
              variant: "destructive",
            });
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        handleNetworkError(error, 'loading note data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [noteId, navigate, toast]);

  // Listen for command palette events
  useEffect(() => {
    const handleDeleteNote = () => {
      if (isEditing && noteId) {
        if (window.confirm('Are you sure you want to delete this note?')) {
          // Trigger delete action
          const event = new CustomEvent('triggerDelete', { detail: { noteId } });
          window.dispatchEvent(event);
        }
      }
    };

    const handleDuplicateNote = () => {
      if (isEditing && noteId) {
        // Create a copy of current note
        const duplicateContent = note.content;
        const duplicateTitle = `${note.title} (Copy)`;
        navigate(`/page?title=${encodeURIComponent(duplicateTitle)}&content=${encodeURIComponent(duplicateContent)}`);
      }
    };

    window.addEventListener('deleteNote', handleDeleteNote);
    window.addEventListener('duplicateNote', handleDuplicateNote);

    return () => {
      window.removeEventListener('deleteNote', handleDeleteNote);
      window.removeEventListener('duplicateNote', handleDuplicateNote);
    };
  }, [isEditing, noteId, note.content, note.title, navigate]);

  // Auto-save function with enhanced status tracking
  const handleAutoSave = useCallback(async (content) => {
    if (!auth.currentUser) return;

    setAutoSaveStatus('saving');
    
    try {
      const noteData = {
        title: note.title || 'Untitled Document',
        content: content,
        pinned: note.pinned,
        folderId: note.folderId
      };

      if (isEditing && noteId) {
        // Update existing note
        await updateNote(noteId, noteData);
      } else if (noteData.title.trim() || content.trim()) {
        // Create new note only if there's content
        const docRef = await createNote(
          noteData.title,
          content,
          noteData.folderId
        );
        
        // Navigate to the new note and mark as editing
        navigate(`/page?id=${docRef.id}`, { replace: true });
        setIsEditing(true);
      }
      
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
    }
  }, [auth.currentUser, isEditing, noteId, note.title, note.pinned, note.folderId, navigate]);

  // Handle note field changes
  const handleNoteChange = (field, value) => {
    setNote(prev => ({ ...prev, [field]: value }));
    
    // Trigger auto-save for title changes if editing
    if (field === 'title' && isEditing) {
      handleAutoSave(note.content);
    }
  };

  // Delete note
  const handleDelete = useCallback(async () => {
    if (!isEditing || !noteId) return;

    try {
      await deleteNote(noteId);
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  }, [isEditing, noteId, navigate, toast]);

  // Listen for custom delete trigger event
  useEffect(() => {
    const handleTriggerDelete = (event) => {
      const { noteId: eventNoteId } = event.detail;
      if (eventNoteId === noteId) {
        handleDelete();
      }
    };

    window.addEventListener('triggerDelete', handleTriggerDelete);
    return () => window.removeEventListener('triggerDelete', handleTriggerDelete);
  }, [noteId, handleDelete]);

  // Toggle pin
  const handleTogglePin = async () => {
    const newPinned = !note.pinned;
    handleNoteChange('pinned', newPinned);
    
    if (isEditing && noteId) {
      try {
        await updateNote(noteId, { pinned: newPinned });
        toast({
          title: "Success",
          description: `Note ${newPinned ? 'added to favorites' : 'removed from favorites'}`,
        });
      } catch (error) {
        console.error('Pin toggle error:', error);
        toast({
          title: "Error",
          description: "Failed to update favorite status",
          variant: "destructive",
        });
      }
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Format auto-save status
  const getAutoSaveDisplay = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return { text: 'Saving...', color: 'text-amber-600 dark:text-amber-400' };
      case 'saved':
        return { 
          text: lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Saved', 
          color: 'text-green-600 dark:text-green-400' 
        };
      case 'error':
        return { text: 'Save failed', color: 'text-red-600 dark:text-red-400' };
      default:
        return { text: '', color: '' };
    }
  };

  if (loading) {
    return <Loader />;
  }

  const autoSaveDisplay = getAutoSaveDisplay();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left side */}
            <div className="flex items-center space-x-3 flex-1">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                title="Toggle Sidebar"
              >
                <Menu size={18} />
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                title="Back to Dashboard"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  value={note.title}
                  onChange={(e) => handleNoteChange('title', e.target.value)}
                  placeholder="Untitled Document"
                  className="text-lg font-semibold bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {/* Auto-save status */}
              {autoSaveDisplay.text && (
                <div className={`flex items-center space-x-1 text-xs ${autoSaveDisplay.color}`}>
                  <Clock size={12} />
                  <span>{autoSaveDisplay.text}</span>
                </div>
              )}

              <FolderSelector
                folders={folders}
                selectedFolderId={note.folderId}
                onFolderChange={(folderId) => handleNoteChange('folderId', folderId)}
              />

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <button
                onClick={handleTogglePin}
                className={`p-2 rounded-lg transition-colors ${
                  note.pinned
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
                title={note.pinned ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star size={16} className={note.pinned ? 'fill-current' : ''} />
              </button>

              {isEditing && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete note"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Word Editor */}
        <div className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-0' : 'ml-0'
        }`}>
          <WordEditor
            content={note.content}
            onChange={(content) => handleNoteChange('content', content)}
            onAutoSave={handleAutoSave}
          />
        </div>
      </div>
    </div>
  );
};

export default NewNotePage;
