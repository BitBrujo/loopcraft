"use client";

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { InteractiveElementDetector, type DetectedElement } from './actions/InteractiveElementDetector';
import { ActionMappingEditor } from './actions/ActionMappingEditor';
import { ActionMappingList } from './actions/ActionMappingList';

/**
 * Actions Tab - Map UI interactions to MCP tool calls
 * Features:
 * - Automatic detection of interactive elements in HTML
 * - Dropdown to select MCP tools for each action
 * - Parameter binding interface (UI field → tool parameter)
 * - Response handler configuration
 * - Real-time validation of parameter types
 */
export function ActionsTabContent() {
  const [selectedElement, setSelectedElement] = useState<DetectedElement | null>(null);

  const handleSelectElement = (element: DetectedElement) => {
    setSelectedElement(element);
  };

  const handleEditMapping = (elementId: string) => {
    // Find the element in the detector and select it
    // This will trigger the editor to open with the existing mapping
    setSelectedElement({ id: elementId } as DetectedElement);
  };

  const handleCloseEditor = () => {
    setSelectedElement(null);
  };

  return (
    <div className="h-full">
      <PanelGroup direction="horizontal">
        {/* Left: Element Detector */}
        <Panel defaultSize={30} minSize={20} maxSize={40}>
          <InteractiveElementDetector onSelectElement={handleSelectElement} />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-primary" />

        {/* Center: Action Mapper/Editor */}
        <Panel defaultSize={40} minSize={30}>
          <ActionMappingEditor selectedElement={selectedElement} onClose={handleCloseEditor} />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-primary" />

        {/* Right: Mappings List */}
        <Panel defaultSize={30} minSize={20} maxSize={40}>
          <ActionMappingList onEditMapping={handleEditMapping} />
        </Panel>
      </PanelGroup>
    </div>
  );
}
