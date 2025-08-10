import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import {
  X,
  Share2,
  Users,
  UserPlus,
  Check,
  Trash2,
  Search
} from 'lucide-react';
import { 
  getFriends, 
  shareNoteWithFriend, 
  removeCollaborator 
} from '../lib/firestoreService';
import { useToast } from '../components/ui/use-toast';

const ShareNoteModal = ({ isOpen, onClose, note, onNoteUpdate }) => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharingWith, setSharingWith] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast({
        title: "Error",
        description: "Failed to load friends list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithFriend = async (friendId) => {
    try {
      setSharingWith(friendId);
      await shareNoteWithFriend(note.id, friendId);
      
      toast({
        title: "Note Shared",
        description: "Note has been shared successfully",
      });

      // Refresh the note data to show updated collaborators
      if (onNoteUpdate) {
        onNoteUpdate();
      }
      
      // Refresh friends list to update UI
      await loadFriends();
      
    } catch (error) {
      console.error('Error sharing note:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to share note",
        variant: "destructive"
      });
    } finally {
      setSharingWith(null);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await removeCollaborator(note.id, collaboratorId);
      
      toast({
        title: "Collaborator Removed",
        description: "Collaborator has been removed from the note",
      });

      // Refresh the note data
      if (onNoteUpdate) {
        onNoteUpdate();
      }
      
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast({
        title: "Error",
        description: "Failed to remove collaborator",
        variant: "destructive"
      });
    }
  };


  const filteredFriends = friends.filter(friend => 
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const collaborators = note?.collaborators || [];
  const isCollaborator = (friendId) => 
    collaborators.some(collab => collab.uid === friendId);

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal $isDarkMode={isDarkMode} onClick={e => e.stopPropagation()}>
        <Header $isDarkMode={isDarkMode}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Share2 size={20} />
            <h2>Share Note</h2>
          </div>
          <CloseButton $isDarkMode={isDarkMode} onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <Content>
          <NoteInfo $isDarkMode={isDarkMode}>
            <h3>{note?.title || 'Untitled'}</h3>
            <p>Share this note with your friends to collaborate together</p>
          </NoteInfo>

          {/* Current Collaborators */}
          {collaborators.length > 0 && (
            <Section>
              <SectionTitle $isDarkMode={isDarkMode}>
                <Users size={16} />
                Current Collaborators ({collaborators.length})
              </SectionTitle>
              <CollaboratorsList>
                {collaborators.map(collaborator => (
                  <CollaboratorItem key={collaborator.uid} $isDarkMode={isDarkMode}>
                    <CollaboratorAvatar>{collaborator.avatar}</CollaboratorAvatar>
                    <CollaboratorInfo>
                      <CollaboratorName $isDarkMode={isDarkMode}>
                        {collaborator.displayName}
                      </CollaboratorName>
                      <CollaboratorEmail $isDarkMode={isDarkMode}>
                        {collaborator.email}
                      </CollaboratorEmail>
                      <CollaboratorPermission $isDarkMode={isDarkMode}>
                        Can {collaborator.permissions}
                      </CollaboratorPermission>
                    </CollaboratorInfo>
                    <RemoveButton
                      $isDarkMode={isDarkMode}
                      onClick={() => handleRemoveCollaborator(collaborator.uid)}
                      title="Remove collaborator"
                    >
                      <Trash2 size={14} />
                    </RemoveButton>
                  </CollaboratorItem>
                ))}
              </CollaboratorsList>
            </Section>
          )}

          {/* Share with Friends */}
          <Section>
            <SectionTitle $isDarkMode={isDarkMode}>
              <UserPlus size={16} />
              Share with Friends
            </SectionTitle>

            <SearchContainer $isDarkMode={isDarkMode}>
              <Search size={16} />
              <SearchInput
                $isDarkMode={isDarkMode}
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchContainer>

            {loading ? (
              <LoadingState $isDarkMode={isDarkMode}>
                Loading friends...
              </LoadingState>
            ) : filteredFriends.length === 0 ? (
              <EmptyState $isDarkMode={isDarkMode}>
                {searchQuery ? 'No friends found matching your search' : 'No friends available to share with'}
              </EmptyState>
            ) : (
              <FriendsList>
                {filteredFriends.map(friend => (
                  <FriendItem key={friend.uid} $isDarkMode={isDarkMode}>
                    <FriendAvatar>{friend.avatar || '👤'}</FriendAvatar>
                    <FriendInfo>
                      <FriendName $isDarkMode={isDarkMode}>
                        {friend.displayName}
                      </FriendName>
                      <FriendEmail $isDarkMode={isDarkMode}>
                        {friend.email}
                      </FriendEmail>
                    </FriendInfo>
                    
                    {isCollaborator(friend.uid) ? (
                      <SharedIndicator $isDarkMode={isDarkMode}>
                        <Check size={16} />
                        Shared
                      </SharedIndicator>
                    ) : (
                      <ShareButton
                        $isDarkMode={isDarkMode}
                        onClick={() => handleShareWithFriend(friend.uid)}
                        disabled={sharingWith === friend.uid}
                      >
                        {sharingWith === friend.uid ? 'Sharing...' : 'Share'}
                      </ShareButton>
                    )}
                  </FriendItem>
                ))}
              </FriendsList>
            )}
          </Section>

        </Content>
      </Modal>
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
  padding: 1rem;
`;

const Modal = styled.div`
  background: ${props => props.$isDarkMode ? '#1e293b' : '#ffffff'};
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.$isDarkMode ? '#334155' : '#e2e8f0'};
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode ? '#334155' : '#f1f5f9'};
  }
`;

const Content = styled.div`
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
`;

const NoteInfo = styled.div`
  padding: 1rem;
  background: ${props => props.$isDarkMode ? '#0f172a' : '#f8fafc'};
  border-radius: 12px;
  margin-bottom: 1.5rem;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
  }
`;

const Section = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  margin-bottom: 1rem;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${props => props.$isDarkMode ? '#0f172a' : '#f8fafc'};
  border: 1px solid ${props => props.$isDarkMode ? '#334155' : '#e2e8f0'};
  border-radius: 8px;
  margin-bottom: 1rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  font-size: 0.875rem;

  &::placeholder {
    color: ${props => props.$isDarkMode ? '#64748b' : '#94a3b8'};
  }
`;

const CollaboratorsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FriendsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CollaboratorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${props => props.$isDarkMode ? '#0f172a' : '#f8fafc'};
  border: 1px solid ${props => props.$isDarkMode ? '#334155' : '#e2e8f0'};
  border-radius: 8px;
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${props => props.$isDarkMode ? '#0f172a' : '#f8fafc'};
  border: 1px solid ${props => props.$isDarkMode ? '#334155' : '#e2e8f0'};
  border-radius: 8px;
`;

const CollaboratorAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
  border: 2px solid rgba(59, 130, 246, 0.1);
`;

const FriendAvatar = styled(CollaboratorAvatar)``;

const CollaboratorInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendInfo = styled(CollaboratorInfo)``;

const CollaboratorName = styled.div`
  font-weight: 500;
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  margin-bottom: 0.25rem;
`;

const FriendName = styled(CollaboratorName)``;

const CollaboratorEmail = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
  margin-bottom: 0.25rem;
`;

const FriendEmail = styled(CollaboratorEmail)``;

const CollaboratorPermission = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? '#3b82f6' : '#2563eb'};
  font-weight: 500;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const ShareButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SharedIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
  font-size: 0.875rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
  font-size: 0.875rem;
`;

export default ShareNoteModal;
