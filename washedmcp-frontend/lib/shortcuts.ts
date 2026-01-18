/**
 * Application Keyboard Shortcuts Configuration
 * Defines all available keyboard shortcuts for the Clean application
 */

import { type KeyboardShortcut } from '@/hooks/useKeyboardShortcut';

/**
 * Global keyboard shortcuts for the Clean application
 * These shortcuts are available throughout the application
 *
 * Categories:
 * - Navigation: Moving between pages
 * - Actions: Common actions
 * - Graph: Graph-specific controls
 * - Help: Help and documentation
 */

/**
 * Navigation shortcuts
 */
export const NAVIGATION_SHORTCUTS: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    keys: 'Cmd+H',
    description: 'Go to Dashboard home',
    category: 'Navigation',
  },
  {
    keys: 'Cmd+M',
    description: 'Go to MCP Management',
    category: 'Navigation',
  },
  {
    keys: 'Cmd+C',
    description: 'Go to Context Library',
    category: 'Navigation',
  },
  {
    keys: 'Cmd+T',
    description: 'Go to Team',
    category: 'Navigation',
  },
  {
    keys: 'Cmd+,',
    description: 'Go to Settings',
    category: 'Navigation',
  },
];

/**
 * Action shortcuts
 */
export const ACTION_SHORTCUTS: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    keys: 'Cmd+K',
    description: 'Open search / command palette',
    category: 'Actions',
  },
  {
    keys: 'Cmd+N',
    description: 'Create new item',
    category: 'Actions',
  },
  {
    keys: 'Cmd+S',
    description: 'Save changes',
    category: 'Actions',
  },
  {
    keys: 'Cmd+R',
    description: 'Refresh / Reload data',
    category: 'Actions',
  },
  {
    keys: 'Cmd+/',
    description: 'Toggle sidebar',
    category: 'Actions',
  },
  {
    keys: 'Escape',
    description: 'Close modal / Cancel action',
    category: 'Actions',
  },
];

/**
 * Graph-specific shortcuts (Dashboard home)
 */
export const GRAPH_SHORTCUTS: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    keys: 'Space',
    description: 'Reset graph view',
    category: 'Graph',
  },
  {
    keys: 'Cmd+Plus',
    description: 'Zoom in',
    category: 'Graph',
  },
  {
    keys: 'Cmd+Minus',
    description: 'Zoom out',
    category: 'Graph',
  },
  {
    keys: 'Cmd+0',
    description: 'Reset zoom level',
    category: 'Graph',
  },
  {
    keys: 'Backspace',
    description: 'Go back to previous layer',
    category: 'Graph',
  },
  {
    keys: 'Enter',
    description: 'Zoom into selected node',
    category: 'Graph',
  },
];

/**
 * Context Library shortcuts
 */
export const CONTEXT_SHORTCUTS: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    keys: 'Cmd+F',
    description: 'Focus search',
    category: 'Context',
  },
  {
    keys: 'Cmd+A',
    description: 'Select all',
    category: 'Context',
  },
  {
    keys: 'Cmd+D',
    description: 'Deselect all',
    category: 'Context',
  },
  {
    keys: 'Delete',
    description: 'Delete selected items',
    category: 'Context',
  },
];

/**
 * Help shortcuts
 */
export const HELP_SHORTCUTS: Omit<KeyboardShortcut, 'callback'>[] = [
  {
    keys: 'Cmd+?',
    description: 'Show keyboard shortcuts',
    category: 'Help',
  },
  {
    keys: 'Cmd+Shift+?',
    description: 'Open documentation',
    category: 'Help',
  },
];

/**
 * All application shortcuts (for reference/display)
 */
export const ALL_SHORTCUTS = [
  ...NAVIGATION_SHORTCUTS,
  ...ACTION_SHORTCUTS,
  ...GRAPH_SHORTCUTS,
  ...CONTEXT_SHORTCUTS,
  ...HELP_SHORTCUTS,
];

/**
 * Shortcut descriptions map (for quick lookup)
 */
export const SHORTCUT_DESCRIPTIONS = ALL_SHORTCUTS.reduce(
  (acc, shortcut) => {
    acc[shortcut.keys] = shortcut.description || '';
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: string) {
  return ALL_SHORTCUTS.filter((s) => s.category === category);
}

/**
 * Get shortcut description by keys
 */
export function getShortcutDescription(keys: string): string | undefined {
  return SHORTCUT_DESCRIPTIONS[keys];
}
