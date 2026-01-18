'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '../Skeleton';

/**
 * Context Table Row Skeleton
 * Loading state for individual table rows
 */
function ContextTableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 px-6 border-b border-(--color-border)">
      {/* Checkbox */}
      <Skeleton variant="rectangle" width={20} height={20} />

      {/* Content preview */}
      <div className="flex-1 min-w-0">
        <Skeleton variant="text" width="80%" height="16px" className="mb-2" />
        <Skeleton variant="text" width="40%" height="14px" />
      </div>

      {/* Source MCP */}
      <div className="w-32">
        <Skeleton variant="text" width="100%" height="16px" />
      </div>

      {/* Freshness badge */}
      <div className="w-24">
        <Skeleton variant="rectangle" width="80px" height="24px" />
      </div>

      {/* Timestamp */}
      <div className="w-32">
        <Skeleton variant="text" width="100%" height="14px" />
      </div>

      {/* Actions */}
      <div className="w-20 flex gap-2">
        <Skeleton variant="circle" width={32} height={32} />
        <Skeleton variant="circle" width={32} height={32} />
      </div>
    </div>
  );
}

/**
 * Context Table Skeleton Component
 * Loading state for context library table
 *
 * @example
 * ```tsx
 * <ContextTableSkeleton rows={10} />
 * ```
 */
export function ContextTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <motion.div
      className="bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-subtle] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Table header */}
      <div className="flex items-center gap-4 py-3 px-6 bg-(--color-background) border-b border-(--color-border)">
        {/* Checkbox */}
        <Skeleton variant="rectangle" width={20} height={20} />

        {/* Column headers */}
        <div className="flex-1">
          <Skeleton variant="text" width="80px" height="14px" />
        </div>
        <div className="w-32">
          <Skeleton variant="text" width="100px" height="14px" />
        </div>
        <div className="w-24">
          <Skeleton variant="text" width="80px" height="14px" />
        </div>
        <div className="w-32">
          <Skeleton variant="text" width="90px" height="14px" />
        </div>
        <div className="w-20">
          <Skeleton variant="text" width="60px" height="14px" />
        </div>
      </div>

      {/* Table rows */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
          >
            <ContextTableRowSkeleton />
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between py-4 px-6 bg-(--color-background) border-t border-(--color-border)">
        <Skeleton variant="text" width="150px" height="14px" />
        <div className="flex gap-2">
          <Skeleton variant="rectangle" width={36} height={36} />
          <Skeleton variant="rectangle" width={36} height={36} />
          <Skeleton variant="rectangle" width={36} height={36} />
          <Skeleton variant="rectangle" width={36} height={36} />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Context Table Header Skeleton
 * Loading state for table toolbar/controls
 */
export function ContextTableHeaderSkeleton() {
  return (
    <motion.div
      className="flex items-center justify-between mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <Skeleton variant="rectangle" width="100%" height="44px" />
      </div>

      {/* Filters and actions */}
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangle" width="120px" height="44px" />
        <Skeleton variant="rectangle" width="100px" height="44px" />
        <Skeleton variant="rectangle" width="40px" height="44px" />
      </div>
    </motion.div>
  );
}

/**
 * Context Table With Header Skeleton
 * Complete loading state including header and table
 */
export function ContextTableWithHeaderSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div>
      <ContextTableHeaderSkeleton />
      <ContextTableSkeleton rows={rows} />
    </div>
  );
}

/**
 * Context Detail Modal Skeleton
 * Loading state for context detail modal
 */
export function ContextDetailModalSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) rounded-[6px] p-6 max-w-2xl w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <Skeleton variant="text" width="200px" height="24px" className="mb-2" />
          <Skeleton variant="text" width="150px" height="16px" />
        </div>
        <Skeleton variant="circle" width={32} height={32} />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-(--color-border)">
        <div>
          <Skeleton variant="text" width="80px" height="14px" className="mb-2" />
          <Skeleton variant="text" width="120px" height="16px" />
        </div>
        <div>
          <Skeleton variant="text" width="90px" height="14px" className="mb-2" />
          <Skeleton variant="text" width="100px" height="16px" />
        </div>
        <div>
          <Skeleton variant="text" width="70px" height="14px" className="mb-2" />
          <Skeleton variant="rectangle" width="80px" height="24px" />
        </div>
        <div>
          <Skeleton variant="text" width="100px" height="14px" className="mb-2" />
          <Skeleton variant="text" width="80px" height="16px" />
        </div>
      </div>

      {/* Content */}
      <div className="mb-6">
        <Skeleton variant="text" width="80px" height="16px" className="mb-3" />
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" height="16px" />
          <Skeleton variant="text" width="95%" height="16px" />
          <Skeleton variant="text" width="98%" height="16px" />
          <Skeleton variant="text" width="90%" height="16px" />
          <Skeleton variant="text" width="85%" height="16px" />
          <Skeleton variant="text" width="70%" height="16px" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Skeleton variant="rectangle" width="100px" height="44px" />
        <Skeleton variant="rectangle" width="120px" height="44px" />
      </div>
    </motion.div>
  );
}
