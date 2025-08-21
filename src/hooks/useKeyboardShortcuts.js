import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      // Build key combination string
      let combination = '';
      if (isMod) combination += 'mod+';
      if (isShift) combination += 'shift+';
      if (isAlt) combination += 'alt+';
      combination += key;

      // Check if this combination exists in shortcuts
      const shortcut = shortcuts[combination] || shortcuts[key];
      
      if (shortcut) {
        event.preventDefault();
        shortcut();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const useGlobalKeyboardShortcuts = (navigate, searchRef) => {
  const shortcuts = {
    '/': () => {
      // Focus search
      if (searchRef?.current) {
        searchRef.current.focus();
      }
    },
    'escape': () => {
      // Blur active element
      if (document.activeElement) {
        document.activeElement.blur();
      }
    },
    'mod+k': () => {
      // Focus search (cmd/ctrl + k)
      if (searchRef?.current) {
        searchRef.current.focus();
      }
    },
    'g h': () => navigate('/dashboard'), // Go home
    'g c': () => navigate('/communities'), // Go communities
    'g n': () => navigate('/notes'), // Go notes
    'c': () => navigate('/communities/create-post'), // Create post
    '?': () => {
      // Show keyboard shortcuts help
      console.log('Keyboard shortcuts:', {
        '/': 'Focus search',
        'Escape': 'Blur active element',
        'Cmd/Ctrl + K': 'Focus search',
        'G then H': 'Go to dashboard',
        'G then C': 'Go to communities',
        'G then N': 'Go to notes',
        'C': 'Create new post',
        '?': 'Show this help'
      });
    }
  };

  useKeyboardShortcuts(shortcuts);
};

export default useKeyboardShortcuts;
