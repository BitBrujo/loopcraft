'use client';

import { useEffect, useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Info, Check, AlertCircle, Server, Sparkles } from 'lucide-react';
import type { ContentType } from '@/types/ui-builder';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MCPServer {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
}

type SizePreset = 'small' | 'medium' | 'large' | 'full' | 'custom';

const SIZE_PRESETS = {
  small: { width: '400px', height: '300px', label: 'Small (400×300)' },
  medium: { width: '800px', height: '600px', label: 'Medium (800×600)' },
  large: { width: '1200px', height: '800px', label: 'Large (1200×800)' },
  full: { width: '100%', height: '600px', label: 'Full Width (100%×600)' },
  custom: { width: '800px', height: '600px', label: 'Custom Size' },
};

export function ConfigureTab() {
  const { currentResource, updateResource } = useUIBuilderStore();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [isLoadingServers, setIsLoadingServers] = useState(true);
  const [sizePreset, setSizePreset] = useState<SizePreset>('medium');

  // Fetch MCP servers on mount
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingServers(false);
          return;
        }

        const response = await fetch('/api/mcp-servers', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMcpServers(data.servers || []);
        }
      } catch (error) {
        console.error('Failed to fetch MCP servers:', error);
      } finally {
        setIsLoadingServers(false);
      }
    };

    fetchServers();
  }, []);

  // Detect current size preset from currentResource
  useEffect(() => {
    if (!currentResource) return;

    const currentSize = currentResource.uiMetadata?.['preferred-frame-size'] || ['800px', '600px'];
    const [width, height] = currentSize;

    // Check which preset matches
    for (const [preset, config] of Object.entries(SIZE_PRESETS)) {
      if (config.width === width && config.height === height) {
        setSizePreset(preset as SizePreset);
        return;
      }
    }

    // If no match, it's custom
    setSizePreset('custom');
  }, [currentResource]);

  if (!currentResource) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No resource loaded</AlertDescription>
      </Alert>
    );
  }

  const handleContentTypeChange = (value: ContentType) => {
    // Clear content when switching content types to avoid stale data
    updateResource({
      contentType: value,
      content: '' // Reset content when changing type
    });
  };

  const handleSizePresetChange = (preset: SizePreset) => {
    setSizePreset(preset);
    if (preset !== 'custom') {
      const { width, height } = SIZE_PRESETS[preset];
      updateResource({
        uiMetadata: {
          ...currentResource.uiMetadata,
          'preferred-frame-size': [width, height]
        }
      });
    }
  };

  const handleCustomSizeChange = (dimension: 'width' | 'height', value: string) => {
    const currentSize = currentResource.uiMetadata?.['preferred-frame-size'] || ['800px', '600px'];
    const newSize: [string, string] = dimension === 'width'
      ? [value, currentSize[1]]
      : [currentSize[0], value];

    updateResource({
      uiMetadata: {
        ...currentResource.uiMetadata,
        'preferred-frame-size': newSize
      }
    });
  };

  const handleServerChange = (value: string) => {
    if (value === 'none') {
      updateResource({
        selectedServerId: null,
        selectedServerName: null
      });
    } else {
      const server = mcpServers.find(s => s.id.toString() === value);
      if (server) {
        updateResource({
          selectedServerId: server.id,
          selectedServerName: server.name
        });
      }
    }
  };

  const preferredSize = currentResource.uiMetadata?.['preferred-frame-size'] || ['800px', '600px'];
  const enabledServers = mcpServers.filter(s => s.enabled);

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
      {/* Resource Identification */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Identification</CardTitle>
          <CardDescription>
            Define the unique identifier for this UI resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uri">
              Resource URI <span className="text-destructive">*</span>
            </Label>
            <Input
              id="uri"
              value={currentResource.uri}
              onChange={(e) => updateResource({ uri: e.target.value })}
              placeholder="ui://myapp/dashboard"
            />
            <p className="text-sm text-muted-foreground">
              Must start with <code className="bg-muted px-1 rounded">ui://</code>
            </p>
            {!currentResource.uri.startsWith('ui://') && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  URI must start with &quot;ui://&quot;
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label>Content Type <span className="text-destructive">*</span></Label>
            <RadioGroup value={currentResource.contentType} onValueChange={handleContentTypeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rawHtml" id="rawHtml" />
                <Label htmlFor="rawHtml" className="font-normal cursor-pointer">
                  Raw HTML
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6 mb-2">
                Static HTML content rendered in an iframe
              </p>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="externalUrl" id="externalUrl" />
                <Label htmlFor="externalUrl" className="font-normal cursor-pointer">
                  External URL
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6 mb-2">
                Embed an external website or web application
              </p>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remoteDom" id="remoteDom" />
                <Label htmlFor="remoteDom" className="font-normal cursor-pointer">
                  Remote DOM
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Server-generated UI using Shopify&apos;s Remote DOM framework
              </p>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Renderer Options - Show on far right when Remote DOM is not selected */}
      {currentResource.contentType !== 'remoteDom' && (
        <Card>
          <CardHeader>
            <CardTitle>Renderer Options</CardTitle>
            <CardDescription>
              Configure how the UI resource is rendered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto-Resize Iframe */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoResize"
                  checked={!!currentResource.uiMetadata?.['auto-resize-iframe']}
                  onChange={(e) => updateResource({
                    uiMetadata: {
                      ...currentResource.uiMetadata,
                      'auto-resize-iframe': e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="autoResize" className="font-normal cursor-pointer">
                  Auto-resize iframe to content
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Automatically adjusts iframe dimensions to fit content. Iframe uses secure sandbox permissions by default.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remote DOM Framework Selection - Only show when remoteDom is selected */}
      {currentResource.contentType === 'remoteDom' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Remote DOM Framework
            </CardTitle>
            <CardDescription>
              Select the framework for your Remote DOM component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="framework">Framework</Label>
              <Select
                value={currentResource.remoteDomConfig?.framework || 'react'}
                onValueChange={(value: 'react' | 'webcomponents') => {
                  updateResource({
                    remoteDomConfig: {
                      ...currentResource.remoteDomConfig,
                      framework: value,
                    },
                  });
                }}
              >
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react">
                    <div className="flex items-center gap-2">
                      <span>⚛️ React</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="webcomponents">
                    <div className="flex items-center gap-2">
                      <span>🧩 Web Components</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {currentResource.remoteDomConfig?.framework === 'react'
                  ? 'Use React components via @remote-dom/core/client'
                  : 'Use native Web Components with customElements API'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MCP Server Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            MCP Server Integration
          </CardTitle>
          <CardDescription>
            Choose an MCP server to integrate with, or create a standalone resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server">Target MCP Server</Label>
            {isLoadingServers ? (
              <div className="text-sm text-muted-foreground">Loading servers...</div>
            ) : (
              <Select
                value={currentResource.selectedServerId?.toString() || 'none'}
                onValueChange={handleServerChange}
              >
                <SelectTrigger id="server">
                  <SelectValue placeholder="Select a server or create standalone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="font-medium">Standalone Resource</span>
                  </SelectItem>
                  {enabledServers.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      {enabledServers.map((server) => (
                        <SelectItem key={server.id} value={server.id.toString()}>
                          {server.name} <span className="text-muted-foreground">({server.type})</span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
            {enabledServers.length === 0 && !isLoadingServers && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No MCP servers configured. Go to <strong>Settings</strong> to add servers, or create a standalone resource.
                </AlertDescription>
              </Alert>
            )}
            {currentResource.selectedServerName && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Will integrate with <strong>{currentResource.selectedServerName}</strong> server
              </div>
            )}
            {!currentResource.selectedServerName && (
              <div className="text-sm text-muted-foreground">
                Creating standalone resource - you can deploy it as a new server
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Standard Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Metadata</CardTitle>
          <CardDescription>
            Basic information about this resource (maps to _meta property)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={currentResource.metadata?.title || ''}
              onChange={(e) => updateResource({
                metadata: {
                  ...currentResource.metadata,
                  title: e.target.value
                }
              })}
              placeholder="Dashboard UI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={currentResource.metadata?.description || ''}
              onChange={(e) => updateResource({
                metadata: {
                  ...currentResource.metadata,
                  description: e.target.value
                }
              })}
              placeholder="Interactive dashboard for monitoring key metrics"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* UI Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>UI Metadata</CardTitle>
          <CardDescription>
            MCP-UI specific configuration (prefixed with mcpui.dev/ui-)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sizePreset">Preferred Frame Size</Label>
            <Select value={sizePreset} onValueChange={handleSizePresetChange}>
              <SelectTrigger id="sizePreset">
                <SelectValue placeholder="Choose a size preset" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SIZE_PRESETS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Initial size for the iframe when rendered
            </p>
          </div>

          {sizePreset === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Size</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="width" className="text-sm text-muted-foreground">
                    Width
                  </Label>
                  <Input
                    id="width"
                    value={preferredSize[0]}
                    onChange={(e) => handleCustomSizeChange('width', e.target.value)}
                    placeholder="800px"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="height" className="text-sm text-muted-foreground">
                    Height
                  </Label>
                  <Input
                    id="height"
                    value={preferredSize[1]}
                    onChange={(e) => handleCustomSizeChange('height', e.target.value)}
                    placeholder="600px"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use CSS units (px, %, vh, vw, etc.)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="lg:col-span-2">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Next step:</strong> Go to the <strong>Design</strong> tab to create your UI content.
        </AlertDescription>
      </Alert>
      </div>
    </div>
  );
}
