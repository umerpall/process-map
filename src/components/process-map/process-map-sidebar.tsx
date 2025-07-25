import {
  Search,
  BarChart3,
  Save,
  ArrowLeft,
  Plus,
  Settings,
} from "lucide-react";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";

type ProcessMapSidebarProps = {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  caseIds: string[];
  setCaseIds: (caseIds: string[]) => void;
  selectedCaseId: string | null;
  setSelectedCaseId: (caseId: string) => void;
  viewMode: string;
  setViewMode: (viewMode: string) => void;
  saveLayout: () => void;
  resetLayout: () => void;
  getZoomConfig: () => { padding: number; minZoom: number; maxZoom: number };
  fitView: (zoomConfig: {
    padding?: number;
    minZoom?: number;
    maxZoom?: number;
    duration?: number;
  }) => void;
  expandedView: string;
  setExpandedView: (viewMode: string) => void;
};

export function ProcessMapSidebar({
  searchTerm,
  setSearchTerm,
  caseIds,
  setCaseIds: _setCaseIds,
  selectedCaseId,
  setSelectedCaseId,
  viewMode: _viewMode,
  setViewMode: _setViewMode,
  saveLayout,
  resetLayout,
  getZoomConfig,
  fitView,
  expandedView,
  setExpandedView,
}: ProcessMapSidebarProps) {
  const handleCaseChange = (value: string) => {
    if (value === "none") {
      setSelectedCaseId("");
    } else {
      setSelectedCaseId(value);
    }
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900 mb-1">
          Case Management System
        </h1>
        <p className="text-xs text-gray-500">
          Framework (Standard CPS Framework)
        </p>
      </div>

      <div className="p-4 space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Workflows
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Case Filter
          </label>
          <Select
            value={selectedCaseId || "none"}
            onValueChange={handleCaseChange}
            className="w-full"
          >
            <option value="none">All Cases</option>
            {caseIds.map((caseId) => (
              <option key={caseId} value={caseId}>
                {caseId}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Actions
          </label>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full justify-start"
              onClick={saveLayout}
            >
              <Save className="w-4 h-4" />
              Save Layout
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full justify-start"
              onClick={() => {
                resetLayout();
                setTimeout(() => {
                  const zoomConfig = getZoomConfig();
                  fitView({ ...zoomConfig, duration: 250 });
                }, 100);
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Reset Layout
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            View Focus
          </label>
          <div className="space-y-2">
            <Button
              variant={expandedView === "process-map" ? "default" : "outline"}
              size="sm"
              className="gap-2 w-full justify-start"
              onClick={() => setExpandedView("process-map")}
            >
              <BarChart3 className="w-4 h-4" />
              Focus Process Map
            </Button>
            <Button
              variant={expandedView === "workflow-list" ? "default" : "outline"}
              size="sm"
              className="gap-2 w-full justify-start"
              onClick={() => setExpandedView("workflow-list")}
            >
              <Plus className="w-4 h-4" />
              Focus Workflows
            </Button>
            <Button
              variant={expandedView === "balanced" ? "default" : "outline"}
              size="sm"
              className="gap-2 w-full justify-start"
              onClick={() => setExpandedView("balanced")}
            >
              <Settings className="w-4 h-4" />
              Balanced View
            </Button>
            <Button size="sm" className="gap-2 w-full justify-start">
              <Plus className="w-4 h-4" />
              New Workflow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
