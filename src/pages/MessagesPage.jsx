import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  Search,
  ArrowLeft,
  MessageCircle,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  createConversation,
  getFriends,
  subscribeToConversations,
  subscribeToMessages
} from '../lib/firestoreService';
import { socketService } from '../lib/socketService';
import { useToast } from '../components/ui/use-toast';

const MessagesPage = () => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Set up Socket.IO event listeners
    const setupSocketListeners = () => {
      // Connection status
      socketService.on('connection-status', ({ connected }) => {
        setSocketConnected(connected);
      });

      // New messages
      socketService.on('new-message', (message) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message].sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return aTime - bTime;
          });
        });
      });

      // Typing indicators
      socketService.on('user-typing', ({ userId, conversationId }) => {
        if (selectedConversation?.id === conversationId) {
          setTypingUsers(prev => new Set([...prev, userId]));
        }
      });

      socketService.on('user-stopped-typing', ({ userId, conversationId }) => {
        if (selectedConversation?.id === conversationId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      });

      // Online/offline status
      socketService.on('user-online', ({ userId }) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      socketService.on('user-offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });
    };

    setupSocketListeners();
    setSocketConnected(socketService.isSocketConnected());

    // Set up Firestore conversations subscription (for conversation list)
    const unsubscribeConversations = subscribeToConversations((convs) => {
      setConversations(convs);
      setIsConnected(true);
    });

    loadFriends();

    // Cleanup
    return () => {
      unsubscribeConversations();
      // Socket service cleanup is handled by the service itself
    };
  }, [selectedConversation]);

  useEffect(() => {
    // Auto-select conversation from URL params
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    let unsubscribeMessages = null;

    if (selectedConversation) {
      // Join Socket.IO room for real-time updates
      socketService.joinConversation(selectedConversation.id);

      // Also maintain Firestore subscription for message history
      unsubscribeMessages = subscribeToMessages(selectedConversation.id, (msgs) => {
        setMessages(msgs);
      });

      // Clear typing indicators when switching conversations
      setTypingUsers(new Set());
    } else {
      setMessages([]);
    }

    // Cleanup previous subscription when conversation changes
    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle typing indicators
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!selectedConversation) return;

    if (value.trim()) {
      // Start typing
      socketService.startTyping(selectedConversation.id);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(selectedConversation.id);
      }, 3000);
    } else {
      // Stop typing if input is empty
      socketService.stopTyping(selectedConversation.id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      setLoading(true);

      // Stop typing indicator
      socketService.stopTyping(selectedConversation.id);

      // Send via Socket.IO for instant delivery
      await socketService.sendMessage(selectedConversation.id, messageContent);

    } catch (error) {
      console.error('Error sending message:', error);

      // Restore message if it failed
      setNewMessage(messageContent);

      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = async (friend) => {
    try {
      const conversationId = await createConversation(friend.uid);
      const newConv = {
        id: conversationId,
        participants: [friend.uid],
        otherUser: friend,
        lastMessage: '',
        lastMessageAt: null
      };
      setSelectedConversation(newConv);
      setShowNewChat(false);
      await loadConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Container $isDarkMode={isDarkMode}>
      <Header $isDarkMode={isDarkMode}>
        <BackButton $isDarkMode={isDarkMode} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </BackButton>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MessageCircle size={24} />
          <h1>Messages</h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {socketConnected ? (
              <>
                <Wifi size={14} style={{ color: '#10b981' }} />
                <span style={{ color: '#10b981' }}>Live</span>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  animation: 'pulse 2s infinite'
                }} />
              </>
            ) : (
              <>
                <WifiOff size={14} style={{ color: '#ef4444' }} />
                <span style={{ color: '#ef4444' }}>Offline</span>
              </>
            )}
          </div>
        </div>
      </Header>

      <MessagingBody>
        {/* Conversations List */}
        <ConversationsList $isDarkMode={isDarkMode}>
          <ConversationsHeader $isDarkMode={isDarkMode}>
            <SearchContainer $isDarkMode={isDarkMode}>
              <Search size={16} />
              <SearchInput
                $isDarkMode={isDarkMode}
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchContainer>
            <NewChatButton $isDarkMode={isDarkMode} onClick={() => setShowNewChat(true)}>
              <Users size={16} />
            </NewChatButton>
          </ConversationsHeader>

          {showNewChat ? (
            <NewChatList $isDarkMode={isDarkMode}>
              <NewChatHeader $isDarkMode={isDarkMode}>
                <button onClick={() => setShowNewChat(false)}>
                  <ArrowLeft size={16} />
                </button>
                <span>New Message</span>
              </NewChatHeader>
              {friends.map(friend => (
                <FriendItem
                  key={friend.uid}
                  $isDarkMode={isDarkMode}
                  onClick={() => handleStartNewChat(friend)}
                >
                  <FriendAvatar>{friend.avatar || '👤'}</FriendAvatar>
                  <FriendInfo>
                    <FriendName $isDarkMode={isDarkMode}>{friend.displayName}</FriendName>
                    <FriendStatus $isDarkMode={isDarkMode}>Online</FriendStatus>
                  </FriendInfo>
                </FriendItem>
              ))}
            </NewChatList>
          ) : (
            <ConversationsContainer>
              {conversations.length === 0 ? (
                <EmptyState $isDarkMode={isDarkMode}>
                  <MessageCircle size={48} />
                  <p>No conversations yet</p>
                  <span>Start chatting with your friends!</span>
                </EmptyState>
              ) : (
                conversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    $isDarkMode={isDarkMode}
                    $active={selectedConversation?.id === conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <ConversationAvatar>
                      {conversation.otherUser?.avatar || '👤'}
                    </ConversationAvatar>
                    <ConversationInfo>
                      <ConversationName $isDarkMode={isDarkMode}>
                        {conversation.otherUser?.displayName || 'Unknown User'}
                      </ConversationName>
                      <LastMessage $isDarkMode={isDarkMode}>
                        {conversation.lastMessage || 'No messages yet'}
                      </LastMessage>
                    </ConversationInfo>
                    <ConversationMeta>
                      <MessageTime $isDarkMode={isDarkMode}>
                        {formatDate(conversation.lastMessageAt)}
                      </MessageTime>
                    </ConversationMeta>
                  </ConversationItem>
                ))
              )}
            </ConversationsContainer>
          )}
        </ConversationsList>

        {/* Messages Area */}
        <MessagesArea $isDarkMode={isDarkMode}>
          {selectedConversation ? (
            <>
              <ChatHeader $isDarkMode={isDarkMode}>
                <ChatUserInfo>
                  <ChatAvatar>{selectedConversation.otherUser?.avatar || '👤'}</ChatAvatar>
                  <ChatUserDetails>
                    <ChatUserName $isDarkMode={isDarkMode}>
                      {selectedConversation.otherUser?.displayName || 'Unknown User'}
                    </ChatUserName>
                    <ChatUserStatus $isDarkMode={isDarkMode}>Online</ChatUserStatus>
                  </ChatUserDetails>
                </ChatUserInfo>
              </ChatHeader>

              <MessagesContainer>
                {messages.length === 0 ? (
                  <EmptyMessages $isDarkMode={isDarkMode}>
                    <MessageCircle size={48} />
                    <p>No messages yet</p>
                    <span>Start the conversation!</span>
                  </EmptyMessages>
                ) : (
                  messages.map(message => (
                    <MessageBubble
                      key={message.id}
                      $isDarkMode={isDarkMode}
                      $isOwn={message.sender?.uid === selectedConversation.otherUser?.uid ? false : true}
                    >
                      <MessageContent $isOwn={message.sender?.uid === selectedConversation.otherUser?.uid ? false : true}>
                        {message.content}
                      </MessageContent>
                      <MessageTimeStamp $isDarkMode={isDarkMode}>
                        {formatTime(message.createdAt)}
                      </MessageTimeStamp>
                    </MessageBubble>
                  ))
                )}
                <div ref={messagesEndRef} />
              </MessagesContainer>

              <MessageInputContainer $isDarkMode={isDarkMode}>
                <MessageForm onSubmit={handleSendMessage}>
                  <MessageInput
                    $isDarkMode={isDarkMode}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message and press Enter..."
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          handleSendMessage(e);
                        }
                      }
                    }}
                  />
                  <SendButton $isDarkMode={isDarkMode} type="submit" disabled={!newMessage.trim() || loading}>
                    <Send size={18} />
                  </SendButton>
                </MessageForm>
              </MessageInputContainer>
            </>
          ) : (
            <EmptyChat $isDarkMode={isDarkMode}>
              <MessageCircle size={64} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </EmptyChat>
          )}
        </MessagesArea>
      </MessagingBody>
    </Container>
  );
};

