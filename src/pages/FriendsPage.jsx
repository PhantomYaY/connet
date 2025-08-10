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
  ArrowLeft
} from 'lucide-react';
import { 
  getFriends, 
  getFriendRequests, 
  getSentFriendRequests,
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest,
  getUserProfile,
  createConversation
} from '../lib/firestoreService';
import { 
  searchUsers, 
  filterAlreadyFriends, 
  filterExistingRequests 
} from '../lib/userSearchService';
import { useToast } from '../components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const FriendsPage = () => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

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
      const sentRequests = await getSentFriendRequests();
      users = await filterExistingRequests(users, sentRequests.map(req => ({...req, from: req.to})));
      
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

  const handleStartChat = async (friend) => {
    try {
      const conversationId = await createConversation(friend.uid);
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  return (
    <Container $isDarkMode={isDarkMode}>
      <Header $isDarkMode={isDarkMode}>
        <BackButton $isDarkMode={isDarkMode} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </BackButton>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={24} />
          <h1>Friends</h1>
        </div>
      </Header>

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

      <Content>
        {activeTab === 'friends' && (
          <Section>
            {friends.length === 0 ? (
              <EmptyState $isDarkMode={isDarkMode}>
                <Users size={48} />
                <h3>No friends yet</h3>
                <p>Start building your network by adding friends!</p>
              </EmptyState>
            ) : (
              <ItemsList>
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
                        onClick={() => handleStartChat(friend)}
                      >
                        <MessageCircle size={16} />
                      </ActionButton>
                      <ActionButton $isDarkMode={isDarkMode}>
                        <MoreVertical size={16} />
                      </ActionButton>
                    </FriendActions>
                  </FriendItem>
                ))}
              </ItemsList>
            )}
          </Section>
        )}

        {activeTab === 'requests' && (
          <Section>
            {friendRequests.length === 0 ? (
              <EmptyState $isDarkMode={isDarkMode}>
                <UserPlus size={48} />
                <h3>No friend requests</h3>
                <p>When someone sends you a friend request, it will appear here.</p>
              </EmptyState>
            ) : (
              <ItemsList>
                {friendRequests.map(request => (
                  <RequestItem key={request.id} $isDarkMode={isDarkMode}>
                    <FriendAvatar>{request.fromUser?.avatar || '👤'}</FriendAvatar>
                    <FriendInfo>
                      <FriendName $isDarkMode={isDarkMode}>
                        {request.fromUser?.displayName || 'Unknown User'}
                      </FriendName>
                      <FriendEmail $isDarkMode={isDarkMode}>
                        {request.fromUser?.email || ''}
                      </FriendEmail>
                    </FriendInfo>
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
              </ItemsList>
            )}
          </Section>
        )}

        {activeTab === 'add' && (
          <Section>
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
                  <SearchResultItem key={user.id} $isDarkMode={isDarkMode}>
                    <FriendAvatar>{user.avatar || '👤'}</FriendAvatar>
                    <FriendInfo>
                      <FriendName $isDarkMode={isDarkMode}>{user.displayName}</FriendName>
                      <FriendEmail $isDarkMode={isDarkMode}>{user.email}</FriendEmail>
                    </FriendInfo>
                    <AddFriendButton 
                      $isDarkMode={isDarkMode}
                      onClick={() => handleSendFriendRequest(user.id)}
                    >
                      <UserPlus size={16} />
                      Add Friend
                    </AddFriendButton>
                  </SearchResultItem>
                ))}
              </SearchResults>
            )}
          </Section>
        )}
      </Content>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode 
    ? 'linear-gradient(135deg, hsl(222.2 84% 4.9%) 0%, hsl(217.2 32.6% 17.5%) 100%)'
    : 'linear-gradient(135deg, hsl(210 40% 98%) 0%, hsl(210 40% 96%) 100%)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  
  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
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

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  padding: 0 2rem;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
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
  border-bottom: 2px solid ${props => props.$active 
    ? (props.$isDarkMode ? 'hsl(217.2 91.2% 69.8%)' : 'hsl(217.2 91.2% 59.8%)')
    : 'transparent'
  };
  
  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(248, 250, 252, 0.8)'
    };
  }
`;

const Content = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Section = styled.div``;

const ItemsList = styled.div`
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
  padding: 1.5rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.05)'
    : 'rgba(255, 255, 255, 0.8)'
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
      : 'rgba(255, 255, 255, 1)'
    };
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const RequestItem = styled(FriendItem)``;
const SearchResultItem = styled(FriendItem)``;

const FriendAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.1));
  border: 2px solid rgba(148, 163, 184, 0.2);
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendName = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
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
  width: 40px;
  height: 40px;
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
  width: 40px;
  height: 40px;
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
  width: 40px;
  height: 40px;
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
  padding: 0.75rem 1rem;
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

export default FriendsPage;
