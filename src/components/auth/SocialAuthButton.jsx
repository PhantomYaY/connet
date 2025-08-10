import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SocialAuthButton = ({
  onClick,
  isLoading,
  provider = 'google',
  children,
}) => {
  const getProviderIcon = () => {
    switch (provider) {
      case 'google':
        return (
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className="w-full bg-white text-slate-800 font-semibold hover:bg-slate-100 flex items-center justify-center gap-2 shadow-sm border border-slate-300 h-12"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {getProviderIcon()}
          {children}
        </>
      )}
    </Button>
  );
};

export default SocialAuthButton;
