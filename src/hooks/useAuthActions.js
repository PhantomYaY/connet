import {
  auth,
  signInWithPopupFn,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from '../lib/firebase';
import { updateProfile } from 'firebase/auth';

export const useAuthActions = () => {
  const getErrorMessage = (error) => {
    // Handle network errors first
    if (error.code === 'auth/network-request-failed' ||
        error.message.includes('NetworkError') ||
        error.message.includes('fetch resource') ||
        error.message.includes('Failed to fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/quota-exceeded':
        return 'Request quota exceeded. Please try again later.';
      case 'auth/api-key-not-valid':
        return 'API configuration error. Please contact support.';
      default:
        return error.message;
    }
  };

  const handleEmailAuth = async (formData, isLogin) => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        await updateProfile(userCredential.user, {
          displayName: formData.name,
        });

        await sendEmailVerification(userCredential.user);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      throw new Error(errorMessage);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopupFn(auth, googleProvider);
      console.log('Google auth successful:', result.user);
      return result;
    } catch (error) {
      console.error('Google auth error:', error);

      // Handle specific Google auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign-in attempt is already in progress.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google sign-in. Please contact support.');
      } else {
        throw new Error(`Google sign-in failed: ${error.message}`);
      }
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  return {
    handleEmailAuth,
    handleGoogleAuth,
    handleForgotPassword,
  };
};
