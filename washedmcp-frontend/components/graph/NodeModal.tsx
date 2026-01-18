'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Hash, Server, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface ContextNode {
  id: string;
  mcpId: string;
  content: string;
  freshness: 'fresh' | 'outdated' | 'deprecated';
  timestamp?: Date;
  tokenCount?: number;
  sourceMCP?: string;
}

interface NodeModalProps {
  context: ContextNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NodeModal({ context, isOpen, onClose }: NodeModalProps) {
  if (!context) return null;

  const getFreshnessConfig = (freshness: string) => {
    switch (freshness) {
      case 'fresh':
        return {
          color: '#10B981',
          bgColor: 'bg-(--color-success)/10',
          borderColor: 'border-(--color-success)/20',
          textColor: 'text-(--color-success)',
          icon: CheckCircle,
          label: 'Fresh',
          description: 'Up to date',
        };
      case 'outdated':
        return {
          color: '#F59E0B',
          bgColor: 'bg-(--color-warning)/10',
          borderColor: 'border-(--color-warning)/20',
          textColor: 'text-(--color-warning)',
          icon: AlertTriangle,
          label: 'Outdated',
          description: '1-2 versions behind',
        };
      case 'deprecated':
        return {
          color: '#EF4444',
          bgColor: 'bg-(--color-error)/10',
          borderColor: 'border-(--color-error)/20',
          textColor: 'text-(--color-error)',
          icon: AlertCircle,
          label: 'Deprecated',
          description: '3+ versions behind',
        };
      default:
        return {
          color: '#64748B',
          bgColor: 'bg-(--color-text-tertiary)/10',
          borderColor: 'border-(--color-border)',
          textColor: 'text-(--color-text-tertiary)',
          icon: AlertCircle,
          label: 'Unknown',
          description: 'Status unknown',
        };
    }
  };

  const freshnessConfig = getFreshnessConfig(context.freshness);
  const FreshnessIcon = freshnessConfig.icon;

  // Mock data - will be replaced with real data
  const timestamp = context.timestamp || new Date();
  const tokenCount = context.tokenCount || 1247;
  const sourceMCP = context.sourceMCP || 'GitHub MCP';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-modal] w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-(--color-border)">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-(--color-text-primary) mb-2">
                  Context Details
                </h2>
                <p className="text-sm text-(--color-text-secondary)">
                  View detailed information about this context node
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="p-2 rounded-[6px] text-(--color-text-tertiary) hover:bg-(--color-background) transition-colors duration-200"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Freshness Status */}
              <div>
                <label className="block text-sm font-semibold text-(--color-text-primary) mb-3">
                  Freshness Status
                </label>
                <div className={`flex items-center gap-3 p-4 rounded-[6px] border ${freshnessConfig.bgColor} ${freshnessConfig.borderColor}`}>
                  <FreshnessIcon className={freshnessConfig.textColor} size={24} />
                  <div className="flex-1">
                    <p className={`font-semibold ${freshnessConfig.textColor} mb-1`}>
                      {freshnessConfig.label}
                    </p>
                    <p className="text-sm text-(--color-text-secondary)">
                      {freshnessConfig.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-(--color-text-primary) mb-2">
                  Content
                </label>
                <div className="p-4 bg-(--color-background) border border-(--color-border) rounded-[6px]">
                  <p className="text-(--color-text-primary) leading-relaxed">
                    {context.content}
                  </p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Source MCP */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary) mb-2">
                    <Server size={16} />
                    Source MCP
                  </label>
                  <p className="text-(--color-text-secondary)">{sourceMCP}</p>
                </div>

                {/* Token Count */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary) mb-2">
                    <Hash size={16} />
                    Token Count
                  </label>
                  <p className="text-(--color-text-secondary)">
                    {tokenCount.toLocaleString()} tokens
                  </p>
                </div>

                {/* Timestamp */}
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary) mb-2">
                    <Calendar size={16} />
                    Last Updated
                  </label>
                  <p className="text-(--color-text-secondary)">
                    {format(timestamp, 'MMMM dd, yyyy')} at {format(timestamp, 'h:mm a')}
                  </p>
                </div>
              </div>

              {/* Context ID (for debugging/reference) */}
              <div>
                <label className="block text-sm font-semibold text-(--color-text-primary) mb-2">
                  Context ID
                </label>
                <code className="block px-4 py-2 bg-(--color-background) border border-(--color-border) rounded-[6px] text-sm text-(--color-text-secondary) font-mono">
                  {context.id}
                </code>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-(--color-border)">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-3 bg-(--color-primary) text-white rounded-[6px] font-medium hover:bg-(--color-primary-hover) transition-colors duration-200"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
