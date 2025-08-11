// Simple Error Debugger - Minimal logging for debugging
class ErrorDebugger {
  constructor() {
    this.errors = [];
    this.maxErrors = 50; // Keep only last 50 errors
  }

  logError(error, context = 'Unknown') {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      message: error?.message || String(error),
      stack: error?.stack?.split('\n').slice(0, 3).join('\n'), // Only first 3 lines
      type: error?.name || 'Unknown'
    };

    this.errors.push(errorInfo);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Only log significant errors in development
    if (this.isDevelopment() && this.isSignificantError(error)) {
      console.group(`🐛 Error in ${context}`);
      console.error('Message:', errorInfo.message);
      console.error('Type:', errorInfo.type);
      if (errorInfo.stack) {
        console.error('Stack:', errorInfo.stack);
      }
      console.groupEnd();
    }
  }

  isSignificantError(error) {
    const message = (error?.message || String(error)).toLowerCase();
    
    // Skip common, expected errors
    const skipPatterns = [
      'networkerror',
      'failed to fetch',
      'favicon',
      'robots.txt',
      'fullstory',
      'fs.js'
    ];

    return !skipPatterns.some(pattern => message.includes(pattern));
  }

  isDevelopment() {
    return (
      typeof window !== 'undefined' && (
        import.meta.env?.DEV ||
        window.location.hostname === 'localhost' ||
        window.location.port !== ''
      )
    );
  }

  getRecentErrors(limit = 10) {
    return this.errors.slice(-limit);
  }

  clearErrors() {
    this.errors = [];
    console.log('🧹 Error debugger: Cleared error history');
  }

  printSummary() {
    if (this.errors.length === 0) {
      console.log('✅ No errors recorded');
      return;
    }

    console.group(`📊 Error Summary (${this.errors.length} total)`);
    
    // Group by type
    const byType = {};
    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
    });

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`${type}: ${count} errors`);
    });

    console.log('\nRecent errors:');
    this.getRecentErrors(5).forEach(error => {
      console.log(`• ${error.timestamp}: ${error.context} - ${error.message}`);
    });

    console.groupEnd();
  }
}

// Create singleton
const errorDebugger = new ErrorDebugger();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.errorDebugger = errorDebugger;
}

export default errorDebugger;
