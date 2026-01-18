'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GraphCanvas, GraphCanvasRef, Theme, lightTheme } from 'reagraph';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { NodeModal } from './NodeModal';

// Types for MCP and Context data
type MCP = {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  contextCount: number;
  lastSync?: string;
};

type ContextNode = {
  id: string;
  mcpId: string;
  content: string;
  freshness: 'fresh' | 'outdated' | 'deprecated';
  timestamp?: string;
  tokenCount?: number;
  sourceMCP?: string;
};

// MCP node colors (cycle through)
const mcpColors = [
  '#0EA5E9', // --color-node-1
  '#06B6D4', // --color-node-2
  '#8B5CF6', // --color-node-3
  '#EC4899', // --color-node-4
  '#F59E0B', // --color-node-5
  '#10B981', // --color-node-6
];

const graphTheme: Theme = {
  ...lightTheme,
  canvas: {
    ...lightTheme.canvas,
    background: '#F8FAFC',
    fog: '#F1F5F9',
  },
  node: {
    ...lightTheme.node,
    fill: '#0EA5E9',
    activeFill: '#0284C7',
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.2,
    label: {
      ...lightTheme.node.label,
      color: '#0F172A',
      backgroundColor: 'transparent',
      backgroundOpacity: 0,
      padding: 0,
      radius: 0,
      strokeColor: 'transparent',
      strokeWidth: 0,
      fontSize: 11,
    },
    subLabel: {
      ...lightTheme.node.subLabel,
      color: '#64748B',
      fontSize: 10,
    },
  },
  edge: {
    ...lightTheme.edge,
    fill: '#38BDF8',
    activeFill: '#0EA5E9',
    opacity: 0.7,
    selectedOpacity: 1,
    inactiveOpacity: 0.15,
    label: {
      ...lightTheme.edge.label,
      color: '#0F172A',
      fontSize: 10,
    },
    subLabel: {
      ...lightTheme.edge.subLabel,
      color: '#64748B',
      fontSize: 9,
    },
  },
  arrow: {
    ...lightTheme.arrow,
    fill: '#38BDF8',
    activeFill: '#0EA5E9',
  },
};

const nodeSizing = {
  clean: 8,
  mcp: 6,
  context: 5,
};

type ZoomLayer = 1 | 2 | 3;

type GraphNodeClick = {
  id: string;
};

