import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmailSentMessage = ({ email, onBack }) => {
  return (
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
        We've sent password reset instructions to {email}
      </p>
      <Button
        onClick={onBack}
        variant="outline"
        className="w-full"
      >
        Back to sign in
      </Button>
    </motion.div>
  );
};

export default EmailSentMessage;
