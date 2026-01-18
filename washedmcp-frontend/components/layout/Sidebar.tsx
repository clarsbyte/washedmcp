'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  MessageCircle,
  Server,
  Database,
  Users,
  Settings,
  ChevronLeft,
  HelpCircle,
} from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'MCP', href: '/mcp', icon: Server },
  { name: 'Context', href: '/context', icon: Database },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? '80px' : '256px',
      }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1], // cubic-bezier(0.4, 0, 0.2, 1)
      }}
      className="h-screen bg-(--color-surface) border-r border-(--color-border) flex flex-col relative"
    >
      {/* Logo/Branding */}
      <div className="h-20 border-b border-(--color-border) flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-[6px] bg-(--color-primary) flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <h1 className="text-2xl font-bold text-(--color-primary)">Clean</h1>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 rounded-[6px] bg-(--color-primary) flex items-center justify-center"
            >
              <span className="text-white font-bold text-xl">C</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCollapse}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-(--color-surface) border border-(--color-border) flex items-center justify-center text-(--color-text-tertiary) hover:text-(--color-primary) hover:border-(--color-primary) transition-colors duration-200 shadow-[--shadow-subtle]"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft size={14} />
          </motion.div>
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link href={item.href} className="block">
                  <motion.div
                    whileHover={{ x: isCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-[6px] transition-colors duration-200 ${
                      isActive
                        ? 'bg-(--color-primary) text-white shadow-[--shadow-subtle]'
                        : 'text-(--color-text-secondary) hover:bg-(--color-background)'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-(--color-border) p-3 space-y-1">
        {/* Help/Documentation */}
        <motion.button
          whileHover={{ x: isCollapsed ? 0 : 4 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[6px] text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Help' : undefined}
        >
          <HelpCircle size={20} className="flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium whitespace-nowrap overflow-hidden"
              >
                Help
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Version Info (only when expanded) */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-2"
            >
              <p className="text-xs text-(--color-text-tertiary)">Version 1.0.0</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Profile Section */}
        <motion.button
          whileHover={{ x: isCollapsed ? 0 : 4 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[6px] text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'User Profile' : undefined}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
                }}
              >
                U
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-medium text-(--color-text-primary) truncate">
                  User Name
                </p>
                <p className="text-xs text-(--color-text-tertiary) truncate">
                  user@example.com
                </p>
              </div>
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
              }}
            >
              U
            </div>
          )}
        </motion.button>
      </div>
    </motion.aside>
  );
}
