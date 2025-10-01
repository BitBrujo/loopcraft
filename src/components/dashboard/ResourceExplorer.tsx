"use client";

import { useEffect, useState, useCallback } from 'react';
import { FileIcon, FolderIcon, RefreshCwIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMCPStore } from '@/lib/stores/mcp-store';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { cn } from '@/lib/utils';

export function ResourceExplorer() {
  const {
    resources,
    setResources,
    loadingResources,
    setLoadingResources
  } = useMCPStore();
  const { selectedResource, setSelectedResource, addLog, refreshTrigger } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceContent, setResourceContent] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setLoadingResources(true);
    addLog({
      level: 'info',
      message: 'Loading MCP resources...',
      source: 'ResourceExplorer',
    });

    try {
      const response = await fetch('/api/mcp/resources');
      const data = await response.json();

      if (data.success) {
        setResources(data.resources);
        addLog({
          level: 'info',
          message: `Loaded ${data.resources.length} resources`,
          source: 'ResourceExplorer',
        });
      } else {
        addLog({
          level: 'error',
          message: `Failed to load resources: ${data.error}`,
          source: 'ResourceExplorer',
        });
      }
    } catch (error) {
      addLog({
        level: 'error',
        message: `Error loading resources: ${error}`,
        source: 'ResourceExplorer',
      });
    } finally {
      setLoadingResources(false);
    }
  }, [setResources, setLoadingResources, addLog]);

  const fetchResourceContent = async (uri: string, serverName: string) => {
    addLog({
      level: 'info',
      message: `Fetching resource: ${uri}`,
      source: 'ResourceExplorer',
    });

    try {
      const response = await fetch('/api/mcp/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, serverName }),
      });

      const data = await response.json();

      if (data.success) {
        setResourceContent(JSON.stringify(data.resource, null, 2));
        addLog({
          level: 'info',
          message: `Loaded resource content for: ${uri}`,
          source: 'ResourceExplorer',
        });
      } else {
        addLog({
          level: 'error',
          message: `Failed to load resource: ${data.error}`,
          source: 'ResourceExplorer',
        });
      }
    } catch (error) {
      addLog({
        level: 'error',
        message: `Error fetching resource: ${error}`,
        source: 'ResourceExplorer',
      });
    }
  };

  useEffect(() => {
    loadResources();
  }, [refreshTrigger, loadResources]);

  const filteredResources = resources.filter(resource =>
    resource.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.uri.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group resources by server
  const groupedResources = filteredResources.reduce((acc, resource) => {
    if (!acc[resource.serverName]) {
      acc[resource.serverName] = [];
    }
    acc[resource.serverName].push(resource);
    return acc;
  }, {} as Record<string, typeof resources>);

  return (
    <div className="flex h-full">
      {/* Resource list */}
      <div className="flex w-1/2 flex-col border-r border-border">
        <div className="flex items-center gap-2 border-b border-border bg-card/50 p-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadResources}
            disabled={loadingResources}
          >
            <RefreshCwIcon className={cn("size-4", loadingResources && "animate-spin")} />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {Object.keys(groupedResources).length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                {loadingResources ? 'Loading resources...' : 'No resources found. Connect to an MCP server first.'}
              </div>
            )}

            {Object.entries(groupedResources).map(([serverName, serverResources]) => (
              <div key={serverName} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FolderIcon className="size-4" />
                  {serverName}
                  <span className="text-xs text-muted-foreground">({serverResources.length})</span>
                </div>
                <div className="ml-6 space-y-1">
                  {serverResources.map((resource) => (
                    <button
                      key={resource.uri}
                      onClick={() => {
                        setSelectedResource(resource.uri);
                        fetchResourceContent(resource.uri, resource.serverName);
                      }}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        selectedResource === resource.uri
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <FileIcon className="size-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{resource.name || resource.uri}</div>
                        {resource.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {resource.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground/75 mt-1">
                          {resource.mimeType || 'unknown type'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Resource preview */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card/50 p-4">
          <h3 className="text-sm font-medium">Resource Preview</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            {resourceContent ? (
              <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto">
                <code>{resourceContent}</code>
              </pre>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                Select a resource to view its content
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}