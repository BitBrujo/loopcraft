"use client";

import { useState, useEffect } from 'react';
import { SearchIcon, ServerIcon, WrenchIcon, PlusIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIBuilderStore, type MCPTool } from '@/lib/stores/ui-builder-store';
import { cn } from '@/lib/utils';

/**
 * Context Tab - Discover and select MCP tools
 * Users browse available MCP servers and tools, then select which ones
 * their UI component will integrate with.
 */
export function ContextTabContent() {
  const {
    mcpContext,
    setMCPContext,
    addSelectedTool,
    removeSelectedTool,
  } = useUIBuilderStore();

  const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch available MCP tools
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/mcp/tools');
        if (response.ok) {
          const data = await response.json();
          setAvailableTools(data.tools || []);
        }
      } catch (error) {
        console.error('Failed to fetch MCP tools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  const filteredTools = availableTools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.serverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isToolSelected = (tool: MCPTool) => {
    return mcpContext.selectedTools.some(
      t => t.name === tool.name && t.serverName === tool.serverName
    );
  };

  const toggleTool = (tool: MCPTool) => {
    if (isToolSelected(tool)) {
      removeSelectedTool(tool.name, tool.serverName);
    } else {
      addSelectedTool(tool);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header section */}
      <div className="border-b border-border bg-card/50 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div>
            <h2 className="text-lg font-medium">Define Context & Purpose</h2>
            <p className="text-sm text-muted-foreground mt-1">
              What is this UI component for? Which MCP tools will it use?
            </p>
          </div>

          {/* Purpose input */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose (optional)</Label>
            <Textarea
              id="purpose"
              placeholder="Example: A dashboard that displays database metrics and allows users to run queries..."
              value={mcpContext.purpose}
              onChange={(e) => setMCPContext({ purpose: e.target.value })}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Describe what this component does and how users will interact with it
            </p>
          </div>
        </div>
      </div>

      {/* Tools selection */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto p-6">
          <div className="h-full flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search MCP tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Tools list */}
            <div className="flex-1 overflow-hidden border border-border rounded-lg">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">Loading tools...</p>
                  </div>
                ) : filteredTools.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                    <WrenchIcon className="size-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'No tools found matching your search' : 'No MCP tools available'}
                    </p>
                    {!searchQuery && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure MCP servers in settings
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {filteredTools.map((tool) => {
                      const selected = isToolSelected(tool);
                      return (
                        <button
                          key={`${tool.serverName}-${tool.name}`}
                          onClick={() => toggleTool(tool)}
                          className={cn(
                            "w-full text-left p-4 rounded-lg border transition-all",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{tool.name}</h4>
                                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                  {tool.serverName}
                                </span>
                              </div>
                              {tool.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {tool.description}
                                </p>
                              )}
                            </div>
                            <div className={cn(
                              "flex-shrink-0 size-5 rounded border-2 flex items-center justify-center transition-colors",
                              selected
                                ? "border-primary bg-primary"
                                : "border-muted"
                            )}>
                              {selected && <PlusIcon className="size-3 text-primary-foreground" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Selected tools summary */}
            {mcpContext.selectedTools.length > 0 && (
              <div className="border border-border rounded-lg p-4 bg-muted/50">
                <h4 className="text-sm font-medium mb-2">
                  Selected Tools ({mcpContext.selectedTools.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mcpContext.selectedTools.map(tool => (
                    <span
                      key={`${tool.serverName}-${tool.name}`}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
                    >
                      <ServerIcon className="size-3" />
                      {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
