'use client';

import { motion } from 'framer-motion';
import { Skeleton, SkeletonGroup } from '../Skeleton';

/**
 * Team Member Card Skeleton Component
 * Loading state for individual team member cards
 *
 * @example
 * ```tsx
 * <TeamMemberCardSkeleton />
 * ```
 */
export function TeamMemberCardSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) border border-(--color-border) rounded-[6px] p-6 shadow-[--shadow-subtle]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar with gradient background */}
        <Skeleton variant="circle" width={64} height={64} />

        {/* Member info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <Skeleton variant="text" width="140px" height="20px" className="mb-2" />
              <Skeleton variant="text" width="180px" height="16px" />
            </div>
            {/* Role badge */}
            <Skeleton variant="rectangle" width="70px" height="24px" />
          </div>

          {/* Status and last active */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-(--color-border)">
            <div className="flex items-center gap-2">
              <Skeleton variant="circle" width={8} height={8} />
              <Skeleton variant="text" width="60px" height="14px" />
            </div>
            <Skeleton variant="text" width="120px" height="14px" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Skeleton variant="rectangle" width="100%" height="36px" />
            <Skeleton variant="rectangle" width="100%" height="36px" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Team Member List Skeleton
 * Loading state for list of team members
 *
 * @example
 * ```tsx
 * <TeamMemberListSkeleton count={5} />
 * ```
 */
export function TeamMemberListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <motion.div
      className="space-y-4"
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
          <TeamMemberCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Team Header Skeleton
 * Loading state for team page header with stats
 */
export function TeamHeaderSkeleton() {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Title and action */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width="180px" height="32px" />
        <Skeleton variant="rectangle" width="140px" height="44px" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="bg-(--color-surface) border border-(--color-border) rounded-[6px] p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              delay: i * 0.05,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Skeleton variant="text" width="100px" height="14px" className="mb-2" />
            <Skeleton variant="text" width="60px" height="28px" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Invite Member Modal Skeleton
 * Loading state for invite member modal
 */
export function InviteMemberModalSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) rounded-[6px] p-6 max-w-lg w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Skeleton variant="text" width="160px" height="24px" className="mb-2" />
          <Skeleton variant="text" width="220px" height="16px" />
        </div>
        <Skeleton variant="circle" width={32} height={32} />
      </div>

      {/* Form fields */}
      <SkeletonGroup className="mb-6">
        <div>
          <Skeleton variant="text" width="80px" height="14px" className="mb-2" />
          <Skeleton variant="rectangle" width="100%" height="44px" />
        </div>
        <div>
          <Skeleton variant="text" width="60px" height="14px" className="mb-2" />
          <Skeleton variant="rectangle" width="100%" height="44px" />
        </div>
        <div>
          <Skeleton variant="text" width="100px" height="14px" className="mb-2" />
          <Skeleton variant="rectangle" width="100%" height="120px" />
        </div>
      </SkeletonGroup>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Skeleton variant="rectangle" width="80px" height="44px" />
        <Skeleton variant="rectangle" width="140px" height="44px" />
      </div>
    </motion.div>
  );
}

/**
 * Team Activity Feed Skeleton
 * Loading state for team activity timeline
 */
export function TeamActivitySkeleton({ count = 5 }: { count?: number }) {
  return (
    <motion.div
      className="space-y-4"
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
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="flex gap-4 p-4 bg-(--color-surface) border border-(--color-border) rounded-[6px]"
          variants={{
            hidden: { opacity: 0, x: -10 },
            visible: { opacity: 1, x: 0 },
          }}
        >
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1">
            <Skeleton variant="text" width="70%" height="16px" className="mb-2" />
            <Skeleton variant="text" width="40%" height="14px" />
          </div>
          <Skeleton variant="text" width="80px" height="14px" />
        </motion.div>
      ))}
    </motion.div>
  );
}
