import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Code, Users, Brain } from 'lucide-react';
import {
  auth,
  signInWithPopupFn,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

function AuthForm({ isFlipped, setIsFlipped }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isFlipped) {
        // Login
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast({ title: 'Logged in successfully!' });
      } else {
        // Signup
        if (formData.password !== formData.confirmPassword) {
          toast({ title: "Passwords don't match", variant: 'destructive' });
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // ✅ Set displayName after signup
        await updateProfile(userCredential.user, {
          displayName: formData.name,
        });

        toast({ title: 'Account created!' });
      }
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Authentication error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopupFn(auth, googleProvider);
      toast({ title: 'Google sign-in successful!' });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Google sign-in failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="absolute w-full h-full flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6 text-white">
        <h2 className="text-3xl font-extrabold text-center">
          {isFlipped ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-center text-sm text-slate-300">
          {isFlipped ? 'Login to continue' : 'Join thousands of CS students'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isFlipped && (
            <div>
              <Label className="text-slate-200">Full Name</Label>
              <Input
                name="name"
                placeholder="Enter your full name"
                className="bg-slate-700 border border-slate-600 text-white"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}
          <div>
            <Label className="text-slate-200">Email</Label>
            <Input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="bg-slate-700 border border-slate-600 text-white"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label className="text-slate-200">Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="Create a password"
              className="bg-slate-700 border border-slate-600 text-white"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          {!isFlipped && (
            <div>
              <Label className="text-slate-200">Confirm Password</Label>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                className="bg-slate-700 border border-slate-600 text-white"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
          >
            {isFlipped ? 'Login' : 'Create Account'} →
          </Button>
        </form>

        <div className="flex items-center justify-center space-x-2 text-slate-400 text-sm">
          <span>or continue with</span>
        </div>

        <Button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-slate-800 font-semibold hover:bg-slate-100 flex items-center justify-center gap-2 shadow-sm border border-slate-300"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </Button>

        <p className="text-center text-sm text-slate-400 mt-4">
          {isFlipped ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="text-cyan-400 hover:underline font-medium"
          >
            {isFlipped ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthForm;
