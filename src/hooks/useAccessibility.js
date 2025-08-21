import { useEffect, useCallback, useState } from 'react';

export const useAccessibility = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    
    const handleMotionChange = (e) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e) => setHighContrast(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Focus management
  const trapFocus = useCallback((element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => element.removeEventListener('keydown', handleTabKey);
  }, []);

  // Announce to screen readers
  const announce = useCallback((message, priority = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('class', 'sr-only');
    announcer.textContent = message;

    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  // Enhanced focus management
  const manageFocus = useCallback(() => {
    let hadKeyboardEvent = false;
    let keyboardThrottleTimeoutID = 0;

    const pointerEvent = () => {
      setFocusVisible(false);
    };

    const keyboardEvent = () => {
      hadKeyboardEvent = true;
    };

    const focusEvent = () => {
      if (hadKeyboardEvent) {
        setFocusVisible(true);
      }
    };

    const blurEvent = () => {
      setFocusVisible(false);
    };

    const visibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hadKeyboardEvent = true;
      }
    };

    const throttledKeyboardEvent = () => {
      clearTimeout(keyboardThrottleTimeoutID);
      keyboardThrottleTimeoutID = setTimeout(() => {
        hadKeyboardEvent = false;
      }, 100);
    };

    document.addEventListener('mousedown', pointerEvent);
    document.addEventListener('pointerdown', pointerEvent);
    document.addEventListener('keydown', keyboardEvent);
    document.addEventListener('keydown', throttledKeyboardEvent);
    document.addEventListener('focusin', focusEvent);
    document.addEventListener('focusout', blurEvent);
    document.addEventListener('visibilitychange', visibilityChange);

    return () => {
      document.removeEventListener('mousedown', pointerEvent);
      document.removeEventListener('pointerdown', pointerEvent);
      document.removeEventListener('keydown', keyboardEvent);
      document.removeEventListener('keydown', throttledKeyboardEvent);
      document.removeEventListener('focusin', focusEvent);
      document.removeEventListener('focusout', blurEvent);
      document.removeEventListener('visibilitychange', visibilityChange);
    };
  }, []);

  useEffect(() => {
    const cleanup = manageFocus();
    return cleanup;
  }, [manageFocus]);

  return {
    reducedMotion,
    highContrast,
    focusVisible,
    trapFocus,
    announce
  };
};

export const useKeyboardNavigation = (items, onSelect) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (selectedIndex >= 0 && items[selectedIndex]) {
            onSelect(items[selectedIndex], selectedIndex);
          }
          break;
        case 'Escape':
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect]);

  return { selectedIndex, setSelectedIndex };
};

export default useAccessibility;
