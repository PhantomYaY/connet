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
      await signInWithPopupFn(auth, googleProvider);
    } catch (error) {
      throw new Error(error.message);
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
