// Generic types for process map items
export interface ProcessMapItem {
  id: string;
  title: string;
  description?: string;
  phaseId: string;
  category: string;
  isActive: boolean;
  // Additional metadata that can be used by different versions
  metadata?: Record<string, unknown>;
}

export interface ProcessPhase {
  id: string;
  label: string;
  x: number;
  width: number;
  color: string;
}

// Generic configuration for different process map versions
export interface ProcessMapConfig<T = ProcessMapItem> {
  phases: ProcessPhase[];
  items: T[];
  selectedItemId?: string;
  searchTerm?: string;
  onItemClick?: (item: T) => void;
  onItemSelect?: (itemId: string | null) => void;
  renderItem?: (item: T) => React.ReactNode;
  getItemPhase?: (item: T) => string;
}

// Version-specific item types
export interface WorkflowItem extends ProcessMapItem {
  metadata?: {
    workflowDefinition?: {
      id: string;
      name: string;
      nodes: Array<{
        id: string;
        type: string;
        label?: string;
        position: { x: number; y: number };
        data?: Record<string, any>;
      }>;
      edges: Array<{ id: string; source: string; target: string }>;
    };
    caseId?: string;
  };
}

export interface CaseItem extends ProcessMapItem {
  metadata?: {
    caseNumber?: string;
    assignedTo?: string;
    priority?: string;
    status?: string;
    lastUpdated?: Date;
  };
}
