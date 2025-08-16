import { useState, useEffect, useCallback } from 'react';
import { apiKeyStorage } from '../lib/apiKeyStorage';

/**
 * Custom hook for managing API keys
 * Provides easy access to API key storage functionality
 */
export const useApiKeys = () => {
  const [storedServices, setStoredServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all stored services
  const loadStoredServices = useCallback(() => {
    try {
      const services = apiKeyStorage.getStoredServices();
      setStoredServices(services);
    } catch (error) {
      console.error('Error loading stored services:', error);
      setStoredServices([]);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadStoredServices();
  }, [loadStoredServices]);

  // Save API key
  const saveApiKey = useCallback(async (service, key) => {
    setLoading(true);
    try {
      const success = apiKeyStorage.saveApiKey(service, key);
      if (success) {
        loadStoredServices();
      }
      return success;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStoredServices]);

  // Get API key
  const getApiKey = useCallback((service) => {
    try {
      return apiKeyStorage.getApiKey(service);
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }, []);

  // Get validated API key
  const getValidatedApiKey = useCallback((service) => {
    try {
      return apiKeyStorage.getValidatedApiKey(service);
    } catch (error) {
      console.error('Error getting validated API key:', error);
      return null;
    }
  }, []);

  // Remove API key
  const removeApiKey = useCallback(async (service) => {
    setLoading(true);
    try {
      const success = apiKeyStorage.removeApiKey(service);
      if (success) {
        loadStoredServices();
      }
      return success;
    } catch (error) {
      console.error('Error removing API key:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStoredServices]);

  // Check if API key exists
  const hasApiKey = useCallback((service) => {
    try {
      return apiKeyStorage.hasApiKey(service);
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
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

  // Clear all API keys
  const clearAllApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      const success = apiKeyStorage.clearAllApiKeys();
      if (success) {
        loadStoredServices();
      }
      return success;
    } catch (error) {
      console.error('Error clearing all API keys:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStoredServices]);

  // Get API key for AI services with fallback
  const getAIApiKey = useCallback((service) => {
    // Map common AI service names
    const serviceMap = {
      'openai': 'openai',
      'gpt': 'openai',
      'chatgpt': 'openai',
      'gemini': 'google',
      'google': 'google',
      'palm': 'google',
      'anthropic': 'anthropic',
      'claude': 'anthropic',
      'huggingface': 'huggingface',
      'hf': 'huggingface'
    };

    const mappedService = serviceMap[service?.toLowerCase()] || service;
    return getValidatedApiKey(mappedService);
  }, [getValidatedApiKey]);

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
