// Network error handler utility

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

  // Parse error message for user-friendly display
  if (typeof error === 'string') {
    if (error.includes('NetworkError') || error.includes('fetch')) {
      title = 'Connection Problem';
      description = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.includes('offline')) {
      title = 'Offline';
      description = 'You appear to be offline. Please check your internet connection.';
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
      description = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.message.includes('offline')) {
      title = 'Offline';
      description = 'You appear to be offline. Please check your internet connection.';
    } else if (error.code === 'permission-denied') {
      title = 'Access Denied';
      description = 'You don\'t have permission to access this resource.';
    } else if (error.code === 'unauthenticated') {
      title = 'Authentication Required';
      description = 'Please log in to continue.';
    } else {
      description = error.message;
    }
  }

  // Show toast if available
  if (toastFunction) {
    toastFunction({
      title,
      description,
      variant: 'destructive',
    });
  }

  return { title, description };
};

// Wrapper for async operations with automatic error handling
export const withErrorHandling = async (operation, context = '', toast = null) => {
  try {
    return await operation();
  } catch (error) {
    const errorHandler = toast || toastFunction;
    if (errorHandler) {
      handleNetworkError(error, context);
    }
    throw error;
  }
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
