import { useState, useEffect, useCallback } from 'react';

const PREFERENCES_KEY = 'userPreferences';

const defaultPreferences = {
  theme: 'system', // 'light', 'dark', 'system'
  sortBy: 'hot',
  viewMode: 'cards', // 'cards', 'list'
  autoSave: true,
  notifications: {
    posts: true,
    comments: true,
    mentions: true,
    email: false
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largerText: false
  },
  performance: {
    autoLoadImages: true,
    lazyLoading: true,
    prefetchContent: true
  }
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences) => {
    try {
      const merged = { ...preferences, ...newPreferences };
      setPreferences(merged);
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(merged));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }, [preferences]);

  // Update specific preference
  const updatePreference = useCallback((key, value) => {
    const update = {};
    if (key.includes('.')) {
      // Handle nested keys like 'notifications.posts'
      const keys = key.split('.');
      let current = update;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...preferences[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    } else {
      update[key] = value;
    }
    savePreferences(update);
  }, [savePreferences, preferences]);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.removeItem(PREFERENCES_KEY);
  }, []);

  // Export preferences
  const exportPreferences = useCallback(() => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-preferences.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [preferences]);

  // Import preferences
  const importPreferences = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          savePreferences(imported);
          resolve(imported);
        } catch (error) {
          reject(new Error('Invalid preferences file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [savePreferences]);

  return {
    preferences,
    isLoading,
    updatePreference,
    savePreferences,
    resetPreferences,
    exportPreferences,
    importPreferences
  };
};

export default useUserPreferences;
