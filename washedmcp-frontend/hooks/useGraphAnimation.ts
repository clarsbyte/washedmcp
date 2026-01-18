'use client';

import { useAnimation } from 'framer-motion';
import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * Animation state for graph transitions
 */
export interface AnimationState {
  isAnimating: boolean;
  currentAnimation: string | null;
  progress: number;
}

/**
 * Custom hook for managing graph animations
 * Provides smooth transitions, zoom controls, and animation orchestration
 *
 * @example
 * ```tsx
 * const {
 *   controls,
 *   isAnimating,
 *   fadeOut,
 *   fadeIn,
 *   zoomTransition,
 *   resetView,
 * } = useGraphAnimation();
 * ```
 */
export function useGraphAnimation() {
  const controls = useAnimation();
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    currentAnimation: null,
    progress: 0,
  });

  // Track animation abort controller
  const abortController = useRef<AbortController | null>(null);

  /**
   * Cubic bezier easing for smooth animations
   * Matches design system: [0.4, 0, 0.2, 1]
   */
  const smoothEase = useMemo(() => [0.4, 0, 0.2, 1] as const, []);

  /**
   * Set animation state
   */
  const setAnimating = useCallback((isAnimating: boolean, animationName: string | null = null) => {
    setAnimationState((prev) => ({
      ...prev,
      isAnimating,
      currentAnimation: isAnimating ? animationName : null,
    }));
  }, []);

  /**
   * Cancel current animation
   */
  const cancelAnimation = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    controls.stop();
    setAnimating(false);
  }, [controls, setAnimating]);

  /**
   * Fade out animation (400ms)
   */
  const fadeOut = useCallback(async () => {
    setAnimating(true, 'fadeOut');
    try {
      await controls.start({
        opacity: 0,
        scale: 0.95,
        transition: {
          duration: 0.4,
          ease: smoothEase,
        },
      });
    } finally {
      setAnimating(false);
    }
  }, [controls, setAnimating, smoothEase]);

  /**
   * Fade in animation (400ms)
   */
  const fadeIn = useCallback(async () => {
    setAnimating(true, 'fadeIn');
    try {
      await controls.start({
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.4,
          ease: smoothEase,
        },
      });
    } finally {
      setAnimating(false);
    }
  }, [controls, setAnimating, smoothEase]);

  /**
   * Complete zoom transition (fade out → change → fade in)
   * Total duration: 800ms (400ms + 400ms)
   *
   * @param onLayerChange - Callback executed between fade out and fade in
   */
  const zoomTransition = useCallback(
    async (onLayerChange: () => void | Promise<void>) => {
      if (animationState.isAnimating) return;

      setAnimating(true, 'zoomTransition');
      abortController.current = new AbortController();

      try {
        // 1. Fade out (400ms)
        await controls.start({
          opacity: 0,
          scale: 0.95,
          transition: {
            duration: 0.4,
            ease: smoothEase,
          },
        });

        // 2. Execute layer change
        await onLayerChange();

        // 3. Small delay for DOM update
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 4. Fade in (400ms)
        await controls.start({
          opacity: 1,
          scale: 1,
          transition: {
            duration: 0.4,
            ease: smoothEase,
          },
        });
      } catch (error) {
        console.error('Animation error:', error);
      } finally {
        setAnimating(false);
        abortController.current = null;
      }
    },
    [controls, animationState.isAnimating, setAnimating, smoothEase]
  );

  /**
   * Reset view animation with spring physics
   */
  const resetView = useCallback(async () => {
    setAnimating(true, 'reset');
    try {
      await controls.start({
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 200,
          damping: 20,
          mass: 0.5,
        },
      });
    } finally {
      setAnimating(false);
    }
  }, [controls, setAnimating]);

  /**
   * Pulse animation for highlighting
   */
  const pulse = useCallback(
    async (iterations: number = 2) => {
      setAnimating(true, 'pulse');
      try {
        for (let i = 0; i < iterations; i++) {
          await controls.start({
            scale: 1.05,
            transition: { duration: 0.2, ease: smoothEase },
          });
          await controls.start({
            scale: 1,
            transition: { duration: 0.2, ease: smoothEase },
          });
        }
      } finally {
        setAnimating(false);
      }
    },
    [controls, setAnimating, smoothEase]
  );

  /**
   * Shake animation for errors
   */
  const shake = useCallback(async () => {
    setAnimating(true, 'shake');
    try {
      await controls.start({
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.5, ease: smoothEase },
      });
    } finally {
      setAnimating(false);
    }
  }, [controls, setAnimating, smoothEase]);

  /**
   * Slide in from direction
   */
  const slideIn = useCallback(
    async (direction: 'top' | 'bottom' | 'left' | 'right' = 'bottom') => {
      const initial = {
        top: { y: -100, opacity: 0 },
        bottom: { y: 100, opacity: 0 },
        left: { x: -100, opacity: 0 },
        right: { x: 100, opacity: 0 },
      };

      setAnimating(true, 'slideIn');
      try {
        await controls.start({
          ...initial[direction],
          transition: { duration: 0 },
        });
        await controls.start({
          x: 0,
          y: 0,
          opacity: 1,
          transition: { duration: 0.5, ease: smoothEase },
        });
      } finally {
        setAnimating(false);
      }
    },
    [controls, setAnimating, smoothEase]
  );

  /**
   * Scale animation with custom parameters
   */
  const scaleAnimation = useCallback(
    async (scale: number, duration: number = 0.4) => {
      setAnimating(true, 'scale');
      try {
        await controls.start({
          scale,
          transition: { duration, ease: smoothEase },
        });
      } finally {
        setAnimating(false);
      }
    },
    [controls, setAnimating, smoothEase]
  );

  return {
    // Controls
    controls,

    // State
    isAnimating: animationState.isAnimating,
    currentAnimation: animationState.currentAnimation,
    progress: animationState.progress,

    // Core animations
    fadeOut,
    fadeIn,
    zoomTransition,
    resetView,

    // Utility animations
    pulse,
    shake,
    slideIn,
    scaleAnimation,

    // Control methods
    cancelAnimation,
    setAnimating,
  };
}
