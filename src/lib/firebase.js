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
  getDoc
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
