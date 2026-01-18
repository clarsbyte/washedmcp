'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '../Skeleton';

/**
 * Graph Skeleton Component
 * Loading state for graph visualization
 * Shows animated placeholder nodes and edges
 *
 * @example
 * ```tsx
 * <GraphSkeleton />
 * ```
 */
export function GraphSkeleton() {
  const nodeCount = 6; // Clean node + 5 MCP nodes

  // Generate random positions for skeleton nodes (deterministic for consistency)
  const nodePositions = Array.from({ length: nodeCount }).map((_, i) => {
    const angle = (i / (nodeCount - 1)) * 2 * Math.PI;
    const radius = i === 0 ? 0 : 200; // Center node at 0, others at radius 200
    return {
      x: 50 + Math.cos(angle) * (radius / 5), // Percentage-based
      y: 50 + Math.sin(angle) * (radius / 5),
      size: i === 0 ? 80 : 64, // Center node larger
    };
  });

  return (
    <div className="relative w-full h-full min-h-[600px] bg-(--color-background) rounded-[6px] border border-(--color-border) overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Animated connecting lines (edges) */}
      <svg className="absolute inset-0 w-full h-full">
        {nodePositions.slice(1).map((pos, i) => (
          <motion.line
            key={`edge-${i}`}
            x1="50%"
            y1="50%"
            x2={`${pos.x}%`}
            y2={`${pos.y}%`}
            stroke="var(--color-border)"
            strokeWidth="2"
            strokeOpacity="0.4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        ))}
      </svg>

      {/* Animated nodes */}
      {nodePositions.map((pos, i) => (
        <motion.div
          key={`node-${i}`}
          className="absolute"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: i * 0.1,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <Skeleton
            variant="circle"
            width={pos.size}
            height={pos.size}
            className="shadow-[--shadow-subtle]"
          />
          {/* Node label */}
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <Skeleton
              variant="text"
              width={i === 0 ? '60px' : '80px'}
              height="14px"
            />
          </div>
        </motion.div>
      ))}

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-subtle]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-(--color-primary)"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <span className="text-sm text-(--color-text-secondary)">
          Loading graph...
        </span>
      </motion.div>
    </div>
  );
}

/**
 * Empty Graph Skeleton
 * Minimal loading state for empty graph
 */
export function EmptyGraphSkeleton() {
  return (
    <div className="relative w-full h-full min-h-[600px] bg-(--color-background) rounded-[6px] border border-(--color-border) overflow-hidden flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Skeleton variant="circle" width={80} height={80} className="mx-auto mb-4" />
        <Skeleton variant="text" width={200} height={20} className="mx-auto mb-2" />
        <Skeleton variant="text" width={150} height={16} className="mx-auto" />
      </motion.div>
    </div>
  );
}
