'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Home,
  Server,
  Database,
  Users,
  Settings,
  Plus,
  RefreshCw,
  ArrowRight,
  Clock,
  Hash,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcut, useKeyPress } from '@/hooks/useKeyboardShortcut';

/**
 * Command item interface
 */
export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  category?: string;
  keywords?: string[];
  action: () => void;
  shortcut?: string;
}

/**
 * Props for CommandPalette component
 */
export interface CommandPaletteProps {
  /**
   * Custom commands to add to the palette
   */
  commands?: Command[];

  /**
   * Callback when command is executed
   */
  onCommandExecute?: (command: Command) => void;
}

/**
 * Command Palette Component
 * Quick search and navigation interface (Cmd+K)
 *
 * Features:
 * - Fuzzy search
 * - Keyboard navigation
 * - Recent commands
 * - Categorized commands
 * - Quick actions
 *
 * @example
 * ```tsx
 * <CommandPalette
 *   commands={[
 *     { id: 'custom', label: 'Custom Action', action: () => {} },
 *   ]}
 * />
 * ```
 */
export function CommandPalette({ commands: customCommands = [], onCommandExecute }: CommandPaletteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Open/close handlers
  const open = useCallback(() => {
    setIsOpen(true);
    setSearch('');
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setSelectedIndex(0);
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcut({
    keys: 'Cmd+K',
    callback: (e) => {
      e.preventDefault();
      if (isOpen) {
        close();
      } else {
        open();
      }
    },
    description: 'Open command palette',
    category: 'Actions',
  });

  useKeyPress('Escape', close, { preventDefault: false });

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Default navigation commands
  const navigationCommands: Command[] = useMemo(
    () => [
      {
        id: 'nav-home',
        label: 'Go to Dashboard',
        description: 'View graph visualization',
        icon: Home,
        category: 'Navigation',
        keywords: ['home', 'dashboard', 'graph'],
        action: () => {
          router.push('/dashboard');
          close();
        },
        shortcut: 'Cmd+H',
      },
      {
        id: 'nav-mcp',
        label: 'Go to MCP Management',
        description: 'Manage MCP servers',
        icon: Server,
        category: 'Navigation',
        keywords: ['mcp', 'servers', 'manage'],
        action: () => {
          router.push('/mcp');
          close();
        },
        shortcut: 'Cmd+M',
      },
      {
        id: 'nav-context',
        label: 'Go to Context Library',
        description: 'Browse context items',
        icon: Database,
        category: 'Navigation',
        keywords: ['context', 'library', 'data'],
        action: () => {
          router.push('/context');
          close();
        },
        shortcut: 'Cmd+C',
      },
      {
        id: 'nav-team',
        label: 'Go to Team',
        description: 'Manage team members',
        icon: Users,
        category: 'Navigation',
        keywords: ['team', 'members', 'collaboration'],
        action: () => {
          router.push('/team');
          close();
        },
        shortcut: 'Cmd+T',
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Configure application',
        icon: Settings,
        category: 'Navigation',
        keywords: ['settings', 'config', 'preferences'],
        action: () => {
          router.push('/settings');
          close();
        },
        shortcut: 'Cmd+,',
      },
    ],
    [router, close]
  );

  // Quick action commands
  const actionCommands: Command[] = useMemo(
    () => [
      {
        id: 'action-refresh',
        label: 'Refresh Data',
        description: 'Reload current page data',
        icon: RefreshCw,
        category: 'Actions',
        keywords: ['refresh', 'reload', 'sync'],
        action: () => {
          router.refresh();
          close();
        },
        shortcut: 'Cmd+R',
      },
      {
        id: 'action-new-mcp',
        label: 'Add New MCP',
        description: 'Connect a new MCP server',
        icon: Plus,
        category: 'Actions',
        keywords: ['add', 'new', 'mcp', 'server'],
        action: () => {
          router.push('/mcp?action=add');
          close();
        },
        shortcut: 'Cmd+N',
      },
    ],
    [router, close]
  );

  // All commands
  const allCommands = useMemo(
    () => [...navigationCommands, ...actionCommands, ...customCommands],
    [navigationCommands, actionCommands, customCommands]
  );

  // Fuzzy search function
  const fuzzyMatch = useCallback((text: string, query: string): boolean => {
    if (!query) return true;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Exact match
    if (lowerText.includes(lowerQuery)) return true;

    // Fuzzy match (all characters present in order)
    let queryIndex = 0;
    for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === lowerQuery.length;
  }, []);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return allCommands;

    return allCommands.filter((cmd) => {
      const searchText = [
        cmd.label,
        cmd.description || '',
        cmd.category || '',
        ...(cmd.keywords || []),
      ].join(' ');

      return fuzzyMatch(searchText, search);
    });
  }, [allCommands, search, fuzzyMatch]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};

    filteredCommands.forEach((cmd) => {
      const category = cmd.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Get recent commands
  const recentCommandsList = useMemo(() => {
    return recentCommands
      .map((id) => allCommands.find((cmd) => cmd.id === id))
      .filter(Boolean) as Command[];
  }, [recentCommands, allCommands]);

  // Execute command
  const executeCommand = useCallback(
    (command: Command) => {
      command.action();

      // Add to recent commands
      setRecentCommands((prev) => {
        const filtered = prev.filter((id) => id !== command.id);
        return [command.id, ...filtered].slice(0, 5); // Keep last 5
      });

      // Callback
      if (onCommandExecute) {
        onCommandExecute(command);
      }
    },
    [onCommandExecute]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = filteredCommands[selectedIndex];
        if (command) {
          executeCommand(command);
        }
      }
    },
    [filteredCommands, selectedIndex, executeCommand]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setSelectedIndex(0);
  }, []);

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
            onClick={close}
          />

          {/* Command Palette */}
          <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-[20vh] pointer-events-none">
            <motion.div
              className="bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-modal] max-w-2xl w-full overflow-hidden pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 p-4 border-b border-(--color-border)">
                <Search size={20} className="text-(--color-text-tertiary)" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent outline-none text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
                />
                <kbd className="px-2 py-1 text-xs font-mono bg-(--color-background) border border-(--color-border) rounded-[4px] text-(--color-text-tertiary)">
                  Esc
                </kbd>
              </div>

              {/* Commands list */}
              <div
                ref={listRef}
                className="max-h-[400px] overflow-y-auto"
              >
                {!search && recentCommandsList.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-(--color-text-tertiary) uppercase tracking-wide flex items-center gap-2">
                      <Clock size={14} />
                      Recent
                    </div>
                    {recentCommandsList.map((cmd, index) => (
                      <CommandItem
                        key={cmd.id}
                        command={cmd}
                        isSelected={selectedIndex === index}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      />
                    ))}
                  </div>
                )}

                {Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category} className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-(--color-text-tertiary) uppercase tracking-wide flex items-center gap-2">
                      <Hash size={14} />
                      {category}
                    </div>
                    {commands.map((cmd) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      return (
                        <CommandItem
                          key={cmd.id}
                          command={cmd}
                          isSelected={selectedIndex === globalIndex}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        />
                      );
                    })}
                  </div>
                ))}

                {filteredCommands.length === 0 && (
                  <div className="py-12 text-center">
                    <Search size={40} className="text-(--color-text-tertiary) mx-auto mb-3" />
                    <p className="text-sm text-(--color-text-secondary)">
                      No commands found for &quot;{search}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-(--color-border) bg-(--color-background) flex items-center justify-between text-xs text-(--color-text-tertiary)">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 font-mono bg-(--color-surface) border border-(--color-border) rounded-[3px]">↑</kbd>
                    <kbd className="px-1.5 py-0.5 font-mono bg-(--color-surface) border border-(--color-border) rounded-[3px]">↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 font-mono bg-(--color-surface) border border-(--color-border) rounded-[3px]">↵</kbd>
                    to select
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Command Item Component
 * Individual command in the palette
 */
function CommandItem({
  command,
  isSelected,
  onClick,
  onMouseEnter,
}: {
  command: Command;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const Icon = command.icon;

  return (
    <motion.button
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
        isSelected
          ? 'bg-(--color-primary)/10 text-(--color-primary)'
          : 'text-(--color-text-secondary) hover:bg-(--color-background)'
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
    >
      {Icon && (
        <div
          className={`w-8 h-8 rounded-[6px] flex items-center justify-center ${
            isSelected ? 'bg-(--color-primary)/20' : 'bg-(--color-background)'
          }`}
        >
          <Icon
            size={16}
            className={isSelected ? 'text-(--color-primary)' : 'text-(--color-text-tertiary)'}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{command.label}</div>
        {command.description && (
          <div className="text-xs text-(--color-text-tertiary) truncate">
            {command.description}
          </div>
        )}
      </div>

      {command.shortcut && (
        <kbd className="px-2 py-1 text-xs font-mono bg-(--color-background) border border-(--color-border) rounded-[4px] text-(--color-text-tertiary)">
          {command.shortcut}
        </kbd>
      )}

      {isSelected && (
        <ArrowRight size={16} className="text-(--color-primary)" />
      )}
    </motion.button>
  );
}
