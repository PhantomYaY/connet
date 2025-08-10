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
  onSnapshot
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
  getDoc
};
