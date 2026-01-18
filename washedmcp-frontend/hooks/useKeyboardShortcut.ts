'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /**
   * Key combination (e.g., 'Ctrl+K', 'Cmd+Shift+P', 'Escape')
   */
  keys: string;

  /**
   * Callback function to execute when shortcut is triggered
   */
  callback: (event: KeyboardEvent) => void;

  /**
   * Description of what the shortcut does (for help menu)
   */
  description?: string;

  /**
   * Category for grouping shortcuts (e.g., 'Navigation', 'Actions')
   */
  category?: string;

  /**
   * Whether to prevent default browser behavior
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Whether to stop event propagation
   * @default true
   */
  stopPropagation?: boolean;

  /**
   * Enable shortcut only when specific element is focused
   */
  element?: HTMLElement | null;

  /**
   * Disable shortcut when typing in input fields
   * @default true
   */
  disableInInput?: boolean;
}

/**
 * Modifier key mappings
 */
const modifierKeys = {
  Cmd: 'metaKey',
  Ctrl: 'ctrlKey',
  Alt: 'altKey',
  Shift: 'shiftKey',
  Meta: 'metaKey',
  Control: 'ctrlKey',
  Option: 'altKey',
} as const;

/**
 * Parse keyboard shortcut string into components
 * @param keys - Shortcut string (e.g., 'Cmd+K', 'Ctrl+Shift+P')
 * @returns Parsed shortcut components
 */
function parseShortcut(keys: string) {
  const parts = keys.split('+').map((k) => k.trim());
  const modifiers: Partial<Record<keyof typeof modifierKeys, boolean>> = {};
  let key = '';

  parts.forEach((part) => {
    if (part in modifierKeys) {
      modifiers[part as keyof typeof modifierKeys] = true;
    } else {
      key = part.toLowerCase();
    }
  });

  return { modifiers, key };
}

/**
 * Check if keyboard event matches shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: ReturnType<typeof parseShortcut>): boolean {
  const { modifiers, key } = shortcut;

  // Check if key matches
  const keyMatches = event.key.toLowerCase() === key;
  if (!keyMatches) return false;

  // Check if all required modifiers are pressed
  for (const [mod, required] of Object.entries(modifiers)) {
    if (required) {
      const modKey = modifierKeys[mod as keyof typeof modifierKeys];
      if (!event[modKey as keyof KeyboardEvent]) {
        return false;
      }
    }
  }

  // Check if any unrequired modifiers are pressed
  const requiredModifiers = Object.keys(modifiers);
  for (const [mod, eventKey] of Object.entries(modifierKeys)) {
    if (!requiredModifiers.includes(mod) && event[eventKey as keyof KeyboardEvent]) {
      return false;
    }
  }

  return true;
}

/**
 * Check if element is an input field
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = element.getAttribute('contenteditable') === 'true';

  return isInput || isContentEditable;
}

/**
 * Custom hook for registering keyboard shortcuts
 * Handles modifier keys, input field detection, and cleanup
 *
 * @example
 * ```tsx
 * // Simple shortcut
 * useKeyboardShortcut({
 *   keys: 'Cmd+K',
 *   callback: () => openSearch(),
 *   description: 'Open search',
 * });
 *
 * // Multiple shortcuts
 * useKeyboardShortcut([
 *   { keys: 'Cmd+S', callback: save, description: 'Save' },
 *   { keys: 'Cmd+N', callback: createNew, description: 'New item' },
 * ]);
 *
 * // With options
 * useKeyboardShortcut({
 *   keys: 'Escape',
 *   callback: closeModal,
 *   disableInInput: false,
 *   preventDefault: false,
 * });
 * ```
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut | KeyboardShortcut[]
) {
  const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];
  const parsedShortcuts = useRef(
    shortcuts.map((s) => ({
      ...s,
      parsed: parseShortcut(s.keys),
    }))
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of parsedShortcuts.current) {
        const {
          parsed,
          callback,
          preventDefault = true,
          stopPropagation = true,
          element,
          disableInInput = true,
        } = shortcut;

        // Check if shortcut is scoped to specific element
        if (element && event.target !== element) {
          continue;
        }

        // Skip if typing in input field (unless explicitly allowed)
        if (disableInInput && isInputElement(event.target as Element)) {
          continue;
        }

        // Check if shortcut matches
        if (matchesShortcut(event, parsed)) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }

          callback(event);
          break; // Stop after first match
        }
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Hook for detecting single key press (without modifiers)
 * Useful for simple navigation keys like arrows, escape, etc.
 *
 * @example
 * ```tsx
 * useKeyPress('Escape', () => closeModal());
 * useKeyPress('ArrowLeft', () => previousSlide());
 * ```
 */
export function useKeyPress(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: {
    disableInInput?: boolean;
    preventDefault?: boolean;
  } = {}
) {
  const { disableInInput = true, preventDefault = true } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        // Skip if typing in input field
        if (disableInInput && isInputElement(event.target as Element)) {
          return;
        }

        if (preventDefault) {
          event.preventDefault();
        }

        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, disableInInput, preventDefault]);
}

/**
 * Get OS-specific modifier key name
 * Returns 'Cmd' on macOS, 'Ctrl' on other platforms
 */
export function getModifierKey(): 'Cmd' | 'Ctrl' {
  if (typeof window === 'undefined') return 'Ctrl';
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  return isMac ? 'Cmd' : 'Ctrl';
}

/**
 * Format shortcut string for display
 * Converts 'Cmd+K' to '⌘K' on Mac or 'Ctrl+K' on other platforms
 */
export function formatShortcut(keys: string): string {
  const mod = getModifierKey();
  const isMac = mod === 'Cmd';

  const formatted = keys
    .replace(/Cmd/g, isMac ? '⌘' : 'Ctrl')
    .replace(/Ctrl/g, isMac ? 'Ctrl' : 'Ctrl')
    .replace(/Alt/g, isMac ? '⌥' : 'Alt')
    .replace(/Shift/g, isMac ? '⇧' : 'Shift')
    .replace(/Meta/g, isMac ? '⌘' : 'Meta');

  return formatted;
}
