"use client";

import { useEffect, useState } from "react";
import { Search, Wrench, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MCPTool } from "@/types/ui-builder";

export function ToolBrowser() {
  const { mcpContext, addSelectedTool, removeSelectedTool } = useUIBuilderStore();
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  useEffect(() => {
    const fetchTools = async () => {
      if (mcpContext.selectedServers.length === 0) {
        setTools([]);
        return;
      }

      setIsLoading(true);

      // Include JWT token if available (for user-specific servers)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/mcp/tools', { headers });
      if (response.ok) {
        const data = await response.json();
        const filteredTools = data.tools.filter((tool: MCPTool) =>
          mcpContext.selectedServers.includes(tool.serverName)
        );
        setTools(filteredTools);
      }
      setIsLoading(false);
    };

    fetchTools();
  }, [mcpContext.selectedServers]);

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isToolSelected = (toolName: string, serverName: string) =>
    mcpContext.selectedTools.some(
      (t) => t.name === toolName && t.serverName === serverName
    );

  const toggleToolSelection = (tool: MCPTool) => {
    if (isToolSelected(tool.name, tool.serverName)) {
      removeSelectedTool(tool.name, tool.serverName);
    } else {
      addSelectedTool(tool);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4" />
        <h3 className="font-semibold text-sm">Available Tools</h3>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {mcpContext.selectedServers.length === 0 ? (
        <div className="text-xs text-muted-foreground p-4 text-center">
          Select one or more servers to view available tools
        </div>
      ) : isLoading ? (
        <div className="text-xs text-muted-foreground p-4 text-center">
          Loading tools...
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="text-xs text-muted-foreground p-4 text-center">
          No tools found
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {filteredTools.map((tool) => {
            const isSelected = isToolSelected(tool.name, tool.serverName);
            const isExpanded = expandedTool === `${tool.serverName}-${tool.name}`;
            const toolKey = `${tool.serverName}-${tool.name}`;

            return (
              <div
                key={toolKey}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm font-mono truncate">
                          {tool.name}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {tool.serverName}
                        </span>
                      </div>
                      {tool.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {tool.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleToolSelection(tool)}
                        className="h-7 w-7 p-0"
                      >
                        {isSelected ? (
                          <X className="h-3 w-3" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                      </Button>
                      {tool.inputSchema && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedTool(isExpanded ? null : toolKey)
                          }
                          className="h-7 w-7 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && tool.inputSchema && (
                  <div className="border-t bg-muted/30 p-3">
                    <div className="text-xs font-medium mb-2">Input Schema:</div>
                    <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                      {JSON.stringify(tool.inputSchema, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <strong>Selected:</strong> {mcpContext.selectedTools.length} tool(s)
      </div>
    </div>
  );
}
