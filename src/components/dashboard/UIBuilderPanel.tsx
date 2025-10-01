"use client";

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { LayoutTemplateIcon, DownloadIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { ContentTypeSelector } from './ui-builder/ContentTypeSelector';
import { ConfigurationPanel } from './ui-builder/ConfigurationPanel';
import { PreviewPanel } from './ui-builder/PreviewPanel';
import { ExportDialog } from './ui-builder/ExportDialog';
import { TemplateGallery } from './ui-builder/TemplateGallery';

export function UIBuilderPanel() {
  const {
    setShowTemplateGallery,
    setShowExportDialog,
    resetResource,
  } = useUIBuilderStore();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <LayoutTemplateIcon className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-medium">MCP-UI Function Builder</h3>
            <p className="text-xs text-muted-foreground">
              Create interactive UI components for MCP servers
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

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left panel - Content editor */}
          <Panel defaultSize={40} minSize={30}>
            <ContentTypeSelector />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-primary" />

          {/* Center panel - Configuration */}
          <Panel defaultSize={25} minSize={20}>
            <div className="flex h-full flex-col border-l border-border">
              <div className="border-b border-border bg-card/50 p-4">
                <h3 className="text-sm font-medium">Configuration</h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <ConfigurationPanel />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-primary" />

          {/* Right panel - Preview */}
          <Panel defaultSize={35} minSize={25}>
            <PreviewPanel />
          </Panel>
        </PanelGroup>
      </div>

      {/* Dialogs */}
      <TemplateGallery />
      <ExportDialog />

      {/* Help text */}
      <div className="border-t border-border bg-card/30 px-4 py-2 text-xs text-muted-foreground">
        <p>
          <strong>Tip:</strong> Use <code className="px-1 py-0.5 bg-muted rounded">window.parent.postMessage()</code> in your HTML to trigger actions.
          Available action types: tool, prompt, link, intent, notify.
        </p>
      </div>
    </div>
  );
}
