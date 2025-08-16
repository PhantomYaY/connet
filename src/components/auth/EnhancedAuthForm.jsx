import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthActions } from '../../hooks/useAuthActions';
import { useFormValidation } from '../../hooks/useFormValidation';
import FormField from './FormField';
import PasswordInput from './PasswordInput';
import SocialAuthButton from './SocialAuthButton';
import EmailSentMessage from './EmailSentMessage';

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
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { setIsAuthenticating, networkError, clearNetworkError } = useAuth();
  const { handleEmailAuth, handleGoogleAuth, handleForgotPassword } = useAuthActions();
  const { errors, validateForm } = useFormValidation(formData, isFlipped);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setFormState(prev => ({ ...prev, isLoading: true }));
    setIsAuthenticating(true);

    try {
      await handleEmailAuth(formData, isFlipped);
      
      toast({ 
        title: isFlipped ? 'Welcome back!' : 'Account created!',
        description: isFlipped ? 'You have been signed in successfully.' : 'Please check your email to verify your account.'
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: isFlipped ? 'Sign in failed' : 'Sign up failed',
        description: error.message,
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
      await handleGoogleAuth();
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

  const handleForgotPasswordClick = async () => {
    if (!formData.email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await handleForgotPassword(formData.email);
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-sm md:max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/[0.03] backdrop-blur-2xl border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-[0_32px_64px_rgba(0,0,0,0.4)] space-y-6 md:space-y-8 text-white relative overflow-hidden"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/4 to-cyan-500/8 rounded-3xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-3xl" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            {/* Logo and Header */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mx-auto w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-400 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-2xl"
              >
                <span className="text-2xl md:text-3xl font-bold text-white">CE</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent"
              >
                {isFlipped ? 'Welcome Back' : 'Get Started'}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-slate-300 text-lg leading-relaxed"
              >
                {isFlipped 
                  ? 'Sign in to continue your learning journey' 
                  : 'Join thousands of students advancing their CS knowledge'
                }
              </motion.p>
            </div>

            {/* Network Error Display */}
            <AnimatePresence>
              {networkError && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-sm text-red-200"
                >
                  <div className="flex items-center justify-between">
                    <span>{networkError}</span>
                    <button
                      type="button"
                      onClick={clearNetworkError}
                      className="text-red-200 hover:text-white ml-2 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Content */}
            <AnimatePresence mode="wait">
              {formState.emailSent ? (
                <EmailSentMessage
                  email={formData.email}
                  onBack={() => setFormState(prev => ({ ...prev, emailSent: false }))}
                />
              ) : (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {!isFlipped && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <FormField
                        icon={User}
                        label="Full Name"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        disabled={formState.isLoading}
                      />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <FormField
                      icon={Mail}
                      label="Email"
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      disabled={formState.isLoading}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <PasswordInput
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={isFlipped ? "Enter your password" : "Create a strong password"}
                      label="Password"
                      showPassword={formState.showPassword}
                      onToggleVisibility={() => togglePasswordVisibility('showPassword')}
                      error={errors.password}
                      disabled={formState.isLoading}
                      showStrength={!isFlipped}
                    />
                  </motion.div>

                  {!isFlipped && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <PasswordInput
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        label="Confirm Password"
                        showPassword={formState.showConfirmPassword}
                        onToggleVisibility={() => togglePasswordVisibility('showConfirmPassword')}
                        error={errors.confirmPassword}
                        disabled={formState.isLoading}
                        confirmPassword={formData.password}
                      />
                    </motion.div>
                  )}

                  {isFlipped && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={handleForgotPasswordClick}
                        className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200 hover:underline"
                        disabled={formState.isLoading}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      type="submit"
                      disabled={formState.isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {formState.isLoading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {isFlipped ? 'Signing in...' : 'Creating account...'}
                        </div>
                      ) : (
                        `${isFlipped ? 'Sign In' : 'Create Account'} →`
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>

            {!formState.emailSent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-6"
              >
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-6 bg-gradient-to-r from-transparent via-slate-900/80 to-transparent text-slate-400">
                      or continue with
                    </span>
                  </div>
                </div>

                {/* Google Sign In */}
                <SocialAuthButton
                  onClick={handleGoogleLogin}
                  isLoading={formState.isLoading}
                  provider="google"
                >
                  Continue with Google
                </SocialAuthButton>

                {/* Toggle Form */}
                <p className="text-center text-base text-slate-300">
                  {isFlipped ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-200 hover:underline"
                    disabled={formState.isLoading}
                  >
                    {isFlipped ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default EnhancedAuthForm;
