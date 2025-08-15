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
              className="space-y-4"
            >
              {!isFlipped && (
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
              )}

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

              {!isFlipped && (
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
              )}

              {isFlipped && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
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

            <SocialAuthButton
              onClick={handleGoogleLogin}
              isLoading={formState.isLoading}
              provider="google"
            >
              Continue with Google
            </SocialAuthButton>

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
