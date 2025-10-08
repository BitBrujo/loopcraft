"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Link as LinkIcon } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MCPServer {
  name: string;
  type: 'stdio' | 'sse' | 'http';
  status: 'connected' | 'disconnected';
  error?: string;
}

const frameSizePresets = [
  { name: "Small", width: 400, height: 300 },
  { name: "Medium", width: 800, height: 600 },
  { name: "Large", width: 1200, height: 800 },
  { name: "Full", width: 1920, height: 1080 },
];

export function ConfigurationTab() {
  const {
    setActiveTab,
    currentResource,
    updateResource,
    connectedServerName,
    setConnectedServerName,
    serverTools,
    isLoadingServerTools,
    serverToolsError,
    fetchServerTools,
  } = useUIBuilderStore();

  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoadingServers, setIsLoadingServers] = useState(false);

  // Load user's MCP servers
  useEffect(() => {
    const loadServers = async () => {
      setIsLoadingServers(true);
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/mcp/servers', { headers });
        if (response.ok) {
          const data = await response.json();
          setServers(data.servers || []);
        }
      } catch (error) {
        console.error('Failed to load MCP servers:', error);
      } finally {
        setIsLoadingServers(false);
      }
    };

    loadServers();
  }, []);

  // Fetch tools when server is selected
  useEffect(() => {
    if (connectedServerName) {
      fetchServerTools(connectedServerName);
    }
  }, [connectedServerName, fetchServerTools]);

  const handleFieldChange = (field: string, value: string | number) => {
    updateResource({ [field]: value });
  };

  const handleSizeChange = (dimension: "width" | "height", value: number) => {
    if (currentResource) {
      updateResource({
        preferredSize: {
          ...currentResource.preferredSize,
          [dimension]: value,
        },
      });
    }
  };

  const applyPreset = (preset: { width: number; height: number }) => {
    updateResource({
      preferredSize: preset,
    });
  };

  if (!currentResource) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">No resource available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main content area with scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-12 space-y-12">
          {/* Basic Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-2">Basic Settings</h3>
              <p className="text-base text-muted-foreground">
                Configure the fundamental properties of your UI resource
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* URI */}
                <div className="space-y-3">
                  <Label htmlFor="uri" className="text-base font-medium">URI</Label>
                  <Input
                    id="uri"
                    type="text"
                    value={currentResource.uri}
                    onChange={(e) => handleFieldChange("uri", e.target.value)}
                    placeholder="ui://server/resource"
                    className="h-11 text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    Format: ui://[server]/[resource-name]
                  </p>
                </div>

                {/* Frame Size */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Preferred Frame Size</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width" className="text-sm font-medium text-muted-foreground">
                        Width (px)
                      </Label>
                      <Input
                        id="width"
                        type="number"
                        value={currentResource.preferredSize.width}
                        onChange={(e) =>
                          handleSizeChange("width", parseInt(e.target.value) || 800)
                        }
                        className="h-11 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height" className="text-sm font-medium text-muted-foreground">
                        Height (px)
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        value={currentResource.preferredSize.height}
                        onChange={(e) =>
                          handleSizeChange("height", parseInt(e.target.value) || 600)
                        }
                        className="h-11 text-base"
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Presets</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {frameSizePresets.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="default"
                          className="h-10 text-sm"
                          onClick={() => applyPreset(preset)}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* MCP Server Connection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    <Label className="text-base font-medium">Connect to MCP Server</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select an existing MCP server to wrap with a UI, or leave empty to create standalone UI
                  </p>
                  <Select
                    value={connectedServerName || '__none__'}
                    onValueChange={(value) => setConnectedServerName(value === '__none__' ? null : value)}
                    disabled={isLoadingServers}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder={isLoadingServers ? "Loading servers..." : "None (standalone UI)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None (standalone UI)</SelectItem>
                      {servers.filter(s => s.status === 'connected').map((server) => (
                        <SelectItem key={server.name} value={server.name}>
                          {server.name} ({server.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Tool Preview when server is connected */}
                  {connectedServerName && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg space-y-2">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium flex items-center gap-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Connected to &quot;{connectedServerName}&quot;
                      </p>
                      {isLoadingServerTools && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Loading tools...
                        </p>
                      )}
                      {serverToolsError && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Error loading tools: {serverToolsError}
                        </p>
                      )}
                      {!isLoadingServerTools && !serverToolsError && serverTools.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {serverTools.length} tool{serverTools.length !== 1 ? 's' : ''} available:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {serverTools.slice(0, 5).map((tool) => (
                              <span
                                key={tool.name}
                                className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded"
                              >
                                {tool.name}
                              </span>
                            ))}
                            {serverTools.length > 5 && (
                              <span className="text-xs px-2 py-1 text-green-600 dark:text-green-400">
                                +{serverTools.length - 5} more
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                            These tools will be available in the Actions tab
                          </p>
                        </div>
                      )}
                      {!isLoadingServerTools && !serverToolsError && serverTools.length === 0 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          No tools found in this server
                        </p>
                      )}
                    </div>
                  )}

                  {servers.filter(s => s.status === 'disconnected').length > 0 && (
                    <div className="text-sm text-amber-600 space-y-1">
                      <p>⚠ {servers.filter(s => s.status === 'disconnected').length} server(s) failed to connect:</p>
                      <ul className="list-disc list-inside pl-2 space-y-0.5">
                        {servers.filter(s => s.status === 'disconnected').map((server) => (
                          <li key={server.name} className="text-xs">
                            {server.name}: {server.error || 'Connection failed'}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs">Check your server settings or try refreshing.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Continue button */}
      <div className="border-t bg-card p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-end">
          <Button
            onClick={() => setActiveTab('design')}
            className="gap-2 h-11 px-6 text-base"
            size="lg"
          >
            Next: Design UI
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
