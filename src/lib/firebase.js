import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
  signInWithEmailAndPassword as _signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
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
  connectFirestoreEmulator,
  onSnapshot,
  limit
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

// Configure Google provider
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export const firestore = getFirestore(app);

// Enable offline persistence
// Note: This is enabled by default in newer Firebase versions

// Enhanced helper function for Firestore operations with better error handling
export const withRetry = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Firestore attempt ${attempt}/${maxRetries} failed:`, {
        code: error.code,
        message: error.message,
        isNetworkError: isFirestoreNetworkError(error)
      });

      // Don't retry on certain errors
      if (shouldNotRetryFirestoreError(error)) {
        throw enhanceFirestoreError(error);
      }

      if (attempt === maxRetries) {
        throw enhanceFirestoreError(error);
      }

      // Progressive delay before retry
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Check if error is network-related for Firestore
const isFirestoreNetworkError = (error) => {
  return (
    error.code === 'unavailable' ||
    error.code === 'deadline-exceeded' ||
    error.code === 'cancelled' ||
    error.message?.includes('NetworkError') ||
    error.message?.includes('fetch')
  );
};

// Determine if we should not retry the error
const shouldNotRetryFirestoreError = (error) => {
  return (
    error.code === 'permission-denied' ||
    error.code === 'unauthenticated' ||
    error.code === 'invalid-argument' ||
    error.code === 'not-found' ||
    error.code === 'already-exists'
  );
};

// Enhance error messages for better user experience
const enhanceFirestoreError = (error) => {
  if (isFirestoreNetworkError(error)) {
    error.message = 'Unable to connect to the database. Please check your internet connection and try again.';
  } else if (error.code === 'permission-denied') {
    error.message = 'You do not have permission to access this resource. Please sign in again.';
  } else if (error.code === 'unauthenticated') {
    error.message = 'Please sign in to continue.';
  }

  return error;
};

// Network status helpers
export const enableFirestoreNetwork = () => enableNetwork(firestore);
export const disableFirestoreNetwork = () => disableNetwork(firestore);

// Export everything
export {
  auth,
  googleProvider,
  signInWithPopup as signInWithPopupFn,
  _createUserWithEmailAndPassword as createUserWithEmailAndPassword,
  _signInWithEmailAndPassword as signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
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
  getDoc,
  onSnapshot,
  limit
};
