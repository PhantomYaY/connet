import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Folder, FolderPlus, X } from 'lucide-react';
import { getFolders, createFolder, moveItemsToFolder } from '../lib/firestoreService';
import { useToast } from './ui/use-toast';

const MoveToFolderModal = ({ 
  isOpen, 
  onClose, 
  items = [], // Array of {id, type} objects
  onSuccess 
}) => {
  const { toast } = useToast();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Load folders when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    try {
      const foldersData = await getFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive"
      });
    }
  };

  const handleMoveToFolder = async (folderId) => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      await moveItemsToFolder(items, folderId);
      
      toast({
        title: "Success",
        description: `Moved ${items.length} item(s) to folder successfully`
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error moving items:', error);
      toast({
        title: "Error",
        description: "Failed to move items to folder",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      await loadFolders();
      setNewFolderName('');
      setShowCreateFolder(false);
      
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

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>Move to Folder</Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <ItemCount>
            Moving {items.length} item{items.length !== 1 ? 's' : ''}
          </ItemCount>

          {showCreateFolder ? (
            <CreateFolderSection>
              <Input
                type="text"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <ButtonGroup>
                <Button variant="secondary" onClick={() => setShowCreateFolder(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Create
                </Button>
              </ButtonGroup>
            </CreateFolderSection>
          ) : (
            <>
              <FolderList>
                <FolderItem onClick={() => handleMoveToFolder('root')} disabled={loading}>
                  <Folder size={16} />
                  <span>Root Folder</span>
                </FolderItem>
                
                {folders.map(folder => (
                  <FolderItem 
                    key={folder.id} 
                    onClick={() => handleMoveToFolder(folder.id)}
                    disabled={loading}
                  >
                    <Folder size={16} />
                    <span>{folder.name}</span>
                  </FolderItem>
                ))}
              </FolderList>

              <CreateFolderButton onClick={() => setShowCreateFolder(true)}>
                <FolderPlus size={16} />
                Create New Folder
              </CreateFolderButton>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Overlay>
  );
};

// Styled Components
const Overlay = styled.div`
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
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${props => props.theme?.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: inherit;
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ModalBody = styled.div``;

const ItemCount = styled.div`
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
  color: #3b82f6;
  font-weight: 500;
  margin-bottom: 1rem;
  text-align: center;
`;

const FolderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
`;

const FolderItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CreateFolderButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  background: none;
  color: inherit;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    opacity: 1;
  }
`;

const CreateFolderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
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
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  ` : `
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    
    &:hover:not(:disabled) {
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

export default MoveToFolderModal;
