'use client';

/* eslint-disable react-hooks/purity, react-hooks/refs, react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getPerformanceManager,
  observeWebVitals,
  getMemoryUsage,
  getNavigationTiming,
  FPSMonitor,
  type PerformanceMetric,
} from '@/lib/performance';

/**
 * Custom hook for monitoring web vitals
 * Automatically tracks Core Web Vitals (LCP, FID, CLS, FCP)
 *
 * @example
 * ```tsx
 * const { metrics, getMetric } = useWebVitals();
 *
 * const lcp = getMetric('LCP');
 * console.log(`LCP: ${lcp?.value}ms (${lcp?.rating})`);
 * ```
 */
export function useWebVitals(onMetric?: (metric: PerformanceMetric) => void) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const manager = getPerformanceManager();

  useEffect(() => {
    const handleMetric = (metric: PerformanceMetric) => {
      setMetrics((prev) => {
        const filtered = prev.filter((m) => m.name !== metric.name);
        return [...filtered, metric];
      });

      if (onMetric) {
        onMetric(metric);
      }
    };

    observeWebVitals(handleMetric);

    return () => {
      manager.disconnect();
    };
  }, [manager, onMetric]);

  const getMetric = useCallback(
    (name: string) => {
      return metrics.find((m) => m.name === name);
    },
    [metrics]
  );

  return {
    metrics,
    getMetric,
  };
}

/**
 * Custom hook for monitoring FPS
 * Tracks frames per second in real-time
 *
 * @example
 * ```tsx
 * const { fps, isMonitoring, startMonitoring, stopMonitoring } = useFPS();
 *
 * useEffect(() => {
 *   startMonitoring();
 *   return stopMonitoring;
 * }, []);
 *
 * console.log(`Current FPS: ${fps}`);
 * ```
 */
export function useFPS(autoStart = false) {
  const [fps, setFps] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitorRef = useRef<FPSMonitor | null>(null);

  const startMonitoring = useCallback(() => {
    if (monitorRef.current) return;

    monitorRef.current = new FPSMonitor();
    monitorRef.current.start((currentFps) => {
      setFps(currentFps);
    });
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.stop();
      monitorRef.current = null;
      setIsMonitoring(false);
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    return stopMonitoring;
  }, [autoStart, startMonitoring, stopMonitoring]);

  return {
    fps,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
}

/**
 * Custom hook for monitoring memory usage
 * Tracks JavaScript heap size (if available)
 *
 * @example
 * ```tsx
 * const { memoryUsage, refresh } = useMemoryUsage({
 *   interval: 5000, // Update every 5 seconds
 * });
 *
 * if (memoryUsage) {
 *   console.log(`Used: ${memoryUsage.usedJSHeapSize / 1048576}MB`);
 * }
 * ```
 */
export function useMemoryUsage(options: { interval?: number } = {}) {
  const { interval = 10000 } = options;
  const [memoryUsage, setMemoryUsage] = useState(() => getMemoryUsage());

  const refresh = useCallback(() => {
    setMemoryUsage(getMemoryUsage());
  }, []);

  useEffect(() => {
    if (!memoryUsage) return; // Browser doesn't support memory API

    const intervalId = setInterval(refresh, interval);
    return () => clearInterval(intervalId);
  }, [interval, refresh, memoryUsage]);

  return {
    memoryUsage,
    refresh,
  };
}

/**
 * Custom hook for tracking navigation timing
 * Provides detailed timing information about page load
 *
 * @example
 * ```tsx
 * const navigationTiming = useNavigationTiming();
 *
 * if (navigationTiming) {
 *   console.log(`DNS: ${navigationTiming.dns}ms`);
 *   console.log(`TCP: ${navigationTiming.tcp}ms`);
 *   console.log(`Total: ${navigationTiming.total}ms`);
 * }
 * ```
 */
export function useNavigationTiming() {
  const [timing, setTiming] = useState<ReturnType<typeof getNavigationTiming>>(null);

  useEffect(() => {
    // Wait for page load to get accurate timing
    if (document.readyState === 'complete') {
      setTiming(getNavigationTiming());
    } else {
      const handleLoad = () => {
        setTiming(getNavigationTiming());
      };
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return timing;
}

/**
 * Custom hook for tracking component render count
 * Useful for debugging unnecessary re-renders
 *
 * @example
 * ```tsx
 * function MyComponent({ value }) {
 *   const renderCount = useRenderCount('MyComponent');
 *
 *   useEffect(() => {
 *     console.log(`MyComponent rendered ${renderCount} times`);
 *   }, [renderCount]);
 *
 *   return <div>{value}</div>;
 * }
 * ```
 */
export function useRenderCount(componentName?: string) {
  const renderCount = useRef(0);

  renderCount.current += 1;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && componentName) {
      console.log(`[Render Count] ${componentName}: ${renderCount.current}`);
    }
  });

  return renderCount.current;
}

/**
 * Custom hook for tracking component render time
 * Measures how long a component takes to render
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const renderTime = useRenderTime('MyComponent');
 *
 *   useEffect(() => {
 *     if (renderTime) {
 *       console.log(`Render time: ${renderTime}ms`);
 *     }
 *   }, [renderTime]);
 *
 *   return <div>Content</div>;
 * }
 * ```
 */
export function useRenderTime(componentName?: string) {
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    setRenderTime(duration);

    if (process.env.NODE_ENV === 'development' && componentName) {
      console.log(`[Render Time] ${componentName}: ${duration.toFixed(2)}ms`);
    }

    // Reset for next render
    startTimeRef.current = performance.now();
  }, [componentName]);

  return renderTime;
}

