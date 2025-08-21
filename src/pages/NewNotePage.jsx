import React, { useState, useEffect, useRef } from 'react';
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
import OptimizedWordEditor from '../components/OptimizedWordEditor';
import Sidebar from '../components/Sidebar';
import FolderSelector from '../components/FolderSelector';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Trash2, Star, Menu, Clock, Sun, Moon } from 'lucide-react';
import { initializeNetworkErrorHandler, handleNetworkError } from '../lib/networkErrorHandler';
import OptimizedModernLoader from '../components/OptimizedModernLoader';
import AISidebar from '../components/AISidebar';
import AITextMenu from '../components/AITextMenu';
import AIInlineSuggestions from '../components/AIInlineSuggestions';
import AIToolbar from '../components/AIToolbar';
import OptimizedAIFloatingButton from '../components/OptimizedAIFloatingButton';

const NewNotePage = () => {
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
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [textMenuPosition, setTextMenuPosition] = useState({ x: 0, y: 0 });
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [autoSaveDisplay, setAutoSaveDisplay] = useState({ text: '', color: '' });
  
  // Auto-save timer
  const autoSaveTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef('');

  useEffect(() => {
    initializeNetworkErrorHandler();
    loadFolders();
    loadAllNotes();
    
    const noteId = searchParams.get('id');
    if (noteId) {
      setIsEdit(true);
      loadNote(noteId);
    } else {
      initializeNewNote();
    }
  }, [searchParams]);

  const loadFolders = async () => {
    try {
      const userFolders = await getFolders();
      setFolders(userFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadAllNotes = async () => {
    try {
      // Import the getAllNotes function
      const { getNotes } = await import('../lib/firestoreService');
      const userNotes = await getNotes();
      setAllNotes(userNotes || []);
    } catch (error) {
      console.error('Error loading all notes:', error);
      setAllNotes([]);
    }
  };

  const loadNote = async (noteId) => {
    setLoading(true);
    try {
      const noteData = await getNote(noteId);
      if (noteData) {
        setNote(noteData);
        lastSavedContentRef.current = noteData.content;
      } else {
        toast({
          title: "Note not found",
          description: "The note you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      handleNetworkError(error, {
        onRetry: () => loadNote(noteId),
        toast
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeNewNote = async () => {
    try {
      const rootFolder = await ensureRootFolder();
      setNote(prev => ({
        ...prev,
        folderId: rootFolder.id
      }));
    } catch (error) {
      console.error('Error initializing new note:', error);
    }
  };

  const handleNoteChange = (field, value) => {
    setNote(prev => ({ ...prev, [field]: value }));
    
    if (field === 'content') {
      scheduleAutoSave(value);
    }
  };

  const scheduleAutoSave = (content) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only auto-save if content has actually changed
    if (content === lastSavedContentRef.current) {
      return;
    }

    setAutoSaveDisplay({ text: 'Saving...', color: 'text-yellow-600' });

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        if (isEdit && note.id) {
          await updateNote(note.id, { ...note, content });
          lastSavedContentRef.current = content;
          setAutoSaveDisplay({ 
            text: `Saved at ${new Date().toLocaleTimeString()}`, 
            color: 'text-green-600' 
          });
        }
        
        // Clear the saved message after 3 seconds
        setTimeout(() => {
          setAutoSaveDisplay({ text: '', color: '' });
        }, 3000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        const errorMessage = error.message || 'Unknown error occurred';
        setAutoSaveDisplay({
          text: 'Save failed - ' + (
            errorMessage.includes('network') ? 'Check connection' :
            errorMessage.includes('permission') ? 'Auth error' :
            errorMessage.includes('unavailable') ? 'Try again later' :
            'Error occurred'
          ),
          color: 'text-red-600'
        });
      }
    }, 1000);
  };

  const handleSave = async () => {
    if (!note.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateNote(note.id, note);
        toast({
          title: "Note updated",
          description: "Your note has been successfully updated.",
        });
      } else {
        const newNote = await createNote(note);
        setNote(newNote);
        setIsEdit(true);
        
        // Update URL to reflect the new note
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', newNote.id);
        window.history.replaceState({}, '', newUrl);
        
        toast({
          title: "Note created",
          description: "Your note has been successfully created.",
        });
      }
      lastSavedContentRef.current = note.content;
    } catch (error) {
      handleNetworkError(error, {
        onRetry: handleSave,
        toast
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !note.id) return;

    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(note.id);
        toast({
          title: "Note deleted",
          description: "Your note has been successfully deleted.",
        });
        navigate('/dashboard');
      } catch (error) {
        handleNetworkError(error, {
          onRetry: handleDelete,
          toast
        });
      }
    }
  };

  const handleTogglePin = async () => {
    const newPinnedState = !note.pinned;
    setNote(prev => ({ ...prev, pinned: newPinnedState }));
    
    if (isEdit && note.id) {
      try {
        await updateNote(note.id, { ...note, pinned: newPinnedState });
        toast({
          title: newPinnedState ? "Note pinned" : "Note unpinned",
          description: newPinnedState ? "Note added to favorites." : "Note removed from favorites.",
        });
      } catch (error) {
        // Revert the state change on error
        setNote(prev => ({ ...prev, pinned: !newPinnedState }));
        console.error('Error updating pin status:', error);
      }
    }
  };

  const handleTextSelection = (text, position) => {
    setSelectedText(text);
    setTextMenuPosition(position);
    setShowTextMenu(true);
  };

  const handleInsertText = (text) => {
    setNote(prev => ({ ...prev, content: prev.content + text }));
  };

  const handleAIAction = (action, text) => {
    // Handle AI actions here
    console.log('AI Action:', action, text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <OptimizedModernLoader size={60} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'dark bg-slate-900' : 'bg-white'}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />

      {/* AI Sidebar */}
      <AISidebar
        isOpen={showAISidebar}
        onClose={() => setShowAISidebar(false)}
        notes={allNotes}
        currentNote={note}
        selectedText={selectedText}
        onApplyText={handleInsertText}
      />

      {/* Main Content */}
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
              title="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 lg:hidden"
              title="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Untitled"
                value={note.title}
                onChange={(e) => handleNoteChange('title', e.target.value)}
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
              onClick={() => setShowAISidebar(!showAISidebar)}
              className={`p-2 rounded-lg transition-colors ${
                showAISidebar
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400'
              }`}
              title="Toggle AI Assistant"
            >
              ✨
            </button>

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
              <Star size={16} fill={note.pinned ? 'currentColor' : 'none'} />
            </button>

            {isEdit && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                title="Delete note"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
            >
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative">
          <OptimizedWordEditor
            content={note.content}
            onChange={(content) => handleNoteChange('content', content)}
            onAutoSave={(content) => {
              if (isEdit && note.id) {
                return updateNote(note.id, { ...note, content });
              }
            }}
          />
        </div>
      </div>

      {/* AI Text Menu */}
      {showTextMenu && (
        <div style={{ position: 'fixed', left: textMenuPosition.x, top: textMenuPosition.y, zIndex: 1000 }}>
          <AIToolbar
            selectedText={selectedText}
            onAction={handleAIAction}
            disabled={loading}
          />
        </div>
      )}

      {showSuggestions && suggestionPosition && (
        <AIInlineSuggestions
          content={note.content}
          position={suggestionPosition}
          onInsert={handleInsertText}
          onClose={() => setShowSuggestions(false)}
        />
      )}

      {/* AI Floating Button */}
      <OptimizedAIFloatingButton
        isVisible={!showAISidebar && note.content && note.content.length > 100}
        onOpenSidebar={() => setShowAISidebar(true)}
        onQuickAction={(action) => {
          setShowAISidebar(true);
        }}
      />
    </div>
  );
};

export default NewNotePage;
