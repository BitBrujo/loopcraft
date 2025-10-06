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
  id: number;
  name: string;
  type: string;
  enabled: boolean;
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

        const response = await fetch('/api/mcp-servers', { headers });
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
        <div className="max-w-3xl mx-auto p-8 space-y-8">
          {/* UI Mode Selector */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">UI Mode</h3>
              <p className="text-sm text-muted-foreground">
                Choose the type of UI you want to create
              </p>
            </div>
            <RadioGroup value={uiMode} onValueChange={handleModeChange}>
              <div className="grid grid-cols-2 gap-4">
                {/* Read-Only Option */}
                <div className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                  uiMode === 'readonly'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}>
                  <RadioGroupItem value="readonly" id="readonly" className="mt-1" />
                  <Label htmlFor="readonly" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">Read-Only UI</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Display-only content like dashboards, charts, or reports. No user interactions needed.
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      Workflow: Config → Design → Generate → Test
                    </p>
                  </Label>
                </div>

                {/* Interactive Option */}
                <div className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                  uiMode === 'interactive'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}>
                  <RadioGroupItem value="interactive" id="interactive" className="mt-1" />
                  <Label htmlFor="interactive" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold">Interactive UI</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Forms, buttons, and user interactions that trigger MCP tool calls.
                    </p>
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      Workflow: Config → Design → Tools → Actions → Generate → Test
                    </p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Basic Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure the fundamental properties of your UI resource
              </p>
            </div>

            {/* URI */}
            <div className="space-y-2">
              <Label htmlFor="uri" className="text-sm font-medium">URI</Label>
              <Input
                id="uri"
                type="text"
                value={currentResource.uri}
                onChange={(e) => handleFieldChange("uri", e.target.value)}
                placeholder="ui://server/resource"
                className="h-9 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format: ui://[server]/[resource-name]
              </p>
            </div>

            {/* Frame Size */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preferred Frame Size</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="width" className="text-xs font-medium text-muted-foreground">
                    Width (px)
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    value={currentResource.preferredSize.width}
                    onChange={(e) =>
                      handleSizeChange("width", parseInt(e.target.value) || 800)
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-xs font-medium text-muted-foreground">
                    Height (px)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    value={currentResource.preferredSize.height}
                    onChange={(e) =>
                      handleSizeChange("height", parseInt(e.target.value) || 600)
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Presets</Label>
                <div className="grid grid-cols-4 gap-2">
                  {frameSizePresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Initial Render Data */}
            <div className="space-y-2">
              <Label htmlFor="initialData" className="text-sm font-medium">Initial Render Data</Label>
              <p className="text-xs text-muted-foreground">
                JSON data to pass to the UI component (optional)
              </p>
              <textarea
                id="initialData"
                value={
                  currentResource.initialData
                    ? JSON.stringify(currentResource.initialData, null, 2)
                    : ""
                }
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                    updateResource({ initialData: parsed });
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={'{\n  "theme": "dark",\n  "userId": "123"\n}'}
                className="w-full px-3 py-2 text-sm border rounded-md resize-none h-32 font-mono"
              />
            </div>
          </div>

          {/* MCP Server Connection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                Connect to MCP Server
              </h3>
              <p className="text-sm text-muted-foreground">
                Select an existing MCP server to wrap with a UI, or leave empty to create standalone UI
              </p>
            </div>
            <Select
              value={connectedServerName || '__none__'}
              onValueChange={(value) => setConnectedServerName(value === '__none__' ? null : value)}
              disabled={isLoadingServers}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={isLoadingServers ? "Loading servers..." : "None (standalone UI)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (standalone UI)</SelectItem>
                {servers.filter(s => s.enabled).map((server) => (
                  <SelectItem key={server.id} value={server.name}>
                    {server.name} ({server.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {connectedServerName && (
              <p className="text-xs text-green-600">
                ✓ Connected to &quot;{connectedServerName}&quot; - tools will be available in Actions tab
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer with Continue button */}
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-end">
          <Button
            onClick={() => setActiveTab('design')}
            className="gap-2"
          >
            Next: Design UI
            <ArrowRight className="h-4 w-4" />
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
