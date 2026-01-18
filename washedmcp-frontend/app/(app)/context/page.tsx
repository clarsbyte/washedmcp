'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Archive, RefreshCw, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAppLoadAnimation } from '@/components/layout/AppLoadProvider';
import type { ContextApiResponse } from '@/lib/types/data';

const freshnessConfig = {
  fresh: { icon: CheckCircle, color: 'text-(--color-success)', bgColor: 'bg-(--color-success)/10', label: 'Fresh' },
  outdated: { icon: AlertCircle, color: 'text-(--color-warning)', bgColor: 'bg-(--color-warning)/10', label: 'Outdated' },
  deprecated: { icon: XCircle, color: 'text-(--color-error)', bgColor: 'bg-(--color-error)/10', label: 'Deprecated' },
};

export default function ContextPage() {
  const [contexts, setContexts] = useState<ContextApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { shouldAnimate, ready } = useAppLoadAnimation();
  const pageMotion = shouldAnimate
    ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    : { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } };

  useEffect(() => {
    async function fetchContexts() {
      try {
        const response = await fetch('/api/contexts');
        if (!response.ok) {
          throw new Error('Failed to fetch contexts');
        }
        const data = await response.json();
        setContexts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchContexts();
  }, []);

  // Filter contexts based on search query
  const filteredContexts = useMemo(() => {
    if (!searchQuery.trim()) return contexts;
    const lowerQuery = searchQuery.toLowerCase();
    return contexts.filter((context) =>
      context.content.toLowerCase().includes(lowerQuery) ||
      (context.sourceMCP?.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery, contexts]);

  if (!ready) {
    return <div className="min-h-screen p-6 pb-28 opacity-0" />;
  }

  if (loading) {
    return (
      <motion.div className="min-h-screen p-6 pb-28 flex items-center justify-center" {...pageMotion}>
        <div className="flex items-center gap-3 text-(--color-text-secondary)">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading contexts...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="min-h-screen p-6 pb-28" {...pageMotion}>
        <div className="bg-(--color-error)/10 border border-(--color-error) rounded-[6px] p-4 text-(--color-error)">
          Error loading contexts: {error}
        </div>
      </motion.div>
    );
  }

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedItems((prev) =>
      prev.length === filteredContexts.length ? [] : filteredContexts.map((c) => c.id)
    );
  };

  return (
    <motion.div className="min-h-screen p-6 pb-28" {...pageMotion}>
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-(--color-text-primary) mb-1">
          Context Library
        </h1>
        <p className="text-(--color-text-secondary) text-base">
          Manage and track your context items across all MCP servers
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)" size={20} />
          <input
            type="text"
            placeholder="Search context items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[44px] pl-12 pr-4 bg-(--color-surface) border border-(--color-border) rounded-[6px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:ring-3 focus:ring-(--color-primary)/20 focus:border-(--color-primary) transition-all duration-200"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-subtle] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-(--color-background) border-b border-(--color-border)">
              <tr>
                <th className="w-12 px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredContexts.length && filteredContexts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-(--color-primary) cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-(--color-text-primary)">Content</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-(--color-text-primary)">Source MCP</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-(--color-text-primary)">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-(--color-text-primary)">Tokens</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-(--color-text-primary)">Freshness</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-(--color-text-primary)">Shared</th>
              </tr>
            </thead>
            <tbody>
              {filteredContexts.map((context) => {
                const freshnessKey = context.freshness as keyof typeof freshnessConfig;
                const FreshnessIcon = freshnessConfig[freshnessKey].icon;
                const isSelected = selectedItems.includes(context.id);

                return (
                  <tr
                    key={context.id}
                    className={`border-b border-(--color-border) transition-colors duration-200 hover:bg-(--color-background) ${isSelected ? 'bg-(--color-primary)/5' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(context.id)}
                        className="w-4 h-4 rounded accent-(--color-primary) cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-text-primary) max-w-md truncate">
                      {context.content}
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-text-secondary)">
                      {context.sourceMCP || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-text-tertiary)">
                      {context.timestamp ? format(new Date(context.timestamp), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-text-secondary) font-mono">
                      {context.tokenCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] ${freshnessConfig[freshnessKey].bgColor}`}>
                        <FreshnessIcon className={freshnessConfig[freshnessKey].color} size={14} />
                        <span className={`text-xs font-medium ${freshnessConfig[freshnessKey].color}`}>
                          {freshnessConfig[freshnessKey].label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-text-secondary)">
                      {context.isShared ? (
                        <span className="text-(--color-success)">Yes</span>
                      ) : (
                        <span className="text-(--color-text-tertiary)">No</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-(--color-border) flex items-center justify-between">
          <p className="text-sm text-(--color-text-tertiary)">
            Showing {filteredContexts.length} of {contexts.length} context items
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-(--color-border) rounded-[6px] text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Previous
            </button>
            <button className="px-4 py-2 border border-(--color-border) rounded-[6px] text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-modal] px-5 py-3 flex items-center gap-5 z-50"
          >
            <span className="text-sm font-medium text-(--color-text-primary)">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-(--color-primary) text-white rounded-[6px] text-sm font-medium hover:bg-(--color-primary-hover) transition-colors duration-200"
              >
                <RefreshCw size={16} />
                Refresh
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 border border-(--color-border) rounded-[6px] text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200"
              >
                <Archive size={16} />
                Archive
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 border border-(--color-error) rounded-[6px] text-sm font-medium text-(--color-error) hover:bg-(--color-error)/5 transition-colors duration-200"
              >
                <Trash2 size={16} />
                Delete
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
