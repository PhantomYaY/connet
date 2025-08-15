import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { getNotes, getFolders, deleteNote, togglePinNote } from "../lib/firestoreService";
import { useToast } from "../components/ui/use-toast";
import { Search, Filter, Grid, List, Calendar, Star, Trash2, Eye, ArrowLeft, FileText, Folder } from "lucide-react";
import OptimizedModernLoader from "../components/OptimizedModernLoader";

const AllNotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load notes and folders
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const [notesData, foldersData] = await Promise.all([
          getNotes(),
          getFolders()
        ]);
        
        setNotes(notesData);
        setFolders(foldersData);
        setFilteredNotes(notesData);
      } catch (error) {
        console.error("Error loading notes:", error);
        toast({
          title: "Error",
          description: "Failed to load notes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, toast]);

  // Filter and search notes
  useEffect(() => {
    let result = [...notes];

    // Search filter
    if (searchQuery) {
      result = result.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Folder filter
    if (selectedFolder !== "all") {
      result = result.filter(note => note.folderId === selectedFolder);
    }

    // Sort notes
    result.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "created":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "updated":
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    setFilteredNotes(result);
  }, [notes, searchQuery, selectedFolder, sortBy]);

  const handleNoteClick = (noteId) => {
    navigate(`/page?id=${noteId}`);
  };

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteNote(noteId);
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const handleTogglePin = async (noteId, e) => {
    e.stopPropagation();
    
    try {
      const note = notes.find(n => n.id === noteId);
      await togglePinNote(noteId, !note.pinned);
      
      const updatedNotes = notes.map(n => 
        n.id === noteId ? { ...n, pinned: !n.pinned } : n
      );
      setNotes(updatedNotes);
      
      toast({
        title: "Success",
        description: `Note ${!note.pinned ? 'pinned' : 'unpinned'} successfully`,
      });
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const getFolderName = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : "Unorganized";
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }).format(date);
    }
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    // Remove HTML tags and decode entities
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    return text.trim();
  };

  if (loading) return <OptimizedModernLoader />;

  return (
    <StyledWrapper className="bg-slate-100 dark:bg-slate-900">
      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]
        bg-[linear-gradient(to_right,theme(colors.slate.300)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.300)_1px,transparent_1px)]
        dark:bg-[linear-gradient(to_right,theme(colors.slate.800)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800)_1px,transparent_1px)]
        bg-[size:40px_40px]"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-400/10 via-blue-500/0 to-teal-400/10 animate-pulse-slow" />

      {/* Header */}
      <div className="header">
        <div className="header-top">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="header-info">
            <h1>All Notes</h1>
            <p>{filteredNotes.length} of {notes.length} notes</p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="controls">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="control-buttons">
            <button 
              className={`control-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </button>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Folder</label>
              <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)}>
                <option value="all">All Folders</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>
            
          </div>
        )}
      </div>

      {/* Notes Content */}
      <div className="content">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <FileText size={64} />
            <h3>No notes found</h3>
            <p>
              {searchQuery 
                ? `No notes match "${searchQuery}"`
                : selectedFolder !== "all" 
                  ? "No notes in this folder"
                  : "You haven't created any notes yet"
              }
            </p>
          </div>
        ) : (
          <div className={`notes-grid ${viewMode}`}>
            {filteredNotes.map(note => (
              <div 
                key={note.id} 
                className="note-card"
                onClick={() => handleNoteClick(note.id)}
              >
                <div className="note-header">
                  <h3 className="note-title">{note.title || "Untitled"}</h3>
                  <div className="note-actions">
                    <button
                      onClick={(e) => handleTogglePin(note.id, e)}
                      className={`action-btn ${note.pinned ? 'pinned' : ''}`}
                      title={note.pinned ? 'Unpin note' : 'Pin note'}
                    >
                      <Star size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="action-btn delete"
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="note-content">
                  {note.content && (
                    <p>{stripHtmlTags(note.content).slice(0, 120)}{stripHtmlTags(note.content).length > 120 ? '...' : ''}</p>
                  )}
                </div>
                
                <div className="note-footer">
                  <div className="note-meta">
                    {note.folderId && (
                      <span className="folder-tag">
                        <Folder size={12} />
                        {getFolderName(note.folderId)}
                      </span>
                    )}
                    <span className="date">
                      <Calendar size={12} />
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                  {note.pinned && <Star size={14} className="pinned-indicator" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;

  @keyframes pulse-slow {
    0%, 100% {
      transform: scale(1);
      opacity: 0.08;
    }
    50% {
      transform: scale(1.03);
      opacity: 0.16;
    }
  }

  .animate-pulse-slow {
    animation: pulse-slow 20s ease-in-out infinite;
  }

  .header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    
    .dark & {
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .header-top {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    color: #374151;
    font-weight: 500;
    transition: all 0.2s;
    
    .dark & {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
      
      .dark & {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .header-info h1 {
    font-size: 2rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 0.25rem;
    
    .dark & {
      color: #f9fafb;
    }
  }

  .header-info p {
    color: #6b7280;
    font-size: 0.875rem;
    
    .dark & {
      color: #9ca3af;
    }
  }

  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 300px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 1rem;
    color: #374151;
    
    .dark & {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }

    input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-size: 0.875rem;
      color: inherit;
      
      &::placeholder {
        color: #9ca3af;
        
        .dark & {
          color: #6b7280;
        }
      }
    }
  }

  .control-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .control-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    color: #374151;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s;
    
    .dark & {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }
    
    &:hover, &.active {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
      color: #2563eb;
      
      .dark & {
        background: rgba(96, 165, 250, 0.1);
        border-color: rgba(96, 165, 250, 0.3);
        color: #60a5fa;
      }
    }
  }

  .view-toggle {
    display: flex;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    overflow: hidden;
    
    .dark & {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .view-btn {
    padding: 0.75rem;
    background: none;
    border: none;
    color: #6b7280;
    transition: all 0.2s;
    
    .dark & {
      color: #9ca3af;
    }
    
    &.active {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
      
      .dark & {
        background: rgba(96, 165, 250, 0.1);
        color: #60a5fa;
      }
    }
  }

  .filters-panel {
    display: flex;
    gap: 1.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    
    .dark & {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      
      .dark & {
        color: #9ca3af;
      }
    }
    
    select {
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 0.5rem;
      color: #374151;
      font-size: 0.875rem;
      
      .dark & {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #d1d5db;
      }
    }
  }

  .content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: #6b7280;
    
    .dark & {
      color: #9ca3af;
    }
    
    h3 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 1rem 0 0.5rem;
      color: #374151;
      
      .dark & {
        color: #d1d5db;
      }
    }
    
    p {
      font-size: 0.875rem;
      max-width: 300px;
    }
  }

  .notes-grid {
    display: grid;
    gap: 1.5rem;
    
    &.grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    
    &.list {
      grid-template-columns: 1fr;
      max-width: 800px;
      margin: 0 auto;
    }
  }

  .note-card {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 1rem;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    
    .dark & {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    &:hover {
      transform: translateY(-1px);
      border-color: rgba(59, 130, 246, 0.3);

      .dark & {
        border-color: rgba(96, 165, 250, 0.3);
      }
    }
  }

  .note-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .note-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    line-height: 1.4;
    
    .dark & {
      color: #f9fafb;
    }
  }

  .note-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
    
    .note-card:hover & {
      opacity: 1;
    }
  }

  .action-btn {
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: 0.5rem;
    color: #6b7280;
    transition: all 0.2s;
    
    .dark & {
      background: rgba(255, 255, 255, 0.05);
      color: #9ca3af;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #374151;
      
      .dark & {
        background: rgba(255, 255, 255, 0.1);
        color: #d1d5db;
      }
    }
    
    &.pinned {
      color: #f59e0b;
      
      &:hover {
        background: rgba(245, 158, 11, 0.1);
      }
    }
    
    &.delete:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
  }

  .note-content {
    margin-bottom: 1rem;
    
    p {
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.6;
      margin: 0;
      
      .dark & {
        color: #9ca3af;
      }
    }
  }

  .note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .note-meta {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .folder-tag, .date {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #9ca3af;
    
    .dark & {
      color: #6b7280;
    }
  }

  .folder-tag {
    background: rgba(59, 130, 246, 0.1);
    color: #2563eb;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    
    .dark & {
      background: rgba(96, 165, 250, 0.1);
      color: #60a5fa;
    }
  }

  .pinned-indicator {
    color: #f59e0b;
  }

  @media (max-width: 768px) {
    .header {
      padding: 1rem;
    }
    
    .controls {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-box {
      min-width: auto;
    }
    
    .filters-panel {
      flex-direction: column;
      gap: 1rem;
    }
    
    .content {
      padding: 1rem;
    }
    
    .notes-grid.grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default AllNotesPage;
