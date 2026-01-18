'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export function DataSection() {
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Mock data - would come from backend
  const lastBackup = new Date('2024-01-14T08:30:00');

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsExporting(false);
    // Would trigger download here
    console.log('Exporting all data...');
  };

  const handleClearData = () => {
    setShowClearModal(false);
    console.log('Clearing all context data...');
  };

  const handleDeleteProject = () => {
    if (deleteConfirmText === 'DELETE') {
      setShowDeleteModal(false);
      console.log('Deleting project...');
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Data */}
      <div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[6px] bg-(--color-info)/10 flex items-center justify-center flex-shrink-0">
            <Download className="text-(--color-info)" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-(--color-text-primary) mb-2">
              Export All Data
            </h3>
            <p className="text-(--color-text-secondary) mb-4">
              Download a complete export of your project data, including all contexts, MCPs, and configurations. The export will be in JSON format.
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-(--color-primary) text-white rounded-[6px] font-medium hover:bg-(--color-primary-hover) transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Export Data
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Last Backup */}
      <div className="pt-5 border-t border-(--color-border)">
        <div className="flex items-center gap-3 p-4 bg-(--color-success)/10 border border-(--color-success)/20 rounded-[6px]">
          <CheckCircle className="text-(--color-success) flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-(--color-success) mb-1">
              Last Backup
            </p>
            <p className="text-sm text-(--color-text-secondary)">
              {format(lastBackup, 'MMMM dd, yyyy')} at {format(lastBackup, 'h:mm a')}
            </p>
          </div>
        </div>
      </div>

      {/* Clear All Context Data */}
      <div className="pt-5 border-t border-(--color-border)">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[6px] bg-(--color-warning)/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-(--color-warning)" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-(--color-text-primary) mb-2">
              Clear All Context Data
            </h3>
            <p className="text-(--color-text-secondary) mb-4">
              Permanently delete all context items from your library. This will not affect your MCP connections or team members. This action cannot be undone.
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowClearModal(true)}
              className="px-5 py-2.5 border border-(--color-warning) text-(--color-warning) rounded-[6px] font-medium hover:bg-(--color-warning)/5 transition-colors duration-200"
            >
              Clear All Data
            </motion.button>
          </div>
        </div>
      </div>

      {/* Delete Project */}
      <div className="pt-5 border-t border-(--color-border)">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[6px] bg-(--color-error)/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="text-(--color-error)" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-(--color-text-primary) mb-2">
              Delete Project
            </h3>
            <p className="text-(--color-text-secondary) mb-4">
              Permanently delete this entire project, including all contexts, MCPs, team members, and settings. This action is irreversible and cannot be undone.
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-2.5 bg-(--color-error) text-white rounded-[6px] font-medium hover:bg-(--color-error)/90 transition-colors duration-200"
            >
              Delete Project
            </motion.button>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
            onClick={() => setShowClearModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-modal] p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-[6px] bg-(--color-warning)/10 flex items-center justify-center">
                  <AlertTriangle className="text-(--color-warning)" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-(--color-text-primary)">
                  Clear All Context Data?
                </h3>
              </div>

              <p className="text-(--color-text-secondary) mb-6">
                This will permanently delete all context items from your library. Your MCP connections and team settings will remain intact. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClearData}
                  className="flex-1 px-6 py-3 bg-(--color-warning) text-white rounded-[6px] font-medium hover:bg-(--color-warning)/90 transition-colors duration-200"
                >
                  Clear All Data
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowClearModal(false)}
                  className="px-6 py-3 border border-(--color-border) rounded-[6px] font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Project Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmText('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-modal] p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-[6px] bg-(--color-error)/10 flex items-center justify-center">
                  <Trash2 className="text-(--color-error)" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-(--color-text-primary)">
                  Delete Project?
                </h3>
              </div>

              <p className="text-(--color-text-secondary) mb-4">
                This will permanently delete your entire project, including:
              </p>

              <ul className="list-disc list-inside text-(--color-text-secondary) mb-6 space-y-1">
                <li>All context items</li>
                <li>All MCP connections</li>
                <li>All team members and permissions</li>
                <li>All project settings and configurations</li>
              </ul>

              <p className="text-(--color-error) font-semibold mb-4">
                This action is irreversible and cannot be undone.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-(--color-text-primary) mb-2">
                  Type <span className="font-mono bg-(--color-background) px-2 py-0.5 rounded">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full h-[44px] px-4 bg-(--color-surface) border border-(--color-border) rounded-[6px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:ring-3 focus:ring-(--color-error)/20 focus:border-(--color-error) transition-all duration-200"
                  placeholder="Type DELETE"
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteProject}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 px-6 py-3 bg-(--color-error) text-white rounded-[6px] font-medium hover:bg-(--color-error)/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Forever
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-6 py-3 border border-(--color-border) rounded-[6px] font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
