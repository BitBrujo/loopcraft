"use client";

import { ConstructionIcon } from 'lucide-react';

/**
 * Actions Tab - Map UI interactions to MCP tool calls
 * TODO: Implement HTML parser to detect interactive elements
 * TODO: Create action mapping interface
 * TODO: Implement parameter binding UI
 */
export function ActionsTabContent() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <ConstructionIcon className="size-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Actions Tab - Coming Soon</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This tab will allow you to map UI interactions (buttons, forms, links) to MCP tool calls
          with parameter binding and response handlers.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 text-left text-xs space-y-2">
          <p><strong>Planned features:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Automatic detection of interactive elements in HTML</li>
            <li>Dropdown to select MCP tools for each action</li>
            <li>Parameter binding interface (UI field → tool parameter)</li>
            <li>Response handler configuration</li>
            <li>Real-time validation of parameter types</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
