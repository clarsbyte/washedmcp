'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design using media queries
 * SSR-safe and automatically updates on window resize
 *
 * @param query - Media query string (e.g., "(min-width: 768px)")
 * @returns Boolean indicating if the media query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1280px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener (modern approach)
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks for common screen sizes
 * Based on Tailwind CSS default breakpoints
 */

/**
 * Hook to detect if viewport is mobile (< 768px)
 * @returns True if viewport width is less than 768px
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect if viewport is tablet (768px - 1023px)
 * @returns True if viewport width is between 768px and 1023px
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook to detect if viewport is desktop (>= 1024px)
 * @returns True if viewport width is 1024px or greater
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook to detect if viewport meets minimum width for dashboard (>= 1280px)
 * @returns True if viewport width is 1280px or greater
 */
export function useIsDesktopWide(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

/**
 * Hook to detect user's preferred color scheme
 * @returns 'light' | 'dark' | undefined
 */
export function usePreferredColorScheme(): 'light' | 'dark' | undefined {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersLight = useMediaQuery('(prefers-color-scheme: light)');

  if (prefersDark) return 'dark';
  if (prefersLight) return 'light';
  return undefined;
}

/**
 * Hook to detect if user prefers reduced motion
 * @returns True if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to get current breakpoint name
 * @returns 'mobile' | 'tablet' | 'desktop' | 'desktopWide'
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'desktopWide' {
  const isDesktopWide = useIsDesktopWide();
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();

  if (isDesktopWide) return 'desktopWide';
  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
}
