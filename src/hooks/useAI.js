// useAI Hook
// Provides easy access to AI services and their availability status
import { useState, useEffect, useCallback } from 'react';
import { aiAutoLoader } from '../lib/aiAutoLoader';
import { aiService } from '../lib/aiService';

export const useAI = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check AI availability
  const checkAvailability = useCallback(async () => {
    try {
      setIsLoading(true);
      const services = await aiAutoLoader.initialize();
      setAvailableServices(services);
      setIsAvailable(services.length > 0);
    } catch (error) {
      setAvailableServices([]);
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Refresh AI services (useful after user adds new API keys)
  const refresh = useCallback(async () => {
    await checkAvailability();
  }, [checkAvailability]);

  // Easy access to AI service methods
  const generateFlashcards = useCallback(async (content) => {
    if (!isAvailable) {
      throw new Error('AI services are not available. Please configure your API keys in Settings.');
    }
    return aiService.generateFlashcards(content);
  }, [isAvailable]);

  const summarizeNotes = useCallback(async (content) => {
    if (!isAvailable) {
      throw new Error('AI services are not available. Please configure your API keys in Settings.');
    }
    return aiService.summarizeNotes(content);
  }, [isAvailable]);

  const improveWriting = useCallback(async (text) => {
    if (!isAvailable) {
      throw new Error('AI services are not available. Please configure your API keys in Settings.');
    }
    return aiService.improveWriting(text);
  }, [isAvailable]);

  const explainConcept = useCallback(async (concept) => {
    if (!isAvailable) {
      throw new Error('AI services are not available. Please configure your API keys in Settings.');
    }
    return aiService.explainConcept(concept);
  }, [isAvailable]);

  const callAI = useCallback(async (prompt) => {
    if (!isAvailable) {
      throw new Error('AI services are not available. Please configure your API keys in Settings.');
    }
    return aiService.callAI(prompt);
  }, [isAvailable]);

  return {
    // Status
    isAvailable,
    isLoading,
    availableServices,
    
    // Methods
    refresh,
    generateFlashcards,
    summarizeNotes,
    improveWriting,
    explainConcept,
    callAI,
    
    // Direct access to aiService for advanced usage
    aiService: isAvailable ? aiService : null
  };
};

export default useAI;
