import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
  signInWithEmailAndPassword as _signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  getDoc,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyALa8w5hg8Q4D_HEp7qinYuBV-wRjUKxaI",
  authDomain: "connected-6cf77.firebaseapp.com",
  projectId: "connected-6cf77",
  storageBucket: "connected-6cf77.firebasestorage.app",
  messagingSenderId: "789566413749",
  appId: "1:789566413749:web:aa5b68b2e9f2b1434d17fc",
  measurementId: "G-ZC2VEMC0HW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);

// Enable offline persistence
// Note: This is enabled by default in newer Firebase versions

// Simplified helper function for Firestore operations
export const withRetry = async (operation, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error; // Throw original error on final attempt
      }

      // Simple delay before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Network status helpers with error handling
export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(firestore);
    console.log('Firestore network enabled');
  } catch (error) {
    console.warn('Failed to enable Firestore network:', error);
    throw new Error('Failed to connect to Firebase. Please check your internet connection.');
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(firestore);
    console.log('Firestore network disabled');
  } catch (error) {
    console.warn('Failed to disable Firestore network:', error);
  }
};

// Enhanced operation wrapper that includes network checks
export const withNetworkCheck = async (operation) => {
  // Check network status first
  if (!navigator.onLine) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  try {
    return await withRetry(operation);
  } catch (error) {
    // If it's a network error and we haven't exceeded retry limit
    if (error.message.includes('NetworkError') && networkRetryCount < MAX_NETWORK_RETRIES) {
      networkRetryCount++;
      console.log(`Network retry attempt ${networkRetryCount}/${MAX_NETWORK_RETRIES}`);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to re-enable network connection
      try {
        await enableFirestoreNetwork();
      } catch (enableError) {
        console.warn('Failed to re-enable network:', enableError);
      }

      // Retry the operation
      return await withRetry(operation, 2);
    }

    throw error;
  }
};

// Export everything
export {
  auth,
  googleProvider,
  signInWithPopup as signInWithPopupFn,
  _createUserWithEmailAndPassword as createUserWithEmailAndPassword,
  _signInWithEmailAndPassword as signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  firestore as db,
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  getDoc
};
