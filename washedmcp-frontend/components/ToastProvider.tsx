'use client';

import { Toaster } from 'sonner';

/**
 * Toast Provider Component
 * Wraps the application with Sonner's Toaster for toast notifications
 * Matches Clean design system colors and styling
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * <ToastProvider>
 *   {children}
 * </ToastProvider>
 * ```
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          padding: '16px',
          fontSize: '14px',
          fontFamily: '"Playfair Display", "SF Pro", ui-serif, Georgia, serif',
        },
        className: 'shadow-[--shadow-subtle]',
      }}
    />
  );
}
