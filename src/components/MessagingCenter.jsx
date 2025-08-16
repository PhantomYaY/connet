import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile,
  ArrowLeft,
  MessageCircle,
  Users
} from 'lucide-react';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  createConversation, 
  getFriends 
} from '../lib/firestoreService';
import { useToast } from './ui/use-toast';
import { auth } from '../lib/firebase';

const MessagingCenter = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      loadFriends();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const convs = await getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    
    try {
      const msgs = await getMessages(selectedConversation.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
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

    try {
      setLoading(true);
      await sendMessage(selectedConversation.id, newMessage.trim());
      setNewMessage('');
      await loadMessages();
      await loadConversations(); // Refresh to update last message
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
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

  if (!isOpen) return null;

  return (
    <Overlay $isDarkMode={isDarkMode} onClick={onClose}>
      <MessagingContainer $isDarkMode={isDarkMode} onClick={(e) => e.stopPropagation()}>
        <MessagingHeader $isDarkMode={isDarkMode}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <MessageCircle size={24} />
            <h2>Messages</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </MessagingHeader>

        <MessagingBody>
          {/* Conversations List */}
          <ConversationsList $isDarkMode={isDarkMode}>
            <ConversationsHeader $isDarkMode={isDarkMode}>
              <SearchContainer $isDarkMode={isDarkMode}>
                <Search size={16} />
                <SearchInput
                  $isDarkMode={isDarkMode}
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 25%)',
                      padding: '4px'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
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
                    <div style={{ position: 'relative' }}>
                      <FriendAvatar>{friend.avatar || '👤'}</FriendAvatar>
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#10b981',
                        border: `2px solid ${isDarkMode ? '#1e293b' : '#ffffff'}`
                      }} />
                    </div>
                    <FriendInfo>
                      <FriendName $isDarkMode={isDarkMode}>{friend.displayName}</FriendName>
                      <FriendStatus $isDarkMode={isDarkMode}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#10b981',
                          marginRight: '6px'
                        }} />
                        Online
                      </FriendStatus>
                    </FriendInfo>
                  </FriendItem>
                ))}
              </NewChatList>
            ) : (
              <ConversationsContainer>
                {conversations.filter(conv =>
                  !searchQuery ||
                  (conv.otherUser?.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (conv.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <EmptyState $isDarkMode={isDarkMode}>
                    <MessageCircle size={48} />
                    <p>{searchQuery ? 'No matching conversations' : 'No conversations yet'}</p>
                    <span>{searchQuery ? 'Try a different search term' : 'Start chatting with your friends!'}</span>
                  </EmptyState>
                ) : (
                  conversations
                    .filter(conv =>
                      !searchQuery ||
                      (conv.otherUser?.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (conv.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(conversation => (
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
                  <ChatActions>
                    <ChatActionButton $isDarkMode={isDarkMode}>
                      <Phone size={18} />
                    </ChatActionButton>
                    <ChatActionButton $isDarkMode={isDarkMode}>
                      <Video size={18} />
                    </ChatActionButton>
                    <ChatActionButton $isDarkMode={isDarkMode}>
                      <MoreVertical size={18} />
                    </ChatActionButton>
                  </ChatActions>
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
                        $isOwn={message.senderId === auth.currentUser?.uid}
                      >
                        <MessageContent $isOwn={message.senderId === auth.currentUser?.uid}>
                          {message.content}
                        </MessageContent>
                        <MessageTime $isDarkMode={isDarkMode}>
                          {formatTime(message.createdAt)}
                        </MessageTime>
                      </MessageBubble>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </MessagesContainer>

                <MessageInputContainer $isDarkMode={isDarkMode}>
                  <MessageInputActions>
                    <InputActionButton $isDarkMode={isDarkMode}>
                      <Paperclip size={18} />
                    </InputActionButton>
                  </MessageInputActions>
                  <MessageForm onSubmit={handleSendMessage}>
                    <MessageInput
                      $isDarkMode={isDarkMode}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={loading}
                    />
                    <InputActionButton $isDarkMode={isDarkMode}>
                      <Smile size={18} />
                    </InputActionButton>
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
      </MessagingContainer>
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

const MessagingContainer = styled.div`
  width: 100%;
  max-width: 1200px;
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

const MessagingHeader = styled.header`
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

const MessagingBody = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const ConversationsList = styled.div`
  width: 350px;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.05)'
    : 'rgba(248, 250, 252, 0.8)'
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

const ChatActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ChatActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 25%)'
  };
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.2)'
      : 'rgba(248, 250, 252, 1)'
    };
  }
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

const MessageInputActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const InputActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 25%)'
  };
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.2)'
      : 'rgba(248, 250, 252, 1)'
    };
  }
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

export default MessagingCenter;
