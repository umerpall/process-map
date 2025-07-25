import React, {
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
  useState,
  useRef,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  ConnectionMode,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "./custom-nodes";
import { useProcessMapStore } from "../../stores/process-map-store";
import { ProcessMapItem, ProcessPhase } from "../../types/process-map";
import { Badge } from "../ui/badge";
import { useWindowSize } from "@react-hook/window-size";

interface ProcessMapProps {
  phases: ProcessPhase[];
  items: ProcessMapItem[];
  selectedItemId?: string;
  onItemClick?: (item: ProcessMapItem) => void;
  onItemSelect?: (itemId: string | null) => void;
  renderItem?: (item: ProcessMapItem) => React.ReactNode;
  className?: string;
}

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
  const phasePadding = 10;
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
    eval: 100,
    prov: 95,
    reeval: 115,
    decide: 115,
    end: 100,
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

  const usableWidth = viewportWidth - 2 * phasePadding;
  const phaseWidths: Record<string, number> = {
    phase1: usableWidth * phaseWidthRatios.phase1,
    phase2: usableWidth * phaseWidthRatios.phase2,
    phase3: usableWidth * phaseWidthRatios.phase3,
    phase4: usableWidth * phaseWidthRatios.phase4,
  };

  const phase1Start = phasePadding;
  const phase2Start = phase1Start + phaseWidths.phase1;
  const phase3Start = phase2Start + phaseWidths.phase2;
  const phase4Start = phase3Start + phaseWidths.phase3;

  const positions: Record<string, { x: number; y: number }> = {};

  // Phase 1: req
  const reqWidth = nodeSizeMap["req"].width;
  const reqX =
    ((phase1Start + (phaseWidths.phase1 - reqWidth) / 2) *
      (nodeMultipliers["req"] ?? 100)) /
    100;
  positions["req"] = { x: Math.max(reqX, phasePadding), y: 0 };

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
    viewportWidth - phasePadding - endWidth
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
        x: pos.x,
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

  return { nodes: layoutedNodes, edges };
};

// const layoutNodesManually = (
//   nodes: any[],
//   edges: any[],
//   viewportWidth: number,
//   viewportHeight: number,
//   expandedView: string
// ) => {
//   const isWorkflowList = expandedView === "workflow-list";
//   const defaultNodeWidth = isWorkflowList ? 140 : 200;
//   const defaultNodeHeight = isWorkflowList ? 30 : 80;
//   const phasePadding = 10;
//   const phaseSpacing = 2;
//   const squareSide = isWorkflowList ? 100 : 140;

//   const phaseWidthRatios: Record<string, number> = {
//     phase1: 0.21875,
//     phase2: 0.234375,
//     phase3: 0.34375,
//     phase4: 0.203125,
//   };

//   const nodeMultipliers: Record<string, number> = {
//     req: 100,
//     eval: 100,
//     prov: 95,
//     reeval: 115,
//     decide: 115,
//     end: 100,
//   };

//   const nodeSizeMap: Record<string, { width: number; height: number }> = {};
//   nodes.forEach((node) => {
//     nodeSizeMap[node.id] = {
//       width: Number.isFinite(node.width) ? node.width : defaultNodeWidth,
//       height: Number.isFinite(node.height) ? node.height : defaultNodeHeight,
//     };
//   });

//   const usableWidth = viewportWidth - 2 * phasePadding;
//   const phaseWidths: Record<string, number> = {
//     phase1: usableWidth * phaseWidthRatios.phase1,
//     phase2: usableWidth * phaseWidthRatios.phase2,
//     phase3: usableWidth * phaseWidthRatios.phase3,
//     phase4: usableWidth * phaseWidthRatios.phase4,
//   };

//   const phase1Start = phasePadding;
//   const phase2Start = phase1Start + phaseWidths.phase1;
//   const phase3Start = phase2Start + phaseWidths.phase2;
//   const phase4Start = phase3Start + phaseWidths.phase3;

//   const positions: Record<string, { x: number; y: number }> = {};

//   // Phase 1: req
//   const reqWidth = nodeSizeMap["req"]?.width ?? defaultNodeWidth;
//   const reqX =
//     ((phase1Start + (phaseWidths.phase1 - reqWidth) / 2) *
//       (nodeMultipliers["req"] ?? 100)) /
//     100;
//   positions["req"] = { x: Math.max(reqX, phasePadding), y: 0 };

