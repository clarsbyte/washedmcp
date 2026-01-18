'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * MCP (Model Context Protocol) server data structure
 */
export interface MCP {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  contextCount: number;
  lastSync?: Date;
  connectionConfig?: Record<string, unknown>;
}

/**
 * Context item data structure
 */
export interface ContextNode {
  id: string;
  mcpId: string;
  content: string;
  freshness: 'fresh' | 'outdated' | 'deprecated';
  timestamp?: Date;
  tokenCount?: number;
  sourceMCP?: string;
}

/**
 * Graph node for visualization
 */
export interface GraphNode {
  id: string;
  label: string;
  fill: string;
  size: number;
  data?: MCP | ContextNode;
}

/**
 * Graph edge for visualization
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  fill?: string;
  interpolation?: 'linear' | 'curved';
}

/**
 * Zoom layer type for graph navigation
 */
export type ZoomLayer = 1 | 2 | 3;

/**
 * Custom hook for managing graph visualization data
 * Handles MCPs, contexts, and graph state with persistence
 *
 * @example
 * ```tsx
 * const {
 *   mcps,
 *   contexts,
 *   currentLayer,
 *   selectedMCP,
 *   addMCP,
 *   updateMCP,
 *   deleteMCP,
 *   getGraphNodes,
 *   getGraphEdges,
 * } = useGraphData();
 * ```
 */
