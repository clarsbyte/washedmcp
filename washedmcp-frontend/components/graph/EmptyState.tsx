'use client';

import { motion } from 'framer-motion';
import { Server, Database, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  type?: 'no-mcps' | 'no-contexts';
  mcpName?: string;
}

export function EmptyState({ type = 'no-mcps', mcpName }: EmptyStateProps) {
  const config = type === 'no-mcps'
    ? {
        icon: Server,
        title: 'No MCPs Connected',
        description: 'Get started by connecting your first MCP server to begin visualizing your context relationships.',
        ctaText: 'Add Your First MCP',
        ctaHref: '/mcp',
      }
    : {
        icon: Database,
        title: 'No Context Items',
        description: mcpName
          ? `${mcpName} doesn't have any context items yet. Context will appear here once data is synced.`
          : 'This MCP doesn\'t have any context items yet. Context will appear here once data is synced.',
        ctaText: 'View All MCPs',
        ctaHref: '/mcp',
      };

  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="text-center max-w-md px-8"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            type: 'spring',
            stiffness: 200,
            damping: 15
          }}
          className="w-20 h-20 mx-auto mb-6 rounded-[6px] bg-(--color-primary)/10 flex items-center justify-center"
        >
          <Icon className="text-(--color-primary)" size={40} />
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-2xl font-bold text-(--color-text-primary) mb-3"
        >
          {config.title}
        </motion.h3>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="text-(--color-text-secondary) mb-8 leading-relaxed"
        >
          {config.description}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Link href={config.ctaHref}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-(--color-primary) text-white rounded-[6px] font-medium hover:bg-(--color-primary-hover) transition-colors duration-200 shadow-[--shadow-subtle]"
            >
              <Plus size={20} />
              {config.ctaText}
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
