import React, { useState, useEffect, useMemo, memo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

const OptimizedProfileAvatar = memo(({ size = 'medium', className = '' }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Memoized size configuration
  const sizeConfig = useMemo(() => ({
    small: { width: '32px', height: '32px', fontSize: '12px' },
    medium: { width: '40px', height: '40px', fontSize: '14px' },
    large: { width: '48px', height: '48px', fontSize: '16px' }
  }), []);

  // Memoized initials generation
  const initials = useMemo(() => {
    if (!user) return '??';
    
    if (user.displayName) {
      const nameParts = user.displayName.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else {
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return '??';
  }, [user]);

  // Optimized auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    
    return unsubscribe;
  }, []);

  const config = sizeConfig[size];

  return (
    <AvatarContainer
      onClick={() => navigate('/profile')}
      $size={config}
      className={className}
      title={user?.displayName || user?.email || 'Profile'}
    >
      {user?.photoURL ? (
        <AvatarImage 
          src={user.photoURL} 
          alt={user.displayName || 'Profile'} 
          loading="lazy"
        />
      ) : (
        <AvatarInitials $size={config}>
          {initials}
        </AvatarInitials>
      )}
    </AvatarContainer>
  );
});

const AvatarContainer = styled.button`
  width: ${props => props.$size.width};
  height: ${props => props.$size.height};
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border: 2px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform, box-shadow;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    border-color: rgba(255, 255, 255, 1);
  }

  &:active {
    transform: scale(0.95);
  }

  .dark & {
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    border-color: rgba(148, 163, 184, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

    &:hover {
      border-color: rgba(148, 163, 184, 0.5);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }
  }

  body:not(.dark) & {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    border-color: rgba(71, 85, 105, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
      border-color: rgba(71, 85, 105, 0.3);
      box-shadow: 0 4px 12px rgba(71, 85, 105, 0.2);
    }
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const AvatarInitials = styled.div`
  font-size: ${props => props.$size.fontSize};
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;

  .dark & {
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  body:not(.dark) & {
    color: #000000;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
  }
`;

OptimizedProfileAvatar.displayName = 'OptimizedProfileAvatar';

export default OptimizedProfileAvatar;
