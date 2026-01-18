'use client';

import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Layout,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState } from 'react';

/**
 * Graph control state
 */
export interface GraphControlsState {
  zoom: number;
  isPaused: boolean;
  showLabels: boolean;
  showEdges: boolean;
  filter: 'all' | 'active' | 'fresh' | 'outdated';
  layout: 'force' | 'radial' | 'hierarchical' | 'circular';
}

/**
 * Props for GraphControls component
 */
export interface GraphControlsProps {
  /**
   * Current control state
   */
  state: GraphControlsState;

  /**
   * Callback when state changes
   */
  onChange: (state: Partial<GraphControlsState>) => void;

  /**
   * Zoom in handler
   */
  onZoomIn: () => void;

  /**
   * Zoom out handler
   */
  onZoomOut: () => void;

  /**
   * Reset view handler
   */
  onReset: () => void;

  /**
   * Fit to screen handler
   */
  onFitToScreen: () => void;

  /**
   * Whether controls are disabled
   */
  disabled?: boolean;
}

/**
 * Graph Controls Component
 * Advanced controls for graph visualization
 * Provides zoom, layout, filtering, and animation controls
 *
 * @example
 * ```tsx
 * <GraphControls
 *   state={controlsState}
 *   onChange={handleControlsChange}
 *   onZoomIn={() => setZoom(z => z * 1.2)}
 *   onZoomOut={() => setZoom(z => z / 1.2)}
 *   onReset={resetView}
 *   onFitToScreen={fitToScreen}
 * />
 * ```
 */
