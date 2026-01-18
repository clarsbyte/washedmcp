'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Database, BarChart3, Trash2 } from 'lucide-react';
import { ProjectSection } from '@/components/settings/ProjectSection';
import { DatabaseSection } from '@/components/settings/DatabaseSection';
import { UsageSection } from '@/components/settings/UsageSection';
import { DataSection } from '@/components/settings/DataSection';
import { useAppLoadAnimation } from '@/components/layout/AppLoadProvider';

const sections = [
  { id: 'project', label: 'Project', icon: SettingsIcon },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'data', label: 'Data', icon: Trash2 },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('project');
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
          Settings
        </h1>
        <p className="text-(--color-text-secondary) text-base">
          Manage your project configuration and preferences
        </p>
      </div>

      {/* Settings Layout */}
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <motion.button
                  key={section.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[6px] text-left transition-colors duration-200 ${
                    isActive
                      ? 'bg-(--color-primary) text-white shadow-[--shadow-subtle]'
                      : 'text-(--color-text-secondary) hover:bg-(--color-background)'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{section.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <motion.div
          key={activeSection}
          initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <div className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-subtle] p-6">
            {activeSection === 'project' && (
              <div>
                <h2 className="text-xl font-semibold text-(--color-text-primary) mb-5">
                  Project Settings
                </h2>
                <ProjectSection />
              </div>
            )}

            {activeSection === 'database' && (
              <div>
                <h2 className="text-xl font-semibold text-(--color-text-primary) mb-5">
                  Database Settings
                </h2>
                <DatabaseSection />
              </div>
            )}

            {activeSection === 'usage' && (
              <div>
                <h2 className="text-xl font-semibold text-(--color-text-primary) mb-5">
                  Usage & Limits
                </h2>
                <UsageSection />
              </div>
            )}

            {activeSection === 'data' && (
              <div>
                <h2 className="text-xl font-semibold text-(--color-text-primary) mb-5">
                  Data Management
                </h2>
                <DataSection />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
