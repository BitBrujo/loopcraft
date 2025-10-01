"use client";

import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";

// Placeholder component for future action handler builder functionality
// This would allow visual configuration of UI actions (tool calls, prompts, links, etc.)
export function ActionHandlerBuilder() {
  const { currentResource } = useUIBuilderStore();

  if (!currentResource) {
    return null;
  }

  return (
    <div className="p-4">
      <h4 className="text-sm font-semibold mb-3">Action Handlers</h4>
      <p className="text-sm text-muted-foreground">
        Action handler configuration will be available in a future update.
        For now, configure actions via postMessage in your HTML/Remote DOM code.
      </p>

      <div className="mt-4 p-3 bg-muted rounded-md text-xs">
        <p className="font-mono">
          {`// Example postMessage for tool call:`}
          <br />
          {`window.parent.postMessage({`}
          <br />
          {`  type: 'tool',`}
          <br />
          {`  payload: { toolName: 'myTool', params: {} }`}
          <br />
          {`}, '*');`}
        </p>
      </div>
    </div>
  );
}