export function useGraphData() {
  // Persistent storage for MCPs and contexts
  const [mcps, setMCPs] = useLocalStorage<MCP[]>('clean-mcps', []);
  const [contexts, setContexts] = useLocalStorage<ContextNode[]>('clean-contexts', []);

  // Graph navigation state
  const [currentLayer, setCurrentLayer] = useState<ZoomLayer>(1);
  const [selectedMCP, setSelectedMCP] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<ContextNode | null>(null);

  // MCP Colors (cycle through for different MCPs)
  const mcpColors = useMemo(
    () => ['#0EA5E9', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
    []
  );

  /**
   * Add a new MCP
   */
  const addMCP = useCallback(
    (mcp: Omit<MCP, 'id'>) => {
      const newMCP: MCP = {
        ...mcp,
        id: `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      setMCPs((prev) => [...prev, newMCP]);
      return newMCP;
    },
    [setMCPs]
  );

  /**
   * Update an existing MCP
   */
  const updateMCP = useCallback(
    (id: string, updates: Partial<MCP>) => {
      setMCPs((prev) => prev.map((mcp) => (mcp.id === id ? { ...mcp, ...updates } : mcp)));
    },
    [setMCPs]
  );

  /**
   * Delete an MCP and its associated contexts
   */
  const deleteMCP = useCallback(
    (id: string) => {
      setMCPs((prev) => prev.filter((mcp) => mcp.id !== id));
      setContexts((prev) => prev.filter((ctx) => ctx.mcpId !== id));
    },
    [setMCPs, setContexts]
  );

  /**
   * Add a new context item
   */
  const addContext = useCallback(
    (context: Omit<ContextNode, 'id'>) => {
      const newContext: ContextNode = {
        ...context,
        id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      setContexts((prev) => [...prev, newContext]);

      // Update MCP context count
      const mcpContextsCount = contexts.filter((c) => c.mcpId === context.mcpId).length + 1;
      updateMCP(context.mcpId, { contextCount: mcpContextsCount });

      return newContext;
    },
    [setContexts, contexts, updateMCP]
  );

  /**
   * Update an existing context
   */
  const updateContext = useCallback(
    (id: string, updates: Partial<ContextNode>) => {
      setContexts((prev) => prev.map((ctx) => (ctx.id === id ? { ...ctx, ...updates } : ctx)));
    },
    [setContexts]
  );

  /**
   * Delete a context item
   */
  const deleteContext = useCallback(
    (id: string) => {
      const context = contexts.find((c) => c.id === id);
      setContexts((prev) => prev.filter((ctx) => ctx.id !== id));

      // Update MCP context count
      if (context) {
        const mcpContextsCount = contexts.filter((c) => c.mcpId === context.mcpId).length - 1;
        updateMCP(context.mcpId, { contextCount: mcpContextsCount });
      }
    },
    [setContexts, contexts, updateMCP]
  );

  /**
   * Get graph nodes based on current layer
   */
  const getGraphNodes = useCallback((): GraphNode[] => {
    if (currentLayer === 1) {
      // Layer 1: Clean central node + MCP nodes
      return [
        {
          id: 'clean',
          label: 'Clean',
          fill: '#0EA5E9',
          size: 20,
        },
        ...mcps.map((mcp, index) => ({
          id: mcp.id,
          label: mcp.name,
          fill: mcpColors[index % mcpColors.length],
          size: 12,
          data: mcp,
        })),
      ];
    } else if (currentLayer === 2 && selectedMCP) {
      // Layer 2: Selected MCP + Context nodes
      const mcp = mcps.find((m) => m.id === selectedMCP);
      const mcpContexts = contexts.filter((c) => c.mcpId === selectedMCP);

      return [
        {
          id: selectedMCP,
          label: mcp?.name || 'MCP',
          fill: mcpColors[mcps.findIndex((m) => m.id === selectedMCP) % mcpColors.length],
          size: 18,
          data: mcp,
        },
        ...mcpContexts.map((ctx) => ({
          id: ctx.id,
          label: ctx.content.substring(0, 50) + (ctx.content.length > 50 ? '...' : ''),
          fill:
            ctx.freshness === 'fresh'
              ? '#10B981'
              : ctx.freshness === 'outdated'
              ? '#F59E0B'
              : '#EF4444',
          size: 10,
          data: ctx,
        })),
      ];
    }

    return [];
  }, [currentLayer, selectedMCP, mcps, contexts, mcpColors]);

  /**
   * Get graph edges based on current layer
   */
  const getGraphEdges = useCallback((): GraphEdge[] => {
    if (currentLayer === 1) {
      // Layer 1: Clean → MCPs
      return mcps.map((mcp) => ({
        id: `clean-${mcp.id}`,
        source: 'clean',
        target: mcp.id,
        label: `${mcp.contextCount} contexts`,
        fill: '#06B6D4',
        interpolation: 'curved' as const,
      }));
    } else if (currentLayer === 2 && selectedMCP) {
      // Layer 2: MCP → Contexts
      const mcpContexts = contexts.filter((c) => c.mcpId === selectedMCP);
      return mcpContexts.map((ctx) => ({
        id: `${selectedMCP}-${ctx.id}`,
        source: selectedMCP,
        target: ctx.id,
        fill: '#64748B',
        interpolation: 'curved' as const,
      }));
    }

    return [];
  }, [currentLayer, selectedMCP, mcps, contexts]);

  /**
   * Navigate to a specific layer
   */
  const navigateToLayer = useCallback(
    (layer: ZoomLayer, mcpId?: string) => {
      setCurrentLayer(layer);
      if (layer === 2 && mcpId) {
        setSelectedMCP(mcpId);
      } else if (layer === 1) {
        setSelectedMCP(null);
        setSelectedContext(null);
      }
    },
    []
  );

  /**
   * Reset to layer 1
   */
  const resetGraph = useCallback(() => {
    navigateToLayer(1);
  }, [navigateToLayer]);

  /**
   * Get contexts for a specific MCP
   */
  const getContextsByMCP = useCallback(
    (mcpId: string) => {
      return contexts.filter((ctx) => ctx.mcpId === mcpId);
    },
    [contexts]
  );

  /**
   * Get MCP by ID
   */
  const getMCPById = useCallback(
    (id: string) => {
      return mcps.find((mcp) => mcp.id === id);
    },
    [mcps]
  );

  /**
   * Get stats for dashboard
   */
  const stats = useMemo(
    () => ({
      totalMCPs: mcps.length,
      activeMCPs: mcps.filter((m) => m.status === 'active').length,
      totalContexts: contexts.length,
      freshContexts: contexts.filter((c) => c.freshness === 'fresh').length,
      outdatedContexts: contexts.filter((c) => c.freshness === 'outdated').length,
      deprecatedContexts: contexts.filter((c) => c.freshness === 'deprecated').length,
    }),
    [mcps, contexts]
  );

  return {
    // Data
    mcps,
    contexts,
    stats,

    // State
    currentLayer,
    selectedMCP,
    selectedContext,

    // MCP operations
    addMCP,
    updateMCP,
    deleteMCP,
    getMCPById,

    // Context operations
    addContext,
    updateContext,
    deleteContext,
    getContextsByMCP,

    // Graph operations
    getGraphNodes,
    getGraphEdges,
    navigateToLayer,
    resetGraph,
    setSelectedContext,

    // Utilities
    mcpColors,
  };
}
