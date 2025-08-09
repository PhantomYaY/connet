// Simple debug logger for network errors

const originalFetch = window.fetch;

// Override fetch to log network errors
window.fetch = function(...args) {
  console.log('Fetch request:', args[0]);
  
  return originalFetch.apply(this, args)
    .then(response => {
      if (!response.ok) {
        console.error('Fetch failed with status:', response.status, response.statusText);
      }
      return response;
    })
    .catch(error => {
      console.error('Network error in fetch:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    });
};

// Log unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  if (event.reason?.message?.includes('NetworkError') || event.reason?.message?.includes('fetch')) {
    console.error('This appears to be a network-related error');
  }
});

export const logNetworkError = (error, context) => {
  console.error(`Network error in ${context}:`, error);
  console.error('Error type:', typeof error);
  console.error('Error constructor:', error.constructor.name);
  console.error('Error properties:', Object.getOwnPropertyNames(error));
};
