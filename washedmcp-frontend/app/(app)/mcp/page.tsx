'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Server, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useAppLoadAnimation } from '@/components/layout/AppLoadProvider';
import type { MCPApiResponse } from '@/lib/types/data';

const statusConfig = {
  active: { icon: CheckCircle, color: 'text-(--color-success)', bgColor: 'bg-(--color-success)/10', label: 'Connected' },
  inactive: { icon: XCircle, color: 'text-(--color-error)', bgColor: 'bg-(--color-error)/10', label: 'Disconnected' },
  error: { icon: Clock, color: 'text-(--color-warning)', bgColor: 'bg-(--color-warning)/10', label: 'Error' },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function formatLastSync(lastSync?: string): string {
  if (!lastSync) return 'Never';

  const date = new Date(lastSync);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function MCPPage() {
  const [mcps, setMCPs] = useState<MCPApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { shouldAnimate, ready } = useAppLoadAnimation();
  const pageMotion = shouldAnimate
    ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    : { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } };

  useEffect(() => {
    async function fetchMCPs() {
      try {
        const response = await fetch('/api/mcps');
        if (!response.ok) {
          throw new Error('Failed to fetch MCPs');
        }
        const data = await response.json();
        setMCPs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchMCPs();
  }, []);

  if (!ready) {
    return <div className="min-h-screen p-6 opacity-0" />;
  }

  if (loading) {
    return (
      <motion.div className="min-h-screen p-6 flex items-center justify-center" {...pageMotion}>
        <div className="flex items-center gap-3 text-(--color-text-secondary)">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading MCPs...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="min-h-screen p-6" {...pageMotion}>
        <div className="bg-(--color-error)/10 border border-(--color-error) rounded-[6px] p-4 text-(--color-error)">
          Error loading MCPs: {error}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen p-6" {...pageMotion}>
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-(--color-text-primary) mb-1">
            MCP Management
          </h1>
          <p className="text-(--color-text-secondary) text-base">
            Manage your Model Context Protocol servers
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 bg-(--color-primary) text-white rounded-[6px] font-medium shadow-[--shadow-subtle] transition-colors duration-200 hover:bg-(--color-primary-hover)"
        >
          <Plus size={20} />
          Add MCP
        </motion.button>
      </div>

      {/* MCP Grid */}
      <motion.div
        variants={container}
        initial={shouldAnimate ? 'hidden' : false}
        animate="show"
        className="grid grid-cols-2 gap-5"
      >
        {mcps.map((mcp) => {
          const statusKey = mcp.status as keyof typeof statusConfig;
          const StatusIcon = statusConfig[statusKey].icon;
          const isExpanded = expandedCard === mcp.id;

          return (
            <motion.div
              key={mcp.id}
              variants={item}
              layout
              className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-subtle] overflow-hidden cursor-pointer transition-colors duration-200 hover:border-(--color-primary)"
              onClick={() => setExpandedCard(isExpanded ? null : mcp.id)}
            >
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[6px] bg-(--color-primary)/10 flex items-center justify-center">
                      <Server className="text-(--color-primary)" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-(--color-text-primary)">
                        {mcp.name}
                      </h3>
                      <p className="text-sm text-(--color-text-tertiary)">
                        Last sync: {formatLastSync(mcp.lastSync)}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] ${statusConfig[statusKey].bgColor}`}>
                    <StatusIcon className={statusConfig[statusKey].color} size={16} />
                    <span className={`text-sm font-medium capitalize ${statusConfig[statusKey].color}`}>
                      {statusConfig[statusKey].label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-(--color-border)">
                  <div>
                    <p className="text-sm text-(--color-text-tertiary) mb-1">Context Items</p>
                    <p className="text-2xl font-bold text-(--color-text-primary)">{mcp.contextCount}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-(--color-text-tertiary)"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </motion.div>
                </div>
              </div>

              {/* Expandable Section */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-(--color-border) bg-(--color-background) px-6 py-4"
                >
                  <h4 className="text-sm font-semibold text-(--color-text-primary) mb-3">
                    Connection Settings
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-(--color-text-tertiary)">Endpoint:</span>
                      <span className="text-(--color-text-secondary) font-mono">
                        {mcp.connectionConfig?.endpoint || 'localhost:3000'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-(--color-text-tertiary)">Protocol:</span>
                      <span className="text-(--color-text-secondary)">
                        {mcp.connectionConfig?.protocol || 'HTTP'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-(--color-text-tertiary)">Auto-sync:</span>
                      <span className={mcp.connectionConfig?.autoSync ? 'text-(--color-success)' : 'text-(--color-text-tertiary)'}>
                        {mcp.connectionConfig?.autoSync ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-(--color-primary) text-white rounded-[6px] text-sm font-medium hover:bg-(--color-primary-hover) transition-colors duration-200">
                      Edit Settings
                    </button>
                    <button className="px-4 py-2 border border-(--color-border) rounded-[6px] text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200">
                      Disconnect
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
