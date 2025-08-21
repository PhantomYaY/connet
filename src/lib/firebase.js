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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyALa8w5hg8Q4D_HEp7qinYuBV-wRjUKxaI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "connected-6cf77.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "connected-6cf77",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "connected-6cf77.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "789566413749",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:789566413749:web:aa5b68b2e9f2b1434d17fc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZC2VEMC0HW",
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

// Enhanced helper function for Firestore operations with exponential backoff
export const withRetry = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);

      // Don't retry on certain errors
      if (
        error.code === 'permission-denied' ||
        error.code === 'not-found' ||
        error.code === 'already-exists' ||
        error.message === 'User not authenticated'
      ) {
        throw error; // Throw immediately for these errors
      }

      if (attempt === maxRetries) {
        throw error; // Throw original error on final attempt
      }

      // Exponential backoff with jitter: base delay * 2^(attempt-1) + random jitter
      const baseDelay = 1000;
      const backoffDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 500; // Add up to 500ms random jitter
      const totalDelay = Math.min(backoffDelay + jitter, 10000); // Cap at 10 seconds

      console.log(`Retrying in ${Math.round(totalDelay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
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
