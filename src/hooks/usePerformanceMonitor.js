import { useEffect, useCallback, useState } from 'react';

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0
  });

  // FPS Monitor
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(performance.now());

  const measureFPS = useCallback(() => {
    const now = performance.now();
    setFrameCount(prev => prev + 1);

    if (now - lastTime >= 1000) {
      setFps(Math.round((frameCount * 1000) / (now - lastTime)));
      setFrameCount(0);
      setLastTime(now);
    }

    requestAnimationFrame(measureFPS);
  }, [frameCount, lastTime]);

  useEffect(() => {
    const animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, [measureFPS]);

  // Memory Usage Monitor
  useEffect(() => {
    const updateMemoryUsage = () => {
      if (performance.memory) {
        const memoryUsage = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load Time Monitor
  useEffect(() => {
    const updateLoadTime = () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    if (document.readyState === 'complete') {
      updateLoadTime();
    } else {
      window.addEventListener('load', updateLoadTime);
      return () => window.removeEventListener('load', updateLoadTime);
    }
  }, []);

  // Render Time Monitor
  const measureRenderTime = useCallback((componentName, renderFunction) => {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    
    if (renderTime > 16) { // 60fps threshold
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    return result;
  }, []);

  // Long Task Detection
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      return () => observer.disconnect();
    }
  }, []);

  // Resource Loading Monitor
  const monitorResource = useCallback((resourceName, loadFunction) => {
    const startTime = performance.now();
    
    return loadFunction().finally(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`${resourceName} loaded in ${duration.toFixed(2)}ms`);
      
      if (duration > 1000) {
        console.warn(`Slow resource loading: ${resourceName} took ${duration.toFixed(2)}ms`);
      }
    });
  }, []);

  // Bundle Size Analysis
  const analyzeBundleSize = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const jsResources = entries.filter(entry => 
          entry.name.includes('.js') && entry.transferSize
        );
        
        const totalSize = jsResources.reduce((sum, entry) => sum + entry.transferSize, 0);
        console.log(`Total JS bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
        
        jsResources.forEach(entry => {
          const sizeKB = (entry.transferSize / 1024).toFixed(2);
          if (entry.transferSize > 100 * 1024) { // 100KB threshold
            console.warn(`Large JS file: ${entry.name} (${sizeKB} KB)`);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    const cleanup = analyzeBundleSize();
    return cleanup;
  }, [analyzeBundleSize]);

  return {
    metrics: { ...metrics, fps },
    measureRenderTime,
    monitorResource
  };
};

export const useImageOptimization = () => {
  const [imageCache, setImageCache] = useState(new Map());

  const preloadImage = useCallback((src) => {
    if (imageCache.has(src)) {
      return Promise.resolve(imageCache.get(src));
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setImageCache(prev => new Map(prev).set(src, img));
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }, [imageCache]);

  const lazyLoadImage = useCallback((imgElement, src, placeholder) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = src;
            img.onload = () => {
              img.classList.add('loaded');
              observer.unobserve(img);
            };
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgElement) {
      imgElement.src = placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';
      observer.observe(imgElement);
    }

    return () => observer.disconnect();
  }, []);

  return { preloadImage, lazyLoadImage, imageCache };
};

export default usePerformanceMonitor;
