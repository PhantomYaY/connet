// User-based API Key Storage Service
// Provides secure storage and retrieval of API keys per authenticated user

import {
  db,
  auth,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  withRetry
} from "./firebase";

// Get user UID
const getUserId = () => auth.currentUser?.uid;

// Encrypt/decrypt functions for basic security
const encrypt = (text, key = 'connectEd_api_key_salt') => {
  try {
    return btoa(text + key);
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
};

const decrypt = (encryptedText, key = 'connectEd_api_key_salt') => {
  try {
    const decoded = atob(encryptedText);
    return decoded.replace(key, '');
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText;
  }
};

// User-based API key storage interface
export const userApiKeyStorage = {
  // Save an API key for a specific service for the current user
  saveApiKey: async (service, apiKey) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const encryptedKey = encrypt(apiKey);
      const apiKeyData = {
        key: encryptedKey,
        service: service,
        timestamp: serverTimestamp(),
        lastUsed: serverTimestamp(),
        userId: userId
      };

      // Save to user's API keys subcollection
      const apiKeyRef = doc(db, "users", userId, "apiKeys", service);
      await setDoc(apiKeyRef, apiKeyData);
      
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  },

  // Retrieve an API key for a specific service for the current user
  getApiKey: async (service) => {
    const userId = getUserId();
    if (!userId) return null;

    try {
      const apiKeyRef = doc(db, "users", userId, "apiKeys", service);
      const apiKeyDoc = await getDoc(apiKeyRef);
      
      if (!apiKeyDoc.exists()) return null;
      
      const keyData = apiKeyDoc.data();
      
      // Update last used timestamp
      await updateDoc(apiKeyRef, {
        lastUsed: serverTimestamp()
      });
      
      return decrypt(keyData.key);
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  },

  // Get all stored API keys for the current user (without decrypting)
  getAllApiKeys: async () => {
    const userId = getUserId();
    if (!userId) return {};

    try {
      return await withRetry(async () => {
        const apiKeysRef = doc(db, "users", userId, "apiKeys", "_metadata");
        const metadataDoc = await getDoc(apiKeysRef);
        
        if (!metadataDoc.exists()) return {};
        
        return metadataDoc.data().services || {};
      });
    } catch (error) {
      console.error('Error getting all API keys:', error);
      return {};
    }
  },

  // Get list of services with stored keys for the current user
  getStoredServices: async () => {
    const userId = getUserId();
    if (!userId) return [];

    try {
      return await withRetry(async () => {
        const apiKeysRef = doc(db, "users", userId, "apiKeys", "_metadata");
        const metadataDoc = await getDoc(apiKeysRef);
        
        if (!metadataDoc.exists()) return [];
        
        const services = metadataDoc.data().services || {};
        return Object.keys(services).map(service => ({
          service,
          timestamp: services[service].timestamp,
          lastUsed: services[service].lastUsed
        }));
      });
    } catch (error) {
      console.error('Error getting stored services:', error);
      return [];
    }
  },

  // Remove an API key for a specific service for the current user
  removeApiKey: async (service) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      // Remove the specific API key document
      const apiKeyRef = doc(db, "users", userId, "apiKeys", service);
      await deleteDoc(apiKeyRef);
      
      // Update metadata
      await userApiKeyStorage._updateMetadata(service, null);
      
      return true;
    } catch (error) {
      console.error('Error removing API key:', error);
      return false;
    }
  },

  // Clear all stored API keys for the current user
  clearAllApiKeys: async () => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const services = await userApiKeyStorage.getStoredServices();
      
      // Delete all API key documents
      const deletePromises = services.map(({ service }) => 
        deleteDoc(doc(db, "users", userId, "apiKeys", service))
      );
      
      // Delete metadata
      deletePromises.push(deleteDoc(doc(db, "users", userId, "apiKeys", "_metadata")));
      
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error clearing all API keys:', error);
      return false;
    }
  },

  // Check if an API key exists for a service for the current user
  hasApiKey: async (service) => {
    const userId = getUserId();
    if (!userId) return false;

    try {
      const apiKeyRef = doc(db, "users", userId, "apiKeys", service);
      const apiKeyDoc = await getDoc(apiKeyRef);
      return apiKeyDoc.exists();
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

  // Get API key with validation for the current user
  getValidatedApiKey: async (service) => {
    const apiKey = await userApiKeyStorage.getApiKey(service);
    if (!apiKey) return null;
    
    const isValid = userApiKeyStorage.validateApiKey(apiKey, service);
    return isValid ? apiKey : null;
  },

  // Private method to update metadata
  _updateMetadata: async (service, keyData) => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const metadataRef = doc(db, "users", userId, "apiKeys", "_metadata");
      const metadataDoc = await getDoc(metadataRef);
      
      let services = {};
      if (metadataDoc.exists()) {
        services = metadataDoc.data().services || {};
      }
      
      if (keyData) {
        // Add or update service
        services[service] = {
          timestamp: keyData.timestamp || serverTimestamp(),
          lastUsed: keyData.lastUsed || serverTimestamp()
        };
      } else {
        // Remove service
        delete services[service];
      }
      
      await setDoc(metadataRef, {
        services,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  }
};

// Migration function to move localStorage keys to Firestore
export const migrateLocalStorageToFirestore = async () => {
  const userId = getUserId();
  if (!userId) return { migrated: 0, errors: [] };

  try {
    // Import the old storage system
    const { apiKeyStorage } = await import('./apiKeyStorage');
    
    const storedServices = apiKeyStorage.getStoredServices();
    let migrated = 0;
    const errors = [];

    for (const { service } of storedServices) {
      try {
        const apiKey = apiKeyStorage.getApiKey(service);
        if (apiKey) {
          const success = await userApiKeyStorage.saveApiKey(service, apiKey);
          if (success) {
            migrated++;
            // Optionally remove from localStorage after successful migration
            apiKeyStorage.removeApiKey(service);
          }
        }
      } catch (error) {
        console.error(`Error migrating ${service}:`, error);
        errors.push({ service, error: error.message });
      }
    }

    return { migrated, errors };
  } catch (error) {
    console.error('Error during migration:', error);
    return { migrated: 0, errors: [{ general: error.message }] };
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
} = userApiKeyStorage;

export default userApiKeyStorage;
