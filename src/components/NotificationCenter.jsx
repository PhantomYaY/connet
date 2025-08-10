import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import {
  Bell,
  BellOff,
  Check,
  X,
  Users,
  MessageCircle,
  Heart,
  UserPlus,
  Trash2
} from 'lucide-react';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  getUnreadNotificationCount 
} from '../lib/firestoreService';
import { useToast } from './ui/use-toast';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, friend_request, message, etc.

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notifs = await getNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
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

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotifications();
      await loadUnreadCount();
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus size={20} color="#3b82f6" />;
      case 'friend_accepted':
        return <Users size={20} color="#10b981" />;
      case 'message':
        return <MessageCircle size={20} color="#6366f1" />;
      case 'like':
        return <Heart size={20} color="#ef4444" />;
      default:
        return <Bell size={20} color="#6b7280" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  if (!isOpen) return null;

  return (
    <Overlay $isDarkMode={isDarkMode} onClick={onClose}>
      <NotificationContainer $isDarkMode={isDarkMode} onClick={(e) => e.stopPropagation()}>
        <NotificationHeader $isDarkMode={isDarkMode}>
          <HeaderInfo>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Bell size={24} />
              <h2>Notifications</h2>
            </div>
            {unreadCount > 0 && (
              <UnreadBadge $isDarkMode={isDarkMode}>{unreadCount}</UnreadBadge>
            )}
          </HeaderInfo>
          <HeaderActions>
            {notifications.some(n => !n.read) && (
              <ActionButton $isDarkMode={isDarkMode} onClick={handleMarkAllAsRead}>
                <Check size={16} />
                Mark all read
              </ActionButton>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              ✕
            </button>
          </HeaderActions>
        </NotificationHeader>

        <FilterContainer $isDarkMode={isDarkMode}>
          <FilterButton 
            $isDarkMode={isDarkMode} 
            $active={filter === 'all'} 
            onClick={() => setFilter('all')}
          >
            All
          </FilterButton>
          <FilterButton 
            $isDarkMode={isDarkMode} 
            $active={filter === 'unread'} 
            onClick={() => setFilter('unread')}
          >
            Unread
          </FilterButton>
          <FilterButton 
            $isDarkMode={isDarkMode} 
            $active={filter === 'friend_request'} 
            onClick={() => setFilter('friend_request')}
          >
            Friends
          </FilterButton>
          <FilterButton 
            $isDarkMode={isDarkMode} 
            $active={filter === 'message'} 
            onClick={() => setFilter('message')}
          >
            Messages
          </FilterButton>
        </FilterContainer>

        <NotificationBody>
          {loading ? (
            <LoadingState $isDarkMode={isDarkMode}>
              <div className="spinner" />
              <p>Loading notifications...</p>
            </LoadingState>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState $isDarkMode={isDarkMode}>
              <BellOff size={48} />
              <h3>No notifications</h3>
              <p>
                {filter === 'all' 
                  ? "You're all caught up! No notifications to show."
                  : `No ${filter} notifications found.`
                }
              </p>
            </EmptyState>
          ) : (
            <NotificationsList>
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  $isDarkMode={isDarkMode}
                  $unread={!notification.read}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <NotificationIcon>
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
                      {formatTime(notification.createdAt)}
                    </NotificationTime>
                  </NotificationContent>
                  <NotificationActions>
                    {!notification.read && (
                      <ReadButton 
                        $isDarkMode={isDarkMode}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <Check size={14} />
                      </ReadButton>
                    )}
                  </NotificationActions>
                  {!notification.read && <UnreadDot />}
                </NotificationItem>
              ))}
            </NotificationsList>
          )}
        </NotificationBody>
      </NotificationContainer>
    </Overlay>
  );
};

// Hook for notification badge
export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    loadUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { unreadCount, refreshCount: async () => {
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
  }};
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

const NotificationContainer = styled.div`
  width: 100%;
  max-width: 600px;
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

const NotificationHeader = styled.header`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h2 {
    margin: 0;
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UnreadBadge = styled.div`
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.$isDarkMode 
    ? 'rgba(59, 130, 246, 0.15)'
    : 'rgba(59, 130, 246, 0.1)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(217.2 91.2% 69.8%)'
    : 'hsl(217.2 91.2% 59.8%)'
  };
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.25)'
      : 'rgba(59, 130, 246, 0.2)'
    };
  }
`;

const FilterContainer = styled.div`
  display: flex;
  padding: 1rem 2rem;
  gap: 0.5rem;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  overflow-x: auto;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.$active 
    ? (props.$isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
    : 'transparent'
  };
  color: ${props => props.$active 
    ? (props.$isDarkMode ? 'hsl(217.2 91.2% 69.8%)' : 'hsl(217.2 91.2% 59.8%)')
    : (props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 35%)')
  };
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(248, 250, 252, 0.8)'
    };
  }
`;

const NotificationBody = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const NotificationsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 2rem;
  cursor: ${props => props.$unread ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  position: relative;
  background: ${props => props.$unread 
    ? (props.$isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)')
    : 'transparent'
  };
  
  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.05)'
      : 'rgba(248, 250, 252, 0.8)'
    };
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.08)'
      : 'rgba(0, 0, 0, 0.05)'
    };
  }
`;

const NotificationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.1);
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  margin-bottom: 0.25rem;
`;

const NotificationMessage = styled.div`
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
`;

const NotificationTime = styled.div`
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
  font-size: 0.75rem;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ReadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(16, 185, 129, 0.25);
  }
`;

const UnreadDot = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
`;

const LoadingState = styled.div`
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
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(148, 163, 184, 0.3);
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  p {
    margin: 0;
    font-size: 0.875rem;
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

export default NotificationCenter;
