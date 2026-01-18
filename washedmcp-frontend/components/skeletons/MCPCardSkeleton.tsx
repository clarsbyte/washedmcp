'use client';

import { motion } from 'framer-motion';
import { Skeleton, SkeletonGroup } from '../Skeleton';

/**
 * MCP Card Skeleton Component
 * Loading state for individual MCP cards
 *
 * @example
 * ```tsx
 * <MCPCardSkeleton />
 * ```
 */
export function MCPCardSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) border border-(--color-border) rounded-[6px] p-6 shadow-[--shadow-subtle]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Icon */}
          <Skeleton variant="circle" width={48} height={48} />

          {/* Name and status */}
          <div className="flex-1">
            <Skeleton variant="text" width="140px" height="20px" className="mb-2" />
            <Skeleton variant="text" width="80px" height="16px" />
          </div>
        </div>

        {/* Status badge */}
        <Skeleton variant="rectangle" width="70px" height="24px" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-(--color-border)">
        <div>
          <Skeleton variant="text" width="60px" height="14px" className="mb-1" />
          <Skeleton variant="text" width="40px" height="20px" />
        </div>
        <div>
          <Skeleton variant="text" width="70px" height="14px" className="mb-1" />
          <Skeleton variant="text" width="80px" height="20px" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton variant="rectangle" width="100%" height="40px" />
        <Skeleton variant="rectangle" width="100%" height="40px" />
      </div>
    </motion.div>
  );
}

/**
 * MCP Card Grid Skeleton
 * Loading state for grid of MCP cards
 *
 * @example
 * ```tsx
 * <MCPCardGridSkeleton count={6} />
 * ```
 */
export function MCPCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <MCPCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * MCP Card Expanded Skeleton
 * Loading state for expanded MCP card with settings
 */
export function MCPCardExpandedSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) border border-(--color-border) rounded-[6px] p-6 shadow-[--shadow-subtle]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton variant="circle" width={48} height={48} />
          <div className="flex-1">
            <Skeleton variant="text" width="140px" height="20px" className="mb-2" />
            <Skeleton variant="text" width="80px" height="16px" />
          </div>
        </div>
        <Skeleton variant="rectangle" width="70px" height="24px" />
      </div>

      {/* Connection Settings */}
      <div className="space-y-4 mb-6">
        <Skeleton variant="text" width="120px" height="18px" className="mb-3" />

        {/* Form fields */}
        <SkeletonGroup>
          <div>
            <Skeleton variant="text" width="80px" height="14px" className="mb-2" />
            <Skeleton variant="rectangle" width="100%" height="44px" />
          </div>
          <div>
            <Skeleton variant="text" width="100px" height="14px" className="mb-2" />
            <Skeleton variant="rectangle" width="100%" height="44px" />
          </div>
          <div>
            <Skeleton variant="text" width="90px" height="14px" className="mb-2" />
            <Skeleton variant="rectangle" width="100%" height="44px" />
          </div>
        </SkeletonGroup>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 pt-6 border-t border-(--color-border)">
        <div>
          <Skeleton variant="text" width="60px" height="14px" className="mb-1" />
          <Skeleton variant="text" width="40px" height="20px" />
        </div>
        <div>
          <Skeleton variant="text" width="70px" height="14px" className="mb-1" />
          <Skeleton variant="text" width="80px" height="20px" />
        </div>
        <div>
          <Skeleton variant="text" width="80px" height="14px" className="mb-1" />
          <Skeleton variant="text" width="60px" height="20px" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton variant="rectangle" width="100%" height="40px" />
        <Skeleton variant="rectangle" width="100%" height="40px" />
        <Skeleton variant="rectangle" width="100px" height="40px" />
      </div>
    </motion.div>
  );
}