/**
 * Custom hook for tracking slow renders
 * Warns when a component takes too long to render
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useSlowRenderDetection('MyComponent', {
 *     threshold: 16, // Warn if render takes > 16ms (1 frame at 60fps)
 *     onSlowRender: (duration) => {
 *       console.warn(`Slow render detected: ${duration}ms`);
 *     },
 *   });
 *
 *   return <div>Content</div>;
 * }
 * ```
 */
export function useSlowRenderDetection(
  componentName: string,
  options: {
    threshold?: number;
    onSlowRender?: (duration: number) => void;
  } = {}
) {
  const { threshold = 16, onSlowRender } = options;
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;

    if (duration > threshold) {
      console.warn(
        `[Slow Render] ${componentName} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
      );

      if (onSlowRender) {
        onSlowRender(duration);
      }
    }

    startTimeRef.current = performance.now();
  });
}

/**
 * Custom hook for monitoring overall performance
 * Combines web vitals, memory, and FPS monitoring
 *
 * @example
 * ```tsx
 * const performance = usePerformanceMonitor({
 *   trackWebVitals: true,
 *   trackMemory: true,
 *   trackFPS: true,
 * });
 *
 * console.log('Performance:', performance);
 * ```
 */
export function usePerformanceMonitor(options: {
  trackWebVitals?: boolean;
  trackMemory?: boolean;
  trackFPS?: boolean;
  memoryInterval?: number;
} = {}) {
  const {
    trackWebVitals = true,
    trackMemory = true,
    trackFPS = false,
    memoryInterval = 10000,
  } = options;

  const { metrics } = useWebVitals(trackWebVitals ? undefined : () => {});
  const { memoryUsage } = useMemoryUsage(
    trackMemory ? { interval: memoryInterval } : { interval: 0 }
  );
  const { fps, startMonitoring, stopMonitoring } = useFPS(trackFPS);
  const navigationTiming = useNavigationTiming();

  useEffect(() => {
    if (trackFPS) {
      startMonitoring();
      return stopMonitoring;
    }
  }, [trackFPS, startMonitoring, stopMonitoring]);

  return {
    webVitals: metrics,
    memoryUsage,
    fps,
    navigationTiming,
  };
}
