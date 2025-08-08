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
import VSCodeEditor from '../components/VSCodeEditor';
import { ArrowLeft, Save, Trash2, Pin, PinOff, FolderOpen } from 'lucide-react';

const NewNotePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState({
    title: '',
    content: '',
    pinned: false,
    folderId: 'root'
  });
  const [folders, setFolders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const noteId = searchParams.get('id');

  // Load note data and folders
  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }

      setLoading(true);
      try {
        // Ensure root folder exists
        await ensureRootFolder();

        // Load folders
        const userFolders = await getFolders();
        setFolders(userFolders);

        // Load existing note if editing
        if (noteId) {
          const existingNote = await getNote(noteId);
          if (existingNote) {
            setNote(existingNote);
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
        toast({
          title: "Error",
          description: "Failed to load note data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [noteId, navigate, toast]);

  // Auto-save functionality
  const debouncedSave = useCallback(
    debounce(async (noteData) => {
      if (!noteData.title.trim() && !noteData.content.trim()) return;

      try {
        if (isEditing && noteId) {
          // Update existing note
          await updateNote(noteId, {
            title: noteData.title || 'Untitled Note',
            content: noteData.content,
            pinned: noteData.pinned,
            folderId: noteData.folderId
          });
        } else if (!noteId && (noteData.title.trim() || noteData.content.trim())) {
          // Create new note only if we don't have a noteId
          const docRef = await createNote(
            noteData.title || 'Untitled Note',
            noteData.content,
            noteData.folderId
          );
          // Update URL to reflect the new note ID
          navigate(`/page?id=${docRef.id}`, { replace: true });
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    }, 2000),
    [isEditing, noteId, navigate]
  );

  // Handle note changes
  const handleNoteChange = (field, value) => {
    const updatedNote = { ...note, [field]: value };
    setNote(updatedNote);
    
    // Trigger auto-save
    if (field === 'title' || field === 'content') {
      debouncedSave(updatedNote);
    }
  };

  // Manual save
  const handleSave = async () => {
    if (!note.title.trim() && !note.content.trim()) {
      toast({
        title: "Warning",
        description: "Cannot save empty note",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (isEditing && noteId) {
        await updateNote(noteId, {
          title: note.title || 'Untitled Note',
          content: note.content,
          pinned: note.pinned,
          folderId: note.folderId
        });
        toast({
          title: "Success",
          description: "Note saved successfully",
        });
      } else {
        const docRef = await createNote(
          note.title || 'Untitled Note',
          note.content,
          note.folderId
        );
        navigate(`/page?id=${docRef.id}`, { replace: true });
        setIsEditing(true);
        toast({
          title: "Success",
          description: "Note created successfully",
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete note
  const handleDelete = async () => {
    if (!isEditing || !noteId) return;
    
    if (!window.confirm('Are you sure you want to delete this note?')) return;

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
  };

  // Toggle pin
  const handleTogglePin = async () => {
    const newPinned = !note.pinned;
    handleNoteChange('pinned', newPinned);
    
    if (isEditing && noteId) {
      try {
        await updateNote(noteId, { pinned: newPinned });
        toast({
          title: "Success",
          description: `Note ${newPinned ? 'pinned' : 'unpinned'}`,
        });
      } catch (error) {
        console.error('Pin toggle error:', error);
        toast({
          title: "Error",
          description: "Failed to update pin status",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={note.title}
                  onChange={(e) => handleNoteChange('title', e.target.value)}
                  placeholder="Untitled Note"
                  className="text-xl font-semibold bg-transparent border-none outline-none min-w-0 flex-1"
                />
                
                <select
                  value={note.folderId || 'root'}
                  onChange={(e) => handleNoteChange('folderId', e.target.value || 'root')}
                  className="text-sm bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1"
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.isRoot ? `📁 ${folder.name}` : folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTogglePin}
                className={`p-2 rounded-lg transition-colors ${
                  note.pinned
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={note.pinned ? 'Unpin note' : 'Pin note'}
              >
                {note.pinned ? <Pin size={18} /> : <PinOff size={18} />}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>

              {isEditing && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete note"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg min-h-[600px]">
          <VSCodeEditor
          content={note.content}
          onChange={(content) => handleNoteChange('content', content)}
        />
        </div>
      </div>
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default NewNotePage;
