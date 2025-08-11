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
