'use client';

import { motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Legend item interface
 */
export interface LegendItem {
  label: string;
  color: string;
  description?: string;
  count?: number;
}

/**
 * Props for GraphLegend component
 */
export interface GraphLegendProps {
  /**
   * MCP color legend items
   */
  mcpColors?: LegendItem[];

  /**
   * Context status legend items
   */
  contextStatuses?: LegendItem[];

  /**
   * Whether the legend is collapsible
   */
  collapsible?: boolean;

  /**
   * Initial collapsed state
   */
  defaultCollapsed?: boolean;
}

/**
 * Graph Legend Component
 * Displays color coding and node types for the graph visualization
 *
 * @example
 * ```tsx
 * <GraphLegend
 *   mcpColors={[
 *     { label: 'GitHub MCP', color: '#0EA5E9', count: 5 },
 *     { label: 'Notion MCP', color: '#06B6D4', count: 3 },
 *   ]}
 *   contextStatuses={[
 *     { label: 'Fresh', color: '#10B981', description: 'Up to date' },
 *     { label: 'Outdated', color: '#F59E0B', description: '1-2 versions behind' },
 *   ]}
 * />
 * ```
 */
export function GraphLegend({
  mcpColors = [],
  contextStatuses = [
    {
      label: 'Fresh',
      color: '#10B981',
      description: 'Up to date with latest version',
    },
    {
      label: 'Outdated',
      color: '#F59E0B',
      description: '1-2 versions behind',
    },
    {
      label: 'Deprecated',
      color: '#EF4444',
      description: '3+ versions behind',
    },
  ],
  collapsible = true,
  defaultCollapsed = false,
}: GraphLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <motion.div
      className="absolute bottom-6 left-6 bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-subtle] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border) bg-(--color-background)">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-(--color-primary)" />
          <h3 className="text-sm font-semibold text-(--color-text-primary)">
            Graph Legend
          </h3>
        </div>

        {collapsible && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-6 h-6 rounded-[4px] flex items-center justify-center hover:bg-(--color-surface) transition-colors duration-200"
            aria-label={isCollapsed ? 'Expand legend' : 'Collapse legend'}
          >
            <X
              size={16}
              className={`text-(--color-text-secondary) transition-transform duration-200 ${
                isCollapsed ? 'rotate-45' : ''
              }`}
            />
          </motion.button>
        )}
      </div>

      {/* Content */}
      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={{
          height: isCollapsed ? 0 : 'auto',
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="p-4 space-y-4 max-w-xs">
          {/* Node Types Section */}
          <div>
            <h4 className="text-xs font-semibold text-(--color-text-primary) mb-2 uppercase tracking-wide">
              Node Types
            </h4>
            <div className="space-y-2">
              <LegendItemRow
                label="Clean (Central)"
                color="#0EA5E9"
                description="Main application node"
              />
              <LegendItemRow
                label="MCP Server"
                color="#06B6D4"
                description="Connected MCP servers"
              />
              <LegendItemRow
                label="Context"
                color="#64748B"
                description="Context items from MCPs"
              />
            </div>
          </div>

          {/* MCP Colors (if provided) */}
          {mcpColors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-(--color-text-primary) mb-2 uppercase tracking-wide">
                MCP Servers
              </h4>
              <div className="space-y-2">
                {mcpColors.map((item) => (
                  <LegendItemRow
                    key={item.label}
                    label={item.label}
                    color={item.color}
                    count={item.count}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Context Statuses */}
          <div>
            <h4 className="text-xs font-semibold text-(--color-text-primary) mb-2 uppercase tracking-wide">
              Context Status
            </h4>
            <div className="space-y-2">
              {contextStatuses.map((item) => (
                <LegendItemRow
                  key={item.label}
                  label={item.label}
                  color={item.color}
                  description={item.description}
                  count={item.count}
                />
              ))}
            </div>
          </div>

          {/* Interactions Hint */}
          <div className="pt-4 border-t border-(--color-border)">
            <h4 className="text-xs font-semibold text-(--color-text-primary) mb-2 uppercase tracking-wide">
              Interactions
            </h4>
            <div className="space-y-1.5 text-xs text-(--color-text-secondary)">
              <div className="flex items-start gap-2">
                <span className="text-(--color-text-tertiary)">•</span>
                <span>Click node to zoom in</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-(--color-text-tertiary)">•</span>
                <span>Drag to pan view</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-(--color-text-tertiary)">•</span>
                <span>Scroll to zoom</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-(--color-text-tertiary)">•</span>
                <span>Press Space to reset</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Legend Item Row Component
 * Individual legend item with color indicator
 */
function LegendItemRow({
  label,
  color,
  description,
  count,
}: {
  label: string;
  color: string;
  description?: string;
  count?: number;
}) {
  return (
    <div className="flex items-start gap-3">
      {/* Color indicator */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
        style={{ backgroundColor: color }}
      />

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-(--color-text-primary)">{label}</span>
          {count !== undefined && (
            <span className="text-xs text-(--color-text-tertiary) font-mono">
              ({count})
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-(--color-text-tertiary) mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Graph Stats Component
 * Displays graph statistics
 */
export function GraphStats({
  totalNodes,
  totalEdges,
  visibleNodes,
  selectedNode,
}: {
  totalNodes: number;
  totalEdges: number;
  visibleNodes: number;
  selectedNode?: string;
}) {
  return (
    <motion.div
      className="absolute top-6 left-6 bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-subtle] px-4 py-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-(--color-text-tertiary)">Nodes: </span>
          <span className="text-(--color-text-primary) font-semibold">
            {visibleNodes}/{totalNodes}
          </span>
        </div>
        <div>
          <span className="text-(--color-text-tertiary)">Edges: </span>
          <span className="text-(--color-text-primary) font-semibold">
            {totalEdges}
          </span>
        </div>
        {selectedNode && (
          <div className="text-(--color-primary) font-medium">
            Selected: {selectedNode}
          </div>
        )}
      </div>
    </motion.div>
  );
}