//   // Phase 2: eval
//   const evalWidth = nodeSizeMap["eval"]?.width ?? defaultNodeWidth;
//   const evalX =
//     ((phase2Start + (phaseWidths.phase2 - evalWidth) / 2) *
//       (nodeMultipliers["eval"] ?? 100)) /
//     100;
//   positions["eval"] = { x: Math.max(evalX, phase2Start), y: 0 };

//   // Phase 3: prov, reeval, decide
//   const reevalWidth = nodeSizeMap["reeval"]?.width ?? defaultNodeWidth;
//   const decideWidth = nodeSizeMap["decide"]?.width ?? defaultNodeWidth;
//   const phase3Center = phase3Start + phaseWidths.phase3 / 2;

//   const fixedSquareSide = isWorkflowList ? 100 : 140; // Use original squareSide for consistent loopWidth
//   const loopWidth = fixedSquareSide + phaseSpacing + reevalWidth;

//   const provX =
//     ((phase3Center - loopWidth / 2) * (nodeMultipliers["prov"] ?? 100)) / 100;

//   // Align reeval and decide to the same vertical line
//   const sharedCenterLineX =
//     (phase3Center * (nodeMultipliers["reeval"] ?? 100)) / 100;

//   const reevalX = sharedCenterLineX - reevalWidth / 2;
//   const decideX = sharedCenterLineX - decideWidth / 2;

//   positions["prov"] = { x: provX, y: 0 };
//   positions["reeval"] = { x: reevalX, y: 0 };
//   positions["decide"] = { x: decideX, y: squareSide };

//   // Phase 4: end
//   const endWidth = nodeSizeMap["end"]?.width ?? defaultNodeWidth;
//   const decideHeight = nodeSizeMap["decide"]?.height ?? defaultNodeHeight;
//   const endHeight = nodeSizeMap["end"]?.height ?? defaultNodeHeight;

//   const endX = Math.min(
//     ((phase4Start + (phaseWidths.phase4 - endWidth) / 2) *
//       (nodeMultipliers["end"] ?? 100)) /
//       100,
//     viewportWidth - phasePadding - endWidth
//   );

//   const endY = squareSide + (decideHeight - endHeight) / 2;
//   positions["end"] = { x: endX, y: endY };

//   // Calculate max bottom Y position
//   let maxBottom = 0;
//   for (const nodeId in positions) {
//     const y = positions[nodeId].y;
//     const h = nodeSizeMap[nodeId]?.height ?? defaultNodeHeight;
//     maxBottom = Math.max(maxBottom, y + h);
//   }

//   const nodeSizeMultipliers: Record<string, number> = {
//     req: 0.7,
//     eval: 0.7,
//     prov: 0.7,
//     reeval: 0.7,
//     decide: 0.7,
//     end: 0.7,
//   };

//   // Vertical centering
//   const verticalOffset = Math.max((viewportHeight - maxBottom) / 2, 0);

//   // Final layout
//   const layoutedNodes = nodes.map((node) => {
//     const pos = positions[node.id] ?? { x: 0, y: 0 };
//     const shouldShrink = isWorkflowList;

//     return {
//       ...node,
//       targetPosition: "top",
//       sourcePosition: "bottom",
//       position: {
//         x: pos.x,
//         y: pos.y + verticalOffset,
//       },
//       data: {
//         ...node.data,
//         sizeMultiplier: shouldShrink
//           ? nodeSizeMultipliers[node.id] ?? 0.7 // fallback if not listed
//           : 1,
//       },
//     };
//   });

