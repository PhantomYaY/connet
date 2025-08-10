import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { getNotes, getFolders, deleteNote, togglePinNote } from "../lib/firestoreService";
import { useToast } from "../components/ui/use-toast";
import { Search, Grid, List, Calendar, Star, Trash2, ArrowLeft, Heart, Sparkles, Tag, Clock } from "lucide-react";
import OptimizedModernLoader from "../components/OptimizedModernLoader";

const FavoritesPage = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [viewMode, setViewMode] = useState("grid");
  const [groupBy, setGroupBy] = useState("none");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load pinned notes only
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
        
        // Filter only pinned notes
        const pinnedNotes = notesData.filter(note => note.pinned);
        setNotes(pinnedNotes);
        setFolders(foldersData);
        setFilteredNotes(pinnedNotes);
      } catch (error) {
        console.error("Error loading favorites:", error);
        toast({
          title: "Error",
          description: "Failed to load favorites. Please try again.",
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
  }, [notes, searchQuery, sortBy]);

  const handleNoteClick = (noteId) => {
    navigate(`/page?noteId=${noteId}`);
  };

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this favorite note?")) return;

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

  const handleRemoveFromFavorites = async (noteId, e) => {
    e.stopPropagation();
    
    try {
      await togglePinNote(noteId, false);
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      
      toast({
        title: "Success",
        description: "Note removed from favorites",
      });
    } catch (error) {
      console.error("Error removing from favorites:", error);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffTime = Math.abs(now - noteDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const groupNotes = (notes) => {
    if (groupBy === "none") return { "All Favorites": notes };
    
    if (groupBy === "folder") {
      const grouped = {};
      notes.forEach(note => {
        const folderName = note.folderId ? getFolderName(note.folderId) : "Unorganized";
        if (!grouped[folderName]) grouped[folderName] = [];
        grouped[folderName].push(note);
      });
      return grouped;
    }
    
    if (groupBy === "date") {
      const grouped = {};
      notes.forEach(note => {
        const timeAgo = getTimeAgo(note.updatedAt);
        if (!grouped[timeAgo]) grouped[timeAgo] = [];
        grouped[timeAgo].push(note);
      });
      return grouped;
    }
    
    return { "All Favorites": notes };
  };

  if (loading) return <ModernLoader />;

  const groupedNotes = groupNotes(filteredNotes);

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
            <div className="title-section">
              <Star className="title-icon" size={32} />
              <div>
                <h1>Favorites</h1>
                <p>{filteredNotes.length} favorite notes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="controls">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="control-buttons">
            <div className="filter-group">
              <label>Group by</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="none">None</option>
                <option value="folder">Folder</option>
                <option value="date">Date</option>
              </select>
            </div>
            
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Grid size={18} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Star size={48} />
              <Heart size={24} className="heart-overlay" />
            </div>
            <h3>No favorites yet</h3>
            <p>
              {searchQuery 
                ? `No favorites match "${searchQuery}"`
                : "Start adding notes to your favorites by clicking the star icon"
              }
            </p>
            <button 
              className="cta-button"
              onClick={() => navigate('/dashboard')}
            >
              <Sparkles size={16} />
              Browse All Notes
            </button>
          </div>
        ) : (
          <div className="groups-container">
            {Object.entries(groupedNotes).map(([groupName, groupNotes]) => (
              <div key={groupName} className="note-group">
                {groupBy !== "none" && (
                  <div className="group-header">
                    <h2>{groupName}</h2>
                    <span className="group-count">{groupNotes.length} notes</span>
                  </div>
                )}
                
                <div className={`notes-grid ${viewMode}`}>
                  {groupNotes.map(note => (
                    <div 
                      key={note.id} 
                      className="note-card"
                      onClick={() => handleNoteClick(note.id)}
                    >
                      <div className="note-header">
                        <h3 className="note-title">{note.title || "Untitled"}</h3>
                        <div className="note-actions">
                          <button
                            onClick={(e) => handleRemoveFromFavorites(note.id, e)}
                            className="action-btn favorite"
                            title="Remove from favorites"
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
                          <p>{note.content.slice(0, 120)}{note.content.length > 120 ? '...' : ''}</p>
                        )}
                      </div>
                      
                      <div className="note-footer">
                        <div className="note-meta">
                          {note.folderId && (
                            <span className="folder-tag">
                              <Tag size={12} />
                              {getFolderName(note.folderId)}
                            </span>
                          )}
                          <span className="date">
                            <Clock size={12} />
                            {getTimeAgo(note.updatedAt)}
                          </span>
                        </div>
                        <Star size={14} className="favorite-indicator" />
                      </div>
                    </div>
                  ))}
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

  .title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .title-icon {
    color: #f59e0b;
    
    .dark & {
      color: #fbbf24;
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
    gap: 1rem;
    align-items: center;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
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
      min-width: 120px;
      
      .dark & {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #d1d5db;
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
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
      
      .dark & {
        background: rgba(251, 191, 36, 0.1);
        color: #fbbf24;
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
  }

  .empty-icon {
    position: relative;
    margin-bottom: 1.5rem;
    
    .heart-overlay {
      position: absolute;
      top: -8px;
      right: -8px;
      color: #ef4444;
      background: white;
      border-radius: 50%;
      padding: 2px;
      
      .dark & {
        background: #0f172a;
      }
    }
  }

  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
    
    .dark & {
      color: #d1d5db;
    }
  }

  .empty-state p {
    font-size: 0.875rem;
    max-width: 400px;
    margin-bottom: 2rem;
  }

  .cta-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
    
    &:hover {
      background: linear-gradient(135deg, #d97706, #b45309);
    }
  }

  .groups-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .note-group {
    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid rgba(245, 158, 11, 0.3);
      
      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
        
        .dark & {
          color: #f9fafb;
        }
      }
      
      .group-count {
        font-size: 0.875rem;
        color: #6b7280;
        background: rgba(245, 158, 11, 0.1);
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        
        .dark & {
          color: #9ca3af;
          background: rgba(251, 191, 36, 0.1);
        }
      }
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
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 1rem;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    
    .dark & {
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(251, 191, 36, 0.2);
    }
    
    &:hover {
      transform: translateY(-1px);
      border-color: rgba(245, 158, 11, 0.4);

      .dark & {
        border-color: rgba(251, 191, 36, 0.4);
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
    
    &.favorite {
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

  .favorite-indicator {
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
    
    .control-buttons {
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .content {
      padding: 1rem;
    }
    
    .notes-grid.grid {
      grid-template-columns: 1fr;
    }
    
    .group-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
`;

export default FavoritesPage;
