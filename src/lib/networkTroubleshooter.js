// Network Troubleshooter - Debugging and testing utility
export class NetworkTroubleshooter {
  async runFullDiagnostics() {
    console.group('🏥 Full Network Diagnostics');
    
    const results = {
      browserStatus: this.getBrowserStatus(),
      connectivity: await this.testConnectivity(),
      services: await this.testExternalServices(),
      firebase: await this.testFirebaseConnection(),
      apis: await this.testAPIServices()
    };
    
    console.log('Diagnostics Results:', results);
    console.groupEnd();
    
    return results;
  }

  getBrowserStatus() {
    return {
      isOnline: navigator.onLine,
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null,
      cookieEnabled: navigator.cookieEnabled,
      language: navigator.language
    };
  }

  async testConnectivity() {
    const tests = [
      { name: 'Local Server', url: '/favicon.ico' },
      { name: 'Google DNS', url: 'https://dns.google.com' },
      { name: 'Cloudflare', url: 'https://cloudflare.com' }
    ];

    const results = {};
    
    for (const test of tests) {
      try {
        const start = performance.now();
        const response = await fetch(test.url, {
          method: 'HEAD',
          mode: test.url.startsWith('/') ? 'same-origin' : 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        const duration = performance.now() - start;
        
        results[test.name] = {
          status: 'success',
          duration: Math.round(duration),
          response: response.status || 'no-cors'
        };
      } catch (error) {
        results[test.name] = {
          status: 'failed',
          error: error.message,
          type: error.name
        };
      }
    }
    
    return results;
  }

  async testExternalServices() {
    const services = [
      { name: 'OpenAI', url: 'https://api.openai.com/v1/models' },
      { name: 'Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models' }
    ];

    const results = {};
    
    for (const service of services) {
      try {
        const response = await fetch(service.url, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(3000)
        });
        
        results[service.name] = {
          status: 'reachable',
          response: 'no-cors-success'
        };
      } catch (error) {
        results[service.name] = {
          status: 'unreachable',
          error: error.message,
          type: error.name
        };
      }
    }
    
    return results;
  }

  async testFirebaseConnection() {
    try {
      // Test Firebase connectivity
      const { auth } = await import('./firebase.js');
      
      return {
        status: 'initialized',
        currentUser: auth.currentUser ? 'authenticated' : 'anonymous',
        config: {
          projectId: auth.app.options.projectId,
          authDomain: auth.app.options.authDomain
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  async testAPIServices() {
    try {
      const { aiService } = await import('./aiService.js');
      
      const providers = aiService.getAvailableProviders?.() || [];
      
      return {
        aiService: 'loaded',
        availableProviders: providers,
        hasKeys: providers.length > 0
      };
    } catch (error) {
      return {
        aiService: 'failed',
        error: error.message
      };
    }
  }

  // Simplified network test for quick checks
  async quickTest() {
    console.log('🔍 Quick Network Test...');
    
    const isOnline = navigator.onLine;
    console.log(`Browser Online Status: ${isOnline ? '✅' : '❌'}`);
    
    if (!isOnline) {
      console.log('❌ Browser reports offline status');
      return false;
    }
    
    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      });
      
      const isActuallyOnline = response.ok;
      console.log(`Actual Connectivity: ${isActuallyOnline ? '✅' : '❌'}`);
      return isActuallyOnline;
    } catch (error) {
      console.log(`❌ Connectivity Test Failed: ${error.message}`);
      return false;
    }
  }

  // Generate troubleshooting recommendations
  generateRecommendations(diagnostics) {
    const recommendations = [];
    
    if (!diagnostics.browserStatus.isOnline) {
      recommendations.push('❌ Browser reports offline - Check network connection');
    }
    
    if (diagnostics.connectivity['Local Server']?.status === 'failed') {
      recommendations.push('❌ Cannot reach development server - Check if server is running');
    }
    
    if (diagnostics.firebase?.status === 'failed') {
      recommendations.push('❌ Firebase connection failed - Check Firebase configuration');
    }
    
    if (diagnostics.apis?.hasKeys === false) {
      recommendations.push('⚠️ No AI API keys configured - Add keys in settings for AI features');
    }
    
    const failedConnectivity = Object.entries(diagnostics.connectivity)
      .filter(([_, result]) => result.status === 'failed');
    
    if (failedConnectivity.length > 0) {
      recommendations.push(`❌ Failed to reach: ${failedConnectivity.map(([name]) => name).join(', ')}`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ All systems appear to be working correctly');
    }
    
    return recommendations;
  }
}

// Create singleton instance
const troubleshooter = new NetworkTroubleshooter();

// Expose to global scope for debugging
if (typeof window !== 'undefined') {
  window.networkTroubleshooter = troubleshooter;
}

export default troubleshooter;

// Helper functions for quick access
export const quickNetworkTest = () => troubleshooter.quickTest();
export const runFullDiagnostics = () => troubleshooter.runFullDiagnostics();
