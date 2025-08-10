import { useState, useCallback } from 'react';
import { validatePassword } from '../lib/passwordValidation';

export const useFormValidation = (formData, isLogin) => {
  const [errors, setErrors] = useState({});

  const validateForm = useCallback(() => {
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
    } else if (!isLogin) {
      // For signup, validate password strength
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    // Name validation for signup
    if (!isLogin && !formData.name?.trim()) {
      newErrors.name = 'Full name is required';
    }

    // Confirm password validation for signup
    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isLogin]);

  const clearError = useCallback((fieldName) => {
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  }, []);

  return {
    errors,
    validateForm,
    clearError,
  };
};
