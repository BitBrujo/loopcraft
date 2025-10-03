"use client";

import { useEffect, useState } from "react";
import { Server, CheckCircle, AlertCircle, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import type { MCPServer } from "@/types/ui-builder";

interface MCPServerWithError extends MCPServer {
  error?: string;
}

export function MCPServerExplorer() {
  const { mcpContext, toggleServer } = useUIBuilderStore();
  const [servers, setServers] = useState<MCPServerWithError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const fetchServers = async () => {
    setIsLoading(true);
    setError(null);

    // Include JWT token if available (for user-specific servers)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/mcp/servers', { headers });
    if (response.ok) {
      const data = await response.json();
      setServers(data.servers);
    } else {
      setError('Failed to fetch MCP servers');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const toggleErrorExpanded = (serverName: string) => {
    setExpandedErrors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serverName)) {
        newSet.delete(serverName);
      } else {
        newSet.add(serverName);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          <h3 className="font-semibold text-sm">Connected MCP Servers</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchServers}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="text-xs text-red-500 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-xs text-muted-foreground p-4 text-center">
          Loading servers...
        </div>
      ) : servers.length === 0 ? (
        <div className="text-xs text-muted-foreground p-4 text-center">
          No MCP servers connected. Configure servers in your environment to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {servers.map((server) => {
            const isSelected = mcpContext.selectedServers.includes(server.name);
            const hasError = server.status === 'disconnected' && server.error;
            const isErrorExpanded = expandedErrors.has(server.name);

            return (
              <div key={server.name} className="space-y-1">
                <button
                  className={`w-full text-left p-3 border rounded-lg transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-blue-300'
                  }`}
                  onClick={() => toggleServer(server.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          server.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="font-medium text-sm font-mono">{server.name}</span>
                    </div>
                    {server.status === 'connected' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Type: {server.type}
                  </div>
                </button>

                {hasError && (
                  <div className="ml-3 border-l-2 border-red-300 pl-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleErrorExpanded(server.name);
                      }}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                    >
                      {isErrorExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <span className="font-medium">Connection Error</span>
                    </button>
                    {isErrorExpanded && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800 space-y-2">
                        <div>
                          <strong>Error:</strong> {server.error}
                        </div>
                        <div className="text-muted-foreground">
                          <strong>Troubleshooting:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Verify the server command/URL is correct</li>
                            <li>Check that required packages are installed</li>
                            <li>Ensure environment variables are set properly</li>
                            <li>Review server logs for more details</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <strong>Selected:</strong> {mcpContext.selectedServers.length} server(s)
      </div>
    </div>
  );
}
