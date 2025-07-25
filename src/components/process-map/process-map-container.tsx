import React, { useCallback } from "react";
import { ReactFlowProvider } from "reactflow";
import { ProcessMapSidebar } from "./process-map-sidebar";
import { ProcessMap } from "./process-map";
import { useProcessMapStore } from "../../stores/process-map-store";
import { ProcessMapItem, ProcessPhase } from "../../types/process-map";

interface ProcessMapContainerProps {
  phases: ProcessPhase[];
  items: ProcessMapItem[];
  onItemClick?: (item: ProcessMapItem) => void;
  renderItem?: (item: ProcessMapItem) => React.ReactNode;
  className?: string;
}

export function ProcessMapContainer({
  phases,
  items,
  onItemClick,
  renderItem,
  className = "",
}: ProcessMapContainerProps) {
  const {
    searchTerm,
    caseIds,
    selectedCaseId,
    viewMode,
    expandedView,
    selectedItemId,
    setSearchTerm,
    setCaseIds,
    setViewMode,
    setExpandedView,
    setSelectedItemId,
    handleSetSelectedCaseId,
    saveLayout,
    resetLayout,
    getZoomConfig,
    fitView,
  } = useProcessMapStore();

  // Memoized handlers to prevent infinite loops
  const handleViewModeChange = useCallback(
    (mode: string) => {
      const newMode = mode as "edit" | "view";
      setViewMode(newMode);
    },
    [setViewMode],
  );

  const handleExpandedViewChange = useCallback(
    (view: string) => {
      const newView = view as "process-map" | "workflow-list" | "balanced";
      setExpandedView(newView);
    },
    [setExpandedView],
  );

  const handleItemSelect = useCallback(
    (itemId: string | null) => {
      setSelectedItemId(itemId);

      if (itemId) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          console.log("Item selected:", item);
        }
      }
    },
    [setSelectedItemId, items],
  );

  const handleItemClickInternal = useCallback(
    (item: ProcessMapItem) => {
      handleItemSelect(item.id);
      console.log("Item clicked:", item);

      if (onItemClick) {
        onItemClick(item);
      }
    },
    [handleItemSelect, onItemClick],
  );

  const handleSearchTermChange = useCallback(
    (term: string) => {
      setSearchTerm(term);

      if (term) {
        const resultsCount = items.filter(
          (item) =>
            item.title.toLowerCase().includes(term.toLowerCase()) ||
            item.description?.toLowerCase().includes(term.toLowerCase()),
        ).length;

        console.log("Search performed:", { term, resultsCount });
      } else {
        console.log("Search cleared");
      }
    },
    [setSearchTerm, items],
  );

  const handleCaseSelection = useCallback(
    (caseId: string) => {
      handleSetSelectedCaseId(caseId);
      console.log("Case selected:", caseId);
    },
    [handleSetSelectedCaseId],
  );

  const handleSaveLayout = useCallback(() => {
    saveLayout();
    console.log("Layout saved");
  }, [saveLayout]);

  const handleResetLayout = useCallback(() => {
    resetLayout();
    console.log("Layout reset");
  }, [resetLayout]);

  const handleFitView = useCallback(
    (config: {
      padding?: number;
      minZoom?: number;
      maxZoom?: number;
      duration?: number;
    }) => {
      fitView(config);
      console.log("Fit view clicked");
    },
    [fitView],
  );

  return (
    <ReactFlowProvider>
      <div className={`flex h-full bg-white ${className}`}>
        <ProcessMapSidebar
          searchTerm={searchTerm}
          setSearchTerm={handleSearchTermChange}
          caseIds={caseIds}
          setCaseIds={setCaseIds}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={handleCaseSelection}
          viewMode={viewMode}
          setViewMode={handleViewModeChange}
          expandedView={expandedView}
          setExpandedView={handleExpandedViewChange}
          saveLayout={handleSaveLayout}
          resetLayout={handleResetLayout}
          getZoomConfig={getZoomConfig}
          fitView={handleFitView}
        />
        <ProcessMap
          phases={phases}
          items={items}
          selectedItemId={selectedItemId || undefined}
          onItemClick={handleItemClickInternal}
          onItemSelect={handleItemSelect}
          renderItem={renderItem}
          className="flex-1"
        />
      </div>
    </ReactFlowProvider>
  );
}
