import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [networkError, setNetworkError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    try {
      unsubscribe = onAuthStateChanged(auth,
        (user) => {
          setUser(user);
          setLoading(false);
          setNetworkError(null); // Clear error on successful auth state change
        },
        (error) => {
          console.error('Auth state change error:', error);
          setLoading(false);

          // Handle network errors specifically
          if (error.code === 'auth/network-request-failed' ||
              error.message.includes('NetworkError') ||
              error.message.includes('fetch resource')) {
            setNetworkError('Network connection issue. Please check your internet connection and try again.');
          } else {
            setNetworkError(`Authentication error: ${error.message}`);
          }
        }
      );
    } catch (error) {
      console.error('Failed to initialize auth listener:', error);
      setLoading(false);
      setNetworkError('Failed to initialize authentication. Please refresh the page.');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticating,
    setIsAuthenticating,
    isAuthenticated: !!user,
    networkError,
    clearNetworkError: () => setNetworkError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
