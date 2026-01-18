'use client';

import { motion } from 'framer-motion';
import { Skeleton, SkeletonGroup } from '../Skeleton';

/**
 * Sidebar Skeleton Component
 * Loading state for sidebar navigation
 *
 * @example
 * ```tsx
 * <SidebarSkeleton />
 * ```
 */
export function SidebarSkeleton() {
  const navItemCount = 5;
  const labelWidths = [84, 92, 100, 88, 96];

  return (
    <motion.aside
      className="w-64 bg-(--color-surface) border-r border-(--color-border) flex flex-col"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo/Header */}
      <div className="p-6 border-b border-(--color-border)">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" width={40} height={40} />
          <Skeleton variant="text" width="120px" height="24px" />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <SkeletonGroup className="space-y-2">
          {Array.from({ length: navItemCount }).map((_, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 px-4 py-3"
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 },
              }}
            >
              <Skeleton variant="circle" width={20} height={20} />
              <Skeleton
                variant="text"
                width={`${labelWidths[i % labelWidths.length]}px`}
                height="16px"
              />
            </motion.div>
          ))}
        </SkeletonGroup>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-(--color-border)">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1">
            <Skeleton variant="text" width="100px" height="16px" className="mb-1" />
            <Skeleton variant="text" width="80px" height="14px" />
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

/**
 * Collapsed Sidebar Skeleton
 * Loading state for collapsed sidebar
 */
export function CollapsedSidebarSkeleton() {
  const navItemCount = 5;

  return (
    <motion.aside
      className="w-20 bg-(--color-surface) border-r border-(--color-border) flex flex-col items-center"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-(--color-border) w-full flex justify-center">
        <Skeleton variant="circle" width={32} height={32} />
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 p-4 w-full">
        <SkeletonGroup className="space-y-4 flex flex-col items-center">
          {Array.from({ length: navItemCount }).map((_, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 },
              }}
            >
              <Skeleton variant="circle" width={20} height={20} />
            </motion.div>
          ))}
        </SkeletonGroup>
      </nav>

      {/* User Avatar */}
      <div className="p-4 border-t border-(--color-border) w-full flex justify-center">
        <Skeleton variant="circle" width={32} height={32} />
      </div>
    </motion.aside>
  );
}

/**
 * Sidebar Navigation Item Skeleton
 * Loading state for individual nav items (used in lazy loading scenarios)
 */
export function SidebarNavItemSkeleton() {
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 rounded-[6px]"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Skeleton variant="circle" width={20} height={20} />
      <Skeleton variant="text" width="100px" height="16px" />
      {/* Optional badge */}
      <Skeleton variant="circle" width={20} height={20} className="ml-auto" />
    </motion.div>
  );
}
