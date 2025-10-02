"use client";

import { useEffect, useState } from "react";
import { Server, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import type { MCPServer } from "@/types/ui-builder";

export function MCPServerExplorer() {
  const { mcpContext, toggleServer } = useUIBuilderStore();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="space-y-2">
          {servers.map((server) => {
            const isSelected = mcpContext.selectedServers.includes(server.name);
            return (
              <button
                key={server.name}
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
