"use client";

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ContentTypeSelector } from './ContentTypeSelector';
import { ConfigurationPanel } from './ConfigurationPanel';
import { PreviewPanel } from './PreviewPanel';

/**
 * Design Tab - UI creation and configuration
 * This tab contains the existing UI builder functionality:
 * - Content type selection (rawHtml, externalUrl, remoteDom)
 * - Monaco code editor
 * - Configuration panel (URI, title, size, initialData)
 * - Live preview with action logging
 */
export function DesignTabContent() {
  return (
    <div className="h-full">
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
              <p className="text-xs text-muted-foreground mt-1">
                Set metadata and preferences
              </p>
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
  );
}
