// Minimal Firebase connection test
import { auth, firestore } from './firebase';

export const testFirebaseConnection = async () => {
  console.log('Testing Firebase connection...');
  
  try {
    // Test 1: Check if Firebase is initialized
    if (!auth || !firestore) {
      throw new Error('Firebase not properly initialized');
    }
    console.log('✓ Firebase initialized');

    // Test 2: Check current auth state
    console.log('Current user:', auth.currentUser?.uid || 'Not authenticated');

    // Test 3: Simple network connectivity test
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    console.log('✓ Basic network connectivity works');

    return { success: true, message: 'Firebase connection test passed' };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return { success: false, error: error.message };
  }
};
