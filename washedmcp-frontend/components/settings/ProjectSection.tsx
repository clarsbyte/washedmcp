'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { format } from 'date-fns';

export function ProjectSection() {
  const [projectName, setProjectName] = useState('Clean Project');
  const [projectDescription, setProjectDescription] = useState(
    'MCP visualization and management dashboard'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock dates - would come from backend
  const createdDate = new Date('2024-01-01');
  const lastModified = new Date();

  // Auto-save simulation on blur
  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-semibold text-(--color-text-primary) mb-2">
          Project Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={handleSave}
            className="w-full h-[44px] px-4 bg-(--color-surface) border border-(--color-border) rounded-[6px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:ring-3 focus:ring-(--color-primary)/20 focus:border-(--color-primary) transition-all duration-200"
            placeholder="Enter project name"
          />
          {isSaving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <div className="w-5 h-5 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Check className="text-(--color-success)" size={20} />
            </motion.div>
          )}
        </div>
        <p className="text-sm text-(--color-text-tertiary) mt-2">
          Changes are saved automatically
        </p>
      </div>

      {/* Project Description */}
      <div>
        <label className="block text-sm font-semibold text-(--color-text-primary) mb-2">
          Project Description
        </label>
        <textarea
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          onBlur={handleSave}
          rows={4}
          className="w-full px-4 py-3 bg-(--color-surface) border border-(--color-border) rounded-[6px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:ring-3 focus:ring-(--color-primary)/20 focus:border-(--color-primary) transition-all duration-200 resize-none"
          placeholder="Describe your project"
        />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-5 pt-5 border-t border-(--color-border)">
        <div>
          <p className="text-sm font-semibold text-(--color-text-primary) mb-2">
            Created
          </p>
          <p className="text-(--color-text-secondary)">
            {format(createdDate, 'MMMM dd, yyyy')}
          </p>
          <p className="text-sm text-(--color-text-tertiary) mt-1">
            {format(createdDate, 'h:mm a')}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-(--color-text-primary) mb-2">
            Last Modified
          </p>
          <p className="text-(--color-text-secondary)">
            {format(lastModified, 'MMMM dd, yyyy')}
          </p>
          <p className="text-sm text-(--color-text-tertiary) mt-1">
            {format(lastModified, 'h:mm a')}
          </p>
        </div>
      </div>

      {/* Project ID */}
      <div className="pt-5 border-t border-(--color-border)">
        <p className="text-sm font-semibold text-(--color-text-primary) mb-2">
          Project ID
        </p>
        <div className="flex items-center gap-3">
          <code className="flex-1 px-4 py-2 bg-(--color-background) border border-(--color-border) rounded-[6px] text-(--color-text-secondary) font-mono text-sm">
            proj_2k5h8x9m3n4p1q7r
          </code>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              navigator.clipboard.writeText('proj_2k5h8x9m3n4p1q7r');
            }}
            className="px-4 py-2 border border-(--color-border) rounded-[6px] text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200"
          >
            Copy
          </motion.button>
        </div>
        <p className="text-sm text-(--color-text-tertiary) mt-2">
          Use this ID for API integrations
        </p>
      </div>
    </div>
  );
}
