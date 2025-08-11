// Network error handler utility
import React from 'react';

let toastFunction = null;

// Initialize with toast function
export const initializeNetworkErrorHandler = (toast) => {
  toastFunction = toast;
};

// Handle network errors with user-friendly messages
export const handleNetworkError = (error, context = '') => {
  console.error(`Network error ${context}:`, error);

  let title = 'Network Error';
  let description = 'An unexpected error occurred.';
  let isTransient = false;

  // Parse error message for user-friendly display
  if (typeof error === 'string') {
    if (error.includes('NetworkError') || error.includes('fetch')) {
      title = 'Connection Problem';
      description = 'Unable to connect to the server. Please check your internet connection and try again.';
      isTransient = true;
    } else if (error.includes('offline') || error.includes('unavailable')) {
      title = 'Service Unavailable';
      description = 'The service is temporarily unavailable. Your data is safe and will sync when connection is restored.';
      isTransient = true;
    } else if (error.includes('Permission denied')) {
      title = 'Access Denied';
      description = 'You don\'t have permission to access this resource. Please try logging in again.';
    } else if (error.includes('unauthenticated')) {
      title = 'Authentication Required';
      description = 'Please log in to continue.';
    } else {
      description = error;
    }
  } else if (error?.message) {
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      title = 'Connection Problem';
      description = 'Unable to connect to the server. Please check your internet connection and try again.';
      isTransient = true;
    } else if (error.message.includes('offline') || error.message.includes('unavailable')) {
      title = 'Service Unavailable';
      description = 'The service is temporarily unavailable. Your data is safe and will sync when connection is restored.';
      isTransient = true;
    } else if (error.code === 'permission-denied') {
      title = 'Access Denied';
      description = 'You don\'t have permission to access this resource.';
    } else if (error.code === 'unauthenticated') {
      title = 'Authentication Required';
      description = 'Please log in to continue.';
    } else if (error.code === 'unavailable') {
      title = 'Service Temporarily Unavailable';
      description = 'The database service is temporarily unavailable. Your data is safe and will be saved when connection is restored.';
      isTransient = true;
    } else if (error.code === 'deadline-exceeded') {
      title = 'Request Timeout';
      description = 'The request took too long. Please try again.';
      isTransient = true;
    } else {
      description = error.message;
    }
  }

  // Show toast if available
  if (toastFunction) {
    toastFunction({
      title,
      description,
      variant: isTransient ? 'default' : 'destructive',
      duration: isTransient ? 3000 : 5000,
    });
  }

  return { title, description, isTransient };
};

// Wrapper for async operations with automatic error handling and retry
export const withErrorHandling = async (operation, context = '', toast = null, maxRetries = 3) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const { isTransient } = handleNetworkError(error, context);

      // Only retry for transient errors and if we have attempts left
      if (isTransient && attempt < maxRetries) {
        // Exponential backoff: wait 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying ${context} (attempt ${attempt + 2}/${maxRetries + 1})`);
        continue;
      }

      // Show error toast only on final failure
      const errorHandler = toast || toastFunction;
      if (errorHandler && attempt === maxRetries) {
        handleNetworkError(error, context);
      }

      throw error;
    }
  }

  throw lastError;
};

// Check if error is network-related
export const isNetworkError = (error) => {
  if (typeof error === 'string') {
    return error.includes('NetworkError') ||
           error.includes('fetch') ||
           error.includes('offline') ||
           error.includes('Network error');
  }

  if (error?.message) {
    return error.message.includes('NetworkError') ||
           error.message.includes('fetch') ||
           error.message.includes('offline') ||
           error.message.includes('Network error') ||
           error.code === 'unavailable' ||
           error.code === 'deadline-exceeded';
  }

  return false;
};

// Connection status manager
class ConnectionManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(isOnline) {
    this.listeners.forEach(callback => callback(isOnline));
  }

  getStatus() {
    return this.isOnline;
  }
}

export const connectionManager = new ConnectionManager();

// React hook for connection status
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = React.useState(connectionManager.getStatus());

  React.useEffect(() => {
    return connectionManager.addListener(setIsOnline);
  }, []);

  return isOnline;
};
