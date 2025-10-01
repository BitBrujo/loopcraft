"use client";

import { useState, useEffect } from 'react';
import {
  ServerIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  WrenchIcon,
  LinkIcon,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { cn } from '@/lib/utils';

interface MCPServerStatus {
  name: string;
  connected: boolean;
  toolCount: number;
}

/**
 * ContextSidebar - Persistent sidebar showing MCP integration status
 * Visible across all tabs to provide context about available servers and tools
 */
export function ContextSidebar() {
  const {
    mcpContext,
    actionMappings,
    validationIssues,
  } = useUIBuilderStore();

  const [servers, setServers] = useState<MCPServerStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch MCP servers status
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/mcp/servers');
        if (response.ok) {
          const data = await response.json();
          setServers(data.servers || []);
        }
      } catch (error) {
        console.error('Failed to fetch MCP servers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const errorCount = validationIssues.filter(i => i.severity === 'error').length;
  const warningCount = validationIssues.filter(i => i.severity === 'warning').length;

  return (
    <div className="flex h-full flex-col border-r border-border bg-card/30">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4">
        <h3 className="text-sm font-medium">Integration Status</h3>
        <p className="text-xs text-muted-foreground mt-1">
          MCP servers and tool status
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* MCP Servers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ServerIcon className="size-4 text-muted-foreground" />
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                MCP Servers
              </h4>
            </div>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading servers...</p>
            ) : servers.length === 0 ? (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p>No MCP servers connected.</p>
                <p className="mt-1">Configure servers in settings.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {servers.map((server) => (
                  <div
                    key={server.name}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md border text-xs",
                      server.connected
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {server.connected ? (
                        <CheckCircle2Icon className="size-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircleIcon className="size-3 text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{server.name}</span>
                    </div>
                    <span className="text-muted-foreground flex-shrink-0">
                      {server.toolCount} tools
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Tools */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <WrenchIcon className="size-4 text-muted-foreground" />
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Selected Tools
              </h4>
            </div>
            {mcpContext.selectedTools.length === 0 ? (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p>No tools selected yet.</p>
                <p className="mt-1">Browse tools in the Context tab.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {mcpContext.selectedTools.map((tool) => (
                  <div
                    key={`${tool.serverName}-${tool.name}`}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{tool.name}</div>
                      <div className="text-muted-foreground text-[10px] truncate">
                        {tool.serverName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Mappings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="size-4 text-muted-foreground" />
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Action Mappings
              </h4>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-sm font-medium">{actionMappings.length}</span>
            </div>
          </div>

          {/* Validation Status */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangleIcon className="size-4 text-muted-foreground" />
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Validation
              </h4>
            </div>
            <div className="space-y-2">
              {errorCount > 0 && (
                <div className="flex items-center justify-between p-2 rounded-md bg-red-500/10 border border-red-500/20">
                  <span className="text-xs text-red-700 dark:text-red-400">Errors</span>
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">{errorCount}</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center justify-between p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-xs text-yellow-700 dark:text-yellow-400">Warnings</span>
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">{warningCount}</span>
                </div>
              )}
              {errorCount === 0 && warningCount === 0 && (
                <div className="flex items-center justify-between p-2 rounded-md bg-green-500/10 border border-green-500/20">
                  <span className="text-xs text-green-700 dark:text-green-400">Status</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">All Clear</span>
                </div>
              )}
            </div>
          </div>

          {/* Purpose */}
          {mcpContext.purpose && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Purpose
                </h4>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                {mcpContext.purpose}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
