"use client";

import { NetworkIcon } from 'lucide-react';

/**
 * Flow Tab - Visualize the complete interaction flow
 * TODO: Integrate React Flow for interactive diagrams
 * TODO: Auto-generate flow from action mappings
 * TODO: Add click-to-edit functionality
 */
export function FlowTabContent() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <NetworkIcon className="size-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Flow Tab - Coming Soon</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This tab will display a visual diagram showing the complete interaction flow:
          MCP Server → Tool → UI → User Action → Tool Call → Response
        </p>
        <div className="bg-muted/50 rounded-lg p-4 text-left text-xs space-y-2">
          <p><strong>Planned features:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Interactive flow diagram with React Flow</li>
            <li>Auto-generated from action mappings</li>
            <li>Click nodes to edit relevant configuration</li>
            <li>Trace execution paths (&ldquo;What happens if user clicks X?&rdquo;)</li>
            <li>Highlight missing connections or errors</li>
            <li>Export diagram as SVG/PNG</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