export function GraphControls({
  state,
  onChange,
  onZoomIn,
  onZoomOut,
  onReset,
  onFitToScreen,
  disabled = false,
}: GraphControlsProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  // Control button base styles
  const buttonClass = `
    w-10 h-10 rounded-[6px] flex items-center justify-center
    bg-(--color-surface) border border-(--color-border)
    hover:bg-(--color-background) hover:border-(--color-primary)
    transition-all duration-200 shadow-[--shadow-subtle]
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:hover:bg-(--color-surface) disabled:hover:border-(--color-border)
  `;

  return (
    <motion.div
      className="absolute top-6 right-6 flex flex-col gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Zoom Controls */}
      <div className="flex flex-col gap-2 bg-(--color-surface) border border-(--color-border) rounded-[6px] p-2 shadow-[--shadow-subtle]">
        {/* Zoom In */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={onZoomIn}
          disabled={disabled}
          className={buttonClass}
          title="Zoom In (Cmd++)"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} className="text-(--color-text-secondary)" />
        </motion.button>

        {/* Zoom Out */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={onZoomOut}
          disabled={disabled}
          className={buttonClass}
          title="Zoom Out (Cmd+-)"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} className="text-(--color-text-secondary)" />
        </motion.button>

        {/* Zoom Percentage */}
        <div className="px-2 py-1 text-xs text-center text-(--color-text-tertiary) font-mono">
          {Math.round(state.zoom * 100)}%
        </div>

        {/* Fit to Screen */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={onFitToScreen}
          disabled={disabled}
          className={buttonClass}
          title="Fit to Screen (Cmd+0)"
          aria-label="Fit to screen"
        >
          <Maximize2 size={18} className="text-(--color-text-secondary)" />
        </motion.button>
      </div>

      {/* View Controls */}
      <div className="flex flex-col gap-2 bg-(--color-surface) border border-(--color-border) rounded-[6px] p-2 shadow-[--shadow-subtle]">
        {/* Toggle Labels */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={() => onChange({ showLabels: !state.showLabels })}
          disabled={disabled}
          className={`${buttonClass} ${state.showLabels ? 'bg-(--color-primary)/10 border-(--color-primary)' : ''}`}
          title={state.showLabels ? 'Hide Labels' : 'Show Labels'}
          aria-label={state.showLabels ? 'Hide labels' : 'Show labels'}
        >
          {state.showLabels ? (
            <Eye size={18} className="text-(--color-primary)" />
          ) : (
            <EyeOff size={18} className="text-(--color-text-secondary)" />
          )}
        </motion.button>

        {/* Toggle Edges */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={() => onChange({ showEdges: !state.showEdges })}
          disabled={disabled}
          className={`${buttonClass} ${state.showEdges ? 'bg-(--color-primary)/10 border-(--color-primary)' : ''}`}
          title={state.showEdges ? 'Hide Connections' : 'Show Connections'}
          aria-label={state.showEdges ? 'Hide edges' : 'Show edges'}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={state.showEdges ? 'text-(--color-primary)' : 'text-(--color-text-secondary)'}
          >
            <circle cx="3" cy="9" r="2" fill="currentColor" />
            <circle cx="15" cy="9" r="2" fill="currentColor" />
            {state.showEdges && (
              <line x1="5" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" />
            )}
          </svg>
        </motion.button>

        {/* Pause/Play Animation */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={() => onChange({ isPaused: !state.isPaused })}
          disabled={disabled}
          className={`${buttonClass} ${state.isPaused ? '' : 'bg-(--color-success)/10 border-(--color-success)'}`}
          title={state.isPaused ? 'Resume Animation' : 'Pause Animation'}
          aria-label={state.isPaused ? 'Resume animation' : 'Pause animation'}
        >
          {state.isPaused ? (
            <Play size={18} className="text-(--color-text-secondary)" />
          ) : (
            <Pause size={18} className="text-(--color-success)" />
          )}
        </motion.button>

        {/* Reset View */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={onReset}
          disabled={disabled}
          className={buttonClass}
          title="Reset View (Space)"
          aria-label="Reset view"
        >
          <RotateCcw size={18} className="text-(--color-text-secondary)" />
        </motion.button>
      </div>

      {/* Filter Menu */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          disabled={disabled}
          className={`${buttonClass} ${showFilterMenu || state.filter !== 'all' ? 'bg-(--color-primary)/10 border-(--color-primary)' : ''}`}
          title="Filter Nodes"
          aria-label="Filter nodes"
        >
          <Filter
            size={18}
            className={showFilterMenu || state.filter !== 'all' ? 'text-(--color-primary)' : 'text-(--color-text-secondary)'}
          />
        </motion.button>

        {showFilterMenu && (
          <motion.div
            className="absolute right-full mr-2 top-0 bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-modal] p-2 min-w-[160px]"
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-xs font-semibold text-(--color-text-primary) mb-2 px-2">
              Filter Nodes
            </div>
            {[
              { value: 'all', label: 'All Nodes' },
              { value: 'active', label: 'Active Only' },
              { value: 'fresh', label: 'Fresh Only' },
              { value: 'outdated', label: 'Outdated' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange({ filter: option.value as typeof state.filter });
                  setShowFilterMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-[4px] text-sm transition-colors duration-150 ${
                  state.filter === option.value
                    ? 'bg-(--color-primary)/10 text-(--color-primary)'
                    : 'text-(--color-text-secondary) hover:bg-(--color-background)'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Layout Menu */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={() => setShowLayoutMenu(!showLayoutMenu)}
          disabled={disabled}
          className={`${buttonClass} ${showLayoutMenu || state.layout !== 'force' ? 'bg-(--color-primary)/10 border-(--color-primary)' : ''}`}
          title="Change Layout"
          aria-label="Change layout"
        >
          <Layout
            size={18}
            className={showLayoutMenu || state.layout !== 'force' ? 'text-(--color-primary)' : 'text-(--color-text-secondary)'}
          />
        </motion.button>

        {showLayoutMenu && (
          <motion.div
            className="absolute right-full mr-2 top-0 bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-modal] p-2 min-w-[160px]"
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-xs font-semibold text-(--color-text-primary) mb-2 px-2">
              Graph Layout
            </div>
            {[
              { value: 'force', label: 'Force-Directed' },
              { value: 'radial', label: 'Radial' },
              { value: 'hierarchical', label: 'Hierarchical' },
              { value: 'circular', label: 'Circular' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange({ layout: option.value as typeof state.layout });
                  setShowLayoutMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-[4px] text-sm transition-colors duration-150 ${
                  state.layout === option.value
                    ? 'bg-(--color-primary)/10 text-(--color-primary)'
                    : 'text-(--color-text-secondary) hover:bg-(--color-background)'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
