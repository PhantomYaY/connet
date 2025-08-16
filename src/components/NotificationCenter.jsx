import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Bell,
  BellOff,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  CheckCircle,
  X,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './ui/use-toast';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  clearAllNotifications
} from '../lib/firestoreService';
import { auth } from '../lib/firebase';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen && auth.currentUser) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notificationData = await getNotifications(20);
      setNotifications(notificationData);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await markNotificationRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Navigate based on notification type
      if (notification.data?.postId) {
        navigate(`/communities/post/${notification.data.postId}`);
        onClose();
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast({
        title: "Error",
        description: "Failed to open notification.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications marked as read.",
        variant: "success"
      });
    } catch (error) {
      console.error('Error marking all read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive"
      });
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications cleared.",
        variant: "success"
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear notifications.",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return <MessageSquare size={16} />;
      case 'like':
        return <ThumbsUp size={16} />;
      case 'friend_request':
      case 'friend_accepted':
        return <UserPlus size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'unknown';

    let jsDate;
    try {
      if (date.toDate) {
        jsDate = date.toDate();
      } else if (date instanceof Date) {
        jsDate = date;
      } else {
        jsDate = new Date(date);
      }

      const now = new Date();
      const diffMs = now - jsDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return jsDate.toLocaleDateString();
    } catch (error) {
      return 'unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <NotificationPanel $isDarkMode={isDarkMode}>
        <Header $isDarkMode={isDarkMode}>
          <HeaderTitle>
            <Bell size={20} />
            Notifications
            {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
          </HeaderTitle>
          <HeaderActions>
            {unreadCount > 0 && (
              <ActionButton 
                $isDarkMode={isDarkMode} 
                onClick={handleMarkAllRead}
                title="Mark all as read"
              >
                <CheckCircle size={16} />
              </ActionButton>
            )}
            <ActionButton 
              $isDarkMode={isDarkMode} 
              onClick={onClose}
              title="Close"
            >
              <X size={16} />
            </ActionButton>
          </HeaderActions>
        </Header>

        <NotificationList>
          {loading ? (
            <LoadingState $isDarkMode={isDarkMode}>
              Loading notifications...
            </LoadingState>
          ) : notifications.length === 0 ? (
            <EmptyState $isDarkMode={isDarkMode}>
              <BellOff size={48} />
              <h3>No notifications</h3>
              <p>You're all caught up! New notifications will appear here.</p>
            </EmptyState>
          ) : (
            notifications.map(notification => (
              <NotificationItem 
                key={notification.id}
                $isDarkMode={isDarkMode}
                $unread={!notification.read}
                onClick={() => handleNotificationClick(notification)}
              >
                <NotificationIcon $type={notification.type} $isDarkMode={isDarkMode}>
                  {getNotificationIcon(notification.type)}
                </NotificationIcon>
                
                <NotificationContent>
                  <NotificationTitle $isDarkMode={isDarkMode}>
                    {notification.title}
                  </NotificationTitle>
                  <NotificationMessage $isDarkMode={isDarkMode}>
                    {notification.message}
                  </NotificationMessage>
                  <NotificationTime $isDarkMode={isDarkMode}>
                    {formatTimeAgo(notification.createdAt)}
                  </NotificationTime>
                </NotificationContent>

                {!notification.read && <UnreadDot />}
                
                <NotificationAction>
                  <ArrowRight size={14} />
                </NotificationAction>
              </NotificationItem>
            ))
          )}
        </NotificationList>
      </NotificationPanel>
    </>
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
  z-index: 999;
`;

const NotificationPanel = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  width: 380px;
  max-height: 500px;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.95)'
    : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.$isDarkMode ? '#475569' : '#e2e8f0'};
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  overflow: hidden;
  animation: slideIn 0.2s ease;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 420px) {
    right: 10px;
    left: 10px;
    width: auto;
  }
`;

const Header = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${props => props.$isDarkMode ? '#475569' : '#e2e8f0'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.$isDarkMode 
    ? 'rgba(51, 65, 85, 0.3)'
    : 'rgba(248, 250, 252, 0.8)'
  };
`;

const HeaderTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
`;

const UnreadBadge = styled.span`
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 1rem;
  min-width: 1.25rem;
  text-align: center;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.5rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(71, 85, 105, 0.5)'
    : 'rgba(226, 232, 240, 0.5)'
  };
  color: ${props => props.$isDarkMode ? '#cbd5e1' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(71, 85, 105, 0.8)'
      : 'rgba(226, 232, 240, 0.8)'
    };
    color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
  }
`;

const NotificationList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 2px;
  }
`;

const LoadingState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};

  svg {
    opacity: 0.5;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: ${props => props.$isDarkMode ? '#cbd5e1' : '#475569'};
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
  }
`;

const NotificationItem = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${props => props.$isDarkMode ? '#374151' : '#f1f5f9'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  position: relative;
  background: ${props => props.$unread 
    ? props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.05)'
      : 'rgba(59, 130, 246, 0.02)'
    : 'transparent'
  };

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(71, 85, 105, 0.3)'
      : 'rgba(248, 250, 252, 0.8)'
    };
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationIcon = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    const colors = {
      comment: '#3b82f6',
      reply: '#3b82f6',
      like: '#ef4444',
      friend_request: '#10b981',
      friend_accepted: '#10b981'
    };
    return colors[props.$type] || '#6b7280';
  }};
  color: white;
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
`;

const NotificationMessage = styled.p`
  font-size: 0.8125rem;
  line-height: 1.4;
  margin: 0 0 0.375rem 0;
  color: ${props => props.$isDarkMode ? '#cbd5e1' : '#475569'};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NotificationTime = styled.span`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? '#94a3b8' : '#64748b'};
`;

const UnreadDot = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  background: #3b82f6;
  border-radius: 50%;
  position: absolute;
  top: 1rem;
  right: 1rem;
`;

const NotificationAction = styled.div`
  color: ${props => props.$isDarkMode ? '#64748b' : '#94a3b8'};
  opacity: 0;
  transition: opacity 0.2s ease;

  ${NotificationItem}:hover & {
    opacity: 1;
  }
`;

export default NotificationCenter;
