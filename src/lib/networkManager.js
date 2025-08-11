// Network Manager - Enhanced network handling and error resolution
class NetworkManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.retryDelays = [1000, 2000, 4000]; // Progressive delays for retries
    this.setupEventListeners();
    this.setupNetworkDetection();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Network connection restored');
      this.notifyConnectionChanged(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('🚫 Network connection lost');
      this.notifyConnectionChanged(false);
    });
  }

  setupNetworkDetection() {
    // Enhanced network detection using multiple methods
    this.checkNetworkConnectivity();
    
    // Check connectivity every 30 seconds
    setInterval(() => {
      this.checkNetworkConnectivity();
    }, 30000);
  }

  async checkNetworkConnectivity() {
    if (!navigator.onLine) {
      this.isOnline = false;
      return;
    }

    try {
      // Use a lightweight request to check actual connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
      console.warn('Network connectivity check failed:', error.message);
    }
  }

  notifyConnectionChanged(isOnline) {
    // Dispatch custom event for components to listen to
    const event = new CustomEvent('networkChanged', { 
      detail: { isOnline } 
    });
    window.dispatchEvent(event);
  }

  async makeRequest(url, options = {}, maxRetries = 3) {
    if (!this.isOnline) {
      throw new Error('No internet connection available');
    }

    const defaultOptions = {
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, defaultOptions.timeout);

        const response = await fetch(url, {
          ...defaultOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return response;
      } catch (error) {
        console.warn(`Request attempt ${attempt}/${maxRetries} failed:`, {
          url: this.sanitizeUrl(url),
          error: error.message,
          type: error.name
        });

        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          throw this.enhanceError(error, url);
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw this.enhanceError(error, url);
        }

        // Wait before retrying with progressive backoff
        const delay = this.retryDelays[attempt - 1] || 4000;
        await this.sleep(delay);

        // Re-check network connectivity before retry
        await this.checkNetworkConnectivity();
        if (!this.isOnline) {
          throw new Error('Network connection lost during retry');
        }
      }
    }
  }

  shouldNotRetry(error) {
    // Don't retry on these types of errors
    return (
      error.message.includes('401') || // Unauthorized
      error.message.includes('403') || // Forbidden
      error.message.includes('400') || // Bad Request
      error.name === 'AbortError' ||   // Request aborted
      error.message.includes('Invalid API key')
    );
  }

  enhanceError(error, url) {
    const sanitizedUrl = this.sanitizeUrl(url);
    
    if (error.name === 'AbortError') {
      return new Error(`Request timeout: ${sanitizedUrl} took too long to respond`);
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Error(`Network error: Could not connect to ${sanitizedUrl}. Please check your internet connection.`);
    }
    
    if (error.message.includes('NetworkError')) {
      return new Error(`Network error: Connection failed to ${sanitizedUrl}`);
    }
    
    return error;
  }

  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'server';
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method for external API calls
  async makeAPICall(url, options = {}) {
    try {
      const response = await this.makeRequest(url, options);
      return await response.json();
    } catch (error) {
      console.error('API call failed:', {
        url: this.sanitizeUrl(url),
        error: error.message
      });
      throw error;
    }
  }

  // Health check for external services
  async healthCheck(services = []) {
    const results = {};
    
    for (const service of services) {
      try {
        const response = await this.makeRequest(service.url, {
          method: 'HEAD',
          timeout: 5000
        }, 1); // Only try once for health checks
        
        results[service.name] = {
          status: 'healthy',
          responseTime: performance.now()
        };
      } catch (error) {
        results[service.name] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    return results;
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      effectiveType: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || null,
      rtt: navigator.connection?.rtt || null
    };
  }
}

// Create singleton instance
const networkManager = new NetworkManager();

// Enhanced fetch wrapper that uses the network manager
export const safeFetch = async (url, options = {}) => {
  return networkManager.makeRequest(url, options);
};

export const safeAPICall = async (url, options = {}) => {
  return networkManager.makeAPICall(url, options);
};

export default networkManager;
