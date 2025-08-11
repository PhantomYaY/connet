// Network Debugging Utility
class NetworkDebugger {
  constructor() {
    this.errors = [];
    this.requests = [];
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Skip fetch interception to avoid conflicts
    console.log('🐛 Network debugger: Skipping fetch interception to prevent conflicts');
  }

  categorizeError(error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return 'NETWORK_ERROR';
    }
    if (error.message.includes('CORS')) {
      return 'CORS_ERROR';
    }
    if (error.message.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  getRecentErrors(limit = 10) {
    return this.errors.slice(-limit);
  }

  getRecentRequests(limit = 10) {
    return this.requests.slice(-limit);
  }

  printSummary() {
    console.group('🔍 Network Debugging Summary');
    console.log(`Total Requests: ${this.requests.length}`);
    console.log(`Total Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.group('Recent Errors:');
      this.getRecentErrors(5).forEach(error => {
        console.error(`${error.timestamp}: ${error.type} - ${error.url} - ${error.error}`);
      });
      console.groupEnd();
    }
    
    if (this.requests.length > 0) {
      console.group('Recent Requests:');
      this.getRecentRequests(5).forEach(req => {
        const status = req.success ? '✅' : '❌';
        console.log(`${status} ${req.method} ${req.url} - ${req.status} (${req.duration}ms)`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  // Quick health check for common services
  async healthCheck() {
    console.log('🏥 Network Health Check: Skipping external services to prevent console errors');
    // External health checks disabled to prevent "Fetch error from" messages
  }
}

// Initialize the debugger
const networkDebugger = new NetworkDebugger();

// Expose to global scope for manual debugging
window.networkDebugger = networkDebugger;

// Auto-print summary every 30 seconds if there are errors
setInterval(() => {
  if (networkDebugger.errors.length > 0) {
    networkDebugger.printSummary();
  }
}, 30000);

export default networkDebugger;
