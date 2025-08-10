import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Search, 
  MessageCircle,
  MoreVertical,
  UserMinus
} from 'lucide-react';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getUserProfile
} from '../lib/firestoreService';
import {
  searchUsers,
  filterAlreadyFriends,
  filterExistingRequests
} from '../lib/userSearchService';
import { useToast } from './ui/use-toast';

const FriendsCenter = ({ isOpen, onClose, onStartChat }) => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      loadFriendRequests();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const requests = await getFriendRequests();
      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);

      // Search for users
      let users = await searchUsers(query, true);

      // Filter out users who are already friends
      users = await filterAlreadyFriends(users, friends);

      // Filter out users who already have pending requests
      const sentRequests = await getFriendRequests(); // Note: this gets received requests, we need sent requests too
      users = await filterExistingRequests(users, sentRequests);

      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId) => {
    try {
      await sendFriendRequest(targetUserId);
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully"
      });

      // Remove the user from search results since request was sent
      setSearchResults(prevResults =>
        prevResults.filter(user => user.id !== targetUserId)
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive"
      });
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      await loadFriends();
      await loadFriendRequests();
      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!"
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      await loadFriendRequests();
      toast({
        title: "Friend Request Rejected",
        description: "The friend request has been rejected"
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay $isDarkMode={isDarkMode} onClick={onClose}>
      <FriendsContainer $isDarkMode={isDarkMode} onClick={(e) => e.stopPropagation()}>
        <FriendsHeader $isDarkMode={isDarkMode}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Users size={24} />
            <h2>Friends</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </FriendsHeader>

        <TabContainer $isDarkMode={isDarkMode}>
          <Tab 
            $isDarkMode={isDarkMode} 
            $active={activeTab === 'friends'} 
            onClick={() => setActiveTab('friends')}
          >
            <Users size={16} />
            Friends ({friends.length})
          </Tab>
          <Tab 
            $isDarkMode={isDarkMode} 
            $active={activeTab === 'requests'} 
            onClick={() => setActiveTab('requests')}
          >
            <UserPlus size={16} />
            Requests ({friendRequests.length})
          </Tab>
          <Tab 
            $isDarkMode={isDarkMode} 
            $active={activeTab === 'add'} 
            onClick={() => setActiveTab('add')}
          >
            <Search size={16} />
            Add Friends
          </Tab>
        </TabContainer>

        <FriendsBody>
          {activeTab === 'friends' && (
            <FriendsTab>
              {friends.length === 0 ? (
                <EmptyState $isDarkMode={isDarkMode}>
                  <Users size={48} />
                  <h3>No friends yet</h3>
                  <p>Start building your network by adding friends!</p>
                </EmptyState>
              ) : (
                <FriendsList>
                  {friends.map(friend => (
                    <FriendItem key={friend.uid} $isDarkMode={isDarkMode}>
                      <FriendAvatar>{friend.avatar || '👤'}</FriendAvatar>
                      <FriendInfo>
                        <FriendName $isDarkMode={isDarkMode}>{friend.displayName}</FriendName>
                        <FriendEmail $isDarkMode={isDarkMode}>{friend.email}</FriendEmail>
                      </FriendInfo>
                      <FriendActions>
                        <ActionButton 
                          $isDarkMode={isDarkMode} 
                          onClick={() => onStartChat && onStartChat(friend)}
                        >
                          <MessageCircle size={16} />
                        </ActionButton>
                        <ActionButton $isDarkMode={isDarkMode}>
                          <MoreVertical size={16} />
                        </ActionButton>
                      </FriendActions>
                    </FriendItem>
                  ))}
                </FriendsList>
              )}
            </FriendsTab>
          )}

          {activeTab === 'requests' && (
            <RequestsTab>
              {friendRequests.length === 0 ? (
                <EmptyState $isDarkMode={isDarkMode}>
                  <UserPlus size={48} />
                  <h3>No friend requests</h3>
                  <p>When someone sends you a friend request, it will appear here.</p>
                </EmptyState>
              ) : (
                <RequestsList>
                  {friendRequests.map(request => (
                    <RequestItem key={request.id} $isDarkMode={isDarkMode}>
                      <FriendAvatar>{request.fromUser?.avatar || '👤'}</FriendAvatar>
                      <RequestInfo>
                        <FriendName $isDarkMode={isDarkMode}>
                          {request.fromUser?.displayName || 'Unknown User'}
                        </FriendName>
                        <FriendEmail $isDarkMode={isDarkMode}>
                          {request.fromUser?.email || ''}
                        </FriendEmail>
                      </RequestInfo>
                      <RequestActions>
                        <AcceptButton 
                          $isDarkMode={isDarkMode}
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <Check size={16} />
                        </AcceptButton>
                        <RejectButton 
                          $isDarkMode={isDarkMode}
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <X size={16} />
                        </RejectButton>
                      </RequestActions>
                    </RequestItem>
                  ))}
                </RequestsList>
              )}
            </RequestsTab>
          )}

          {activeTab === 'add' && (
            <AddFriendsTab>
              <SearchContainer $isDarkMode={isDarkMode}>
                <Search size={16} />
                <SearchInput
                  $isDarkMode={isDarkMode}
                  placeholder="Search by email or username..."
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                />
              </SearchContainer>

              {searchQuery.trim().length === 0 ? (
                <EmptyState $isDarkMode={isDarkMode}>
                  <Search size={48} />
                  <h3>Find Friends</h3>
                  <p>Search for friends by their email address or username.</p>
                </EmptyState>
              ) : loading ? (
                <EmptyState $isDarkMode={isDarkMode}>
                  <Search size={48} />
                  <h3>Searching...</h3>
                  <p>Looking for users matching "{searchQuery}"</p>
                </EmptyState>
              ) : searchResults.length === 0 ? (
                <EmptyState $isDarkMode={isDarkMode}>
                  <UserPlus size={48} />
                  <h3>No users found</h3>
                  <p>No users found matching "{searchQuery}". Try a different search term.</p>
                </EmptyState>
              ) : (
                <SearchResults>
                  {searchResults.map(user => (
                    <SearchResultItem key={user.uid} $isDarkMode={isDarkMode}>
                      <FriendAvatar>{user.avatar || '👤'}</FriendAvatar>
                      <FriendInfo>
                        <FriendName $isDarkMode={isDarkMode}>{user.displayName}</FriendName>
                        <FriendEmail $isDarkMode={isDarkMode}>{user.email}</FriendEmail>
                      </FriendInfo>
                      <AddFriendButton 
                        $isDarkMode={isDarkMode}
                        onClick={() => handleSendFriendRequest(user.uid)}
                      >
                        <UserPlus size={16} />
                        Add Friend
                      </AddFriendButton>
                    </SearchResultItem>
                  ))}
                </SearchResults>
              )}
            </AddFriendsTab>
          )}
        </FriendsBody>
      </FriendsContainer>
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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const FriendsContainer = styled.div`
  width: 100%;
  max-width: 800px;
  height: 90vh;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.95)'
    : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const FriendsHeader = styled.header`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h2 {
    margin: 0;
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
`;

const Tab = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  background: ${props => props.$active 
    ? (props.$isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
    : 'transparent'
  };
  color: ${props => props.$active 
    ? (props.$isDarkMode ? 'hsl(217.2 91.2% 69.8%)' : 'hsl(217.2 91.2% 59.8%)')
    : (props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 35%)')
  };
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: ${props => props.$active ? '600' : '500'};
  
  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(248, 250, 252, 0.8)'
    };
  }
`;

const FriendsBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const FriendsTab = styled.div``;
const RequestsTab = styled.div``;
const AddFriendsTab = styled.div``;

const FriendsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RequestsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.05)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(248, 250, 252, 1)'
    };
    transform: translateY(-1px);
  }
`;

const RequestItem = styled(FriendItem)``;
const SearchResultItem = styled(FriendItem)``;

const FriendAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.1));
  border: 2px solid rgba(148, 163, 184, 0.2);
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RequestInfo = styled(FriendInfo)``;

const FriendName = styled.div`
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin-bottom: 0.25rem;
`;

const FriendEmail = styled.div`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
`;

const FriendActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RequestActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 25%)'
  };
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.25)'
      : 'rgba(255, 255, 255, 1)'
    };
    transform: translateY(-1px);
  }
`;

const AcceptButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(16, 185, 129, 0.25);
    transform: translateY(-1px);
  }
`;

const RejectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    transform: translateY(-1px);
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.25)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 12px;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 25%)'
  };
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 0.875rem;
  
  &::placeholder {
    color: ${props => props.$isDarkMode 
      ? 'hsl(215 20.2% 65.1%)'
      : 'hsl(222.2 84% 35%)'
    };
  }
`;

const AddFriendButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
  
  h3 {
    margin: 1rem 0 0.5rem 0;
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }
  
  p {
    font-size: 0.875rem;
    margin: 0;
  }
`;

export default FriendsCenter;
