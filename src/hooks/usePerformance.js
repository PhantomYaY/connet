import { useEffect, useRef, useCallback, useMemo } from 'react';

// Hook for debouncing values to improve performance
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling function calls
export const useThrottle = (callback, delay) => {
  const lastCall = useRef(0);
  
  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }
  }, [callback, delay]);
};

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [ref, isIntersecting];
};

// Hook for virtual scrolling
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    ...visibleItems,
    handleScroll,
  };
};

// Hook for prefetching resources
export const usePrefetch = (urls) => {
  useEffect(() => {
    const links = urls.map(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
      return link;
    });

    return () => {
      links.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [urls]);
};

// Hook for memory-efficient event listeners
export const useEventListener = (eventName, handler, element = window) => {
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = (event) => savedHandler.current(event);
    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
};

// Hook for measuring component performance
export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(Date.now());
  const mountTime = useRef(null);

  useEffect(() => {
    mountTime.current = Date.now();
    const mountDuration = mountTime.current - renderStartTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${componentName} mounted in ${mountDuration}ms`);
    }

    return () => {
      const unmountTime = Date.now();
      const lifetimeDuration = unmountTime - mountTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${componentName} lifetime: ${lifetimeDuration}ms`);
      }
    };
  }, [componentName]);

  useEffect(() => {
    const renderEndTime = Date.now();
    const renderDuration = renderEndTime - renderStartTime.current;
    
    if (process.env.NODE_ENV === 'development' && renderDuration > 16) {
      console.warn(`⚠️ ${componentName} render took ${renderDuration}ms (>16ms)`);
    }
    
    renderStartTime.current = Date.now();
  });
};

// Hook for optimizing re-renders
export const useStableCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

// Hook for memoizing expensive calculations
export const useExpensiveCalculation = (calculate, deps) => {
  return useMemo(() => {
    const start = performance.now();
    const result = calculate();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development' && (end - start) > 5) {
      console.warn(`⚠️ Expensive calculation took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }, deps);
};

// Hook for idle callback optimization
export const useIdleCallback = (callback, options = {}) => {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(callback, options);
      return () => cancelIdleCallback(id);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      const id = setTimeout(callback, 1);
      return () => clearTimeout(id);
    }
  }, [callback, options]);
};

// Hook for batching state updates
export const useBatchedState = (initialState) => {
  const [state, setState] = useState(initialState);
  const batchedUpdates = useRef([]);
  const timeoutRef = useRef(null);

  const batchedSetState = useCallback((update) => {
    batchedUpdates.current.push(update);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(currentState => {
        let newState = currentState;
        batchedUpdates.current.forEach(update => {
          newState = typeof update === 'function' ? update(newState) : update;
        });
        batchedUpdates.current = [];
        return newState;
      });
    }, 0);
  }, []);

  return [state, batchedSetState];
};
