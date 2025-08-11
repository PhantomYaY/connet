import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import collaborationService from '../lib/collaborationService';

const CollaborativeCursors = ({ editorRef }) => {
  const [cursors, setCursors] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    const handleCursorMove = (cursorsData) => {
      setCursors(cursorsData);
    };

    const handleCollaboratorsChange = (collaboratorsData) => {
      setCollaborators(collaboratorsData);
    };

    // Register for collaboration events
    collaborationService.on('onCursorMoved', handleCursorMove);
    collaborationService.on('onCollaboratorsChanged', handleCollaboratorsChange);

    return () => {
      collaborationService.off('onCursorMoved', handleCursorMove);
      collaborationService.off('onCollaboratorsChanged', handleCollaboratorsChange);
    };
  }, []);

  // Convert text position to screen coordinates
  const getScreenPosition = (cursor) => {
    if (!editorRef?.current) return { x: 0, y: 0 };

    try {
      // Find the ProseMirror editor content area
      const proseMirrorEditor = editorRef.current.querySelector('.ProseMirror');
      if (!proseMirrorEditor) return { x: 0, y: 0 };

      const editorRect = proseMirrorEditor.getBoundingClientRect();
      const lineHeight = 24; // Better line height estimate
      const charWidth = 8.5; // Better character width estimate

      // Calculate position within the editor content area
      const x = editorRect.left + 16 + (cursor.column * charWidth); // Add padding
      const y = editorRect.top + 16 + (cursor.line * lineHeight); // Add padding

      return { x, y };
    } catch (error) {
      return { x: 0, y: 0 };
    }
  };

  // Generate color for user
  const getUserColor = (userId) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
    ];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  if (!collaborationService.isCollaborating()) {
    return null;
  }

  return (
    <CursorsContainer>
      {cursors.map(([userId, cursor]) => {
        const collaborator = collaborators.find(c => c.userId === userId);
        if (!collaborator) return null;

        const position = getScreenPosition(cursor);
        const color = getUserColor(userId);

        return (
          <CursorWrapper
            key={userId}
            style={{
              left: position.x,
              top: position.y,
              '--user-color': color
            }}
          >
            <CursorLine />
            <CursorLabel>
              <CursorAvatar>
                {collaborator.photoURL ? (
                  <img src={collaborator.photoURL} alt={collaborator.displayName} />
                ) : (
                  <span>{collaborator.displayName?.charAt(0) || '?'}</span>
                )}
              </CursorAvatar>
              <CursorName>{collaborator.displayName || 'Anonymous'}</CursorName>
            </CursorLabel>
          </CursorWrapper>
        );
      })}
      
      {/* Collaborators indicator */}
      {collaborators.length > 0 && (
        <CollaboratorsIndicator>
          <IndicatorText>
            {collaborators.length} other{collaborators.length !== 1 ? 's' : ''} editing
          </IndicatorText>
          <CollaboratorAvatars>
            {collaborators.slice(0, 3).map((collaborator) => (
              <CollaboratorAvatar key={collaborator.userId} $color={getUserColor(collaborator.userId)}>
                {collaborator.photoURL ? (
                  <img src={collaborator.photoURL} alt={collaborator.displayName} />
                ) : (
                  <span>{collaborator.displayName?.charAt(0) || '?'}</span>
                )}
              </CollaboratorAvatar>
            ))}
            {collaborators.length > 3 && (
              <MoreCollaborators>+{collaborators.length - 3}</MoreCollaborators>
            )}
          </CollaboratorAvatars>
        </CollaboratorsIndicator>
      )}
    </CursorsContainer>
  );
};

// Animations
const cursorBlink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const CursorsContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1000;
  width: 100vw;
  height: 100vh;
`;

const CursorWrapper = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: 1001;
  animation: ${slideIn} 0.3s ease;
`;

const CursorLine = styled.div`
  width: 2px;
  height: 20px;
  background-color: var(--user-color);
  position: relative;
  animation: ${cursorBlink} 1.5s infinite;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 6px;
    height: 6px;
    background-color: var(--user-color);
    border-radius: 50%;
  }
`;

const CursorLabel = styled.div`
  position: absolute;
  top: -35px;
  left: 0;
  background: var(--user-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  max-width: 150px;
`;

const CursorAvatar = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  span {
    font-size: 10px;
    font-weight: 600;
  }
`;

const CursorName = styled.span`
  font-size: 10px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CollaboratorsIndicator = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: ${slideIn} 0.5s ease;
  pointer-events: auto;
  z-index: 1002;

  .dark & {
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(148, 163, 184, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const IndicatorText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: rgba(71, 85, 105, 0.8);

  .dark & {
    color: rgba(226, 232, 240, 0.8);
  }
`;

const CollaboratorAvatars = styled.div`
  display: flex;
  align-items: center;
  gap: -4px;
`;

const CollaboratorAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid ${props => props.$color};
  background: ${props => props.$color};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -4px;
  
  &:first-child {
    margin-left: 0;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  span {
    font-size: 10px;
    font-weight: 600;
    color: white;
  }
`;

const MoreCollaborators = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(107, 114, 128, 0.8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  margin-left: -4px;
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

export default CollaborativeCursors;
