'use client';

import { motion } from 'framer-motion';
import { GraphView } from '@/components/graph/GraphView';
import { useAppLoadAnimation } from '@/components/layout/AppLoadProvider';

export default function DashboardPage() {
  const { shouldAnimate, ready } = useAppLoadAnimation();
  const pageMotion = shouldAnimate
    ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    : { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } };

  if (!ready) {
    return <div className="min-h-screen p-6 opacity-0" />;
  }

  return (
    <motion.div className="min-h-screen p-6" {...pageMotion}>
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-(--color-text-primary) mb-1">
          Dashboard
        </h1>
        <p className="text-(--color-text-secondary) text-base">
          Visualize your MCP connections and context relationships
        </p>
      </div>

      {/* Graph Container */}
      <div className="w-full h-[calc(100vh-200px)] bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-subtle] overflow-hidden">
        <GraphView />
      </div>
    </motion.div>
  );
}
