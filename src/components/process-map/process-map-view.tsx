import React, { useMemo, useCallback, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { ProcessMapContainer } from "./process-map-container";
import { ProcessPhase, WorkflowItem } from "../../types/process-map";
import { WorkflowDefinition, WorkflowNode } from "../../types/workflow";

// Sample data for demonstration
const SAMPLE_WORKFLOWS = [
  {
    id: "workflow-1",
    name: "Initial Intake and Assessment",
    description: "First contact and initial assessment of service request",
    category: "intake",
    status: "active",
    nodes: [
      {
        id: "start-1",
        type: "startNode" as const,
        label: "Service Request Received",
        position: { x: 0, y: 0 },
        data: { label: "Service Request Received", phase: "request-service" },
      },
      {
        id: "action-1",
        type: "actionNode" as const,
        label: "Initial Screening",
        position: { x: 200, y: 0 },
        data: { label: "Initial Screening", phase: "request-service" },
      },
    ],
    edges: [{ id: "e1", source: "start-1", target: "action-1" }],
  },
  {
    id: "workflow-2",
    name: "CPS Investigation",
    description: "Child Protective Services investigation workflow",
    category: "investigation",
    status: "active",
    nodes: [
      {
        id: "start-2",
        type: "startNode" as const,
        label: "Investigation Assigned",
        position: { x: 0, y: 0 },
        data: { label: "Investigation Assigned", phase: "evaluate-service" },
      },
      {
        id: "action-2",
        type: "actionNode" as const,
        label: "Conduct Investigation",
        position: { x: 200, y: 0 },
        data: { label: "Conduct Investigation", phase: "evaluate-service" },
      },
    ],
    edges: [{ id: "e2", source: "start-2", target: "action-2" }],
  },
  {
    id: "workflow-3",
    name: "Family Support Services",
    description: "Ongoing family support and case management",
    category: "support",
    status: "active",
    nodes: [
      {
        id: "start-3",
        type: "startNode" as const,
        label: "Services Initiated",
        position: { x: 0, y: 0 },
        data: { label: "Services Initiated", phase: "provide-services" },
      },
      {
        id: "action-3",
        type: "actionNode" as const,
        label: "Provide Support",
        position: { x: 200, y: 0 },
        data: { label: "Provide Support", phase: "provide-services" },
      },
    ],
    edges: [{ id: "e3", source: "start-3", target: "action-3" }],
  },
  {
    id: "workflow-4",
    name: "Case Closure",
    description: "Case completion and closure procedures",
    category: "closure",
    status: "active",
    nodes: [
      {
        id: "start-4",
        type: "startNode" as const,
        label: "Closure Initiated",
        position: { x: 0, y: 0 },
        data: { label: "Closure Initiated", phase: "end-services" },
      },
      {
        id: "action-4",
        type: "actionNode" as const,
        label: "Complete Case",
        position: { x: 200, y: 0 },
        data: { label: "Complete Case", phase: "end-services" },
      },
    ],
    edges: [{ id: "e4", source: "start-4", target: "action-4" }],
  },
];

interface ProcessMapViewProps {
  frameworkId?: string;
}

export function ProcessMapView({ frameworkId }: ProcessMapViewProps) {
  // Workflow viewer state
  const [showWorkflowViewer, setShowWorkflowViewer] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<WorkflowDefinition | null>(null);

  // Define phases for workflow view
  const phases: ProcessPhase[] = [
    {
      id: "phase1",
      label: "REQUEST",
      x: 0,
      width: 280,
      color: "from-blue-50 to-blue-100",
    },
    {
      id: "phase2",
      label: "EVALUATE",
      x: 280,
      width: 300,
      color: "from-purple-50 to-purple-100",
    },
    {
      id: "phase3",
      label: "SERVICE DELIVERY",
      x: 580,
      width: 440,
      color: "from-green-50 to-green-100",
    },
    {
      id: "phase4",
      label: "COMPLETION",
      x: 1020,
      width: 260,
      color: "from-orange-50 to-orange-100",
    },
  ];

  // Helper function to determine phase from workflow nodes
  const getPhaseFromWorkflow = (
    nodes: Array<{ data?: { phase?: string } }>,
  ): string => {
    const phase = nodes?.[0]?.data?.phase;
    switch (phase) {
      case "request-service":
        return "phase1";
      case "evaluate-service":
        return "phase2";
      case "provide-services":
        return "phase3";
      case "end-services":
        return "phase4";
      default:
        return "phase1";
    }
  };

  // Convert workflows to process map items
  const workflowItems: WorkflowItem[] = useMemo(() => {
    console.log("ProcessMapView: Computing workflow items", {
      workflowsLength: SAMPLE_WORKFLOWS.length,
    });

    const items = SAMPLE_WORKFLOWS.map((workflow) => ({
      id: workflow.id,
      title: workflow.name,
      description: workflow.description || "",
      phaseId: getPhaseFromWorkflow(workflow.nodes),
      category: workflow.category || "general",
      isActive: workflow.status === "active",
      metadata: {
        workflowDefinition: {
          id: workflow.id,
          name: workflow.name,
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
      },
    }));

    console.log("ProcessMapView: Generated workflow items", items);
    return items;
  }, []);

  // Handle workflow click
  const handleWorkflowClick = useCallback((workflow: WorkflowItem) => {
    console.log("Workflow clicked:", workflow);

    // Convert nodes to WorkflowNode format
    const workflowNodes: WorkflowNode[] = (
      workflow.metadata?.workflowDefinition?.nodes || []
    ).map((node) => ({
      id: node.id,
      type: node.type as WorkflowNode["type"],
      label: node.label || (node.data?.label as string) || node.id,
      position: node.position,
      data: node.data,
    }));

    // Set the selected workflow and show viewer
    setSelectedWorkflow({
      id: workflow.id,
      title: workflow.title,
      nodes: workflowNodes,
      edges: workflow.metadata?.workflowDefinition?.edges || [],
    });
    setShowWorkflowViewer(true);
  }, []);

  // Custom render function for workflow items
  const renderWorkflowItem = useCallback(
    (item: WorkflowItem) => (
      <div
        key={item.id}
        className="p-3 mb-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all"
        onClick={() => handleWorkflowClick(item)}
      >
        <div className="font-medium text-sm text-gray-900 mb-1">
          {item.title}
        </div>
        {item.description && (
          <div className="text-xs text-gray-600 mb-2">{item.description}</div>
        )}
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
          {item.category}
        </div>
      </div>
    ),
    [handleWorkflowClick],
  );

  console.log("ProcessMapView: Rendering with", {
    phasesLength: phases.length,
    workflowItemsLength: workflowItems.length,
  });

  return (
    <ReactFlowProvider>
      <ProcessMapContainer
        phases={phases}
        items={workflowItems}
        onItemClick={handleWorkflowClick}
        renderItem={renderWorkflowItem}
        className="h-full"
      />

      {/* Simple Workflow Viewer Modal */}
      {showWorkflowViewer && selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedWorkflow.title}</h2>
              <button
                onClick={() => {
                  setShowWorkflowViewer(false);
                  setSelectedWorkflow(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Workflow Steps:</h3>
                <div className="space-y-2">
                  {selectedWorkflow.nodes.map((node) => (
                    <div key={node.id} className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">{node.label || node.id}</div>
                      <div className="text-sm text-gray-600">
                        Type: {node.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedWorkflow.edges.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Connections:</h3>
                  <div className="space-y-1">
                    {selectedWorkflow.edges.map((edge) => (
                      <div key={edge.id} className="text-sm text-gray-600">
                        {edge.source} → {edge.target}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ReactFlowProvider>
  );
}
