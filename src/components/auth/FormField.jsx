import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FormField = ({
  icon: Icon,
  label,
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  error,
  disabled,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-slate-200 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </Label>
      <Input
        type={type}
        name={name}
        placeholder={placeholder}
        className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 ${error ? 'border-red-500' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && (
        <div className="flex items-center gap-1 text-red-400 text-sm">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
