// Global Error Handler - Centralized error management and user feedback
import { handleNetworkError, isNetworkError } from './networkErrorHandler';

class GlobalErrorHandler {
  constructor() {
    this.toastFunction = null;
    this.setupGlobalHandlers();
    this.errorQueue = [];
    this.isProcessing = false;
  }

  setToastFunction(toast) {
    this.toastFunction = toast;
    console.log('Global error handler initialized with toast function');
  }

  setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (this.isNetworkRelatedError(event.reason)) {
        event.preventDefault(); // Prevent default browser error handling
        this.handleError(event.reason, 'Unhandled Network Error');
      }
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      
      if (this.isNetworkRelatedError(event.error)) {
        this.handleError(event.error, 'Global Network Error');
      }
    });

    // Handle fetch errors specifically
    this.setupFetchErrorHandler();
  }

  setupFetchErrorHandler() {
    // Skip fetch interception to avoid conflicts with Vite and other systems
    console.log('🌐 Global error handler: Skipping fetch interception to avoid conflicts');
  }

  enhanceFetchError(error, url) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const domain = this.extractDomain(url);
      error.message = `Network error: Unable to reach ${domain}. Please check your internet connection.`;
    } else if (error.name === 'AbortError') {
      error.message = `Request timeout: The server took too long to respond.`;
    }
    
    return error;
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'server';
    }
  }

  isNetworkRelatedError(error) {
    if (!error) return false;
    
    return (
      isNetworkError(error) ||
      error.code === 'unavailable' ||
      error.code === 'deadline-exceeded' ||
      error.name === 'TypeError' && error.message.includes('fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('Unable to connect') ||
      error.message?.includes('timeout')
    );
  }

  async handleError(error, context = 'Unknown') {
    // Add to queue to prevent overwhelming the user with multiple toasts
    this.errorQueue.push({ error, context, timestamp: Date.now() });
    
    if (!this.isProcessing) {
      this.processErrorQueue();
    }
  }

  async processErrorQueue() {
    this.isProcessing = true;
    
    while (this.errorQueue.length > 0) {
      const { error, context } = this.errorQueue.shift();
      
      // Only show network-related errors to users
      if (this.isNetworkRelatedError(error) && this.toastFunction) {
        try {
          handleNetworkError(error, context);
        } catch (toastError) {
          console.error('Failed to show error toast:', toastError);
        }
      }
      
      // Small delay between processing errors
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.isProcessing = false;
  }

  // Utility method for components to manually report errors
  reportError(error, context = 'Component Error') {
    console.error(`[${context}]`, error);
    this.handleError(error, context);
  }

  // Check current network status
  getNetworkStatus() {
    return {
      isOnline: navigator.onLine,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }

  // Test network connectivity
  async testConnectivity() {
    try {
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Manual network diagnostics
  async runDiagnostics() {
    console.group('🔍 Network Diagnostics');
    
    const status = this.getNetworkStatus();
    console.log('Browser Status:', status);
    
    const connectivity = await this.testConnectivity();
    console.log('Actual Connectivity:', connectivity ? '✅ Connected' : '❌ Disconnected');
    
    // Skip external service connectivity checks to avoid network errors
    // These checks were causing "Fetch error from https://dns.google.com" and similar errors
    console.log('🌐 Skipping external connectivity checks to reduce console noise');
    
    console.groupEnd();
    
    return {
      browserOnline: status.isOnline,
      actualConnectivity: connectivity,
      connection: status.connection
    };
  }
}

// Create singleton instance
const globalErrorHandler = new GlobalErrorHandler();

// Export for use in components
export const reportError = (error, context) => {
  globalErrorHandler.reportError(error, context);
};

export const setGlobalToast = (toastFunction) => {
  globalErrorHandler.setToastFunction(toastFunction);
};

export const runNetworkDiagnostics = () => {
  return globalErrorHandler.runDiagnostics();
};

export const testConnectivity = () => {
  return globalErrorHandler.testConnectivity();
};

export default globalErrorHandler;
