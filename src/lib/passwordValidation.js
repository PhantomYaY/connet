export const validatePassword = (password) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  
  return {
    requirements,
    score,
    isValid: score >= 4 && requirements.length,
    strength: score <= 2 ? 'weak' : score === 3 ? 'medium' : score === 4 ? 'strong' : 'very-strong'
  };
};

export const getPasswordFeedback = (password) => {
  if (!password) return '';
  
  const validation = validatePassword(password);
  const { requirements, strength } = validation;
  
  const missing = [];
  if (!requirements.length) missing.push('at least 8 characters');
  if (!requirements.uppercase) missing.push('one uppercase letter');
  if (!requirements.lowercase) missing.push('one lowercase letter');
  if (!requirements.number) missing.push('one number');
  if (!requirements.special) missing.push('one special character');
  
  if (missing.length === 0) {
    return `Password strength: ${strength.replace('-', ' ')}`;
  }
  
  return `Password needs: ${missing.join(', ')}`;
};