export function GraphView() {
  // Data state
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [contexts, setContexts] = useState<ContextNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Graph state
  const [currentLayer, setCurrentLayer] = useState<ZoomLayer>(1);
  const [selectedMCP, setSelectedMCP] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<ContextNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const graphRef = useRef<GraphCanvasRef>(null);
  const controls = useAnimationControls();
  const fitRetryRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);
  const layer1Ids = useMemo(() => ['clean', ...mcps.map((mcp) => mcp.id)], [mcps]);

  // Fetch graph data from Neo4j
  useEffect(() => {
    async function fetchGraphData() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/graph');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch graph data: ${response.statusText}`);
        }

        const data = await response.json();
        setMcps(data.mcps || []);
        setContexts(data.contexts || []);
      } catch (err) {
        console.error('Error fetching graph data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load graph data');
        // Fallback to empty arrays on error
        setMcps([]);
        setContexts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGraphData();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fitNodesToViewRef = useRef<(ids: string[], attempt?: number) => void>(() => {});

  const fitNodesToView = useCallback((ids: string[], attempt = 0) => {
    const graph = graphRef.current?.getGraph?.();
    if (!graph || ids.length === 0) return;

    const existingIds = ids.filter((id) => graph.hasNode(id));
    if (existingIds.length !== ids.length) {
      if (attempt >= 6) return;
      if (fitRetryRef.current) {
        window.clearTimeout(fitRetryRef.current);
      }
      fitRetryRef.current = window.setTimeout(() => {
        fitNodesToViewRef.current(ids, attempt + 1);
      }, 60);
      return;
    }

    const scheduleRetry = () => {
      if (attempt < 6) {
        fitRetryRef.current = window.setTimeout(() => {
          fitNodesToViewRef.current(ids, attempt + 1);
        }, 60);
      }
    };

    try {
      const graphNow = graphRef.current?.getGraph?.();
      if (!graphNow || !ids.every((id) => graphNow.hasNode(id))) {
        scheduleRetry();
        return;
      }

      window.setTimeout(() => {
        try {
          const graphLatest = graphRef.current?.getGraph?.();
          if (!graphLatest || !ids.every((id) => graphLatest.hasNode(id))) {
            scheduleRetry();
            return;
          }
          graphRef.current?.fitNodesInView(ids, { fitOnlyIfNodesNotInView: false });
        } catch {
          scheduleRetry();
        }
      }, 0);
    } catch {
      if (attempt < 6) {
        fitRetryRef.current = window.setTimeout(() => {
          fitNodesToViewRef.current(ids, attempt + 1);
        }, 60);
      }
    }

  }, []);
  
  useEffect(() => {
    fitNodesToViewRef.current = fitNodesToView;
  }, [fitNodesToView]);

  // Generate nodes based on current layer
  const getNodesForLayer = useCallback(() => {
    if (currentLayer === 1) {
      // Layer 1: Clean central node + MCP nodes
      const nodes = [
        {
          id: 'clean',
          label: 'Clean',
          fill: '#0EA5E9',
          size: nodeSizing.clean,
        },
        ...mcps.map((mcp, index) => ({
          id: mcp.id,
          label: mcp.name,
          fill: mcpColors[index % mcpColors.length],
          size: nodeSizing.mcp,
          data: mcp,
        })),
      ];

      return nodes;
    } else if (currentLayer === 2 && selectedMCP) {
      // Layer 2: Selected MCP + Context nodes
      const mcp = mcps.find((m) => m.id === selectedMCP);
      const mcpContexts = contexts.filter((c) => c.mcpId === selectedMCP);

      const nodes = [
        {
          id: selectedMCP,
          label: mcp?.name || 'MCP',
          fill: mcpColors[mcps.findIndex((m) => m.id === selectedMCP) % mcpColors.length],
          size: nodeSizing.mcp,
          data: mcp,
        },
        ...mcpContexts.map((ctx) => ({
          id: ctx.id,
          label: ctx.content,
          fill: ctx.freshness === 'fresh' ? '#10B981' : ctx.freshness === 'outdated' ? '#F59E0B' : '#EF4444',
          size: nodeSizing.context,
          data: ctx,
        })),
      ];

      return nodes;
    }

    return [];
  }, [currentLayer, selectedMCP, mcps, contexts]);

  // Generate edges based on current layer
  const getEdgesForLayer = useCallback(() => {
    if (currentLayer === 1) {
      // Layer 1: Clean → MCPs
      return mcps.map((mcp) => ({
        id: `clean-${mcp.id}`,
        source: 'clean',
        target: mcp.id,
        label: `${mcp.contextCount} contexts`,
        fill: '#06B6D4',
      }));
    } else if (currentLayer === 2 && selectedMCP) {
      // Layer 2: MCP → Contexts
      const mcpContexts = contexts.filter((c) => c.mcpId === selectedMCP);
      return mcpContexts.map((ctx) => ({
        id: `${selectedMCP}-${ctx.id}`,
        source: selectedMCP,
        target: ctx.id,
        fill: '#64748B',
      }));
    }

    return [];
  }, [currentLayer, selectedMCP, mcps, contexts]);

  // Handle node click - zoom into MCP or open context modal
  const handleNodeClick = useCallback(
    async (node: GraphNodeClick) => {
      if (isAnimating) return; // Prevent clicks during animation

      if (currentLayer === 1 && node.id !== 'clean') {
        // Zoom into MCP (Layer 1 → Layer 2)
        setIsAnimating(true);

        // 1. Fade out current layer
        if (!isMountedRef.current) return;
        await controls.start({
          opacity: 0,
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
        });

        // 2. Switch layer and node
        setSelectedMCP(node.id);
        setCurrentLayer(2);

        // 3. Wait for DOM update
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 4. Let layout settle without forcing camera jumps

        // 5. Fade in new layer
        if (!isMountedRef.current) return;
        await controls.start({
          opacity: 1,
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
        });

        setIsAnimating(false);
      } else if (currentLayer === 2 && node.id !== selectedMCP) {
        // Open context modal (Layer 2 → Layer 3 modal)
        const contextData = contexts.find((ctx) => ctx.id === node.id);
        if (contextData) {
          setSelectedContext(contextData);
          setIsModalOpen(true);
        }
      }
    },
    [currentLayer, selectedMCP, isAnimating, controls]
  );

  // Reset to Layer 1
  const handleReset = useCallback(async () => {
    if (isAnimating) return; // Prevent clicks during animation
    setIsAnimating(true);

    // 1. Fade out current layer
    if (!isMountedRef.current) return;
    await controls.start({
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    });

    // 2. Reset state
    setCurrentLayer(1);
    setSelectedMCP(null);
    setSelectedContext(null);

    // 3. Wait for DOM update
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 4. Reset camera
    graphRef.current?.resetControls(true);

    // 5. Fade in layer 1
    if (!isMountedRef.current) return;
    await controls.start({
      opacity: 1,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    });

    setIsAnimating(false);
  }, [isAnimating, controls]);

  // Close modal handler
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedContext(null);
  }, []);

  const nodes = getNodesForLayer();
  const edges = getEdgesForLayer();

  useEffect(() => {
    if (currentLayer !== 1) return;
    fitNodesToView(layer1Ids);
    return () => {
      if (fitRetryRef.current) {
        window.clearTimeout(fitRetryRef.current);
      }
    };
  }, [currentLayer, fitNodesToView, layer1Ids]);


  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-(--color-primary) animate-spin" />
          <p className="text-(--color-text-secondary) text-sm">Loading graph data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <AlertCircle className="w-8 h-8 text-(--color-error)" />
          <div>
            <h3 className="text-(--color-text-primary) font-semibold mb-1">Failed to load graph data</h3>
            <p className="text-(--color-text-secondary) text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-(--color-primary) text-white rounded-[6px] hover:bg-(--color-primary-hover) transition-colors duration-200 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (mcps.length === 0 && contexts.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <p className="text-(--color-text-secondary) text-sm">
            No graph data available. Connect MCP servers to see visualization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Reset Button (appears when not on Layer 1) */}
      <AnimatePresence>
        {currentLayer !== 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-4 left-4 z-10"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-(--color-surface) border border-(--color-border) rounded-[6px] shadow-[--shadow-subtle] text-(--color-text-primary) font-medium hover:bg-(--color-background) transition-colors duration-200"
            >
              <RotateCcw size={16} />
              <span>Reset View</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graph Canvas */}
      <motion.div
        animate={controls}
        initial={{ opacity: 1 }}
        className="w-full h-full"
      >
        <GraphCanvas
          ref={graphRef}
          nodes={nodes}
          edges={edges}
          layoutType="radialOut2d"
          layoutOverrides={{
            ...(currentLayer === 1
              ? { radius: 240, levelDistance: 140 }
              : { radius: 240, levelDistance: 140 }),
          }}
          cameraMode="pan"
          animated={true}
          draggable={true}
          sizingType="default"
          defaultNodeSize={6}
          minNodeSize={5}
          maxNodeSize={8}
          labelType="auto"
          edgeInterpolation="linear"
          edgeArrowPosition="end"
          edgeLabelPosition="natural"
          minDistance={240}
          maxDistance={5000}
          theme={graphTheme}
          onNodeClick={handleNodeClick}
        />
      </motion.div>

      {/* Node Modal (Layer 3) */}
      <NodeModal
        context={selectedContext}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
