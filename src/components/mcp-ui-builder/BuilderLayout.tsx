"use client";

import { useState } from "react";
import { Save, Download, Play, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { TemplateGallery } from "./TemplateGallery";
import { ConfigPanel } from "./ConfigPanel";
import { ExportDialog } from "./ExportDialog";
import { ContextSidebar } from "./ContextSidebar";
import { ContextTab } from "./tabs/ContextTab";
import { DesignTab } from "./tabs/DesignTab";
import { ActionsTab } from "./tabs/ActionsTab";
import { FlowTab } from "./tabs/FlowTab";
import { TestTab } from "./tabs/TestTab";
import { Button } from "@/components/ui/button";
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
  const [showConfig, setShowConfig] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const {
    currentResource,
    activeTab,
    setActiveTab,
    resetResource,
    setError,
    mcpContext,
    actionMappings,
  } = useUIBuilderStore();

  const handleSave = async () => {
    if (!currentResource) {
      setError("No resource to save");
      return;
    }

    try {
      // TODO: Implement save to database
      // This would call the templates API endpoint
      console.log("Saving template...", currentResource);
      alert("Save functionality will be implemented with authentication");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save");
    }
  };

  const handleTest = async () => {
    if (!currentResource) {
      setError("No resource to test");
      return;
    }

    try {
      const response = await fetch("/api/ui-builder/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource: currentResource }),
      });

      if (!response.ok) {
        throw new Error("Failed to test resource");
      }

      const data = await response.json();
      console.log("Test result:", data);
      alert("UI resource tested successfully! Check the console for details.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to test");
    }
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
      {/* Left Sidebar - Template Gallery (collapsible) */}
      {showTemplates && (
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
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Chat</span>
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-semibold">MCP-UI Function Builder</h1>
            {!showTemplates && (
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
              onClick={resetResource}
              title="Reset to blank"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTest}
              title="Test in chat"
            >
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              title="Export code"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              title="Save template"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
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
          {/* Active Tab Content */}
          <div className="flex-1 overflow-hidden">
            {renderTabContent()}
          </div>

          {/* Right Sidebar - Context Sidebar (persistent) */}
          <ContextSidebar />

          {/* Right Sidebar - Configuration (collapsible, only on design tab) */}
          {activeTab === 'design' && showConfig && (
            <div className="w-80 border-l bg-card overflow-y-auto">
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

          {/* Toggle config panel if hidden */}
          {activeTab === 'design' && !showConfig && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-[17rem] top-20"
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
    </div>
  );
}
