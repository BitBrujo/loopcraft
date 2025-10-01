"use client";

import { ArrowRight } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { MCPServerExplorer } from "../context/MCPServerExplorer";
import { ToolBrowser } from "../context/ToolBrowser";
import { PurposeDefinition } from "../context/PurposeDefinition";

export function ContextTab() {
  const { setActiveTab, mcpContext } = useUIBuilderStore();

  const canProceed = mcpContext.selectedTools.length > 0 || mcpContext.purpose.trim().length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Discover Available Tools</h2>
          <p className="text-sm text-muted-foreground">
            Select MCP servers and tools that you want to integrate into your UI component.
            This step helps you understand what capabilities are available.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Server Explorer */}
          <div className="border rounded-lg p-4 bg-card">
            <MCPServerExplorer />
          </div>

          {/* Tool Browser */}
          <div className="border rounded-lg p-4 bg-card">
            <ToolBrowser />
          </div>

          {/* Purpose Definition */}
          <div className="border rounded-lg p-4 bg-card">
            <PurposeDefinition />
          </div>
        </div>
      </div>

      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {canProceed ? (
              <span className="text-green-600">Ready to proceed to design</span>
            ) : (
              <span>Select tools or define a purpose to continue</span>
            )}
          </div>
          <Button
            onClick={() => setActiveTab('design')}
            disabled={!canProceed}
            className="gap-2"
          >
            Next: Design UI
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
