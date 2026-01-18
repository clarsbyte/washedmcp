'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Eye, EyeOff, Key, RefreshCw } from 'lucide-react';

export function DatabaseSection() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('connected');
  const [showConnectionString, setShowConnectionString] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  // Mock data - would come from backend
  const connectionString = 'bolt://localhost:7687';
  const maskedConnectionString = 'bolt://••••••••••••••••';
  const apiKey = 'sk_live_51HqJ8KLwW9xYz...';
  const maskedApiKey = 'sk_live_••••••••••••••••••••';

  const testConnection = async () => {
    setConnectionStatus('testing');
    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setConnectionStatus('connected');
  };

  const regenerateApiKey = () => {
    setShowRegenerateModal(false);
    // Simulate regeneration
    console.log('API Key regenerated');
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div>
        <h3 className="text-lg font-semibold text-(--color-text-primary) mb-4">
          Connection Status
        </h3>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-[6px] ${
            connectionStatus === 'connected'
              ? 'bg-(--color-success)/10 border border-(--color-success)/20'
              : connectionStatus === 'testing'
              ? 'bg-(--color-warning)/10 border border-(--color-warning)/20'
              : 'bg-(--color-error)/10 border border-(--color-error)/20'
          }`}>
            {connectionStatus === 'connected' && (
              <CheckCircle className="text-(--color-success)" size={20} />
            )}
            {connectionStatus === 'testing' && (
              <Loader2 className="text-(--color-warning) animate-spin" size={20} />
            )}
            {connectionStatus === 'disconnected' && (
              <XCircle className="text-(--color-error)" size={20} />
            )}
            <span className={`font-medium ${
              connectionStatus === 'connected'
                ? 'text-(--color-success)'
                : connectionStatus === 'testing'
                ? 'text-(--color-warning)'
                : 'text-(--color-error)'
            }`}>
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'testing' && 'Testing Connection...'}
              {connectionStatus === 'disconnected' && 'Disconnected'}
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={testConnection}
            disabled={connectionStatus === 'testing'}
            className="px-4 py-2 bg-(--color-primary) text-white rounded-[6px] text-sm font-medium hover:bg-(--color-primary-hover) transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Connection
          </motion.button>
        </div>
      </div>

      {/* Connection String */}
      <div className="pt-5 border-t border-(--color-border)">
        <h3 className="text-lg font-semibold text-(--color-text-primary) mb-4">
          Neo4j Connection
        </h3>
        <div>
          <label className="block text-sm font-semibold text-(--color-text-primary) mb-2">
            Connection String
          </label>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-2 bg-(--color-background) border border-(--color-border) rounded-[6px] text-(--color-text-secondary) font-mono text-sm">
              {showConnectionString ? connectionString : maskedConnectionString}
            </code>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowConnectionString(!showConnectionString)}
              className="p-2 border border-(--color-border) rounded-[6px] text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200"
            >
              {showConnectionString ? <EyeOff size={20} /> : <Eye size={20} />}
            </motion.button>
          </div>
          <p className="text-sm text-(--color-text-tertiary) mt-2">
            Bolt protocol connection to your Neo4j database
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-(--color-text-primary) mb-1">
              Host
            </p>
            <p className="text-(--color-text-secondary)">localhost</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-(--color-text-primary) mb-1">
              Port
            </p>
            <p className="text-(--color-text-secondary)">7687</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-(--color-text-primary) mb-1">
              Protocol
            </p>
            <p className="text-(--color-text-secondary)">Bolt</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-(--color-text-primary) mb-1">
              SSL/TLS
            </p>
            <p className="text-(--color-text-secondary)">Disabled</p>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="pt-5 border-t border-(--color-border)">
        <h3 className="text-lg font-semibold text-(--color-text-primary) mb-4">
          API Authentication
        </h3>
        <div>
          <label className="block text-sm font-semibold text-(--color-text-primary) mb-2">
            API Key
          </label>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-2 bg-(--color-background) border border-(--color-border) rounded-[6px] text-(--color-text-secondary) font-mono text-sm">
              {showApiKey ? apiKey : maskedApiKey}
            </code>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowApiKey(!showApiKey)}
              className="p-2 border border-(--color-border) rounded-[6px] text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200"
            >
              {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowRegenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-(--color-border) rounded-[6px] text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200"
            >
              <RefreshCw size={16} />
              Regenerate
            </motion.button>
          </div>
          <p className="text-sm text-(--color-text-tertiary) mt-2">
            Keep your API key secure and never share it publicly
          </p>
        </div>
      </div>

      {/* Regenerate Confirmation Modal */}
      <AnimatePresence>
        {showRegenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
            onClick={() => setShowRegenerateModal(false)}
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
                  <Key className="text-(--color-warning)" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-(--color-text-primary)">
                  Regenerate API Key?
                </h3>
              </div>

              <p className="text-(--color-text-secondary) mb-6">
                This will invalidate your current API key. Any applications using the old key will stop working immediately. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={regenerateApiKey}
                  className="flex-1 px-6 py-3 bg-(--color-warning) text-white rounded-[6px] font-medium hover:bg-(--color-warning)/90 transition-colors duration-200"
                >
                  Regenerate Key
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRegenerateModal(false)}
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
