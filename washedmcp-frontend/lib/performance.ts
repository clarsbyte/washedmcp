/**
 * Performance Monitoring Utilities
 * Tools for tracking and reporting application performance metrics
 */

/**
 * Performance metric types
 */
export type PerformanceMetricType =
  | 'navigation'
  | 'resource'
  | 'measure'
  | 'paint'
  | 'layout-shift'
  | 'first-input'
  | 'largest-contentful-paint';

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

/**
 * Web Vitals thresholds
 */
const WEB_VITALS_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint
};

/**
 * Rate performance metric
 */
function rateMetric(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];

  if (!thresholds) return 'good';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Performance Observer Manager
 */
class PerformanceObserverManager {
  private observers: Map<string, PerformanceObserver> = new Map();
  private metrics: Map<string, PerformanceMetric> = new Map();
  private callbacks: Set<(metric: PerformanceMetric) => void> = new Set();

  /**
   * Start observing performance entries
   */
  observe(
    type: 'navigation' | 'resource' | 'mark' | 'measure' | 'paint' | 'layout-shift' | 'first-input' | 'largest-contentful-paint',
    callback?: (metric: PerformanceMetric) => void
  ) {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    if (callback) {
      this.callbacks.add(callback);
    }

    // Avoid duplicate observers
    if (this.observers.has(type)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processEntry(entry);
        }
      });

      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  /**
   * Process performance entry
   */
  private processEntry(entry: PerformanceEntry) {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration || (entry as PerformanceEntry & { value?: number }).value || 0,
      rating: 'good',
    };

    // Special handling for web vitals
    if (entry.entryType === 'largest-contentful-paint') {
      metric.name = 'LCP';
      metric.value = entry.startTime;
      metric.rating = rateMetric('LCP', metric.value);
    } else if (entry.entryType === 'first-input') {
      metric.name = 'FID';
      metric.value = (entry as PerformanceEventTiming).processingStart - entry.startTime;
      metric.rating = rateMetric('FID', metric.value);
    } else if (
      entry.entryType === 'layout-shift' &&
      !(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput
    ) {
      const currentCLS = this.metrics.get('CLS');
      metric.name = 'CLS';
      metric.value =
        (currentCLS?.value || 0) + (entry as PerformanceEntry & { value?: number }).value;
      metric.rating = rateMetric('CLS', metric.value);
    } else if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
      metric.name = 'FCP';
      metric.value = entry.startTime;
      metric.rating = rateMetric('FCP', metric.value);
    }

    // Store metric
    this.metrics.set(metric.name, metric);

    // Notify callbacks
    this.callbacks.forEach((cb) => cb(metric));
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Clear all observers and metrics
   */
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
    this.callbacks.clear();
  }
}

// Singleton instance
let performanceManager: PerformanceObserverManager | null = null;

/**
 * Get performance manager instance
 */
export function getPerformanceManager(): PerformanceObserverManager {
  if (!performanceManager) {
    performanceManager = new PerformanceObserverManager();
  }
  return performanceManager;
}

/**
 * Track navigation timing
 */
export function getNavigationTiming(): Record<string, number> | null {
  if (typeof window === 'undefined' || !window.performance?.timing) {
    return null;
  }

  const timing = window.performance.timing;
  const navigationStart = timing.navigationStart;

  return {
    // Network
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    tcp: timing.connectEnd - timing.connectStart,
    request: timing.responseStart - timing.requestStart,
    response: timing.responseEnd - timing.responseStart,

    // Processing
    domLoading: timing.domLoading - navigationStart,
    domInteractive: timing.domInteractive - navigationStart,
    domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
    domComplete: timing.domComplete - navigationStart,

    // Load
    loadEventStart: timing.loadEventStart - navigationStart,
    loadEventEnd: timing.loadEventEnd - navigationStart,

    // Total
    total: timing.loadEventEnd - navigationStart,
  };
}

/**
 * Measure function execution time
 */
export function measure<T>(
  name: string,
  fn: () => T
): { result: T; duration: number } {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  if (typeof performance === 'undefined') {
    const result = fn();
    return { result, duration: 0 };
  }

  performance.mark(startMark);
  const result = fn();
  performance.mark(endMark);

  const measure = performance.measure(name, startMark, endMark);
  const duration = measure.duration;

  // Clean up marks and measures
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(name);

  return { result, duration };
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  if (typeof performance === 'undefined') {
    const result = await fn();
    return { result, duration: 0 };
  }

  performance.mark(startMark);
  const result = await fn();
  performance.mark(endMark);

  const measure = performance.measure(name, startMark, endMark);
  const duration = measure.duration;

  // Clean up
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(name);

  return { result, duration };
}

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  const perf = performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (typeof window === 'undefined' || !perf.memory) {
    return null;
  }

  const memory = perf.memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Report performance metrics to console (development only)
 */
export function reportPerformance() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const manager = getPerformanceManager();
  const metrics = manager.getMetrics();
  const navigationTiming = getNavigationTiming();
  const memoryUsage = getMemoryUsage();

  console.group('🔍 Performance Report');

  // Web Vitals
  if (metrics.length > 0) {
    console.group('Web Vitals');
    metrics.forEach((metric) => {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
    });
    console.groupEnd();
  }

  // Navigation Timing
  if (navigationTiming) {
    console.group('Navigation Timing');
    Object.entries(navigationTiming).forEach(([key, value]) => {
      console.log(`${key}: ${value.toFixed(2)}ms`);
    });
    console.groupEnd();
  }

  // Memory Usage
  if (memoryUsage) {
    console.group('Memory Usage');
    console.log(`Used: ${formatBytes(memoryUsage.usedJSHeapSize)}`);
    console.log(`Total: ${formatBytes(memoryUsage.totalJSHeapSize)}`);
    console.log(`Limit: ${formatBytes(memoryUsage.jsHeapSizeLimit)}`);
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Start observing all web vitals
 */
export function observeWebVitals(callback?: (metric: PerformanceMetric) => void) {
  const manager = getPerformanceManager();

  // Observe different entry types
  manager.observe('largest-contentful-paint', callback);
  manager.observe('first-input', callback);
  manager.observe('layout-shift', callback);
  manager.observe('paint', callback);
  manager.observe('navigation', callback);
}

/**
 * FPS Monitor
 */
export class FPSMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private rafId: number | null = null;
  private callback?: (fps: number) => void;

  /**
   * Start monitoring FPS
   */
  start(callback?: (fps: number) => void) {
    this.callback = callback;
    this.tick();
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    if (this.frames.length === 0) return 0;

    const sum = this.frames.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frames.length);
  }

  /**
   * Tick
   */
  private tick = () => {
    const now = performance.now();
    const delta = now - this.lastTime;
    const fps = 1000 / delta;

    this.frames.push(fps);
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    this.lastTime = now;

    if (this.callback) {
      this.callback(this.getFPS());
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
