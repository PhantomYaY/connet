import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tldraw, createTLStore, defaultShapeUtils, defaultBindingUtils, defaultTools } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import styled from 'styled-components';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Share, 
  Settings,
  Folder,
  Plus,
  Users,
  Eye,
  Lock,
  Unlock,
  Trash2,
  Copy,
  FileText
} from 'lucide-react';
import { 
  createWhiteboard, 
  getWhiteboard, 
  updateWhiteboard, 
  saveWhiteboardContent, 
  deleteWhiteboard,
  getFolders,
  getWhiteboards
} from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/use-toast';

const WhiteboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get whiteboard ID from URL params
  const whiteboardId = searchParams.get('id');
  const folderId = searchParams.get('folder');
  
  // State management
  const [whiteboard, setWhiteboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [title, setTitle] = useState('Untitled Whiteboard');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [folders, setFolders] = useState([]);
  const [whiteboards, setWhiteboards] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isShared, setIsShared] = useState(false);
  
  // Create tldraw store
  const store = useMemo(() => {
    return createTLStore({
      shapeUtils: defaultShapeUtils,
      bindingUtils: defaultBindingUtils,
      tools: defaultTools,
    });
  }, []);

  // Initialize or load whiteboard
  useEffect(() => {
    const initializeWhiteboard = async () => {
      try {
        setLoading(true);
        
        if (whiteboardId) {
          // Load existing whiteboard
          const whiteboardData = await getWhiteboard(whiteboardId);
          if (whiteboardData) {
            setWhiteboard(whiteboardData);
            setTitle(whiteboardData.title);
            setIsShared(whiteboardData.shared || false);
            
            // Load content into store if it exists
            if (whiteboardData.content && Object.keys(whiteboardData.content).length > 0) {
              store.loadSnapshot(whiteboardData.content);
            }
          } else {
            toast({
              title: "Error",
              description: "Whiteboard not found",
              variant: "destructive"
            });
            navigate('/dashboard');
            return;
          }
        } else {
          // Create new whiteboard
          const newTitle = "Untitled Whiteboard";
          const docRef = await createWhiteboard(newTitle, folderId);
          const newWhiteboardData = {
            id: docRef.id,
            title: newTitle,
            content: {},
            folderId: folderId || 'root',
            createdAt: new Date(),
            updatedAt: new Date(),
            shared: false,
            collaborators: []
          };
          
          setWhiteboard(newWhiteboardData);
          setTitle(newTitle);
          
          // Update URL with new whiteboard ID
          setSearchParams({ id: docRef.id, ...(folderId && { folder: folderId }) });
          
          toast({
            title: "Success",
            description: "New whiteboard created",
          });
        }
        
        // Load folders for settings
        const foldersData = await getFolders();
        setFolders(foldersData);
        
        // Load other whiteboards for quick access
        const whiteboardsData = await getWhiteboards();
        setWhiteboards(whiteboardsData);
        
      } catch (error) {
        console.error('Error initializing whiteboard:', error);
        toast({
          title: "Error",
          description: "Failed to load whiteboard",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initializeWhiteboard();
    }
  }, [whiteboardId, folderId, user, navigate, toast, store, setSearchParams]);

  // Auto-save functionality
  useEffect(() => {
    if (!whiteboard || !store) return;

    let timeoutId;
    let isFirstLoad = true;

    const handleStoreChange = () => {
      // Skip the first change event which happens on load
      if (isFirstLoad) {
        isFirstLoad = false;
        return;
      }

      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set new timeout for auto-save
      timeoutId = setTimeout(async () => {
        try {
          setSaving(true);
          const snapshot = store.getSnapshot();
          await saveWhiteboardContent(whiteboard.id, snapshot);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
          toast({
            title: "Auto-save failed",
            description: "Your changes might not be saved",
            variant: "destructive"
          });
        } finally {
          setSaving(false);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    };

    // Listen to store changes
    const unsubscribe = store.listen(handleStoreChange);

    return () => {
      unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [whiteboard, store, toast]);

  // Manual save
  const handleSave = useCallback(async () => {
    if (!whiteboard || !store) return;

    try {
      setSaving(true);
      const snapshot = store.getSnapshot();
      await saveWhiteboardContent(whiteboard.id, snapshot);
      setLastSaved(new Date());
      
      toast({
        title: "Saved",
        description: "Whiteboard saved successfully",
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Save failed",
        description: "Failed to save whiteboard",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [whiteboard, store, toast]);

  // Update title
  const handleTitleUpdate = useCallback(async (newTitle) => {
    if (!whiteboard || !newTitle.trim()) return;

    try {
      await updateWhiteboard(whiteboard.id, { title: newTitle.trim() });
      setTitle(newTitle.trim());
      setWhiteboard(prev => ({ ...prev, title: newTitle.trim() }));
      
      toast({
        title: "Title updated",
        description: "Whiteboard title has been updated",
      });
    } catch (error) {
      console.error('Failed to update title:', error);
      toast({
        title: "Update failed",
        description: "Failed to update title",
        variant: "destructive"
      });
    }
  }, [whiteboard, toast]);

  // Export whiteboard
  const handleExport = useCallback(async () => {
    if (!store) return;

    try {
      const svg = await store.getSvg(store.getCurrentPageShapeIds());
      if (!svg) return;

      // Convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
      
      toast({
        title: "Exported",
        description: "Whiteboard exported successfully",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "Failed to export whiteboard",
        variant: "destructive"
      });
    }
  }, [store, title, toast]);

  // Delete whiteboard
  const handleDelete = useCallback(async () => {
    if (!whiteboard) return;
    
    if (window.confirm('Are you sure you want to delete this whiteboard? This action cannot be undone.')) {
      try {
        await deleteWhiteboard(whiteboard.id);
        toast({
          title: "Deleted",
          description: "Whiteboard deleted successfully",
        });
        navigate('/dashboard');
      } catch (error) {
        console.error('Delete failed:', error);
        toast({
          title: "Delete failed",
          description: "Failed to delete whiteboard",
          variant: "destructive"
        });
      }
    }
  }, [whiteboard, toast, navigate]);

  // Toggle sharing
  const handleToggleSharing = useCallback(async () => {
    if (!whiteboard) return;

    try {
      const newSharedStatus = !isShared;
      await updateWhiteboard(whiteboard.id, { shared: newSharedStatus });
      setIsShared(newSharedStatus);
      setWhiteboard(prev => ({ ...prev, shared: newSharedStatus }));
      
      toast({
        title: newSharedStatus ? "Sharing enabled" : "Sharing disabled",
        description: `Whiteboard is now ${newSharedStatus ? 'shared' : 'private'}`,
      });
    } catch (error) {
      console.error('Failed to toggle sharing:', error);
      toast({
        title: "Update failed",
        description: "Failed to update sharing settings",
        variant: "destructive"
      });
    }
  }, [whiteboard, isShared, toast]);

  if (loading) {
    return (
      <LoadingWrapper>
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading whiteboard...</p>
        </div>
      </LoadingWrapper>
    );
  }

  if (!whiteboard) {
    return (
      <ErrorWrapper>
        <div className="error-content">
          <h2>Whiteboard not found</h2>
          <p>The requested whiteboard could not be loaded.</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </ErrorWrapper>
    );
  }

  return (
    <WhiteboardWrapper>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          <div className="title-section">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false);
                  handleTitleUpdate(title);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false);
                    handleTitleUpdate(title);
                  }
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setTitle(whiteboard.title);
                  }
                }}
                className="title-input"
                autoFocus
              />
            ) : (
              <h1 
                onClick={() => setIsEditingTitle(true)}
                className="title"
                title="Click to edit title"
              >
                {title}
              </h1>
            )}
            
            <div className="status-indicators">
              {saving && <span className="saving">Saving...</span>}
              {lastSaved && !saving && (
                <span className="last-saved">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {isShared && (
                <span className="shared-indicator">
                  <Users size={14} />
                  Shared
                </span>
              )}
            </div>
          </div>
        </HeaderLeft>
        
        <HeaderRight>
          <button onClick={handleSave} className="action-btn" disabled={saving}>
            <Save size={16} />
            <span>Save</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="action-btn"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </HeaderRight>
      </Header>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel>
          <div className="settings-content">
            <div className="settings-header">
              <h3>Whiteboard Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="settings-section">
              <h4>Quick Actions</h4>
              <div className="quick-actions">
                <button onClick={handleExport} className="quick-btn">
                  <Download size={16} />
                  Export as PNG
                </button>
                <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="quick-btn">
                  <Copy size={16} />
                  Copy Link
                </button>
                <button onClick={handleDelete} className="quick-btn danger">
                  <Trash2 size={16} />
                  Delete Whiteboard
                </button>
              </div>
            </div>
            
            <div className="settings-section">
              <h4>Other Whiteboards</h4>
              <div className="whiteboards-list">
                {whiteboards.filter(w => w.id !== whiteboard.id).slice(0, 5).map(wb => (
                  <button
                    key={wb.id}
                    onClick={() => {
                      setSearchParams({ id: wb.id });
                      setShowSettings(false);
                    }}
                    className="whiteboard-item"
                  >
                    <FileText size={16} />
                    <span>{wb.title}</span>
                    <span className="date">
                      {wb.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                    </span>
                  </button>
                ))}
                {whiteboards.length <= 1 && (
                  <p className="no-whiteboards">No other whiteboards</p>
                )}
              </div>
            </div>
          </div>
        </SettingsPanel>
      )}

      {/* Tldraw Canvas */}
      <CanvasWrapper>
        <Tldraw 
          store={store}
          persistenceKey={`whiteboard-${whiteboard.id}`}
          autoFocus
        />
      </CanvasWrapper>
    </WhiteboardWrapper>
  );
};

// Styled Components
const WhiteboardWrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  
  .dark & {
    background: #1a1a1a;
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  .dark & {
    background: #2a2a2a;
    border-bottom: 1px solid #374151;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LoadingWrapper = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  
  .loading-content {
    text-align: center;
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    p {
      color: #6b7280;
      font-size: 0.875rem;
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorWrapper = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  
  .error-content {
    text-align: center;
    max-width: 400px;
    
    h2 {
      color: #ef4444;
      margin-bottom: 0.5rem;
    }
    
    p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
  }
`;

const CanvasWrapper = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const SettingsPanel = styled.div`
  position: absolute;
  top: 70px;
  right: 1.5rem;
  width: 320px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  .dark & {
    background: #2a2a2a;
    border: 1px solid #374151;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }
`;

// Common button styles
const buttonStyles = `
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  cursor: pointer;
  
  .dark & {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #d1d5db;
  }
  
  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #2563eb;
    transform: translateY(-1px);
    
    .dark & {
      background: rgba(96, 165, 250, 0.1);
      border-color: rgba(96, 165, 250, 0.3);
      color: #60a5fa;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  &.shared {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: #16a34a;
  }
  
  &.danger {
    color: #ef4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
  }
`;

// Apply styles using CSS-in-JS
const styledElements = `
  .back-btn, .action-btn, .quick-btn {
    ${buttonStyles}
  }
  
  .title-section {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  
  .title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    .dark & {
      color: #f9fafb;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.05);
      
      .dark & {
        background: rgba(255, 255, 255, 0.05);
      }
    }
  }
  
  .title-input {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    outline: none;
    
    .dark & {
      color: #f9fafb;
      background: #374151;
      border-color: #60a5fa;
    }
  }
  
  .status-indicators {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .saving {
    color: #f59e0b;
    font-weight: 500;
  }
  
  .last-saved {
    color: #10b981;
  }
  
  .shared-indicator {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #3b82f6;
    font-weight: 500;
  }
  
  .settings-content {
    padding: 1.5rem;
  }
  
  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
      
      .dark & {
        color: #f9fafb;
      }
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0.25rem;
      border-radius: 0.25rem;
      
      &:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #374151;
        
        .dark & {
          background: rgba(255, 255, 255, 0.05);
          color: #d1d5db;
        }
      }
    }
  }
  
  .settings-section {
    margin-bottom: 1.5rem;
    
    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.75rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      
      .dark & {
        color: #d1d5db;
      }
    }
  }
  
  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .quick-btn {
    justify-content: flex-start;
    font-size: 0.875rem;
    padding: 0.75rem;
  }
  
  .whiteboards-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .whiteboard-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    
    .dark & {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    &:hover {
      background: rgba(59, 130, 246, 0.05);
      border-color: rgba(59, 130, 246, 0.2);
      transform: translateY(-1px);
    }
    
    span:first-of-type {
      flex: 1;
      font-weight: 500;
      color: #374151;
      
      .dark & {
        color: #d1d5db;
      }
    }
    
    .date {
      font-size: 0.75rem;
      color: #6b7280;
      
      .dark & {
        color: #9ca3af;
      }
    }
  }
  
  .no-whiteboards {
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
    padding: 1rem;
    
    .dark & {
      color: #9ca3af;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styledElements;
document.head.appendChild(styleSheet);

export default WhiteboardPage;
