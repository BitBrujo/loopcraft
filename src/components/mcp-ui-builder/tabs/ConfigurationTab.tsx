"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Zap, Link as LinkIcon } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    uiMode,
    setUIMode,
    customTools,
    actionMappings,
    clearCustomTools,
    clearActionMappings,
    connectedServerName,
    setConnectedServerName,
  } = useUIBuilderStore();

  const [showModeChangeDialog, setShowModeChangeDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<'readonly' | 'interactive' | null>(null);
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

  const handleModeChange = (newMode: 'readonly' | 'interactive') => {
    // If switching to readonly and there are custom tools/mappings, show confirmation
    if (newMode === 'readonly' && (customTools.length > 0 || actionMappings.length > 0)) {
      setPendingMode(newMode);
      setShowModeChangeDialog(true);
    } else {
      setUIMode(newMode);
    }
  };

  const confirmModeChange = () => {
    if (pendingMode) {
      setUIMode(pendingMode);
      clearCustomTools();
      clearActionMappings();
      setShowModeChangeDialog(false);
      setPendingMode(null);
    }
  };

  const cancelModeChange = () => {
    setShowModeChangeDialog(false);
    setPendingMode(null);
  };

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
          {/* UI Mode Selector */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-2">UI Mode</h3>
              <p className="text-base text-muted-foreground">
                Choose the type of UI you want to create
              </p>
            </div>
            <RadioGroup value={uiMode} onValueChange={handleModeChange}>
              <div className="grid grid-cols-2 gap-6">
                {/* Read-Only Option */}
                <div className={`relative flex items-start space-x-4 rounded-lg border p-6 cursor-pointer transition-all ${
                  uiMode === 'readonly'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}>
                  <RadioGroupItem value="readonly" id="readonly" className="mt-1" />
                  <Label htmlFor="readonly" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-semibold">Read-Only UI</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Display-only content like dashboards, charts, or reports. No user interactions needed.
                    </p>
                    <p className="text-sm text-blue-600 mt-3 font-medium">
                      Workflow: Config → Design → Generate → Test
                    </p>
                  </Label>
                </div>

                {/* Interactive Option */}
                <div className={`relative flex items-start space-x-4 rounded-lg border p-6 cursor-pointer transition-all ${
                  uiMode === 'interactive'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}>
                  <RadioGroupItem value="interactive" id="interactive" className="mt-1" />
                  <Label htmlFor="interactive" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-orange-600" />
                      <span className="text-lg font-semibold">Interactive UI</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Forms, buttons, and user interactions that trigger MCP tool calls.
                    </p>
                    <p className="text-sm text-orange-600 mt-3 font-medium">
                      Workflow: Config → Design → Tools → Actions → Generate → Test
                    </p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

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
                  {connectedServerName && (
                    <p className="text-sm text-green-600">
                      ✓ Connected to &quot;{connectedServerName}&quot; - tools will be available in Actions tab
                    </p>
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

      {/* Mode Change Confirmation Dialog */}
      <Dialog open={showModeChangeDialog} onOpenChange={setShowModeChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to Read-Only Mode?</DialogTitle>
            <DialogDescription>
              Switching to read-only mode will clear your custom tools and action mappings.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>What will be cleared:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              {customTools.length > 0 && (
                <li>{customTools.length} custom tool{customTools.length !== 1 ? 's' : ''}</li>
              )}
              {actionMappings.length > 0 && (
                <li>{actionMappings.length} action mapping{actionMappings.length !== 1 ? 's' : ''}</li>
              )}
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Your UI design and content will be preserved.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={cancelModeChange}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmModeChange}>
              Switch to Read-Only
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
