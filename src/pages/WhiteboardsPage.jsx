import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  ArrowLeft,
  Plus,
  Grid,
  List,
  Search,
  Folder,
  FolderPlus,
  MoreVertical,
  Edit3,
  Trash2,
  Move,
  Star,
  Calendar,
  Clock,
  Eye
} from 'lucide-react';
import {
  getWhiteboards,
  getFolders,
  createWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  createFolder,
  moveItemsToFolder
} from '../lib/firestoreService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { useTheme } from '../context/ThemeContext';
import ModernLoader from '../components/ModernLoader';

const WhiteboardsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDarkMode } = useTheme();

  // State management
  const [whiteboards, setWhiteboards] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedItems, setSelectedItems] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [whiteboardsData, foldersData] = await Promise.all([
        getWhiteboards(),
        getFolders()
      ]);
      
      setWhiteboards(whiteboardsData);
      setFolders(foldersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load whiteboards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter whiteboards based on search
  const filteredWhiteboards = whiteboards.filter(whiteboard =>
    whiteboard.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create new whiteboard
  const handleCreateWhiteboard = async () => {
    try {
      const title = prompt("Enter whiteboard name:", "Untitled Whiteboard");
      if (!title?.trim()) return;

      const whiteboardRef = await createWhiteboard(title.trim());
      await loadData();
      
      toast({
        title: "Success",
        description: "Whiteboard created successfully"
      });

      // Navigate to the new whiteboard
      navigate(`/whiteboard?id=${whiteboardRef.id}`);
    } catch (error) {
      console.error('Error creating whiteboard:', error);
      toast({
        title: "Error",
        description: "Failed to create whiteboard",
        variant: "destructive"
      });
    }
  };

  // Delete whiteboard
  const handleDeleteWhiteboard = async (whiteboardId) => {
    if (!window.confirm('Are you sure you want to delete this whiteboard?')) return;

    try {
      await deleteWhiteboard(whiteboardId);
      await loadData();
      
      toast({
        title: "Success",
        description: "Whiteboard deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
      toast({
        title: "Error",
        description: "Failed to delete whiteboard",
        variant: "destructive"
      });
    }
  };

  // Rename whiteboard
  const handleRenameWhiteboard = async (whiteboardId, currentTitle) => {
    const newTitle = prompt("Enter new name:", currentTitle);
    if (!newTitle?.trim() || newTitle === currentTitle) return;

    try {
      await updateWhiteboard(whiteboardId, { title: newTitle.trim() });
      await loadData();
      
      toast({
        title: "Success",
        description: "Whiteboard renamed successfully"
      });
    } catch (error) {
      console.error('Error renaming whiteboard:', error);
      toast({
        title: "Error",
        description: "Failed to rename whiteboard",
        variant: "destructive"
      });
    }
  };

  // Toggle selection
  const toggleSelection = (id) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      await loadData();
      setNewFolderName('');
      setShowCreateFolderModal(false);
      
      toast({
        title: "Success",
        description: "Folder created successfully"
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  // Move selected items to folder
  const handleMoveToFolder = async (folderId) => {
    try {
      const items = selectedItems.map(id => ({
        id,
        type: 'whiteboard' // All items in this page are whiteboards
      }));

      await moveItemsToFolder(items, folderId);
      await loadData();
      setSelectedItems([]);
      setShowMoveModal(false);

      toast({
        title: "Success",
        description: `Moved ${selectedItems.length} whiteboard(s) to folder`
      });
    } catch (error) {
      console.error('Error moving items:', error);
      toast({
        title: "Error",
        description: "Failed to move items",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <ModernLoader />
        <p>Loading whiteboards...</p>
      </LoadingContainer>
    );
  }

  return (
    <PageContainer $isDarkMode={isDarkMode}>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <IconButton onClick={() => navigate('/dashboard')} title="Back to dashboard">
            <ArrowLeft size={20} />
          </IconButton>
          <HeaderTitle>
            <h1>My Whiteboards</h1>
            <p>{whiteboards.length} whiteboards</p>
          </HeaderTitle>
        </HeaderLeft>

        <HeaderActions>
          <SearchInput
            type="text"
            placeholder="Search whiteboards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <ViewToggle>
            <ViewButton
              $active={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid size={18} />
            </ViewButton>
            <ViewButton
              $active={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={18} />
            </ViewButton>
          </ViewToggle>

          <IconButton onClick={() => setShowCreateFolderModal(true)} title="Create folder">
            <FolderPlus size={20} />
          </IconButton>

          <CreateButton onClick={handleCreateWhiteboard}>
            <Plus size={18} />
            New Whiteboard
          </CreateButton>
        </HeaderActions>
      </Header>

      {/* Selection toolbar */}
      {selectedItems.length > 0 && (
        <SelectionToolbar>
          <SelectionInfo>
            {selectedItems.length} item(s) selected
          </SelectionInfo>
          <SelectionActions>
            <IconButton onClick={() => setShowMoveModal(true)} title="Move to folder">
              <Move size={16} />
            </IconButton>
            <IconButton onClick={() => setSelectedItems([])} title="Clear selection">
              ✕
            </IconButton>
          </SelectionActions>
        </SelectionToolbar>
      )}

      {/* Content */}
      <Content>
        {filteredWhiteboards.length === 0 ? (
          <EmptyState>
            <Edit3 size={48} />
            <h3>No whiteboards found</h3>
            <p>
              {searchTerm
                ? "No whiteboards match your search"
                : "Create your first whiteboard to start brainstorming"
              }
            </p>
            {!searchTerm && (
              <CreateButton onClick={handleCreateWhiteboard}>
                <Plus size={18} />
                Create Whiteboard
              </CreateButton>
            )}
          </EmptyState>
        ) : viewMode === 'grid' ? (
          <WhiteboardGrid>
            {filteredWhiteboards.map(whiteboard => (
              <WhiteboardCard
                key={whiteboard.id}
                $selected={selectedItems.includes(whiteboard.id)}
                onClick={() => navigate(`/whiteboard?id=${whiteboard.id}`)}
              >
                <CardHeader>
                  <SelectionCheckbox
                    type="checkbox"
                    checked={selectedItems.includes(whiteboard.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelection(whiteboard.id);
                    }}
                  />
                  <CardMenu
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical size={16} />
                    <MenuDropdown>
                      <MenuItem onClick={() => handleRenameWhiteboard(whiteboard.id, whiteboard.title)}>
                        <Edit3 size={14} />
                        Rename
                      </MenuItem>
                      <MenuItem onClick={() => handleDeleteWhiteboard(whiteboard.id)} $danger>
                        <Trash2 size={14} />
                        Delete
                      </MenuItem>
                    </MenuDropdown>
                  </CardMenu>
                </CardHeader>

                <CardPreview>
                  <Edit3 size={24} />
                </CardPreview>

                <CardFooter>
                  <CardTitle>{whiteboard.title || 'Untitled'}</CardTitle>
                  <CardMeta>
                    <span>
                      <Clock size={12} />
                      {whiteboard.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </span>
                  </CardMeta>
                </CardFooter>
              </WhiteboardCard>
            ))}
          </WhiteboardGrid>
        ) : (
          <WhiteboardList>
            {filteredWhiteboards.map(whiteboard => (
              <ListItem
                key={whiteboard.id}
                $selected={selectedItems.includes(whiteboard.id)}
                onClick={() => navigate(`/whiteboard?id=${whiteboard.id}`)}
              >
                <SelectionCheckbox
                  type="checkbox"
                  checked={selectedItems.includes(whiteboard.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelection(whiteboard.id);
                  }}
                />
                <ListItemIcon>
                  <Edit3 size={20} />
                </ListItemIcon>
                <ListItemContent>
                  <ListItemTitle>{whiteboard.title || 'Untitled'}</ListItemTitle>
                  <ListItemMeta>
                    Updated {whiteboard.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </ListItemMeta>
                </ListItemContent>
                <ListItemActions onClick={(e) => e.stopPropagation()}>
                  <IconButton onClick={() => handleRenameWhiteboard(whiteboard.id, whiteboard.title)}>
                    <Edit3 size={14} />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteWhiteboard(whiteboard.id)}>
                    <Trash2 size={14} />
                  </IconButton>
                </ListItemActions>
              </ListItem>
            ))}
          </WhiteboardList>
        )}
      </Content>

      {/* Move to folder modal */}
      {showMoveModal && (
        <Modal onClick={() => setShowMoveModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Move to Folder</h3>
              <IconButton onClick={() => setShowMoveModal(false)}>✕</IconButton>
            </ModalHeader>
            <ModalBody>
              <FolderList>
                <FolderItem onClick={() => handleMoveToFolder('root')}>
                  <Folder size={16} />
                  <span>Root Folder</span>
                </FolderItem>
                {folders.map(folder => (
                  <FolderItem key={folder.id} onClick={() => handleMoveToFolder(folder.id)}>
                    <Folder size={16} />
                    <span>{folder.name}</span>
                  </FolderItem>
                ))}
              </FolderList>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Create folder modal */}
      {showCreateFolderModal && (
        <Modal onClick={() => setShowCreateFolderModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Create New Folder</h3>
              <IconButton onClick={() => setShowCreateFolderModal(false)}>✕</IconButton>
            </ModalHeader>
            <ModalBody>
              <Input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <ModalActions>
                <Button onClick={() => setShowCreateFolderModal(false)} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Create Folder
                </Button>
              </ModalActions>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  };
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderTitle = styled.div`
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
  }
  
  p {
    font-size: 0.875rem;
    opacity: 0.7;
    margin: 0;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  backdrop-filter: blur(10px);
  width: 200px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  @media (max-width: 768px) {
    width: 150px;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  overflow: hidden;
`;

const ViewButton = styled.button`
  padding: 0.5rem;
  border: none;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const IconButton = styled.button`
  padding: 0.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
  }
`;

const SelectionToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(59, 130, 246, 0.1);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
`;

const SelectionInfo = styled.div`
  font-weight: 600;
  color: #3b82f6;
`;

const SelectionActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Content = styled.main`
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const WhiteboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const WhiteboardCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.$selected ? '#3b82f6' : 'transparent'};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SelectionCheckbox = styled.input`
  margin: 0;
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;

  /* Increase click area for better UX */
  padding: 2px;
  margin: -2px;

  .dark & {
    accent-color: #60a5fa;
  }
`;

const CardMenu = styled.div`
  position: relative;
  
  &:hover > div {
    display: block;
  }
`;

const MenuDropdown = styled.div`
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 10;
  min-width: 120px;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border: none;
  background: none;
  color: ${props => props.$danger ? '#ef4444' : 'inherit'};
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const CardPreview = styled.div`
  height: 120px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.5);
`;

const CardFooter = styled.div``;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.7;
`;

const WhiteboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.$selected ? '#3b82f6' : 'transparent'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ListItemIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
`;

const ListItemContent = styled.div`
  flex: 1;
`;

const ListItemTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`;

const ListItemMeta = styled.div`
  font-size: 0.875rem;
  opacity: 0.7;
`;

const ListItemActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
  color: inherit;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  gap: 1rem;
  
  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }
  
  p {
    font-size: 1rem;
    opacity: 0.7;
    margin: 0;
    max-width: 400px;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1.5rem;
  min-width: 400px;
  max-width: 90vw;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
`;

const ModalBody = styled.div``;

const FolderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
`;

const FolderItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  font-size: 1rem;
  margin-bottom: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'secondary' ? `
    background: rgba(0, 0, 0, 0.1);
    color: inherit;
    
    &:hover {
      background: rgba(0, 0, 0, 0.15);
    }
  ` : `
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  `}
`;

export default WhiteboardsPage;
