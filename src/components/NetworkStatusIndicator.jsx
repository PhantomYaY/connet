import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { addNetworkStatusListener, getNetworkStatus, checkConnectivity } from '../lib/networkStatus';

const NetworkStatusIndicator = ({ className = "" }) => {
  const [isOnline, setIsOnline] = useState(getNetworkStatus());
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const removeListener = addNetworkStatusListener((online) => {
      setIsOnline(online);
      
      // Show indicator when offline or when coming back online briefly
      if (!online) {
        setShowIndicator(true);
      } else {
        setShowIndicator(true);
        // Hide after 3 seconds when coming back online
        setTimeout(() => setShowIndicator(false), 3000);
      }
    });

    // Initial connectivity check
    checkConnectivity().then(online => {
      if (!online && getNetworkStatus()) {
        setIsOnline(false);
        setShowIndicator(true);
      }
    });

    return removeListener;
  }, []);

  if (!showIndicator) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border transition-all duration-300
          ${isOnline 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }
        `}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusIndicator;
