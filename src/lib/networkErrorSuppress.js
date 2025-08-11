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
      'failed to fetch',
      'networkerror',
      'aborterror',
      'typeerror: failed to fetch',
      'fetch error from :',
      'fetch error from undefined'
    ]);

    this.originalConsoleError = null;
    this.originalConsoleWarn = null;
    this.isSetup = false;

    // Only setup in development and if not already setup
    if (this.isDevelopment() && !this.isSetup) {
      this.setupConsoleFilter();
    }
  }

  isDevelopment() {
    // Multiple checks for development mode
    return (
      typeof window !== 'undefined' && (
        import.meta.env?.DEV ||
        import.meta.env?.MODE === 'development' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.port !== ''
      )
    );
  }

  setupConsoleFilter() {
    if (this.isSetup) return;

    try {
      // Store original console methods safely
      this.originalConsoleError = console.error.bind(console);
      this.originalConsoleWarn = console.warn.bind(console);

      // Override console.error with error handling
      console.error = (...args) => {
        try {
          if (!this.shouldSuppressError(...args)) {
            this.originalConsoleError(...args);
          }
        } catch (suppressorError) {
          // If suppressor fails, fall back to original console
          this.originalConsoleError(...args);
        }
      };

      // Override console.warn with error handling
      console.warn = (...args) => {
        try {
          if (!this.shouldSuppressWarning(...args)) {
            this.originalConsoleWarn(...args);
          }
        } catch (suppressorError) {
          // If suppressor fails, fall back to original console
          this.originalConsoleWarn(...args);
        }
      };

      this.isSetup = true;
      console.log('🔇 Network error suppressor initialized for development');
    } catch (error) {
      console.warn('Failed to setup console filter:', error);
    }
  }

  shouldSuppressError(...args) {
    try {
      // Convert all arguments to strings safely
      const message = args
        .filter(arg => arg != null)
        .map(arg => {
          if (typeof arg === 'string') return arg;
          if (typeof arg === 'object') {
            return arg.message || arg.toString();
          }
          return String(arg);
        })
        .join(' ')
        .toLowerCase();

      if (!message) return false;

      // Suppress empty fetch errors
      if (message.includes('fetch error from :') || 
          message.includes('fetch error from undefined') ||
          message.includes('fetch error from null')) {
        return true;
      }

      // Suppress favicon and other resource errors
      for (const url of this.suppressedUrls) {
        if (message.includes(url)) {
          return true;
        }
      }

      // Suppress known network errors in development
      if (this.isDevelopment()) {
        for (const error of this.suppressedErrors) {
          if (message.includes(error)) {
            return true;
          }
        }
      }

      // Suppress FullStory and other third-party errors
      if (message.includes('fullstory') || 
          message.includes('fs.js') ||
          message.includes('edge.fullstory.com')) {
        return true;
      }

      return false;
    } catch (error) {
      // If error checking fails, don't suppress
      return false;
    }
  }

  shouldSuppressWarning(...args) {
    try {
      const message = args
        .filter(arg => arg != null)
        .map(arg => String(arg))
        .join(' ')
        .toLowerCase();

      if (!message) return false;
      
      // Suppress network connectivity warnings for common resources
      if (message.includes('network connectivity check failed')) {
        for (const url of this.suppressedUrls) {
          if (message.includes(url)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      // If error checking fails, don't suppress
      return false;
    }
  }

  // Restore original console methods
  restore() {
    if (this.isSetup && this.originalConsoleError && this.originalConsoleWarn) {
      console.error = this.originalConsoleError;
      console.warn = this.originalConsoleWarn;
      this.isSetup = false;
      console.log('🔊 Network error suppressor restored');
    }
  }

  // Manually suppress specific error patterns
  addSuppressedPattern(pattern) {
    if (typeof pattern === 'string' && pattern.length > 0) {
      this.suppressedErrors.add(pattern.toLowerCase());
    }
  }

  addSuppressedUrl(url) {
    if (typeof url === 'string' && url.length > 0) {
      this.suppressedUrls.add(url);
    }
  }
}

// Create singleton instance
let suppressorInstance = null;

// Initialize only once and only in development
if (typeof window !== 'undefined') {
  try {
    suppressorInstance = new NetworkErrorSupressor();
    
    // Expose for debugging
    window.networkErrorSupressor = suppressorInstance;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (suppressorInstance) {
        suppressorInstance.restore();
      }
    });
  } catch (error) {
    console.warn('Failed to initialize network error suppressor:', error);
  }
}

export default NetworkErrorSupressor;
