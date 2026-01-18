'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useKeyboardShortcut } from './useKeyboardShortcut';
import type { GraphControlsState } from '@/components/graph/GraphControls';

/**
 * Graph controls hook configuration
 */
export interface GraphControlsConfig {
  /**
   * Initial zoom level
   * @default 1
   */
  initialZoom?: number;

  /**
   * Minimum zoom level
   * @default 0.1
   */
  minZoom?: number;

  /**
   * Maximum zoom level
   * @default 5
   */
  maxZoom?: number;

  /**
   * Zoom step multiplier
   * @default 1.2
   */
  zoomStep?: number;

  /**
   * Initial paused state
   * @default false
   */
  initialPaused?: boolean;

  /**
   * Initial show labels state
   * @default true
   */
  initialShowLabels?: boolean;

  /**
   * Initial show edges state
   * @default true
   */
  initialShowEdges?: boolean;

  /**
   * Initial filter
   * @default 'all'
   */
  initialFilter?: GraphControlsState['filter'];

  /**
   * Initial layout
   * @default 'force'
   */
  initialLayout?: GraphControlsState['layout'];

  /**
   * Enable keyboard shortcuts
   * @default true
   */
  enableKeyboardShortcuts?: boolean;
}

/**
 * Custom hook for managing graph controls
 * Handles zoom, layout, filtering, and animation state
 *
 * @example
 * ```tsx
 * const {
 *   controlsState,
 *   zoom,
 *   zoomIn,
 *   zoomOut,
 *   resetZoom,
 *   fitToScreen,
 *   updateControls,
 *   resetView,
 * } = useGraphControls({
 *   initialZoom: 1,
 *   enableKeyboardShortcuts: true,
 * });
 * ```
 */
export function useGraphControls(config: GraphControlsConfig = {}) {
  const {
    initialZoom = 1,
    minZoom = 0.1,
    maxZoom = 5,
    zoomStep = 1.2,
    initialPaused = false,
    initialShowLabels = true,
    initialShowEdges = true,
    initialFilter = 'all',
    initialLayout = 'force',
    enableKeyboardShortcuts = true,
  } = config;

  // Controls state
  const [controlsState, setControlsState] = useState<GraphControlsState>({
    zoom: initialZoom,
    isPaused: initialPaused,
    showLabels: initialShowLabels,
    showEdges: initialShowEdges,
    filter: initialFilter,
    layout: initialLayout,
  });

  const zoomRef = useRef(initialZoom);

  /**
   * Zoom in
   */
  const zoomIn = useCallback(() => {
    setControlsState((prev) => {
      const newZoom = Math.min(prev.zoom * zoomStep, maxZoom);
      zoomRef.current = newZoom;
      return { ...prev, zoom: newZoom };
    });
  }, [zoomStep, maxZoom]);

  /**
   * Zoom out
   */
  const zoomOut = useCallback(() => {
    setControlsState((prev) => {
      const newZoom = Math.max(prev.zoom / zoomStep, minZoom);
      zoomRef.current = newZoom;
      return { ...prev, zoom: newZoom };
    });
  }, [zoomStep, minZoom]);

  /**
   * Reset zoom to initial level
   */
  const resetZoom = useCallback(() => {
    zoomRef.current = initialZoom;
    setControlsState((prev) => ({ ...prev, zoom: initialZoom }));
  }, [initialZoom]);

  /**
   * Set specific zoom level
   */
  const setZoomLevel = useCallback(
    (level: number) => {
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, level));
      zoomRef.current = clampedZoom;
      setControlsState((prev) => ({ ...prev, zoom: clampedZoom }));
    },
    [minZoom, maxZoom]
  );

  /**
   * Fit to screen (calculate zoom to fit all nodes)
   */
  const fitToScreen = useCallback(() => {
    // This would typically calculate based on canvas size and node positions
    // For now, reset to initial zoom
    resetZoom();
  }, [resetZoom]);

  /**
   * Update controls state
   */
  const updateControls = useCallback((updates: Partial<GraphControlsState>) => {
    setControlsState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset entire view (zoom, pan, rotation)
   */
  const resetView = useCallback(() => {
    resetZoom();
    // Additional reset logic would go here (pan, rotation, etc.)
  }, [resetZoom]);

  /**
   * Toggle pause state
   */
  const togglePause = useCallback(() => {
    setControlsState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  /**
   * Toggle labels
   */
  const toggleLabels = useCallback(() => {
    setControlsState((prev) => ({ ...prev, showLabels: !prev.showLabels }));
  }, []);

  /**
   * Toggle edges
   */
  const toggleEdges = useCallback(() => {
    setControlsState((prev) => ({ ...prev, showEdges: !prev.showEdges }));
  }, []);

  /**
   * Set filter
   */
  const setFilter = useCallback((filter: GraphControlsState['filter']) => {
    setControlsState((prev) => ({ ...prev, filter }));
  }, []);

  /**
   * Set layout
   */
  const setLayout = useCallback((layout: GraphControlsState['layout']) => {
    setControlsState((prev) => ({ ...prev, layout }));
  }, []);

  const shortcuts = useMemo(
    () =>
      enableKeyboardShortcuts
        ? [
            {
              keys: 'Cmd+Plus',
              callback: zoomIn,
              description: 'Zoom in',
              category: 'Graph',
            },
            {
              keys: 'Cmd+Minus',
              callback: zoomOut,
              description: 'Zoom out',
              category: 'Graph',
            },
            {
              keys: 'Cmd+0',
              callback: resetZoom,
              description: 'Reset zoom',
              category: 'Graph',
            },
            {
              keys: 'Space',
              callback: resetView,
              description: 'Reset view',
              category: 'Graph',
              disableInInput: true,
            },
          ]
        : [],
    [enableKeyboardShortcuts, resetView, resetZoom, zoomIn, zoomOut]
  );

  useKeyboardShortcut(shortcuts);

  return {
    // State
    controlsState,
    zoom,

    // Zoom controls
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
    fitToScreen,

    // General controls
    updateControls,
    resetView,

    // Toggle controls
    togglePause,
    toggleLabels,
    toggleEdges,

    // Set controls
    setFilter,
    setLayout,

    // Refs
    zoomRef,
  };
}
