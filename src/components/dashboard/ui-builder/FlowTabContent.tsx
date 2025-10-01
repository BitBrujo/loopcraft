"use client";

import { FlowDiagram } from './flow/FlowDiagram';
import { FlowControls } from './flow/FlowControls';

/**
 * Flow Tab - Visualize the complete interaction flow
 * Features:
 * - Interactive flow diagram with React Flow
 * - Auto-generated from action mappings
 * - Click nodes to view details
 * - Color-coded nodes (UI Element → Tool → Response Handler)
 * - Highlight errors with red edges
 * - Export diagram as PNG
 * - Mini-map for navigation
 * - Zoom and pan controls
 */
export function FlowTabContent() {
  const handleNodeClick = (nodeId: string) => {
    // Could implement navigation to relevant tab/section
    console.log('Node clicked:', nodeId);
  };

  const handleLayoutChange = (layout: string) => {
    // Layout changes are handled automatically by React Flow
    console.log('Layout changed to:', layout);
  };

  const handleExport = () => {
    console.log('Export SVG requested');
  };

  return (
    <div className="h-full flex flex-col">
      <FlowControls onLayoutChange={handleLayoutChange} onExport={handleExport} />
      <div className="flex-1 overflow-hidden">
        <FlowDiagram onNodeClick={handleNodeClick} />
      </div>
    </div>
  );
}
