"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditorPanel } from "../EditorPanel";
import { PreviewPanel } from "../PreviewPanel";
import { extractTemplatePlaceholders } from "@/lib/html-parser";

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

export function DesignTab() {
  const [showSettings, setShowSettings] = useState(true);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoadingServers, setIsLoadingServers] = useState(false);

  const {
    setActiveTab,
    currentResource,
    updateResource,
    connectedServerName,
    setConnectedServerName,
  } = useUIBuilderStore();

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

  // Auto-detect template placeholders when content changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      const placeholders = extractTemplatePlaceholders(currentResource.content);
      if (JSON.stringify(placeholders) !== JSON.stringify(currentResource.templatePlaceholders)) {
        updateResource({ templatePlaceholders: placeholders });
      }
    }
  }, [currentResource?.content, currentResource?.contentType, updateResource]);

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

  const canProceed = currentResource && currentResource.content.trim().length > 0;
  const agentSlots = currentResource?.templatePlaceholders?.length || 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Settings Section (Collapsible) */}
      <div className="border-b bg-card">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <h3 className="font-semibold">Basic Settings</h3>
          {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showSettings && (
          <div className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* URI */}
              <div className="space-y-2">
                <Label htmlFor="uri" className="text-sm font-medium">URI</Label>
                <Input
                  id="uri"
                  type="text"
                  value={currentResource?.uri || ''}
                  onChange={(e) => handleFieldChange("uri", e.target.value)}
                  placeholder="ui://server/resource"
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  Format: ui://[server]/[resource-name]
                </p>
              </div>

              {/* Frame Size */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Frame Size (px)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={currentResource?.preferredSize.width || 800}
                    onChange={(e) => handleSizeChange("width", parseInt(e.target.value) || 800)}
                    placeholder="Width"
                    className="h-9"
                  />
                  <Input
                    type="number"
                    value={currentResource?.preferredSize.height || 600}
                    onChange={(e) => handleSizeChange("height", parseInt(e.target.value) || 600)}
                    placeholder="Height"
                    className="h-9"
                  />
                </div>
                <div className="flex gap-2">
                  {frameSizePresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="text-xs h-7"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* MCP Server Connection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Connect to Server</Label>
                </div>
                <Select
                  value={connectedServerName || '__none__'}
                  onValueChange={(value) => setConnectedServerName(value === '__none__' ? null : value)}
                  disabled={isLoadingServers}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={isLoadingServers ? "Loading..." : "None (standalone)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (standalone)</SelectItem>
                    {servers.filter(s => s.status === 'connected').map((server) => (
                      <SelectItem key={server.name} value={server.name}>
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {connectedServerName && (
                  <p className="text-xs text-green-600">
                    ✓ Connected to &quot;{connectedServerName}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-1/2 border-b overflow-hidden">
          <EditorPanel />
        </div>
        <div className="h-1/2 overflow-hidden">
          <PreviewPanel />
        </div>
      </div>

      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm flex items-center gap-2">
            {canProceed ? (
              <>
                <span className="text-green-600">UI design ready</span>
                {agentSlots > 0 && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {agentSlots} agent slot{agentSlots !== 1 ? 's' : ''} detected
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Add UI content to continue</span>
            )}
          </div>
          <Button
            onClick={() => setActiveTab('actions')}
            disabled={!canProceed}
            className="gap-2"
          >
            Next: Map Actions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
