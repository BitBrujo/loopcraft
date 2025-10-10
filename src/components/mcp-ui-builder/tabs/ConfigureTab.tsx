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
import { Info, Check, AlertCircle, Server, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import type { ContentType } from '@/types/ui-builder';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  const [showAdvancedAnnotations, setShowAdvancedAnnotations] = useState(false);
  const [showAdvancedContentOptions, setShowAdvancedContentOptions] = useState(false);

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

  const handleAudienceChange = (value: string) => {
    if (value === 'both') {
      updateResource({ audience: undefined });
    } else if (value === 'user') {
      updateResource({ audience: ['user'] });
    } else if (value === 'assistant') {
      updateResource({ audience: ['assistant'] });
    }
  };

  const getAudienceValue = () => {
    if (!currentResource.audience) return 'both';
    if (currentResource.audience.includes('user') && !currentResource.audience.includes('assistant')) {
      return 'user';
    }
    if (currentResource.audience.includes('assistant') && !currentResource.audience.includes('user')) {
      return 'assistant';
    }
    return 'both';
  };

  const getConfiguredOptionsCount = () => {
    let count = 0;
    if (currentResource.audience) count++;
    if (currentResource.priority !== undefined) count++;
    return count;
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

          {/* Advanced Content Options */}
          <Collapsible open={showAdvancedContentOptions} onOpenChange={setShowAdvancedContentOptions}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                {showAdvancedContentOptions ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Advanced Content Options</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 animate-in slide-in-from-top-1 duration-150">
              <TooltipProvider>
                {/* MIME Type */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="mimeType">MIME Type</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Override the default MIME type for specialized content handling</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="mimeType"
                    value={currentResource.mimeType || ''}
                    onChange={(e) => updateResource({ mimeType: e.target.value || undefined })}
                    placeholder={
                      currentResource.contentType === 'rawHtml' ? 'text/html' :
                      currentResource.contentType === 'externalUrl' ? 'text/uri-list' :
                      'application/vnd.mcp-ui.remote-dom'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default for content type
                  </p>
                </div>

                {/* Encoding (only for rawHtml) */}
                {currentResource.contentType === 'rawHtml' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="encoding">Encoding</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Text encoding is standard. Use Base64 for embedding binary data or images.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={currentResource.encoding || 'text'}
                      onValueChange={(value: 'text' | 'base64') => updateResource({ encoding: value === 'text' ? undefined : value })}
                    >
                      <SelectTrigger id="encoding">
                        <SelectValue placeholder="Select encoding" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text (UTF-8)</SelectItem>
                        <SelectItem value="base64">Base64</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Supported Content Types */}
                {currentResource.contentType === 'rawHtml' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="supportedContentTypes">Supported Content Types</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Restrict which rendering modes are allowed for security/policy enforcement</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['rawHtml', 'externalUrl', 'remoteDom'] as const).map((type) => (
                        <Badge
                          key={type}
                          variant={
                            !currentResource.supportedContentTypes ||
                            currentResource.supportedContentTypes.includes(type)
                              ? 'default'
                              : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            const current = currentResource.supportedContentTypes || ['rawHtml', 'externalUrl', 'remoteDom'];
                            const updated = current.includes(type)
                              ? current.filter(t => t !== type)
                              : [...current, type];
                            updateResource({
                              supportedContentTypes: updated.length === 3 ? undefined : updated as ('rawHtml' | 'externalUrl' | 'remoteDom')[]
                            });
                          }}
                        >
                          {type === 'rawHtml' && 'Raw HTML'}
                          {type === 'externalUrl' && 'External URL'}
                          {type === 'remoteDom' && 'Remote DOM'}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click to toggle. All types enabled by default.
                    </p>
                  </div>
                )}
              </TooltipProvider>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>


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

      {/* Resource Annotations */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Annotations</CardTitle>
          <CardDescription>
            Optional annotations for audience targeting and priority ordering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={showAdvancedAnnotations} onOpenChange={setShowAdvancedAnnotations}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                {showAdvancedAnnotations ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Advanced Options</span>
                {!showAdvancedAnnotations && getConfiguredOptionsCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getConfiguredOptionsCount()} configured
                  </Badge>
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 animate-in slide-in-from-top-1 duration-150">
              <TooltipProvider>
                {/* Audience */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="audience">Audience</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Control who sees this UI. User-only UIs appear in end-user interfaces. Assistant-only UIs are hidden from users and only visible to the AI.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={getAudienceValue()} onValueChange={handleAudienceChange}>
                    <SelectTrigger id="audience">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both (user and assistant)</SelectItem>
                      <SelectItem value="user">User only</SelectItem>
                      <SelectItem value="assistant">Assistant only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Higher priority UIs are displayed first. Range: 0.0 (low) to 1.0 (high)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {currentResource.priority !== undefined && (
                      <span className="text-sm font-mono text-muted-foreground">
                        {currentResource.priority.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <Slider
                    id="priority"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[currentResource.priority ?? 0.5]}
                    onValueChange={(values: number[]) => updateResource({ priority: values[0] })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low (0.0)</span>
                    <span>High (1.0)</span>
                  </div>
                </div>

                {/* Last Modified (Read-only) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="lastModified">Last Modified</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Automatically tracked for versioning and cache invalidation</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="lastModified"
                    value={currentResource.lastModified || 'Not yet saved'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </TooltipProvider>
            </CollapsibleContent>
          </Collapsible>
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

          <Separator className="my-4" />

          {/* Renderer Options Section */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Renderer Options</h4>
              <p className="text-xs text-muted-foreground">Configure iframe rendering behavior</p>
            </div>

            {/* Auto-Resize Iframe */}
            {currentResource.contentType !== 'remoteDom' && (
              <div className="space-y-2">
                <Label htmlFor="autoResize">Auto-Resize Iframe</Label>
                <Select
                  value={
                    typeof currentResource.uiMetadata?.['auto-resize-iframe'] === 'boolean'
                      ? currentResource.uiMetadata['auto-resize-iframe']
                        ? 'both'
                        : 'disabled'
                      : typeof currentResource.uiMetadata?.['auto-resize-iframe'] === 'object'
                        ? currentResource.uiMetadata['auto-resize-iframe'].width && currentResource.uiMetadata['auto-resize-iframe'].height
                          ? 'both'
                          : currentResource.uiMetadata['auto-resize-iframe'].width
                            ? 'width'
                            : 'height'
                        : 'disabled'
                  }
                  onValueChange={(value) => {
                    const autoResize =
                      value === 'disabled' ? false :
                      value === 'both' ? true :
                      value === 'width' ? { width: true } :
                      { height: true };
                    updateResource({
                      uiMetadata: {
                        ...currentResource.uiMetadata,
                        'auto-resize-iframe': autoResize
                      }
                    });
                  }}
                >
                  <SelectTrigger id="autoResize">
                    <SelectValue placeholder="Choose resize behavior" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="both">Both dimensions</SelectItem>
                    <SelectItem value="width">Width only</SelectItem>
                    <SelectItem value="height">Height only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Automatically adjusts iframe size to fit content
                </p>
              </div>
            )}

            {/* Sandbox Permissions */}
            {currentResource.contentType !== 'remoteDom' && (
              <div className="space-y-2">
                <Label htmlFor="sandboxPermissions">Sandbox Permissions</Label>
                <Select
                  value={
                    currentResource.uiMetadata?.['sandbox-permissions'] === 'allow-scripts' ? 'strict' :
                    currentResource.uiMetadata?.['sandbox-permissions'] === 'allow-forms allow-scripts allow-same-origin allow-popups' ? 'permissive' :
                    currentResource.uiMetadata?.['sandbox-permissions'] &&
                    currentResource.uiMetadata['sandbox-permissions'] !== 'allow-forms allow-scripts allow-same-origin' ? 'custom' :
                    'standard'
                  }
                  onValueChange={(value) => {
                    const permissions =
                      value === 'strict' ? 'allow-scripts' :
                      value === 'permissive' ? 'allow-forms allow-scripts allow-same-origin allow-popups' :
                      value === 'custom' ? currentResource.uiMetadata?.['sandbox-permissions'] || '' :
                      'allow-forms allow-scripts allow-same-origin';
                    updateResource({
                      uiMetadata: {
                        ...currentResource.uiMetadata,
                        'sandbox-permissions': permissions
                      }
                    });
                  }}
                >
                  <SelectTrigger id="sandboxPermissions">
                    <SelectValue placeholder="Choose security level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (forms, scripts, same-origin)</SelectItem>
                    <SelectItem value="strict">Strict (scripts only)</SelectItem>
                    <SelectItem value="permissive">Permissive (includes popups)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {(currentResource.uiMetadata?.['sandbox-permissions'] &&
                  currentResource.uiMetadata['sandbox-permissions'] !== 'allow-scripts' &&
                  currentResource.uiMetadata['sandbox-permissions'] !== 'allow-forms allow-scripts allow-same-origin' &&
                  currentResource.uiMetadata['sandbox-permissions'] !== 'allow-forms allow-scripts allow-same-origin allow-popups') && (
                  <Input
                    value={currentResource.uiMetadata['sandbox-permissions']}
                    onChange={(e) => updateResource({
                      uiMetadata: {
                        ...currentResource.uiMetadata,
                        'sandbox-permissions': e.target.value
                      }
                    })}
                    placeholder="allow-scripts allow-forms"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Controls iframe security restrictions
                </p>
              </div>
            )}

            {/* Iframe Title */}
            <div className="space-y-2">
              <Label htmlFor="iframeTitle">Iframe Title (Accessibility)</Label>
              <Input
                id="iframeTitle"
                value={currentResource.uiMetadata?.['iframe-title'] || ''}
                onChange={(e) => updateResource({
                  uiMetadata: {
                    ...currentResource.uiMetadata,
                    'iframe-title': e.target.value
                  }
                })}
                placeholder="Contact Form Interface"
              />
              <p className="text-xs text-muted-foreground">
                Helps screen readers identify the iframe content
              </p>
            </div>

            {/* Container Style */}
            <div className="space-y-2">
              <Label>Container Style</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="border" className="text-xs text-muted-foreground">
                    Border
                  </Label>
                  <Input
                    id="border"
                    value={currentResource.uiMetadata?.['container-style']?.border || ''}
                    onChange={(e) => updateResource({
                      uiMetadata: {
                        ...currentResource.uiMetadata,
                        'container-style': {
                          ...currentResource.uiMetadata?.['container-style'],
                          border: e.target.value
                        }
                      }
                    })}
                    placeholder="1px solid #ccc"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="borderColor" className="text-xs text-muted-foreground">
                    Border Color
                  </Label>
                  <Input
                    id="borderColor"
                    type="color"
                    value={currentResource.uiMetadata?.['container-style']?.borderColor || '#cccccc'}
                    onChange={(e) => updateResource({
                      uiMetadata: {
                        ...currentResource.uiMetadata,
                        'container-style': {
                          ...currentResource.uiMetadata?.['container-style'],
                          borderColor: e.target.value
                        }
                      }
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="borderRadius" className="text-xs text-muted-foreground">
                    Border Radius
                  </Label>
                  <Input
                    id="borderRadius"
                    value={currentResource.uiMetadata?.['container-style']?.borderRadius || ''}
                    onChange={(e) => updateResource({
                      uiMetadata: {
                        ...currentResource.uiMetadata,
                        'container-style': {
                          ...currentResource.uiMetadata?.['container-style'],
                          borderRadius: e.target.value
                        }
                      }
                    })}
                    placeholder="8px"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="minHeight" className="text-xs text-muted-foreground">
                    Min Height
                  </Label>
                  <Input
                    id="minHeight"
                    value={currentResource.uiMetadata?.['container-style']?.minHeight || ''}
                    onChange={(e) => updateResource({
                      uiMetadata: {
                        ...currentResource.uiMetadata,
                        'container-style': {
                          ...currentResource.uiMetadata?.['container-style'],
                          minHeight: e.target.value
                        }
                      }
                    })}
                    placeholder="400px"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Visual customization for the iframe container
              </p>
            </div>
          </div>
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
