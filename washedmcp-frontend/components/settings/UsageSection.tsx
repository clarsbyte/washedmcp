'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Database, Users, HardDrive, FileText } from 'lucide-react';

export function UsageSection() {
  // Mock data - would come from backend
  const usage = {
    contexts: { current: 847, limit: 1000, percentage: 84.7 },
    tokens: { current: 2456789, limit: 3000000, percentage: 81.9 },
    teamMembers: { current: 5, limit: 10, percentage: 50 },
    storage: { current: 3.2, limit: 5, percentage: 64, unit: 'GB' },
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-(--color-error)';
    if (percentage >= 80) return 'bg-(--color-warning)';
    return 'bg-(--color-success)';
  };

  const getProgressBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-(--color-error)/10';
    if (percentage >= 80) return 'bg-(--color-warning)/10';
    return 'bg-(--color-success)/10';
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner (shows when usage > 80%) */}
      {(usage.contexts.percentage >= 80 || usage.tokens.percentage >= 80) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-(--color-warning)/10 border border-(--color-warning)/20 rounded-[6px]"
        >
          <AlertTriangle className="text-(--color-warning) flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-(--color-warning) mb-1">
              Approaching Usage Limits
            </p>
            <p className="text-sm text-(--color-text-secondary)">
              You are approaching your usage limits. Consider upgrading your plan or cleaning up old data to avoid service interruptions.
            </p>
          </div>
        </motion.div>
      )}

      {/* Context Items Usage */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[6px] bg-(--color-primary)/10 flex items-center justify-center">
            <FileText className="text-(--color-primary)" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-(--color-text-primary)">
              Context Items
            </h3>
            <p className="text-sm text-(--color-text-tertiary)">
              {formatNumber(usage.contexts.current)} of {formatNumber(usage.contexts.limit)} used
            </p>
          </div>
          <span className={`text-2xl font-bold ${
            usage.contexts.percentage >= 90
              ? 'text-(--color-error)'
              : usage.contexts.percentage >= 80
              ? 'text-(--color-warning)'
              : 'text-(--color-success)'
          }`}>
            {usage.contexts.percentage.toFixed(1)}%
          </span>
        </div>
        <div className={`relative w-full h-3 rounded-full overflow-hidden ${getProgressBgColor(usage.contexts.percentage)}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usage.contexts.percentage}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full ${getProgressColor(usage.contexts.percentage)}`}
          />
        </div>
      </div>

      {/* Token Usage */}
      <div className="pt-5 border-t border-(--color-border)">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[6px] bg-(--color-secondary)/10 flex items-center justify-center">
            <Database className="text-(--color-secondary)" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-(--color-text-primary)">
              Token Usage
            </h3>
            <p className="text-sm text-(--color-text-tertiary)">
              {formatNumber(usage.tokens.current)} of {formatNumber(usage.tokens.limit)} used
            </p>
          </div>
          <span className={`text-2xl font-bold ${
            usage.tokens.percentage >= 90
              ? 'text-(--color-error)'
              : usage.tokens.percentage >= 80
              ? 'text-(--color-warning)'
              : 'text-(--color-success)'
          }`}>
            {usage.tokens.percentage.toFixed(1)}%
          </span>
        </div>
        <div className={`relative w-full h-3 rounded-full overflow-hidden ${getProgressBgColor(usage.tokens.percentage)}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usage.tokens.percentage}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full ${getProgressColor(usage.tokens.percentage)}`}
          />
        </div>
      </div>

      {/* Team Members */}
      <div className="pt-5 border-t border-(--color-border)">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[6px] bg-(--color-tertiary)/10 flex items-center justify-center">
            <Users className="text-(--color-tertiary)" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-(--color-text-primary)">
              Team Members
            </h3>
            <p className="text-sm text-(--color-text-tertiary)">
              {usage.teamMembers.current} of {usage.teamMembers.limit} seats used
            </p>
          </div>
          <span className={`text-2xl font-bold ${
            usage.teamMembers.percentage >= 90
              ? 'text-(--color-error)'
              : usage.teamMembers.percentage >= 80
              ? 'text-(--color-warning)'
              : 'text-(--color-success)'
          }`}>
            {usage.teamMembers.percentage.toFixed(1)}%
          </span>
        </div>
        <div className={`relative w-full h-3 rounded-full overflow-hidden ${getProgressBgColor(usage.teamMembers.percentage)}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usage.teamMembers.percentage}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full ${getProgressColor(usage.teamMembers.percentage)}`}
          />
        </div>
      </div>

      {/* Storage Usage */}
      <div className="pt-5 border-t border-(--color-border)">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[6px] bg-(--color-info)/10 flex items-center justify-center">
            <HardDrive className="text-(--color-info)" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-(--color-text-primary)">
              Storage
            </h3>
            <p className="text-sm text-(--color-text-tertiary)">
              {usage.storage.current} {usage.storage.unit} of {usage.storage.limit} {usage.storage.unit} used
            </p>
          </div>
          <span className={`text-2xl font-bold ${
            usage.storage.percentage >= 90
              ? 'text-(--color-error)'
              : usage.storage.percentage >= 80
              ? 'text-(--color-warning)'
              : 'text-(--color-success)'
          }`}>
            {usage.storage.percentage.toFixed(1)}%
          </span>
        </div>
        <div className={`relative w-full h-3 rounded-full overflow-hidden ${getProgressBgColor(usage.storage.percentage)}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usage.storage.percentage}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full ${getProgressColor(usage.storage.percentage)}`}
          />
        </div>
      </div>

      {/* Billing Information */}
      <div className="pt-5 border-t border-(--color-border)">
        <h3 className="text-lg font-semibold text-(--color-text-primary) mb-4">
          Billing Period
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-(--color-text-primary) mb-1">
              Current Plan
            </p>
            <p className="text-(--color-text-secondary)">Pro Plan</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-(--color-text-primary) mb-1">
              Billing Cycle
            </p>
            <p className="text-(--color-text-secondary)">Monthly</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-(--color-text-primary) mb-1">
              Next Billing Date
            </p>
            <p className="text-(--color-text-secondary)">February 15, 2024</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-(--color-text-primary) mb-1">
              Resets In
            </p>
            <p className="text-(--color-text-secondary)">12 days</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          className="mt-5 px-6 py-3 bg-(--color-primary) text-white rounded-[6px] font-medium hover:bg-(--color-primary-hover) transition-colors duration-200"
        >
          Upgrade Plan
        </motion.button>
      </div>
    </div>
  );
}
