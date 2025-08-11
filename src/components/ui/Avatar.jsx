import React from 'react';
import styled from 'styled-components';

const AvatarContainer = styled.div`
  width: ${props => {
    switch(props.$size) {
      case 'xs': return '24px';
      case 'sm': return '32px';
      case 'md': return '40px';
      case 'lg': return '48px';
      case 'xl': return '56px';
      default: return '32px';
    }
  }};
  height: ${props => {
    switch(props.$size) {
      case 'xs': return '24px';
      case 'sm': return '32px';
      case 'md': return '40px';
      case 'lg': return '48px';
      case 'xl': return '56px';
      default: return '32px';
    }
  }};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => {
    switch(props.$size) {
      case 'xs': return '0.625rem';
      case 'sm': return '0.75rem';
      case 'md': return '0.875rem';
      case 'lg': return '1rem';
      case 'xl': return '1.125rem';
      default: return '0.75rem';
    }
  }};
  font-weight: 600;
  color: white;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
    : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
  };
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.2)' 
    : 'rgba(148, 163, 184, 0.3)'
  };
  transition: all 0.2s ease;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  position: relative;
  
  ${props => props.$clickable && `
    &:hover {
      transform: scale(1.05);
      border-color: ${props.$isDarkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.5)'};
      box-shadow: 0 2px 8px ${props.$isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)'};
    }
  `}

  /* Online indicator */
  ${props => props.$online && `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: ${props.$size === 'xs' ? '6px' : props.$size === 'sm' ? '8px' : '10px'};
      height: ${props.$size === 'xs' ? '6px' : props.$size === 'sm' ? '8px' : '10px'};
      background: #22c55e;
      border-radius: 50%;
      border: 2px solid ${props.$isDarkMode ? '#0f172a' : '#ffffff'};
    }
  `}
`;

const Avatar = ({ 
  user, 
  size = 'sm', 
  isDarkMode = false, 
  clickable = false, 
  online = false,
  onClick,
  className,
  ...props 
}) => {
  const getInitials = (user) => {
    if (!user) return 'U';
    
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  return (
    <AvatarContainer
      $size={size}
      $isDarkMode={isDarkMode}
      $clickable={clickable}
      $online={online}
      onClick={clickable ? onClick : undefined}
      className={className}
      {...props}
    >
      {getInitials(user)}
    </AvatarContainer>
  );
};

export default Avatar;
