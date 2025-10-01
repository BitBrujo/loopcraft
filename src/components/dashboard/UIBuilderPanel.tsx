"use client";

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  LayoutTemplateIcon,
  DownloadIcon,
  RefreshCwIcon,
  ServerIcon,
  PaletteIcon,
  LinkIcon,
  GitBranchIcon,
  FlaskConicalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIBuilderStore, type BuilderTab } from '@/lib/stores/ui-builder-store';
import { ContextTabContent } from './ui-builder/ContextTabContent';
import { DesignTabContent } from './ui-builder/DesignTabContent';
import { ActionsTabContent } from './ui-builder/ActionsTabContent';
import { FlowTabContent } from './ui-builder/FlowTabContent';
import { TestTabContent } from './ui-builder/TestTabContent';
import { ContextSidebar } from './ui-builder/ContextSidebar';
import { ExportDialog } from './ui-builder/ExportDialog';
import { TemplateGallery } from './ui-builder/TemplateGallery';
import { cn } from '@/lib/utils';

const TABS: Array<{
  id: BuilderTab;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    id: 'context',
    label: 'Context',
    icon: ServerIcon,
    description: 'Discover MCP servers and tools',
  },
  {
    id: 'design',
    label: 'Design',
    icon: PaletteIcon,
    description: 'Create the UI layout',
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: LinkIcon,
    description: 'Wire up interactions',
  },
  {
    id: 'flow',
    label: 'Flow',
    icon: GitBranchIcon,
    description: 'Visualize integration',
  },
  {
    id: 'test',
    label: 'Test',
    icon: FlaskConicalIcon,
    description: 'Validate functionality',
  },
];

export function UIBuilderPanel() {
  const {
    activeTab,
    setActiveTab,
    setShowTemplateGallery,
    setShowExportDialog,
    resetResource,
    sidebarCollapsed,
    setSidebarCollapsed,
    validationIssues,
    actionMappings,
    mcpContext,
  } = useUIBuilderStore();

  // Calculate completion status for each tab
  const getTabStatus = (tabId: BuilderTab): 'complete' | 'partial' | 'incomplete' => {
    switch (tabId) {
      case 'context':
        return mcpContext.selectedTools.length > 0 ? 'complete' : 'incomplete';
      case 'design':
        return 'complete'; // Always complete if they've entered the UI
      case 'actions':
        return actionMappings.length > 0 ? 'complete' : 'incomplete';
      case 'flow':
        return actionMappings.length > 0 && validationIssues.length === 0 ? 'complete' : 'partial';
      case 'test':
        return validationIssues.length === 0 ? 'complete' : 'partial';
      default:
        return 'incomplete';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'context':
        return <ContextTabContent />;
      case 'design':
        return <DesignTabContent />;
      case 'actions':
        return <ActionsTabContent />;
      case 'flow':
        return <FlowTabContent />;
      case 'test':
        return <TestTabContent />;
      default:
        return <DesignTabContent />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <LayoutTemplateIcon className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-medium">MCP-UI Function Builder</h3>
            <p className="text-xs text-muted-foreground">
              Design, wire, and test interactive MCP components
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateGallery(true)}
            className="gap-2"
          >
            <LayoutTemplateIcon className="size-4" />
            Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetResource}
            className="gap-2"
          >
            <RefreshCwIcon className="size-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            className="gap-2"
          >
            <DownloadIcon className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tab navigation bar */}
      <div className="border-b border-border bg-card/20">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const status = getTabStatus(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  title={tab.description}
                >
                  <Icon className="size-4" />
                  {tab.label}
                  {/* Status indicator */}
                  {status === 'complete' && (
                    <span className="size-2 rounded-full bg-green-500" title="Complete" />
                  )}
                  {status === 'partial' && (
                    <span className="size-2 rounded-full bg-yellow-500" title="In progress" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {TABS.filter(tab => getTabStatus(tab.id) === 'complete').length} / {TABS.length} complete
            </span>
            <div className="flex gap-1">
              {TABS.map(tab => (
                <div
                  key={tab.id}
                  className={cn(
                    'size-2 rounded-full transition-colors',
                    getTabStatus(tab.id) === 'complete' && 'bg-green-500',
                    getTabStatus(tab.id) === 'partial' && 'bg-yellow-500',
                    getTabStatus(tab.id) === 'incomplete' && 'bg-muted'
                  )}
                  title={`${tab.label}: ${getTabStatus(tab.id)}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          {!sidebarCollapsed && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={30}>
                <ContextSidebar />
              </Panel>
              <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-primary" />
            </>
          )}

          {/* Main content */}
          <Panel defaultSize={sidebarCollapsed ? 100 : 80} minSize={50}>
            <div className="h-full relative">
              {/* Sidebar toggle button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute top-2 left-2 z-10 rounded-md bg-card/90 p-1.5 border border-border hover:bg-accent transition-colors"
                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon className="size-4" />
                ) : (
                  <ChevronLeftIcon className="size-4" />
                )}
              </button>

              {/* Tab content */}
              <div className="h-full overflow-auto">
                {renderTabContent()}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Dialogs */}
      <TemplateGallery />
      <ExportDialog />

      {/* Help text footer */}
      <div className="border-t border-border bg-card/30 px-4 py-2 text-xs text-muted-foreground">
        <p>
          <strong>Tip:</strong> Use <code className="px-1 py-0.5 bg-muted rounded">window.parent.postMessage()</code> to trigger actions.
          Types: <code>tool</code>, <code>prompt</code>, <code>link</code>, <code>intent</code>, <code>notify</code>.
        </p>
      </div>
    </div>
  );
}
