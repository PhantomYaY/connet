// AI Auto-loader Service
// Automatically loads and initializes AI services in the background
import { aiService } from './aiService';
import { apiKeyStorage } from './apiKeyStorage';
import { getUserApiKey } from './firestoreService';
import { auth } from './firebase';

class AIAutoLoader {
  constructor() {
    this.isInitialized = false;
    this.availableServices = [];
    this.loadingPromises = new Map();
    
    console.log('🤖 AI Auto-loader initialized');
  }

  async initialize() {
    if (this.isInitialized) {
      return this.availableServices;
    }

    try {
      console.log('🔄 Auto-loading AI services in background...');
      
      // Load API keys from all sources
      await this.loadAllApiKeys();
      
      // Initialize AI service with loaded keys
      await this.initializeAIService();
      
      this.isInitialized = true;
      console.log('✅ AI services auto-loaded successfully', {
        availableServices: this.availableServices
      });
      
      return this.availableServices;
    } catch (error) {
      console.warn('⚠️ AI auto-loading failed (this is normal if no API keys are configured):', error.message);
      return [];
    }
  }

  async loadAllApiKeys() {
    const loadPromises = [];

    // Load from local storage (apiKeyStorage)
    loadPromises.push(this.loadLocalApiKeys());

    // Load from Firestore user storage (if authenticated)
    if (auth.currentUser) {
      loadPromises.push(this.loadFirestoreApiKeys());
    }

    // Load legacy localStorage keys
    loadPromises.push(this.loadLegacyApiKeys());

    await Promise.allSettled(loadPromises);
  }

  async loadLocalApiKeys() {
    try {
      const storedServices = apiKeyStorage.getStoredServices();
      
      for (const serviceInfo of storedServices) {
        const apiKey = apiKeyStorage.getValidatedApiKey(serviceInfo.service);
        if (apiKey) {
          this.availableServices.push(serviceInfo.service);
          console.log(`🔑 Loaded ${serviceInfo.service} API key from local storage`);
        }
      }
    } catch (error) {
      console.warn('Failed to load local API keys:', error);
    }
  }

  async loadFirestoreApiKeys() {
    try {
      // Load common AI service keys from Firestore
      const services = ['openai', 'google', 'anthropic'];
      
      for (const service of services) {
        try {
          const apiKey = await getUserApiKey(service);
          if (apiKey && !this.availableServices.includes(service)) {
            this.availableServices.push(service);
            console.log(`🔑 Loaded ${service} API key from Firestore`);
            
            // Store locally for faster access
            apiKeyStorage.saveApiKey(service, apiKey);
          }
        } catch (error) {
          // Silently continue if a specific service key is not found
        }
      }
    } catch (error) {
      console.warn('Failed to load Firestore API keys:', error);
    }
  }

  async loadLegacyApiKeys() {
    try {
      // Check for legacy localStorage keys
      const legacyKeys = {
        'custom_openai_key': 'openai',
        'custom_gemini_key': 'google'
      };

      for (const [legacyKey, service] of Object.entries(legacyKeys)) {
        const apiKey = localStorage.getItem(legacyKey);
        if (apiKey && !this.availableServices.includes(service)) {
          this.availableServices.push(service);
          console.log(`🔑 Migrated legacy ${service} API key`);
          
          // Migrate to new storage system
          apiKeyStorage.saveApiKey(service, apiKey);
          // Optionally remove legacy key
          // localStorage.removeItem(legacyKey);
        }
      }
    } catch (error) {
      console.warn('Failed to load legacy API keys:', error);
    }
  }

  async initializeAIService() {
    try {
      // Set default provider based on available services
      const preferredOrder = ['openai', 'google', 'anthropic'];
      const availableProvider = preferredOrder.find(provider => 
        this.availableServices.includes(provider)
      );

      if (availableProvider) {
        aiService.setProvider(availableProvider);
        console.log(`🎯 Set AI provider to: ${availableProvider}`);
      }

      // Test AI service with a simple call to ensure it's working
      if (this.availableServices.length > 0) {
        // Don't await this to avoid blocking initialization
        this.testAIService().catch(error => {
          console.warn('AI service test failed:', error.message);
        });
      }
    } catch (error) {
      console.warn('Failed to initialize AI service:', error);
    }
  }

  async testAIService() {
    try {
      // Simple test to verify AI service is working
      const testPrompt = "Respond with 'OK' if you're working properly.";
      const response = await aiService.callAI(testPrompt);
      
      if (response) {
        console.log('✅ AI service test successful');
        return true;
      }
    } catch (error) {
      console.warn('AI service test failed:', error.message);
      return false;
    }
  }

  // Check if AI services are available
  isAvailable() {
    return this.isInitialized && this.availableServices.length > 0;
  }

  // Get available services
  getAvailableServices() {
    return [...this.availableServices];
  }

  // Reinitialize (useful when user adds new API keys)
  async reinitialize() {
    this.isInitialized = false;
    this.availableServices = [];
    return this.initialize();
  }

  // Background refresh (can be called periodically)
  async backgroundRefresh() {
    if (this.isInitialized) {
      // Only refresh if we detect changes in storage
      const currentServices = apiKeyStorage.getStoredServices();
      const currentServiceNames = currentServices.map(s => s.service);
      
      const hasChanges = currentServiceNames.length !== this.availableServices.length ||
                        !currentServiceNames.every(name => this.availableServices.includes(name));
      
      if (hasChanges) {
        console.log('🔄 Detected API key changes, refreshing AI services...');
        await this.reinitialize();
      }
    }
  }
}

// Create and export singleton instance
export const aiAutoLoader = new AIAutoLoader();

// Auto-initialize when module loads (but don't block)
if (typeof window !== 'undefined') {
  // Initialize in the next tick to avoid blocking
  setTimeout(() => {
    aiAutoLoader.initialize().catch(error => {
      console.log('AI auto-initialization completed with warnings (this is normal)');
    });
  }, 1000);
}

export default aiAutoLoader;
