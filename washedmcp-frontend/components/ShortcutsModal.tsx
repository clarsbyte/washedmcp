'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { type KeyboardShortcut, formatShortcut } from '@/hooks/useKeyboardShortcut';
import { useKeyPress } from '@/hooks/useKeyboardShortcut';

/**
 * Props for ShortcutsModal component
 */
export interface ShortcutsModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Shortcuts to display
   */
  shortcuts: KeyboardShortcut[];
}

/**
 * Shortcuts Modal Component
 * Displays all available keyboard shortcuts grouped by category
 *
 * @example
 * ```tsx
 * <ShortcutsModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   shortcuts={shortcuts}
 * />
 * ```
 */
export function ShortcutsModal({ isOpen, onClose, shortcuts }: ShortcutsModalProps) {
  // Close on Escape key
  useKeyPress('Escape', onClose, { preventDefault: false });

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  // Sort categories (prioritize specific ones)
  const categoryOrder = ['Navigation', 'Actions', 'General', 'Help'];
  const sortedCategories = Object.keys(groupedShortcuts).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-(--color-text-primary)/20 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              className="bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-modal] max-w-3xl w-full max-h-[80vh] overflow-hidden pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-(--color-border)">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[6px] bg-(--color-primary)/10 flex items-center justify-center">
                    <Keyboard className="text-(--color-primary)" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-(--color-text-primary)">
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-sm text-(--color-text-secondary)">
                      Boost your productivity with these shortcuts
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-(--color-background) transition-colors duration-200"
                  aria-label="Close"
                >
                  <X size={20} className="text-(--color-text-secondary)" />
                </motion.button>
              </div>

              {/* Shortcuts list */}
              <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-6">
                {sortedCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <Keyboard
                      size={48}
                      className="text-(--color-text-tertiary) mx-auto mb-3"
                    />
                    <p className="text-(--color-text-secondary)">
                      No keyboard shortcuts registered
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedCategories.map((category, categoryIndex) => (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: categoryIndex * 0.05,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        {/* Category title */}
                        <h3 className="text-sm font-semibold text-(--color-text-primary) mb-3 uppercase tracking-wide">
                          {category}
                        </h3>

                        {/* Shortcuts in category */}
                        <div className="space-y-2">
                          {groupedShortcuts[category].map((shortcut, index) => (
                            <motion.div
                              key={`${shortcut.keys}-${index}`}
                              className="flex items-center justify-between py-2 px-3 rounded-[6px] hover:bg-(--color-background) transition-colors duration-200"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.2,
                                delay: categoryIndex * 0.05 + index * 0.02,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                            >
                              {/* Description */}
                              <span className="text-sm text-(--color-text-secondary)">
                                {shortcut.description || shortcut.keys}
                              </span>

                              {/* Keyboard shortcut display */}
                              <div className="flex items-center gap-1">
                                {formatShortcut(shortcut.keys)
                                  .split('+')
                                  .map((key, i, arr) => (
                                    <span key={i} className="flex items-center gap-1">
                                      <kbd className="px-2 py-1 text-xs font-mono bg-(--color-background) border border-(--color-border) rounded-[4px] text-(--color-text-primary) shadow-sm min-w-[24px] text-center">
                                        {key}
                                      </kbd>
                                      {i < arr.length - 1 && (
                                        <span className="text-(--color-text-tertiary) text-xs">
                                          +
                                        </span>
                                      )}
                                    </span>
                                  ))}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-(--color-border) bg-(--color-background)">
                <p className="text-xs text-(--color-text-tertiary) text-center">
                  Press <kbd className="px-2 py-0.5 text-xs font-mono bg-(--color-surface) border border-(--color-border) rounded-[4px]">Esc</kbd> or{' '}
                  <kbd className="px-2 py-0.5 text-xs font-mono bg-(--color-surface) border border-(--color-border) rounded-[4px]">{formatShortcut('Cmd+/')}</kbd>{' '}
                  to close
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
