import React from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword, getPasswordFeedback } from '../../lib/passwordValidation';

const PasswordInput = ({
  name,
  value,
  onChange,
  placeholder,
  label,
  showPassword,
  onToggleVisibility,
  error,
  disabled,
  showStrength = false,
  confirmPassword = null,
}) => {
  const passwordValidation = showStrength && value ? validatePassword(value) : null;

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
    <div className="space-y-2">
      <Label className="text-slate-200 flex items-center gap-2">
        <Lock className="w-4 h-4" />
        {label}
      </Label>
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          name={name}
          placeholder={placeholder}
          className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10 ${error ? 'border-red-500' : ''}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      
      {showStrength && passwordValidation && (
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
            {getPasswordFeedback(value)}
          </p>
        </div>
      )}
      
      {confirmPassword !== null && value && confirmPassword === value && (
        <div className="flex items-center gap-1 text-green-400 text-sm">
          <CheckCircle2 className="w-3 h-3" />
          Passwords match
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-1 text-red-400 text-sm">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
