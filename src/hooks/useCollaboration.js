import { useState, useEffect, useCallback } from 'react';
import collaborationService from '../lib/collaborationService';

export const useCollaboration = (noteId) => {
  const [collaborators, setCollaborators] = useState([]);
  const [cursors, setCursors] = useState([]);
  const [isCollaborating, setIsCollaborating] = useState(false);

  // Join collaboration session
  const joinCollaboration = useCallback(async () => {
    if (noteId) {
      console.log('🤝 Joining collaboration for noteId:', noteId);
      try {
        await collaborationService.joinNote(noteId);
        setIsCollaborating(true);
        console.log('✅ Successfully joined collaboration');
      } catch (error) {
        console.error('❌ Failed to join collaboration:', error);
        // Still set as collaborating ready even if join fails
        // This allows the UI to show collaboration features
        setIsCollaborating(true);
      }
    } else {
      console.warn('⚠️ Cannot join collaboration: no noteId provided');
    }
  }, [noteId]);

  // Leave collaboration session
  const leaveCollaboration = useCallback(async () => {
    await collaborationService.leaveNote();
    setIsCollaborating(false);
    setCollaborators([]);
    setCursors([]);
  }, []);

  // Update cursor position
  const updateCursor = useCallback((position) => {
    collaborationService.updateCursor(position);
  }, []);

  // Share content changes
  const shareContentChange = useCallback((change) => {
    collaborationService.shareContentChange(change);
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handleCollaboratorsChange = (newCollaborators) => {
      setCollaborators(newCollaborators);
    };

    const handleCursorMove = (newCursors) => {
      setCursors(newCursors);
    };

    const handleContentChange = (change) => {
      // Handle incoming content changes from other users
      console.log('Content change received:', change);
      // Emit event for the note page to handle
      window.dispatchEvent(new CustomEvent('collaborativeContentChange', {
        detail: change
      }));
    };

    // Register event listeners
    collaborationService.on('onCollaboratorsChanged', handleCollaboratorsChange);
    collaborationService.on('onCursorMoved', handleCursorMove);
    collaborationService.on('onContentChanged', handleContentChange);

    return () => {
      // Cleanup event listeners
      collaborationService.off('onCollaboratorsChanged', handleCollaboratorsChange);
      collaborationService.off('onCursorMoved', handleCursorMove);
      collaborationService.off('onContentChanged', handleContentChange);
    };
  }, []);

  // Auto-join when noteId changes - collaboration is always available for any note
  useEffect(() => {
    if (noteId) {
      console.log('🔄 Auto-joining collaboration for note:', noteId);
      joinCollaboration();
    }

    return () => {
      if (noteId) {
        leaveCollaboration();
      }
    };
  }, [noteId, joinCollaboration, leaveCollaboration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveCollaboration();
    };
  }, [leaveCollaboration]);

  return {
    collaborators,
    cursors,
    isCollaborating,
    joinCollaboration,
    leaveCollaboration,
    updateCursor,
    shareContentChange
  };
};

export default useCollaboration;
