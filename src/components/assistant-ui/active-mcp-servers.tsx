"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Server, Sparkles } from "lucide-react";

interface MCPServer {
  name: string;
  type: "stdio" | "sse" | "http";
  status: "connected" | "disconnected";
  error?: string;
}

interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverName: string;
}

export function ActiveMCPServers() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get authentication token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        // Fetch servers
        const serversResponse = await fetch("/api/mcp/servers", { headers });
        if (serversResponse.ok) {
          const serversData = await serversResponse.json();
          setServers(serversData.servers || []);
        }

        // Fetch resources to detect UI resources
        const resourcesResponse = await fetch("/api/mcp/resources", { headers });
        if (resourcesResponse.ok) {
          const resourcesData = await resourcesResponse.json();
          setResources(resourcesData.resources || []);
        }
      } catch (error) {
        console.error("Failed to fetch MCP data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Optionally poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if a server has UI resources (uri starting with ui://)
  const hasUIResources = (serverName: string) => {
    return resources.some(
      (resource) =>
        resource.serverName === serverName && resource.uri.startsWith("ui://")
    );
  };

  // Show only connected servers
  const connectedServers = servers.filter((s) => s.status === "connected");

  if (isLoading || connectedServers.length === 0) {
    return null; // Don't show section if loading or no servers
  }

  return (
    <div className="mt-4">
      <Separator className="mb-3" />
      <div className="px-1 mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Active MCP Servers
        </h3>
      </div>
      <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
        {connectedServers.slice(0, 5).map((server) => (
          <div
            key={server.name}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted transition-colors"
          >
            <div className="flex-shrink-0">
              <Server className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{server.name}</p>
            </div>
            {hasUIResources(server.name) && (
              <Badge
                variant="secondary"
                className="flex-shrink-0 text-xs px-1.5 py-0 h-5"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                UI
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