// Styled Components (using similar styles to MessagingCenter but adapted for full page layout)
const Container = styled.div`
  min-height: 100vh;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  background: ${props => props.$isDarkMode 
    ? 'linear-gradient(135deg, hsl(222.2 84% 4.9%) 0%, hsl(217.2 32.6% 17.5%) 100%)'
    : 'linear-gradient(135deg, hsl(210 40% 98%) 0%, hsl(210 40% 96%) 100%)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  display: flex;
  flex-direction: column;
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

const MessagingBody = styled.div`
  flex: 1;
  display: flex;
  height: calc(100vh - 120px);
  overflow: hidden;
`;

const ConversationsList = styled.div`
  width: 350px;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.05)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  border-right: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  display: flex;
  flex-direction: column;
`;

const ConversationsHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  display: flex;
  gap: 0.5rem;
`;

const SearchContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.25)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 8px;
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

const NewChatButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: ${props => props.$isDarkMode 
    ? 'rgba(59, 130, 246, 0.2)'
    : 'rgba(59, 130, 246, 0.1)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(217.2 91.2% 69.8%)'
    : 'hsl(217.2 91.2% 59.8%)'
  };
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.3)'
      : 'rgba(59, 130, 246, 0.2)'
    };
  }
`;

const ConversationsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active 
    ? (props.$isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
    : 'transparent'
  };
  
  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(248, 250, 252, 0.8)'
    };
  }
`;

