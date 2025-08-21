// UX Enhancement Utilities

// Haptic feedback for mobile devices
export const hapticFeedback = (type = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [50],
      heavy: [100],
      success: [50, 50, 100],
      error: [100, 50, 100, 50, 100]
    };
    navigator.vibrate(patterns[type] || patterns.light);
  }
};

// Smooth loading state management
export const withLoadingState = (asyncFunction, setLoading) => {
  return async (...args) => {
    setLoading(true);
    try {
      const result = await asyncFunction(...args);
      return result;
    } finally {
      // Add minimum loading time for better UX
      setTimeout(() => setLoading(false), 300);
    }
  };
};

// Enhanced click handling with feedback
export const enhancedClick = (onClick, options = {}) => {
  const { 
    haptic = true, 
    preventDefault = true,
    stopPropagation = true,
    minDelay = 100
  } = options;

  return async (e) => {
    if (preventDefault) e.preventDefault();
    if (stopPropagation) e.stopPropagation();
    
    // Add visual feedback
    e.target.style.transform = 'scale(0.98)';
    
    if (haptic) {
      hapticFeedback('light');
    }

    // Minimum delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, minDelay));
    
    // Reset visual state
    e.target.style.transform = '';
    
    if (onClick) {
      return onClick(e);
    }
  };
};

// Optimistic UI update helper
export const optimisticUpdate = (setState, id, updateFn, revertFn) => {
  // Apply optimistic update
  setState(prev => updateFn(prev, id));

  return {
    revert: () => setState(prev => revertFn(prev, id)),
    confirm: () => {/* Update confirmed, no action needed */}
  };
};

// Smart retry mechanism
export const smartRetry = async (fn, options = {}) => {
  const { 
    maxAttempts = 3, 
    delay = 1000, 
    backoff = 2,
    onRetry = () => {}
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }

      const waitTime = delay * Math.pow(backoff, attempt - 1);
      onRetry(attempt, waitTime, error);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
};

// Progressive enhancement for features
export const progressiveEnhancement = (feature, fallback = () => {}) => {
  try {
    if (typeof feature === 'function') {
      return feature();
    }
    return feature;
  } catch (error) {
    console.warn('Progressive enhancement fallback:', error);
    return fallback();
  }
};

// Intersection observer for lazy loading
export const createLazyLoader = (callback, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
        observer.unobserve(entry.target);
      }
    });
  }, { ...defaultOptions, ...options });

  return {
    observe: (element) => observer.observe(element),
    unobserve: (element) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  };
};

// Smart form validation
export const createValidator = (rules) => {
  return (values) => {
    const errors = {};

    Object.keys(rules).forEach(field => {
      const value = values[field];
      const fieldRules = rules[field];

      for (const rule of fieldRules) {
        const error = rule(value, values);
        if (error) {
          errors[field] = error;
          break; // Stop at first error
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required') => 
    (value) => !value || value.trim() === '' ? message : null,
    
  minLength: (min, message) => 
    (value) => value && value.length < min ? message || `Minimum ${min} characters` : null,
    
  maxLength: (max, message) => 
    (value) => value && value.length > max ? message || `Maximum ${max} characters` : null,
    
  email: (message = 'Please enter a valid email') => 
    (value) => value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : null,
    
  url: (message = 'Please enter a valid URL') => 
    (value) => value && !/^https?:\/\/.+/.test(value) ? message : null
};

// Smooth state transitions
export const createStateMachine = (initialState, transitions) => {
  let currentState = initialState;
  const listeners = new Set();

  return {
    getState: () => currentState,
    
    transition: (action, payload) => {
      const transition = transitions[currentState]?.[action];
      if (transition) {
        const newState = typeof transition === 'function' 
          ? transition(payload) 
          : transition;
        
        if (newState !== currentState) {
          const previousState = currentState;
          currentState = newState;
          
          listeners.forEach(listener => 
            listener(newState, previousState, action, payload)
          );
        }
      }
    },
    
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

export default {
  hapticFeedback,
  withLoadingState,
  enhancedClick,
  optimisticUpdate,
  smartRetry,
  progressiveEnhancement,
  createLazyLoader,
  createValidator,
  validationRules,
  createStateMachine
};
