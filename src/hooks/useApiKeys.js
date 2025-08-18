import { useState, useEffect, useCallback } from 'react';
import { apiKeyStorage } from '../lib/apiKeyStorage';
import { userApiKeyStorage } from '../lib/userApiKeyStorage';
import { auth } from '../lib/firebase';

/**
 * Custom hook for managing API keys
 * Provides easy access to API key storage functionality
 */
export const useApiKeys = () => {
  const [storedServices, setStoredServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all stored services (prioritize user storage if authenticated)
  const loadStoredServices = useCallback(async () => {
    try {
      if (auth.currentUser) {
        // Load from user's Firestore storage if authenticated
        const services = await userApiKeyStorage.getStoredServices();
        setStoredServices(services);
      } else {
        // Fallback to localStorage if not authenticated
        const services = apiKeyStorage.getStoredServices();
        setStoredServices(services);
      }
    } catch (error) {
      console.error('Error loading stored services:', error);
      // Fallback to localStorage on error
      try {
        const services = apiKeyStorage.getStoredServices();
        setStoredServices(services);
      } catch (fallbackError) {
        console.error('Error loading fallback services:', fallbackError);
        setStoredServices([]);
      }
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadStoredServices();
  }, [loadStoredServices]);

  // Save API key (prioritize user storage if authenticated)
  const saveApiKey = useCallback(async (service, key) => {
    setLoading(true);
    try {
      let success = false;

      if (auth.currentUser) {
        // Save to user's Firestore storage if authenticated
        success = await userApiKeyStorage.saveApiKey(service, key);
        // Also save to localStorage as fallback
        apiKeyStorage.saveApiKey(service, key);
      } else {
        // Save to localStorage if not authenticated
        success = apiKeyStorage.saveApiKey(service, key);
      }

      if (success) {
        await loadStoredServices();
      }
      return success;
    } catch (error) {
      console.error('Error saving API key:', error);
      // Fallback to localStorage
      const fallbackSuccess = apiKeyStorage.saveApiKey(service, key);
      if (fallbackSuccess) {
        await loadStoredServices();
      }
      return fallbackSuccess;
    } finally {
      setLoading(false);
    }
  }, [loadStoredServices]);

  // Get API key (prioritize user storage if authenticated)
  const getApiKey = useCallback(async (service) => {
    try {
      if (auth.currentUser) {
        // Get from user's Firestore storage if authenticated
        const key = await userApiKeyStorage.getApiKey(service);
        if (key) return key;
        // Fallback to localStorage if not found in Firestore
        return apiKeyStorage.getApiKey(service);
      } else {
        // Get from localStorage if not authenticated
        return apiKeyStorage.getApiKey(service);
      }
    } catch (error) {
      console.error('Error getting API key:', error);
      // Fallback to localStorage
      try {
        return apiKeyStorage.getApiKey(service);
      } catch (fallbackError) {
        console.error('Error getting fallback API key:', fallbackError);
        return null;
      }
    }
  }, []);

  // Get validated API key (prioritize user storage if authenticated)
  const getValidatedApiKey = useCallback(async (service) => {
    try {
      if (auth.currentUser) {
        // Get from user's Firestore storage if authenticated
        const key = await userApiKeyStorage.getValidatedApiKey(service);
        if (key) return key;
        // Fallback to localStorage if not found in Firestore
        return apiKeyStorage.getValidatedApiKey(service);
      } else {
        // Get from localStorage if not authenticated
        return apiKeyStorage.getValidatedApiKey(service);
      }
    } catch (error) {
      console.error('Error getting validated API key:', error);
      // Fallback to localStorage
      try {
        return apiKeyStorage.getValidatedApiKey(service);
      } catch (fallbackError) {
        console.error('Error getting fallback validated API key:', fallbackError);
        return null;
      }
    }
  }, []);

  // Remove API key (remove from both storages)
  const removeApiKey = useCallback(async (service) => {
    setLoading(true);
    try {
      let success = false;

      if (auth.currentUser) {
        // Remove from user's Firestore storage if authenticated
        success = await userApiKeyStorage.removeApiKey(service);
        // Also remove from localStorage
        apiKeyStorage.removeApiKey(service);
      } else {
        // Remove from localStorage if not authenticated
        success = apiKeyStorage.removeApiKey(service);
      }

      if (success) {
        await loadStoredServices();
      }
      return success;
    } catch (error) {
      console.error('Error removing API key:', error);
      // Fallback to localStorage removal
      const fallbackSuccess = apiKeyStorage.removeApiKey(service);
      if (fallbackSuccess) {
        await loadStoredServices();
      }
      return fallbackSuccess;
    } finally {
      setLoading(false);
    }
  }, [loadStoredServices]);

  // Check if API key exists (check both storages)
  const hasApiKey = useCallback(async (service) => {
    try {
      if (auth.currentUser) {
        // Check user's Firestore storage if authenticated
        const hasFirestoreKey = await userApiKeyStorage.hasApiKey(service);
        if (hasFirestoreKey) return true;
        // Fallback to localStorage check
        return apiKeyStorage.hasApiKey(service);
      } else {
        // Check localStorage if not authenticated
        return apiKeyStorage.hasApiKey(service);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
      // Fallback to localStorage check
      try {
        return apiKeyStorage.hasApiKey(service);
      } catch (fallbackError) {
        console.error('Error checking fallback API key:', fallbackError);
        return false;
      }
    }
  }, []);

  // Validate API key format
  const validateApiKey = useCallback((key, service) => {
    try {
      return apiKeyStorage.validateApiKey(key, service);
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }, []);

  // Clear all API keys (clear from both storages)
  const clearAllApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      let success = false;

      if (auth.currentUser) {
        // Clear from user's Firestore storage if authenticated
        success = await userApiKeyStorage.clearAllApiKeys();
        // Also clear from localStorage
        apiKeyStorage.clearAllApiKeys();
      } else {
        // Clear from localStorage if not authenticated
        success = apiKeyStorage.clearAllApiKeys();
      }

      if (success) {
        await loadStoredServices();
      }
      return success;
    } catch (error) {
      console.error('Error clearing all API keys:', error);
      // Fallback to localStorage clearing
      const fallbackSuccess = apiKeyStorage.clearAllApiKeys();
      if (fallbackSuccess) {
        await loadStoredServices();
      }
      return fallbackSuccess;
    } finally {
      setLoading(false);
    }
  }, [loadStoredServices]);


  return {
    // State
    storedServices,
    loading,
    
    // Actions
    saveApiKey,
    getApiKey,
    getValidatedApiKey,
    removeApiKey,
    hasApiKey,
    validateApiKey,
    clearAllApiKeys,
    getAIApiKey,
    
    // Utilities
    refreshStoredServices: loadStoredServices,
    
    // Computed values
    hasAnyKeys: storedServices.length > 0,
    serviceCount: storedServices.length,
    services: storedServices.map(s => s.service)
  };
};

export default useApiKeys;
