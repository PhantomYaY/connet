import { enableFirestoreNetwork, disableFirestoreNetwork } from './firebase';

let isOnline = navigator.onLine;
let networkStatusListeners = [];

// Network status detection
export const getNetworkStatus = () => isOnline;

export const addNetworkStatusListener = (callback) => {
  networkStatusListeners.push(callback);
  return () => {
    networkStatusListeners = networkStatusListeners.filter(cb => cb !== callback);
  };
};

// Enhanced network connectivity check
export const checkConnectivity = async () => {
  if (!navigator.onLine) {
    return false;
  }

  try {
    // Try to fetch a small resource with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/manifest.json', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Connectivity check failed:', error);
    return false;
  }
};

// Initialize network status monitoring
const initNetworkMonitoring = () => {
  const updateNetworkStatus = async (online) => {
    const wasOnline = isOnline;
    isOnline = online;
    
    // Verify actual connectivity for online events
    if (online && !wasOnline) {
      const actuallyOnline = await checkConnectivity();
      if (!actuallyOnline) {
        isOnline = false;
        return;
      }
    }
    
    // Notify listeners of status change
    networkStatusListeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error('Network status listener error:', error);
      }
    });

    // Handle Firestore network status
    try {
      if (isOnline && !wasOnline) {
        console.log('Network restored, enabling Firestore network');
        await enableFirestoreNetwork();
      } else if (!isOnline && wasOnline) {
        console.log('Network lost, disabling Firestore network');
        await disableFirestoreNetwork();
      }
    } catch (error) {
      console.warn('Error updating Firestore network status:', error);
    }
  };

  // Listen for browser network events
  window.addEventListener('online', () => updateNetworkStatus(true));
  window.addEventListener('offline', () => updateNetworkStatus(false));

  // Periodic connectivity check
  setInterval(async () => {
    const actuallyOnline = await checkConnectivity();
    if (actuallyOnline !== isOnline) {
      updateNetworkStatus(actuallyOnline);
    }
  }, 30000); // Check every 30 seconds
};

// Auto-initialize when module is loaded
initNetworkMonitoring();

export default {
  getNetworkStatus,
  addNetworkStatusListener,
  checkConnectivity
};
