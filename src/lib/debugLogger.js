// Simple debug logger for network errors

const originalFetch = window.fetch;

// Override fetch to log network errors
window.fetch = function(...args) {
  const url = args[0] instanceof Request ? args[0].url : args[0];

  // Skip logging for empty or invalid URLs
  if (!url || url === '' || url === 'undefined') {
    console.warn('Fetch called with empty or invalid URL:', url);
    return Promise.reject(new Error('Invalid URL provided to fetch'));
  }

  // Only log non-Vite dev server requests to reduce noise
  if (!url.includes('node_modules') && !url.includes('/@vite') && !url.includes('/@fs')) {
    console.log('Fetch request:', url);
  }

  return originalFetch.apply(this, args)
    .then(response => {
      if (!response.ok && !url.includes('node_modules')) {
        console.error(`Fetch failed from ${url}:`, response.status, response.statusText);
      }
      return response;
    })
    .catch(error => {
      // Only log actual network errors, not development server requests
      if (!url.includes('node_modules') && !url.includes('/@vite')) {
        console.error(`Network error in fetch to ${url}:`, error.message);
      }
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
