import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { MessageCircle, UserPlus, X } from 'lucide-react';

const UserContextMenu = ({ user, position, onClose, onMessage, onFriendRequest, isDarkMode }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleMessage = () => {
    onMessage(user);
    onClose();
  };

  const handleFriendRequest = () => {
    onFriendRequest(user);
    onClose();
  };

  return (
    <MenuOverlay>
      <MenuContainer
        ref={menuRef}
        $isDarkMode={isDarkMode}
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <MenuHeader $isDarkMode={isDarkMode}>
          <UserInfo>
            <UserAvatar>{user.avatar || '👤'}</UserAvatar>
            <UserName $isDarkMode={isDarkMode}>{user.displayName}</UserName>
          </UserInfo>
          <CloseButton onClick={onClose} $isDarkMode={isDarkMode}>
            <X size={16} />
          </CloseButton>
        </MenuHeader>

        <MenuActions>
          <MenuAction onClick={handleMessage} $isDarkMode={isDarkMode}>
            <MessageCircle size={18} />
            <span>Send Message</span>
          </MenuAction>
          <MenuAction onClick={handleFriendRequest} $isDarkMode={isDarkMode}>
            <UserPlus size={18} />
            <span>Send Friend Request</span>
          </MenuAction>
        </MenuActions>
      </MenuContainer>
    </MenuOverlay>
  );
};

const MenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
`;

const MenuContainer = styled.div`
  position: absolute;
  min-width: 200px;
  background: ${props => props.$isDarkMode
    ? 'rgba(30, 41, 59, 0.95)'
    : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 12px;
  box-shadow: ${props => props.$isDarkMode
    ? '0 20px 40px rgba(0, 0, 0, 0.5)'
    : '0 20px 40px rgba(0, 0, 0, 0.15)'
  };
  overflow: hidden;
  animation: menuAppear 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes menuAppear {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const MenuHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'
  };
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: ${props => props.$isDarkMode
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(215 20.2% 50%)'
  };
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(0, 0, 0, 0.05)'
    };
    color: ${props => props.$isDarkMode
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }
`;

const MenuActions = styled.div`
  padding: 0.5rem;
`;

const MenuAction = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.$isDarkMode
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(59, 130, 246, 0.15)'
      : 'rgba(59, 130, 246, 0.1)'
    };
    color: ${props => props.$isDarkMode
      ? 'hsl(217.2 91.2% 59.8%)'
      : 'hsl(217.2 91.2% 45%)'
    };
    transform: translateX(2px);
  }

  &:active {
    transform: scale(0.98);
  }

  span {
    flex: 1;
    text-align: left;
  }
`;

export default UserContextMenu;
