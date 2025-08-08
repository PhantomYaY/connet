import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Code, Users, Brain } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

function AuthPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
  const [currentStep, setCurrentStep] = useState(4); // Skip onboarding for demo

  // Check if user is already authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (location.state?.toast) {
      toast({ title: location.state.toast });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const onboardingSteps = [
    {
      icon: (
        <img
          alt="ConnectEd"
          className="w-50 h-50 mx-auto object-cover"
          src="logo.PNG"
        />
      ),
      title: 'Welcome to ConnectEd',
      description: 'Your all-in-one platform for CS students.',
      color: 'text-cyan-300',
    },
    {
      icon: <Code className="w-24 h-24 mx-auto" />,
      title: 'Smart Note-Taking',
      description: 'Take notes with runnable code snippets.',
      color: 'text-green-300',
    },
    {
      icon: <Users className="w-24 h-24 mx-auto" />,
      title: 'Real-Time Collaboration',
      description: 'Connect with communities and collaborate.',
      color: 'text-sky-300',
    },
    {
      icon: <Brain className="w-24 h-24 mx-auto" />,
      title: 'AI-Powered Tools',
      description: 'Flashcards, summaries, and code help.',
      color: 'text-teal-300',
    },
  ];

  const slideVariants = {
    enter: (direction) => ({ y: direction > 0 ? 50 : -50, scale: 0.8, opacity: 0, rotateX: -45 }),
    center: { zIndex: 1, y: 0, scale: 1, opacity: 1, rotateX: 0 },
    exit: (direction) => ({ zIndex: 0, y: direction < 0 ? 50 : -50, opacity: 0, scale: 0.8, rotateX: 45 }),
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      localStorage.setItem('hasSeenOnboarding', 'true');
      setCurrentStep(4);
    }
  };

  return (
    <>
      <Helmet>
        <title>ConnectEd - Smart Learning Platform</title>
        <meta name="description" content="The ultimate platform for CS students to take notes, collaborate, and learn with AI-powered tools." />
      </Helmet>
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-grid-slate-800/40 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/0 to-teal-500/20"
          animate={{ x: ['-20%', '0%', '20%', '0%', '-20%'], y: ['-20%', '20%', '-20%', '20%', '-20%'], scale: [1, 1.2, 1, 1.2, 1], opacity: [0.1, 0.3, 0.1, 0.3, 0.1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10 w-full max-w-lg h-[600px]" style={{ perspective: '1000px' }}>
          <AnimatePresence mode="wait" custom={1}>
            {currentStep < 4 ? (
              <motion.div
                key={currentStep}
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className={`${onboardingSteps[currentStep].color}`}>{onboardingSteps[currentStep].icon}</div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 mt-8">{onboardingSteps[currentStep].title}</h1>
                <p className="text-slate-300 text-lg md:text-xl mb-12 max-w-sm">{onboardingSteps[currentStep].description}</p>
              </motion.div>
            ) : (
              <motion.div
                key="auth-card"
                initial={{ rotateY: isFlipped ? 180 : 0 }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}>
                  <AuthForm isFlipped={false} setIsFlipped={setIsFlipped} />
                </div>
                <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <AuthForm isFlipped={true} setIsFlipped={setIsFlipped} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {currentStep < 4 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center space-y-4">
            <Button
              onClick={nextStep}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm px-10 py-6 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 hover:border-white/40 group"
            >
              {currentStep === 3 ? 'Get Started' : 'Next'}
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="flex justify-center space-x-2">
              {onboardingSteps.map((_, step) => (
                <motion.div
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === currentStep ? 'bg-cyan-400 scale-125' : 'bg-slate-600'}`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          </div>
        )}

        <Toaster />
      </main>
    </>
  );
}

export default AuthPage;
