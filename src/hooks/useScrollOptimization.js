import { useState, useEffect, useCallback, useRef } from 'react';

export const useVirtualScroll = (items, itemHeight = 100, containerHeight = 600) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  useEffect(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return {
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight,
    offsetY: visibleRange.start * itemHeight
  };
};

export const useInfiniteScroll = (loadMore, hasMore = true, threshold = 100) => {
  const [loading, setLoading] = useState(false);
  const observerRef = useRef();

  const lastElementRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setLoading(true);
          loadMore().finally(() => setLoading(false));
        }
      },
      { rootMargin: `${threshold}px` }
    );
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore, threshold]);

  return { lastElementRef, loading };
};

export const useSmoothScroll = () => {
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const scrollToElement = useCallback((elementId, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollToPosition = useCallback((position) => {
    window.scrollTo({
      top: position,
      behavior: 'smooth'
    });
  }, []);

  return { scrollToTop, scrollToElement, scrollToPosition };
};

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      
      if (direction !== scrollDirection && Math.abs(currentScrollY - lastScrollY.current) > 10) {
        setScrollDirection(direction);
      }
      
      setScrollY(currentScrollY);
      lastScrollY.current = currentScrollY > 0 ? currentScrollY : 0;
    };

    const throttledUpdateScrollDirection = throttle(updateScrollDirection, 100);
    window.addEventListener('scroll', throttledUpdateScrollDirection);
    
    return () => window.removeEventListener('scroll', throttledUpdateScrollDirection);
  }, [scrollDirection]);

  return { scrollDirection, scrollY };
};

// Utility function for throttling
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export default useScrollOptimization;