const ConversationAvatar = styled.div`
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

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConversationName = styled.div`
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin-bottom: 0.25rem;
`;

const LastMessage = styled.div`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ConversationMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;

const MessageTime = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
`;

const NewChatList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const NewChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }
  
  span {
    font-weight: 600;
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(248, 250, 252, 0.8)'
    };
  }
`;

const FriendAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.1));
  border: 2px solid rgba(148, 163, 184, 0.2);
`;

const FriendInfo = styled.div`
  flex: 1;
`;

const FriendName = styled.div`
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin-bottom: 0.25rem;
`;

const FriendStatus = styled.div`
  font-size: 0.875rem;
  color: #10b981;
`;

const MessagesArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.25)'
    : 'rgba(255, 255, 255, 0.8)'
  };
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
`;

const ChatUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ChatAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.1));
  border: 2px solid rgba(148, 163, 184, 0.2);
`;

const ChatUserDetails = styled.div``;

const ChatUserName = styled.div`
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin-bottom: 0.25rem;
`;

const ChatUserStatus = styled.div`
  font-size: 0.875rem;
  color: #10b981;
`;


const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MessageBubble = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
  margin-bottom: 0.5rem;
`;

const MessageContent = styled.div`
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: ${props => props.$isOwn 
    ? '1rem 1rem 0.25rem 1rem'
    : '1rem 1rem 1rem 0.25rem'
  };
  background: ${props => props.$isOwn 
    ? '#3b82f6'
    : 'rgba(148, 163, 184, 0.15)'
  };
  color: ${props => props.$isOwn 
    ? 'white'
    : props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'
  };
  word-wrap: break-word;
`;

const MessageTimeStamp = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
  margin-top: 0.25rem;
`;

const MessageInputContainer = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;


const MessageForm = styled.form`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.25)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  outline: none;
  
  &:focus {
    border-color: #3b82f6;
  }
  
  &::placeholder {
    color: ${props => props.$isDarkMode 
      ? 'hsl(215 20.2% 65.1%)'
      : 'hsl(222.2 84% 35%)'
    };
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  
  p {
    margin: 1rem 0 0.5rem 0;
    font-weight: 600;
  }
  
  span {
    font-size: 0.875rem;
  }
`;

const EmptyMessages = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
  
  p {
    margin: 1rem 0 0.5rem 0;
    font-weight: 600;
  }
  
  span {
    font-size: 0.875rem;
  }
`;

const EmptyChat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
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
  }
`;

export default MessagesPage;
