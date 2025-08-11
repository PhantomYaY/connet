// Network Error Suppressor - Reduce noise from expected network errors
class NetworkErrorSupressor {
  constructor() {
    this.suppressedUrls = new Set([
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/manifest.json'
    ]);
    
    this.suppressedErrors = new Set([
      'Failed to fetch',
      'NetworkError',
      'AbortError',
      'TypeError: Failed to fetch'
    ]);

    this.setupConsoleFilter();
  }

  setupConsoleFilter() {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;

    // Filter console.error
    console.error = (...args) => {
      if (!this.shouldSuppressError(...args)) {
        originalError.apply(console, args);
      }
    };

    // Filter console.warn for network-related warnings
    console.warn = (...args) => {
      if (!this.shouldSuppressWarning(...args)) {
        originalWarn.apply(console, args);
      }
    };
  }

  shouldSuppressError(...args) {
    const message = args.join(' ').toLowerCase();
    
    // Suppress empty fetch errors
    if (message.includes('fetch error from :') || message.includes('fetch error from undefined')) {
      return true;
    }

    // Suppress favicon and other resource errors
    if (this.suppressedUrls.some(url => message.includes(url))) {
      return true;
    }

    // Suppress known network errors for development
    if (process.env.NODE_ENV === 'development') {
      if (this.suppressedErrors.some(error => message.includes(error.toLowerCase()))) {
        return true;
      }
    }

    return false;
  }

  shouldSuppressWarning(...args) {
    const message = args.join(' ').toLowerCase();
    
    // Suppress network connectivity warnings for common resources
    if (message.includes('network connectivity check failed') && 
        this.suppressedUrls.some(url => message.includes(url))) {
      return true;
    }

    return false;
  }

  // Manually suppress specific error patterns
  addSuppressedPattern(pattern) {
    if (typeof pattern === 'string') {
      this.suppressedErrors.add(pattern);
    }
  }

  addSuppressedUrl(url) {
    this.suppressedUrls.add(url);
  }
}

// Initialize in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const suppressor = new NetworkErrorSupressor();
  
  // Expose for debugging
  window.networkErrorSupressor = suppressor;
}

export default NetworkErrorSupressor;
