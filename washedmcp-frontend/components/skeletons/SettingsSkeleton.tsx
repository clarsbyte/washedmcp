'use client';

import { motion } from 'framer-motion';
import { Skeleton, SkeletonGroup } from '../Skeleton';

/**
 * Settings Section Skeleton Component
 * Loading state for individual settings sections
 *
 * @example
 * ```tsx
 * <SettingsSectionSkeleton />
 * ```
 */
export function SettingsSectionSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) border border-(--color-border) rounded-[6px] p-6 shadow-[--shadow-subtle]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Section header */}
      <div className="mb-6">
        <Skeleton variant="text" width="180px" height="24px" className="mb-2" />
        <Skeleton variant="text" width="300px" height="16px" />
      </div>

      {/* Settings fields */}
      <SkeletonGroup className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton variant="text" width="120px" height="14px" className="mb-2" />
            <Skeleton variant="rectangle" width="100%" height="44px" />
          </div>
        ))}
      </SkeletonGroup>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-(--color-border)">
        <Skeleton variant="rectangle" width="100px" height="44px" />
        <Skeleton variant="rectangle" width="120px" height="44px" />
      </div>
    </motion.div>
  );
}

/**
 * Settings Page Skeleton
 * Loading state for complete settings page with multiple sections
 *
 * @example
 * ```tsx
 * <SettingsPageSkeleton sections={4} />
 * ```
 */
export function SettingsPageSkeleton({ sections = 4 }: { sections?: number }) {
  return (
    <div>
      {/* Page header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Skeleton variant="text" width="160px" height="32px" className="mb-2" />
        <Skeleton variant="text" width="350px" height="16px" />
      </motion.div>

      {/* Settings sections */}
      <motion.div
        className="space-y-6"
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
        {Array.from({ length: sections }).map((_, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <SettingsSectionSkeleton />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Project Settings Skeleton
 * Loading state for project settings section with specific fields
 */
export function ProjectSettingsSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) border border-(--color-border) rounded-[6px] p-6 shadow-[--shadow-subtle]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="mb-6">
        <Skeleton variant="text" width="150px" height="24px" className="mb-2" />
        <Skeleton variant="text" width="280px" height="16px" />
      </div>

      {/* Project name field */}
      <div className="mb-6">
        <Skeleton variant="text" width="100px" height="14px" className="mb-2" />
        <Skeleton variant="rectangle" width="100%" height="44px" />
      </div>

      {/* Project ID (read-only) */}
      <div className="mb-6">
        <Skeleton variant="text" width="80px" height="14px" className="mb-2" />
        <Skeleton variant="rectangle" width="100%" height="44px" className="opacity-50" />
      </div>

      {/* Created date */}
      <div>
        <Skeleton variant="text" width="90px" height="14px" className="mb-2" />
        <Skeleton variant="text" width="200px" height="16px" />
      </div>
    </motion.div>
  );
}

/**
 * Database Settings Skeleton
 * Loading state for database connection settings
 */
export function DatabaseSettingsSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) border border-(--color-border) rounded-[6px] p-6 shadow-[--shadow-subtle]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <Skeleton variant="text" width="200px" height="24px" className="mb-2" />
          <Skeleton variant="text" width="320px" height="16px" />
        </div>
        {/* Connection status badge */}
        <Skeleton variant="rectangle" width="90px" height="24px" />
      </div>

      {/* Connection fields */}
      <SkeletonGroup className="mb-6">
        <div>
          <Skeleton variant="text" width="100px" height="14px" className="mb-2" />
          <Skeleton variant="rectangle" width="100%" height="44px" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton variant="text" width="80px" height="14px" className="mb-2" />
            <Skeleton variant="rectangle" width="100%" height="44px" />
          </div>
          <div>
            <Skeleton variant="text" width="60px" height="14px" className="mb-2" />
            <Skeleton variant="rectangle" width="100%" height="44px" />
          </div>
        </div>
        <div>
          <Skeleton variant="text" width="80px" height="14px" className="mb-2" />
          <Skeleton variant="rectangle" width="100%" height="44px" />
        </div>
      </SkeletonGroup>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-(--color-border)">
        <Skeleton variant="rectangle" width="140px" height="40px" />
        <div className="flex gap-3">
          <Skeleton variant="rectangle" width="100px" height="44px" />
          <Skeleton variant="rectangle" width="120px" height="44px" />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Usage Stats Skeleton
 * Loading state for usage statistics section
 */
export function UsageStatsSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) border border-(--color-border) rounded-[6px] p-6 shadow-[--shadow-subtle]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="mb-6">
        <Skeleton variant="text" width="120px" height="24px" className="mb-2" />
        <Skeleton variant="text" width="300px" height="16px" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton variant="text" width="100px" height="14px" className="mb-3" />
            {/* Progress bar */}
            <Skeleton variant="rectangle" width="100%" height="8px" className="mb-2" />
            <div className="flex justify-between">
              <Skeleton variant="text" width="80px" height="14px" />
              <Skeleton variant="text" width="60px" height="14px" />
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade prompt */}
      <div className="p-4 bg-(--color-background) border border-(--color-border) rounded-[6px]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton variant="text" width="180px" height="18px" className="mb-2" />
            <Skeleton variant="text" width="280px" height="14px" />
          </div>
          <Skeleton variant="rectangle" width="120px" height="40px" />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * API Key Section Skeleton
 * Loading state for API key management
 */
export function ApiKeySkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) border border-(--color-border) rounded-[6px] p-6 shadow-[--shadow-subtle]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="mb-6">
        <Skeleton variant="text" width="140px" height="24px" className="mb-2" />
        <Skeleton variant="text" width="350px" height="16px" />
      </div>

      {/* API Key display */}
      <div className="flex gap-2 mb-4">
        <Skeleton variant="rectangle" width="100%" height="44px" />
        <Skeleton variant="rectangle" width="100px" height="44px" />
      </div>

      {/* Last generated */}
      <Skeleton variant="text" width="200px" height="14px" className="mb-6" />

      {/* Actions */}
      <div className="flex gap-3">
        <Skeleton variant="rectangle" width="140px" height="40px" />
        <Skeleton variant="rectangle" width="120px" height="40px" />
      </div>
    </motion.div>
  );
}

/**
 * Danger Zone Skeleton
 * Loading state for danger zone section with destructive actions
 */
export function DangerZoneSkeleton() {
  return (
    <motion.div
      className="bg-(--color-surface) border-2 border-(--color-error)/20 rounded-[6px] p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="mb-6">
        <Skeleton variant="text" width="120px" height="24px" className="mb-2" />
        <Skeleton variant="text" width="380px" height="16px" />
      </div>

      {/* Destructive actions */}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start justify-between p-4 border border-(--color-border) rounded-[6px]"
          >
            <div className="flex-1">
              <Skeleton variant="text" width="180px" height="18px" className="mb-2" />
              <Skeleton variant="text" width="320px" height="14px" />
            </div>
            <Skeleton variant="rectangle" width="120px" height="40px" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
