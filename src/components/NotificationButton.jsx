import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import NotificationCenter from './NotificationCenter';
import { getUnreadNotificationCount } from '../lib/firestoreService';
import { auth } from '../lib/firebase';

const NotificationButton = () => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (auth.currentUser) {
      loadUnreadCount();
      
      // Set up interval to check for new notifications
      const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [auth.currentUser]);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reload count when closing to update the badge
    loadUnreadCount();
  };

  if (!auth.currentUser) {
    return null; // Don't show notification button if not authenticated
  }

  return (
    <>
      <NotificationButtonContainer 
        $isDarkMode={isDarkMode}
        onClick={handleClick}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <UnreadBadge>
            {unreadCount > 99 ? '99+' : unreadCount}
          </UnreadBadge>
        )}
      </NotificationButtonContainer>
      
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={handleClose}
      />
    </>
  );
};

const NotificationButtonContainer = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 0.75rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(51, 65, 85, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'
  };
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$isDarkMode ? '#475569' : '#e2e8f0'};
  color: ${props => props.$isDarkMode ? '#cbd5e1' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(51, 65, 85, 0.8)'
      : 'rgba(248, 250, 252, 1)'
    };
    color: ${props => props.$isDarkMode ? '#f1f5f9' : '#1e293b'};
    border-color: ${props => props.$isDarkMode ? '#64748b' : '#cbd5e1'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const UnreadBadge = styled.span`
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: #ef4444;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.125rem 0.25rem;
  border-radius: 0.625rem;
  min-width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.$isDarkMode ? '#1e293b' : '#ffffff'};
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
  }
`;

export default NotificationButton;
