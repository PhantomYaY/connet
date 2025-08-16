// API Key Storage Service
// Provides secure storage and retrieval of API keys

const API_KEY_STORAGE_KEY = 'connectEd_api_keys';

// Encrypt/decrypt functions for basic security
const encrypt = (text, key = 'connectEd_default_key') => {
  try {
    return btoa(text + key);
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
};

const decrypt = (encryptedText, key = 'connectEd_default_key') => {
  try {
    const decoded = atob(encryptedText);
    return decoded.replace(key, '');
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText;
  }
};

// Storage interface
export const apiKeyStorage = {
  // Save an API key for a specific service
  saveApiKey: (service, apiKey) => {
    try {
      const existingKeys = apiKeyStorage.getAllApiKeys();
      const encryptedKey = encrypt(apiKey);
      
      const updatedKeys = {
        ...existingKeys,
        [service]: {
          key: encryptedKey,
          timestamp: Date.now(),
          lastUsed: Date.now()
        }
      };
      
      localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(updatedKeys));
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  },

  // Retrieve an API key for a specific service
  getApiKey: (service) => {
    try {
      const keys = apiKeyStorage.getAllApiKeys();
      const keyData = keys[service];
      
      if (!keyData) return null;
      
      // Update last used timestamp
      keyData.lastUsed = Date.now();
      const allKeys = { ...keys, [service]: keyData };
      localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(allKeys));
      
      return decrypt(keyData.key);
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  },

  // Get all stored API keys (encrypted)
  getAllApiKeys: () => {
    try {
      const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting all API keys:', error);
      return {};
    }
  },

  // Get list of services with stored keys
  getStoredServices: () => {
    try {
      const keys = apiKeyStorage.getAllApiKeys();
      return Object.keys(keys).map(service => ({
        service,
        timestamp: keys[service].timestamp,
        lastUsed: keys[service].lastUsed
      }));
    } catch (error) {
      console.error('Error getting stored services:', error);
      return [];
    }
  },

  // Remove an API key for a specific service
  removeApiKey: (service) => {
    try {
      const existingKeys = apiKeyStorage.getAllApiKeys();
      delete existingKeys[service];
      localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(existingKeys));
      return true;
    } catch (error) {
      console.error('Error removing API key:', error);
      return false;
    }
  },

  // Clear all stored API keys
  clearAllApiKeys: () => {
    try {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing all API keys:', error);
      return false;
    }
  },

  // Check if an API key exists for a service
  hasApiKey: (service) => {
    try {
      const keys = apiKeyStorage.getAllApiKeys();
      return keys.hasOwnProperty(service);
    } catch (error) {
      console.error('Error checking API key existence:', error);
      return false;
    }
  },

  // Validate API key format (basic validation)
  validateApiKey: (apiKey, service = 'general') => {
    if (!apiKey || typeof apiKey !== 'string') return false;
    
    const validations = {
      openai: /^sk-[a-zA-Z0-9]{48,}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9-]{95,}$/,
      google: /^[a-zA-Z0-9-_]{39}$/,
      general: /^[a-zA-Z0-9-_]{10,}$/
    };
    
    const pattern = validations[service] || validations.general;
    return pattern.test(apiKey.trim());
  },

  // Get API key with validation
  getValidatedApiKey: (service) => {
    const apiKey = apiKeyStorage.getApiKey(service);
    if (!apiKey) return null;
    
    const isValid = apiKeyStorage.validateApiKey(apiKey, service);
    return isValid ? apiKey : null;
  }
};

// Export specific functions for convenience
export const {
  saveApiKey,
  getApiKey,
  getAllApiKeys,
  getStoredServices,
  removeApiKey,
  clearAllApiKeys,
  hasApiKey,
  validateApiKey,
  getValidatedApiKey
} = apiKeyStorage;

export default apiKeyStorage;
