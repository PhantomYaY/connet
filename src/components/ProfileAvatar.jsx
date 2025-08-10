import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

const ProfileAvatar = ({ size = 'medium', className = '' }) => {
  const [initials, setInitials] = useState('??');
  const navigate = useNavigate();

  const sizeConfig = {
    small: { width: '32px', height: '32px', fontSize: '12px' },
    medium: { width: '40px', height: '40px', fontSize: '14px' },
    large: { width: '48px', height: '48px', fontSize: '16px' }
  };
  
  const config = sizeConfig[size];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        let userInitials = '??';
        
        if (user.displayName) {
          // Get first two letters of display name
          const nameParts = user.displayName.trim().split(' ');
          if (nameParts.length >= 2) {
            userInitials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
          } else {
            userInitials = nameParts[0].substring(0, 2).toUpperCase();
          }
        } else if (user.email) {
          // Get first two letters of email username
          const emailUsername = user.email.split('@')[0];
          userInitials = emailUsername.substring(0, 2).toUpperCase();
        }
        
        setInitials(userInitials);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleClick = () => {
    navigate('/profile');
  };

  return (
    <AvatarContainer
      className={className}
      onClick={handleClick}
      style={{
        width: config.width,
        height: config.height,
        fontSize: config.fontSize
      }}
      title="View Profile"
    >
      {initials}
    </AvatarContainer>
  );
};

const AvatarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  }

  .dark & {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);

    &:hover {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
  }
`;

export default ProfileAvatar;