//   return { nodes: layoutedNodes, edges };
// };

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

  // const data = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [layoutedNodes, setLayoutedNodes] = useState<any>([]);
  const [layoutedEdges, setLayoutedEdges] = useState(edges);

  const containerRef = useRef<HTMLDivElement>(null);
  const renderCount = useRef(0);

  const [width, height] = useWindowSize();

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

  // Use ReactFlow's built-in state management

  // Initialize and update nodes based on view mode
  useEffect(() => {
    if (sharedNodes.length > 0) {
      setNodes(sharedNodes);
      setEdges(sharedEdges);
    }
  }, [sharedNodes, sharedEdges, setNodes, setEdges]);

  // Fit view when view changes
  // useLayoutEffect(() => {
  //   const zoomConfig = getZoomConfig();
  //   setTimeout(() => fitView({ ...zoomConfig, duration: 300 }), 100);
  // }, [expandedView, fitView, getZoomConfig]);

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
                import dagre from '@dagrejs/dagre'; import
                '@xyflow/react/dist/style.css';
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

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();

        requestAnimationFrame(() => {
          setDimensions((prev) => {
            const newDims = { width, height: height / 2 };
            return prev.width !== newDims.width ||
              prev.height !== newDims.height
              ? newDims
              : prev;
          });
        });
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Run layoutNodesManually on page load when nodes, edges, and dimensions are available
  useEffect(() => {
    if (
      nodes.length > 0 &&
      edges.length > 0 &&
      dimensions.width > 0 &&
      dimensions.height > 0 &&
      renderCount.current < 4
    ) {
      const { nodes: initialNodes, edges: initialEdges } = layoutNodesManually(
        nodes,
        edges,
        dimensions.width,
        dimensions.height,
        expandedView
      );
      setLayoutedNodes(initialNodes);
      setLayoutedEdges(initialEdges);
      setNodes(initialNodes); // Sync nodes with layoutedNodes
      setEdges(initialEdges); // Sync edges with layoutedEdges
      renderCount.current += 1;
    }
  }, [nodes, edges, dimensions]);

  useEffect(() => {
    if (renderCount.current >= 4) {
      const numericPercentage = parseFloat(diagramHeight); // removes the '%'
      const viewportHeight = window.innerHeight;
      const calculatedHeight = (numericPercentage / 100) * viewportHeight;

      // Delay to ensure DOM has rendered updated node sizes
      requestAnimationFrame(() => {
        const { nodes: initialNodes, edges: initialEdges } =
          layoutNodesManually(
            nodes,
            edges,
            dimensions.width,
            calculatedHeight,
            expandedView
          );
        setLayoutedNodes(initialNodes);
        setLayoutedEdges(initialEdges);
        setNodes(initialNodes); // Sync nodes with layoutedNodes
        setEdges(initialEdges); // Sync edges with layoutedEdges
      });
    }
  }, [expandedView, width, height]);

  // Sync layoutedNodes with nodes after initial renders
  useEffect(() => {
    if (renderCount.current >= 4) {
      setLayoutedNodes(nodes);
      setLayoutedEdges(edges);
    }
  }, [nodes, edges]);

  // Handle resize, preserving dragged positions
  useEffect(() => {
    if (
      layoutedNodes.length > 0 &&
      dimensions.width > 0 &&
      dimensions.height > 0 &&
      renderCount.current < 3
    ) {
      // Store dragged offsets relative to original layout
      const originalLayout = layoutNodesManually(
        nodes,
        edges,
        dimensions.width,
        dimensions.height,
        expandedView
      ).nodes;
      const draggedOffsets = layoutedNodes.reduce((acc: any, node: any) => {
        const originalNode = originalLayout.find((n) => n.id === node.id);
        if (originalNode) {
          acc[node.id] = {
            x: node.position.x - originalNode.position.x,
            y: node.position.y - originalNode.position.y,
          };
        }
        return acc;
      }, {});

      // Run layout with new dimensions
      const { nodes: newNodes, edges: newEdges } = layoutNodesManually(
        layoutedNodes,
        edges,
        dimensions.width,
        dimensions.height,
        expandedView
      );

      // Apply dragged offsets to new layout
      const adjustedNodes = newNodes.map((node) => {
        const offset = draggedOffsets[node.id] || { x: 0, y: 0 };
        return {
          ...node,
          position: {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          },
        };
      });

      setLayoutedNodes(adjustedNodes);
      setLayoutedEdges(newEdges);
      setNodes(adjustedNodes); // Sync nodes with layoutedNodes
      setEdges(newEdges); // Sync edges with layoutedEdges
      renderCount.current += 1;
    }
  }, [dimensions]);

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
        <ReactFlow
          nodes={layoutedNodes}
          edges={layoutedEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionMode={ConnectionMode.Loose}
          // fitView
          // fitViewOptions={{ padding: 0.001 }}
          minZoom={0.5}
          maxZoom={2}
          className="bg-gray-50"
          // nodesDraggable={expandedView !== "workflow-list"}
          // nodesConnectable={expandedView !== "workflow-list"}
          // elementsSelectable={expandedView !== "workflow-list"}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#e5e7eb" />
          <Controls showInteractive={false} />
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
