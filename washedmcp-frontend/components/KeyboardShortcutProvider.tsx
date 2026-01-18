'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useKeyboardShortcut, type KeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { ShortcutsModal } from './ShortcutsModal';

/**
 * Keyboard shortcut context
 */
interface KeyboardShortcutContextValue {
  /**
   * Register a global shortcut
   */
  registerShortcut: (shortcut: KeyboardShortcut) => void;

  /**
   * Unregister a global shortcut
   */
  unregisterShortcut: (keys: string) => void;

  /**
   * Get all registered shortcuts
   */
  shortcuts: KeyboardShortcut[];

  /**
   * Show shortcuts help modal
   */
  showShortcuts: () => void;

  /**
   * Hide shortcuts help modal
   */
  hideShortcuts: () => void;

  /**
   * Toggle shortcuts help modal
   */
  toggleShortcuts: () => void;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue | null>(null);

/**
 * Keyboard Shortcut Provider Props
 */
export interface KeyboardShortcutProviderProps {
  children: ReactNode;

  /**
   * Global shortcuts to register
   */
  shortcuts?: KeyboardShortcut[];
}

/**
 * Keyboard Shortcut Provider Component
 * Manages global keyboard shortcuts and help modal
 *
 * @example
 * ```tsx
 * <KeyboardShortcutProvider shortcuts={[
 *   { keys: 'Cmd+K', callback: openSearch, description: 'Open search' },
 * ]}>
 *   <App />
 * </KeyboardShortcutProvider>
 * ```
 */
export function KeyboardShortcutProvider({
  children,
  shortcuts: initialShortcuts = [],
}: KeyboardShortcutProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(initialShortcuts);
  const [showModal, setShowModal] = useState(false);

  // Register shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      // Remove existing shortcut with same keys
      const filtered = prev.filter((s) => s.keys !== shortcut.keys);
      return [...filtered, shortcut];
    });
  }, []);

  // Unregister shortcut
  const unregisterShortcut = useCallback((keys: string) => {
    setShortcuts((prev) => prev.filter((s) => s.keys !== keys));
  }, []);

  // Show/hide shortcuts modal
  const showShortcuts = useCallback(() => setShowModal(true), []);
  const hideShortcuts = useCallback(() => setShowModal(false), []);
  const toggleShortcuts = useCallback(() => setShowModal((prev) => !prev), []);

  // Register help shortcut (Cmd+/)
  useKeyboardShortcut({
    keys: 'Cmd+/',
    callback: toggleShortcuts,
    description: 'Show keyboard shortcuts',
    category: 'Help',
  });

  // Register all global shortcuts
  useKeyboardShortcut(shortcuts);

  return (
    <KeyboardShortcutContext.Provider
      value={{
        registerShortcut,
        unregisterShortcut,
        shortcuts,
        showShortcuts,
        hideShortcuts,
        toggleShortcuts,
      }}
    >
      {children}
      <ShortcutsModal
        isOpen={showModal}
        onClose={hideShortcuts}
        shortcuts={shortcuts}
      />
    </KeyboardShortcutContext.Provider>
  );
}

/**
 * Hook to access keyboard shortcut context
 *
 * @example
 * ```tsx
 * const { registerShortcut, showShortcuts } = useKeyboardShortcuts();
 *
 * useEffect(() => {
 *   registerShortcut({
 *     keys: 'Cmd+S',
 *     callback: save,
 *     description: 'Save',
 *   });
 * }, [registerShortcut]);
 * ```
 */
export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error(
      'useKeyboardShortcuts must be used within KeyboardShortcutProvider'
    );
  }
  return context;
}
