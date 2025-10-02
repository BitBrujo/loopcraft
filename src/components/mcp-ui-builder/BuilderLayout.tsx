"use client";

import { useState } from "react";
import { Save, Download, RotateCcw, RefreshCw, FolderOpen, File } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { TemplateGallery } from "./TemplateGallery";
import { ConfigPanel } from "./ConfigPanel";
import { ExportDialog } from "./ExportDialog";
import { SaveDialog } from "./SaveDialog";
import { LoadDialog } from "./LoadDialog";
import { ContextSidebar } from "./ContextSidebar";
import { ContextTab } from "./tabs/ContextTab";
import { DesignTab } from "./tabs/DesignTab";
import { ActionsTab } from "./tabs/ActionsTab";
import { FlowTab } from "./tabs/FlowTab";
import { TestTab } from "./tabs/TestTab";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TabId } from "@/types/ui-builder";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'context', label: 'Context' },
  { id: 'design', label: 'Design' },
  { id: 'actions', label: 'Actions' },
  { id: 'flow', label: 'Flow' },
  { id: 'test', label: 'Test' },
];

export function BuilderLayout() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    currentResource,
    activeTab,
    setActiveTab,
    resetResource,
    setError,
    mcpContext,
    actionMappings,
    validationStatus,
    setMCPContext,
    clearActionMappings,
    setTestConfig,
    setValidationStatus,
  } = useUIBuilderStore();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Re-fetch MCP servers to update connection status
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/mcp/servers", { headers });
      if (response.ok) {
        console.log("MCP servers refreshed");
      }

      // TODO: Could also re-validate action mappings here if needed

      // Success message could be shown via a toast/notification
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetAll = () => {
    // Clear all builder state
    resetResource();
    setMCPContext({ selectedServers: [], selectedTools: [], purpose: '' });
    clearActionMappings();
    setTestConfig({ mockResponses: [], testHistory: [], useMockData: true });
    setValidationStatus({ missingMappings: [], typeMismatches: [], warnings: [] });
    setActiveTab('context');
    setShowResetConfirmation(false);
  };

  const handleExport = () => {
    if (!currentResource) {
      setError("No resource to export");
      return;
    }

    // Validate basic requirements
    if (!currentResource.content || !currentResource.content.trim()) {
      setError("Resource content is empty");
      return;
    }

    if (!currentResource.uri.startsWith("ui://")) {
      setError("Resource URI must start with 'ui://'");
      return;
    }

    // Show warning if validation errors exist but allow export anyway
    const hasErrors = validationStatus.missingMappings.length > 0 || validationStatus.typeMismatches.length > 0;
    if (hasErrors) {
      console.warn("Exporting with validation errors:", validationStatus);
    }

    setShowExportDialog(true);
  };

  const handleSave = () => {
    if (!currentResource) {
      setError("No resource to save");
      return;
    }
    setShowSaveDialog(true);
  };

  const handleLoad = () => {
    setShowLoadDialog(true);
  };

  const getTabProgress = (tabId: TabId): 'completed' | 'current' | 'pending' => {
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);

    if (tabIndex < activeIndex) return 'completed';
    if (tabIndex === activeIndex) return 'current';
    return 'pending';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'context':
        return <ContextTab />;
      case 'design':
        return <DesignTab />;
      case 'actions':
        return <ActionsTab />;
      case 'flow':
        return <FlowTab />;
      case 'test':
        return <TestTab />;
      default:
        return <ContextTab />;
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Sidebar - Template Gallery (collapsible, Design tab only) */}
      {activeTab === 'design' && showTemplates && (
        <div className="w-64 border-r bg-card overflow-y-auto">
          <div className="sticky top-0 bg-card border-b p-2 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Templates</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplates(false)}
            >
              &times;
            </Button>
          </div>
          <TemplateGallery />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with actions */}
        <div className="h-14 border-b bg-card/50 backdrop-blur flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">MCP-UI Function Builder</h1>
            {activeTab === 'design' && !showTemplates && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(true)}
              >
                Show Templates
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirmation(true)}
              title="Reset all builder state"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              title="Refresh servers and validation"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="h-6 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" title="File operations">
                  <File className="h-4 w-4 mr-2" />
                  File
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLoad}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b bg-muted/30">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const progress = getTabProgress(tab.id);
                return (
                  <button
                    key={tab.id}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                      activeTab === tab.id
                        ? 'bg-background shadow-sm font-medium'
                        : progress === 'completed'
                        ? 'hover:bg-background/50 text-muted-foreground'
                        : 'hover:bg-background/30 text-muted-foreground'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-2">Progress:</span>
              {tabs.map((tab) => {
                const progress = getTabProgress(tab.id);
                return (
                  <div
                    key={tab.id}
                    className={`w-2 h-2 rounded-full ${
                      progress === 'completed'
                        ? 'bg-green-500'
                        : progress === 'current'
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                    title={tab.label}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Sidebar - Configuration (collapsible, only on design tab) */}
          {activeTab === 'design' && showConfig && (
            <div className="w-80 border-r bg-card overflow-y-auto">
              <div className="sticky top-0 bg-card border-b p-2 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Configuration</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfig(false)}
                >
                  &times;
                </Button>
              </div>
              <ConfigPanel />
            </div>
          )}

          {/* Active Tab Content */}
          <div className="flex-1 overflow-hidden">
            {renderTabContent()}
          </div>

          {/* Right Sidebar - Context Sidebar (persistent, hidden on Context tab) */}
          {activeTab !== 'context' && <ContextSidebar />}

          {/* Toggle config panel if hidden */}
          {activeTab === 'design' && !showConfig && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-20"
              onClick={() => setShowConfig(true)}
            >
              Show Config
            </Button>
          )}
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          onClose={() => setShowExportDialog(false)}
          resource={currentResource}
          actionMappings={actionMappings}
          mcpContext={mcpContext}
        />
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <SaveDialog
          onClose={() => setShowSaveDialog(false)}
          onSaved={() => {
            console.log("Template saved successfully");
          }}
        />
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <LoadDialog
          onClose={() => setShowLoadDialog(false)}
          onLoaded={() => {
            console.log("Template loaded successfully");
          }}
        />
      )}

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Builder State?</DialogTitle>
            <DialogDescription>
              This will clear all your work including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>UI resource content and configuration</li>
                <li>Selected MCP servers and tools</li>
                <li>Action mappings and parameter bindings</li>
                <li>Test configuration and history</li>
                <li>Validation status</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">
                This action cannot be undone. Make sure to save your work first!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowResetConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetAll}
            >
              Reset All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
