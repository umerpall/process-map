import { create } from "zustand";
import { Node, Edge, Position } from "reactflow";
import { ProcessMapItem } from "../types/process-map";

// Types for the store
export type ViewMode = "edit" | "view";
export type ExpandedView = "process-map" | "workflow-list" | "balanced";

export interface ProcessMapState {
  // React Flow state
  nodes: Node[];
  edges: Edge[];
  initialized: boolean;

  // UI state
  searchTerm: string;
  caseIds: string[];
  selectedCaseId: string | null;
  viewMode: ViewMode;
  expandedView: ExpandedView;

  // Generic items state
  items: ProcessMapItem[];
  selectedItemId: string | null;

  // React Flow actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodePositions: (
    updates: { id: string; position: { x: number; y: number } }[]
  ) => void;
  resetToInitial: () => void;
  initialize: () => void;

  // UI actions
  setSearchTerm: (term: string) => void;
  setCaseIds: (caseIds: string[]) => void;
  setSelectedCaseId: (caseId: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setExpandedView: (view: ExpandedView) => void;

  // Generic items actions
  setItems: (items: ProcessMapItem[]) => void;
  setSelectedItemId: (itemId: string | null) => void;

  // Layout actions
  saveLayout: () => void;
  resetLayout: () => void;
  getZoomConfig: () => { padding: number; minZoom: number; maxZoom: number };
  fitView: (zoomConfig: {
    padding?: number;
    minZoom?: number;
    maxZoom?: number;
    duration?: number;
  }) => void;

  // Item actions (generic)
  handleItemClick: (item: ProcessMapItem) => void;

  // Helper to reset selected case when setting to empty string
  handleSetSelectedCaseId: (caseId: string) => void;
}

export const createInitialNodes = (): Node[] => [
  {
    id: "req",
    type: "startEnd",
    position: { x: 100, y: 50 },
    data: {
      label: "Request Service/Report",
      onClick: () => console.log("Request node clicked"),
      outputs: [{ id: "out", position: Position.Right }],
    },
  },
  {
    id: "eval",
    type: "process",
    position: { x: 400, y: 50 },
    data: {
      label: "Evaluate Service",
      onClick: () => console.log("Evaluate node clicked"),
      inputs: [{ id: "in", position: Position.Left }],
      outputs: [{ id: "out", position: Position.Right }],
    },
  },
  {
    id: "prov",
    type: "process",
    position: { x: 700, y: 50 },
    data: {
      label: "Provide Services",
      onClick: () => console.log("Provide node clicked"),
      inputs: [
        { id: "in_left", position: Position.Left },
        { id: "in_bottom", position: Position.Bottom },
      ],
      outputs: [{ id: "out", position: Position.Right }],
    },
  },
  {
    id: "reeval",
    type: "process",
    position: { x: 950, y: 50 },
    data: {
      label: "Reevaluate Services",
      onClick: () => console.log("Reevaluate node clicked"),
      inputs: [{ id: "in", position: Position.Left }],
      outputs: [{ id: "out", position: Position.Bottom }],
    },
  },
  {
    id: "decide",
    type: "decision",
    position: { x: 950, y: 200 },
    data: {
      label: "Continue?",
      onClick: () => console.log("Decision node clicked"),
      inputs: [{ id: "in", position: Position.Top }],
      outputs: [
        { id: "yes", position: Position.Left },
        { id: "no", position: Position.Right },
      ],
    },
  },
  {
    id: "end",
    type: "startEnd",
    position: { x: 1200, y: 200 },
    data: {
      label: "End of Services",
      onClick: () => console.log("End node clicked"),
      inputs: [{ id: "in", position: Position.Left }],
    },
  },
];

export const createInitialEdges = (): Edge[] =>
  [
    {
      id: "e-req-eval",
      source: "req",
      target: "eval",
    },
    {
      id: "e-eval-prov",
      source: "eval",
      target: "prov",
      targetHandle: "in_left",
    },
    {
      id: "e-prov-reeval",
      source: "prov",
      target: "reeval",
    },
    {
      id: "e-reeval-decide",
      source: "reeval",
      target: "decide",
      targetHandle: "in",
    },
    {
      id: "e-decide-end",
      source: "decide",
      target: "end",
      sourceHandle: "no",
      label: "No",
      type: "custom",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: "e-decide-loop",
      source: "decide",
      target: "prov",
      sourceHandle: "yes",
      targetHandle: "in_bottom",
      label: "Yes",
      type: "custom",
      sourcePosition: Position.Left,
      targetPosition: Position.Bottom,
    },
  ].map((edge: any) => ({
    ...edge,
    type: edge?.type || "smoothstep",
    animated: true,
    style: { strokeWidth: 2, stroke: "#6366f1" }, // Remove strokeDasharray
    data: edge.label ? { label: edge.label } : undefined, // Move label to data
  }));

export const useProcessMapStore = create<ProcessMapState>((set, get) => ({
  // React Flow state
  nodes: [],
  edges: [],
  initialized: false,

  // UI state
  searchTerm: "",
  caseIds: ["case-001", "case-002", "case-003"],
  selectedCaseId: null,
  viewMode: "edit" as ViewMode,
  expandedView: "balanced" as ExpandedView,

  // Generic items state
  items: [],
  selectedItemId: null,

  // React Flow actions
  setNodes: (nodes: Node[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),

  updateNodePositions: (
    updates: { id: string; position: { x: number; y: number } }[]
  ) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) => {
      const update = updates.find((u) => u.id === node.id);
      return update ? { ...node, position: update.position } : node;
    });
    set({ nodes: updatedNodes });
  },

  resetToInitial: () => {
    const initialNodes = createInitialNodes();
    const initialEdges = createInitialEdges();
    set({
      nodes: initialNodes,
      edges: initialEdges,
    });
  },

  initialize: () => {
    const { initialized } = get();
    if (!initialized) {
      const initialNodes = createInitialNodes();
      const initialEdges = createInitialEdges();
      set({
        nodes: initialNodes,
        edges: initialEdges,
        initialized: true,
      });
    }
  },

  // UI actions
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setCaseIds: (caseIds: string[]) => set({ caseIds }),
  setSelectedCaseId: (caseId: string | null) => set({ selectedCaseId: caseId }),
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setExpandedView: (view: ExpandedView) => set({ expandedView: view }),

  // Generic items actions
  setItems: (items: ProcessMapItem[]) => set({ items }),
  setSelectedItemId: (itemId: string | null) => set({ selectedItemId: itemId }),

  // Layout actions
  saveLayout: () => {
    console.log("Save layout");
  },

  resetLayout: () => {
    console.log("Reset layout");
    get().resetToInitial();
  },

  getZoomConfig: () => {
    const { expandedView } = get();
    switch (expandedView) {
      case "process-map":
        return { padding: 0.1, minZoom: 0.8, maxZoom: 2.5 };
      case "workflow-list":
        return { padding: 0.2, minZoom: 0.8, maxZoom: 1.8 };
      default:
        return { padding: 0.2, minZoom: 0.5, maxZoom: 2.0 };
    }
  },

  fitView: (zoomConfig: {
    padding?: number;
    minZoom?: number;
    maxZoom?: number;
    duration?: number;
  }) => {
    console.log("Fit view", zoomConfig);
  },

  // Item actions (generic)
  handleItemClick: (item: ProcessMapItem) => {
    console.log("Item clicked:", item);
  },

  // Helper to reset selected case when setting to empty string
  handleSetSelectedCaseId: (caseId: string) => {
    set({ selectedCaseId: caseId === "" ? null : caseId });
  },
}));
