export interface Workflow {
  id: string;
  title: string;
  description?: string;
  phaseId: string;
  category: string;
  isActive: boolean;
}

export interface WorkflowNode {
  id: string;
  type:
    | "trigger"
    | "action"
    | "decision"
    | "end"
    | "startNode"
    | "actionNode"
    | "conditionNode"
    | "endNode";
  label?: string;
  description?: string;
  hasDataEntry?: boolean;
  position: { x: number; y: number };
  data?: Record<string, any>;
  inputs?: { id: string; label: string }[];
  outputs?: { id: string; label: string }[];
  width?: number;
  height?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowDefinition {
  id: string;
  title: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ProcessPhase {
  id: string;
  label: string;
  x: number;
  width: number;
  color: string;
}
