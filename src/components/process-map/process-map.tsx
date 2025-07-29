import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import ReactFlow, {
  Background,
  ConnectionMode,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "./custom-nodes";
import { useProcessMapStore } from "../../stores/process-map-store";
import { ProcessMapItem, ProcessPhase } from "../../types/process-map";
import { Badge } from "../ui/badge";
import CustomEdge from "./custom-edge";

interface ProcessMapProps {
  phases: ProcessPhase[];
  items: ProcessMapItem[];
  selectedItemId?: string;
  onItemClick?: (item: ProcessMapItem) => void;
  onItemSelect?: (itemId: string | null) => void;
  renderItem?: (item: ProcessMapItem) => React.ReactNode;
  className?: string;
}

// Function to calculate phase boundaries and node positions
const layoutNodesManually = (
  nodes: any[],
  edges: any[],
  viewportWidth: number,
  viewportHeight: number,
  expandedView: string
) => {
  const isWorkflowList = expandedView === "workflow-list";
  const defaultNodeWidth = isWorkflowList ? 140 : 200;
  const defaultNodeHeight = isWorkflowList ? 30 : 80;
  const phaseSpacing = 2;
  const squareSide = isWorkflowList ? 100 : 140;

  const phaseWidthRatios: Record<string, number> = {
    phase1: 0.21875,
    phase2: 0.234375,
    phase3: 0.34375,
    phase4: 0.203125,
  };

  const nodeMultipliers: Record<string, number> = {
    req: 100,
    eval: isWorkflowList ? 99 : 100,
    prov: isWorkflowList ? 90 : 93,
    reeval: isWorkflowList ? 113 : 114,
    decide: isWorkflowList ? 113 : 114,
    end: isWorkflowList ? 99 : 100,
  };

  const nodeSizeMultipliers: Record<string, { width: number; height: number }> =
    {
      req: { width: 0.8, height: 0.4 },
      eval: { width: 0.8, height: 0.4 },
      prov: { width: 0.8, height: 0.4 },
      reeval: { width: 0.8, height: 0.4 },
      decide: { width: 0.6, height: 0.6 },
      end: { width: 0.8, height: 0.4 },
    };

  const nodeSizeMap: Record<string, { width: number; height: number }> = {};
  nodes.forEach((node) => {
    const rawWidth = Number.isFinite(node.width)
      ? node.width
      : defaultNodeWidth;
    const rawHeight = Number.isFinite(node.height)
      ? node.height
      : defaultNodeHeight;

    const multipliers = isWorkflowList
      ? nodeSizeMultipliers[node.id] ?? { width: 0.7, height: 0.7 }
      : { width: 1, height: 1 };

    nodeSizeMap[node.id] = {
      width: rawWidth * multipliers.width,
      height: rawHeight * multipliers.height,
    };
  });

  const usableWidth = viewportWidth; // Use full width
  const phaseWidths: Record<string, number> = {
    phase1: usableWidth * phaseWidthRatios.phase1,
    phase2: usableWidth * phaseWidthRatios.phase2,
    phase3: usableWidth * phaseWidthRatios.phase3,
    phase4: usableWidth * phaseWidthRatios.phase4,
  };

  const phase1Start = 0; // Start at 0 to touch left border
  const phase2Start = phase1Start + phaseWidths.phase1;
  const phase3Start = phase2Start + phaseWidths.phase2;
  const phase4Start = phase3Start + phaseWidths.phase3;

  // Calculate phase boundaries for background overlays
  const phaseBoundaries = [
    { id: "phase1", start: phase1Start, width: phaseWidths.phase1 },
    { id: "phase2", start: phase2Start, width: phaseWidths.phase2 },
    { id: "phase3", start: phase3Start, width: phaseWidths.phase3 },
    { id: "phase4", start: phase4Start, width: phaseWidths.phase4 },
  ];

  const positions: Record<string, { x: number; y: number }> = {};

  // Phase 1: req
  const reqWidth = nodeSizeMap["req"].width;
  const reqX =
    ((phase1Start + (phaseWidths.phase1 - reqWidth) / 2) *
      (nodeMultipliers["req"] ?? 100)) /
    100;
  positions["req"] = { x: Math.max(reqX, 0), y: 0 };

  // Phase 2: eval
  const evalWidth = nodeSizeMap["eval"].width;
  const evalX =
    ((phase2Start + (phaseWidths.phase2 - evalWidth) / 2) *
      (nodeMultipliers["eval"] ?? 100)) /
    100;
  positions["eval"] = { x: Math.max(evalX, phase2Start), y: 0 };

  // Phase 3: prov, reeval, decide
  const reevalWidth = nodeSizeMap["reeval"].width;
  const decideWidth = nodeSizeMap["decide"].width;

  const phase3Center = phase3Start + phaseWidths.phase3 / 2;

  const loopWidth = squareSide + phaseSpacing + reevalWidth;
  const provX =
    ((phase3Center - loopWidth / 2) * (nodeMultipliers["prov"] ?? 100)) / 100;

  const sharedCenterX =
    (phase3Center * (nodeMultipliers["reeval"] ?? 100)) / 100;
  const reevalX = sharedCenterX - reevalWidth / 2;
  const decideX = sharedCenterX - decideWidth / 2;

  positions["prov"] = { x: provX, y: 0 };
  positions["reeval"] = { x: reevalX, y: 0 };
  positions["decide"] = {
    x: decideX,
    y: squareSide,
  };

  // Phase 4: end
  const endWidth = nodeSizeMap["end"].width;
  const decideHeight = nodeSizeMap["decide"].height;
  const endHeight = nodeSizeMap["end"].height;

  const endX = Math.min(
    ((phase4Start + (phaseWidths.phase4 - endWidth) / 2) *
      (nodeMultipliers["end"] ?? 100)) /
      100,
    viewportWidth - endWidth
  );
  const endY = squareSide + (decideHeight - endHeight) / 2;

  positions["end"] = { x: endX, y: endY };

  // Vertical centering
  let maxBottom = 0;
  for (const nodeId in positions) {
    const y = positions[nodeId].y;
    const h = nodeSizeMap[nodeId]?.height ?? defaultNodeHeight;
    maxBottom = Math.max(maxBottom, y + h);
  }
  const verticalOffset = Math.max((viewportHeight - maxBottom) / 2, 0);

  // Final layout
  const layoutedNodes = nodes.map((node) => {
    const pos = positions[node.id] ?? { x: 0, y: 0 };

    return {
      ...node,
      targetPosition: "top",
      sourcePosition: "bottom",
      position: {
        x: isWorkflowList && node.id === "decide" ? pos.x + 2 : pos.x,
        y: pos.y + verticalOffset,
      },
      data: {
        ...node.data,
        sizeMultiplier: isWorkflowList
          ? nodeSizeMultipliers[node.id] ?? { width: 0.7, height: 0.7 }
          : { width: 1, height: 1 },
      },
    };
  });

  return { nodes: layoutedNodes, edges, phaseBoundaries };
};

export function ProcessMap({
  phases,
  items,
  selectedItemId,
  onItemClick,
  onItemSelect,
  renderItem,
  className = "",
}: ProcessMapProps) {
  const {
    searchTerm,
    expandedView,
    getZoomConfig,
    initialize,
    initialized,
    nodes: sharedNodes,
    edges: sharedEdges,
  } = useProcessMapStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [phaseBoundaries, setPhaseBoundaries] = useState<
    { id: string; start: number; width: number }[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize the store on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // Group items by phase
  const itemsByPhase = useMemo(() => {
    console.log("ProcessMap: Grouping items by phase", {
      itemsLength: items.length,
      filteredItemsLength: filteredItems.length,
      phases: phases.map((p) => p.id),
    });

    const grouped: Record<string, ProcessMapItem[]> = {};
    phases.forEach((phase) => {
      grouped[phase.id] = [];
    });

    filteredItems.forEach((item) => {
      console.log("ProcessMap: Processing item", {
        id: item.id,
        title: item.title,
        phaseId: item.phaseId,
      });
      if (grouped[item.phaseId]) {
        grouped[item.phaseId].push(item);
      }
    });

    console.log("ProcessMap: Grouped items", grouped);
    return grouped;
  }, [filteredItems, phases, items]);

  // Initialize nodes and edges from store
  useEffect(() => {
    if (sharedNodes.length > 0) {
      setNodes(sharedNodes);
      setEdges(sharedEdges);
    }
  }, [sharedNodes, sharedEdges, setNodes, setEdges]);

  // Layout nodes and update phase boundaries on page load or when dimensions/expandedView change
  useEffect(() => {
    if (
      nodes.length > 0 &&
      edges.length > 0 &&
      dimensions.width > 0 &&
      dimensions.height > 0
    ) {
      const numericPercentage = parseFloat(diagramHeight);
      const viewportHeight = window.innerHeight;
      const calculatedHeight = (numericPercentage / 100) * viewportHeight;

      const {
        nodes: layoutedNodes,
        edges: layoutedEdges,
        phaseBoundaries,
      } = layoutNodesManually(
        nodes,
        edges,
        dimensions.width,
        calculatedHeight,
        expandedView
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setPhaseBoundaries(phaseBoundaries);
    }
  }, [nodes, edges, dimensions, expandedView]);

  // Update dimensions on container resize with debouncing
  useEffect(() => {
    if (!containerRef.current) return;

    let timeoutId: NodeJS.Timeout;
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Debounce updates to prevent loop
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          requestAnimationFrame(() => {
            setDimensions((prev) => {
              const newDims = { width, height: height / 2 };
              return prev.width !== newDims.width ||
                prev.height !== newDims.height
                ? newDims
                : prev;
            });
          });
        }, 500); // 100ms debounce
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleItemClick = useCallback(
    (item: ProcessMapItem) => {
      if (onItemClick) {
        onItemClick(item);
      }
      if (onItemSelect) {
        onItemSelect(item.id);
      }
    },
    [onItemClick, onItemSelect]
  );

  const defaultRenderItem = useCallback(
    (item: ProcessMapItem) => (
      <div
        key={item.id}
        className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all ${
          selectedItemId === item.id
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm text-gray-900 mb-1">
              {item.title}
            </h4>
            {item.description && (
              <p className="text-xs text-gray-600 mb-2">{item.description}</p>
            )}
            <div className="flex items-center gap-2">
              <Badge
                variant={item.isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {item.category}
              </Badge>
              {!item.isActive && (
                <Badge variant="outline" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    [selectedItemId, handleItemClick]
  );

  // Calculate dynamic heights based on expandedView
  const getViewHeights = () => {
    switch (expandedView) {
      case "process-map":
        return { diagramHeight: "70%", listHeight: "30%" };
      case "workflow-list":
        return { diagramHeight: "30%", listHeight: "70%" };
      case "balanced":
      default:
        return { diagramHeight: "50%", listHeight: "50%" };
    }
  };

  const renderItemContent = renderItem || defaultRenderItem;
  const { diagramHeight, listHeight } = getViewHeights();

  // Calculate total width and proportional widths for phases
  const totalWidth = useMemo(() => {
    return phases.reduce((sum, phase) => sum + phase.width, 0);
  }, [phases]);

  const getPhaseWidthPercentage = useCallback(
    (phase: ProcessPhase) => {
      return (phase.width / totalWidth) * 100;
    },
    [totalWidth]
  );

  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
    }),
    []
  );

  return (
    <div
      ref={containerRef}
      className={`h-full w-full flex flex-col ${className}`}
    >
      {/* ReactFlow Diagram Section */}
      <div
        className="relative border-b border-gray-200"
        style={{ height: diagramHeight }}
      >
        {/* Phase Background Overlays */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          {phaseBoundaries.map((boundary) => {
            const phase = phases.find((p) => p.id === boundary.id);
            return (
              <div
                key={boundary.id}
                className={`absolute top-0 h-full bg-gradient-to-r ${
                  phase?.color || "from-gray-50 to-gray-100"
                }`}
                style={{
                  left: `${boundary.start}px`,
                  width: `${boundary.width}px`,
                }}
              />
            );
          })}
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          elementsSelectable={false}
          minZoom={1}
          maxZoom={1}
          className="bg-transparent !p-0"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#e5e7eb" />
        </ReactFlow>
      </div>

      {/* Phase columns with item lists */}
      <div className="flex-1 flex flex-col" style={{ height: listHeight }}>
        {/* Process Map Header */}
        <div className="flex-shrink-0 border-b border-gray-200">
          <div className="flex">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className={`bg-gradient-to-r ${phase.color} border-r border-gray-300 flex items-center justify-center h-12`}
                style={{ width: `${getPhaseWidthPercentage(phase)}%` }}
              >
                <h3 className="font-semibold text-gray-800 text-sm">
                  {phase.label}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Process Map Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Phase columns */}
          {phases.map((phase) => (
            <div
              key={phase.id}
              className="border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0"
              style={{ width: `${getPhaseWidthPercentage(phase)}%` }}
            >
              <div className="p-4 space-y-2">
                {itemsByPhase[phase.id]?.map((item) => renderItemContent(item))}
                {itemsByPhase[phase.id]?.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No items in this phase
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
