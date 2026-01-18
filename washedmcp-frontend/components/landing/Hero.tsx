'use client';

import { motion } from 'framer-motion';

export function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex min-h-screen items-center justify-center"
    >
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold text-(--color-text-primary)">
          Hero Component
        </h1>
      </div>
    </motion.section>
  );
}
