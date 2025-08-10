import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validatePassword, getPasswordFeedback } from '../lib/passwordValidation';

function EnhancedAuthForm({ isFlipped, setIsFlipped }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [formState, setFormState] = useState({
    isLoading: false,
    showPassword: false,
    showConfirmPassword: false,
    emailSent: false,
    showForgotPassword: false,
  });
  
  const [errors, setErrors] = useState({});
  const [passwordValidation, setPasswordValidation] = useState(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { setIsAuthenticating } = useAuth();

  // Real-time password validation
  useEffect(() => {
    if (formData.password && !isFlipped) {
      setPasswordValidation(validatePassword(formData.password));
    } else {
      setPasswordValidation(null);
    }
  }, [formData.password, isFlipped]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isFlipped) {
      // For signup, validate password strength
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    // Name validation for signup
    if (!isFlipped && !formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    // Confirm password validation for signup
    if (!isFlipped) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setFormState(prev => ({ ...prev, isLoading: true }));
    setIsAuthenticating(true);

    try {
      if (isFlipped) {
        // Login
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast({ title: 'Welcome back!', description: 'You have been signed in successfully.' });
      } else {
        // Signup
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Set displayName
        await updateProfile(userCredential.user, {
          displayName: formData.name,
        });

        // Send email verification
        await sendEmailVerification(userCredential.user);
        
        toast({ 
          title: 'Account created!', 
          description: 'Please check your email to verify your account.' 
        });
      }
      navigate('/dashboard');
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }

      toast({
        title: isFlipped ? 'Sign in failed' : 'Sign up failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormState(prev => ({ ...prev, isLoading: true }));
    setIsAuthenticating(true);

    try {
      await signInWithPopupFn(auth, googleProvider);
      toast({ title: 'Welcome!', description: 'You have been signed in with Google.' });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Google sign-in failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
      setIsAuthenticating(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, formData.email);
      setFormState(prev => ({ ...prev, emailSent: true }));
      toast({
        title: 'Reset email sent',
        description: 'Check your email for password reset instructions',
      });
    } catch (error) {
      toast({
        title: 'Error sending reset email',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const togglePasswordVisibility = (field) => {
    setFormState(prev => ({ 
      ...prev, 
      [field]: !prev[field] 
    }));
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-blue-500';
      case 'very-strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="absolute w-full h-full flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">
            {isFlipped ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            {isFlipped ? 'Sign in to continue your journey' : 'Join thousands of CS students'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {formState.emailSent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center p-6 space-y-4"
            >
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold">Check your email</h3>
              <p className="text-slate-300 text-sm">
                We've sent password reset instructions to {formData.email}
              </p>
              <Button
                onClick={() => setFormState(prev => ({ ...prev, emailSent: false }))}
                variant="outline"
                className="w-full"
              >
                Back to sign in
              </Button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {!isFlipped && (
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    name="name"
                    placeholder="Enter your full name"
                    className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 ${errors.name ? 'border-red-500' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    disabled={formState.isLoading}
                  />
                  {errors.name && (
                    <div className="flex items-center gap-1 text-red-400 text-sm">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 ${errors.email ? 'border-red-500' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={formState.isLoading}
                />
                {errors.email && (
                  <div className="flex items-center gap-1 text-red-400 text-sm">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={formState.showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder={isFlipped ? "Enter your password" : "Create a strong password"}
                    className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={formState.isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('showPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {formState.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {!isFlipped && passwordValidation && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full flex-1 ${
                            i < passwordValidation.score 
                              ? getPasswordStrengthColor(passwordValidation.strength)
                              : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-300">
                      {getPasswordFeedback(formData.password)}
                    </p>
                  </div>
                )}
                
                {errors.password && (
                  <div className="flex items-center gap-1 text-red-400 text-sm">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </div>
                )}
              </div>

              {!isFlipped && (
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={formState.showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={formState.isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('showConfirmPassword')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {formState.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle2 className="w-3 h-3" />
                      Passwords match
                    </div>
                  )}
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-1 text-red-400 text-sm">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              )}

              {isFlipped && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-cyan-400 hover:underline text-sm"
                    disabled={formState.isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={formState.isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold h-12"
              >
                {formState.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isFlipped ? 'Signing in...' : 'Creating account...'}
                  </div>
                ) : (
                  `${isFlipped ? 'Sign In' : 'Create Account'} →`
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {!formState.emailSent && (
          <>
            <div className="flex items-center justify-center space-x-2 text-slate-400 text-sm">
              <span>or continue with</span>
            </div>

            <Button
              onClick={handleGoogleLogin}
              disabled={formState.isLoading}
              className="w-full bg-white text-slate-800 font-semibold hover:bg-slate-100 flex items-center justify-center gap-2 shadow-sm border border-slate-300 h-12"
            >
              {formState.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Continue with Google
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-400 mt-4">
              {isFlipped ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="text-cyan-400 hover:underline font-medium"
                disabled={formState.isLoading}
              >
                {isFlipped ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default EnhancedAuthForm;
