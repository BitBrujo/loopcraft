'use client';

import { useEffect, useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Info, Check, AlertCircle, Server, Sparkles, ChevronDown, Component, Puzzle, Settings } from 'lucide-react';
import type { ContentType } from '@/types/ui-builder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// Auto-determine MIME type based on content type
const getMimeTypeForContentType = (contentType: ContentType): string => {
  switch (contentType) {
    case 'rawHtml':
      return 'text/html';
    case 'externalUrl':
      return 'text/uri-list';
    case 'remoteDom':
      return 'application/vnd.mcp-ui.remote-dom';
    default:
      return 'text/html';
  }
};

export function ConfigureTab() {
  const { currentResource, updateResource } = useUIBuilderStore();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [isLoadingServers, setIsLoadingServers] = useState(true);
  const [sizePreset, setSizePreset] = useState<SizePreset>('medium');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showRendererOptions, setShowRendererOptions] = useState(false);

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
  const displayMimeType = getMimeTypeForContentType(currentResource.contentType);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-5xl mx-auto pb-20">

        {/* Section 1: Basic Configuration */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <span
                className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: '#6d8d96' }}
              >
                Basic Configuration
              </span>
            </CardTitle>
            <CardDescription>
              Core resource settings
              <span className="block mt-1 text-xs">
                Fields marked with <abbr title="required" className="text-destructive ml-0.5 no-underline" aria-label="required">*</abbr> are required
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resource URI */}
            <div className="space-y-2">
              <Label htmlFor="uri" className="text-sm font-medium">
                Resource URI <abbr title="required" className="text-destructive ml-0.5 no-underline" aria-label="required">*</abbr>
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

            {/* Content Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Content Type <abbr title="required" className="text-destructive ml-0.5 no-underline" aria-label="required">*</abbr>
              </Label>
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

            {/* MCP Server Integration */}
            <div className="space-y-2">
              <Label htmlFor="server" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                MCP Server Integration
              </Label>
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

              {/* Advanced Content Options - Nested under MCP Server Integration */}
              <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions} className="mt-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-accent mb-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <span
                        className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: '#6d8d96' }}
                      >
                        Advanced Content Options
                      </span>
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedOptions ? '' : '-rotate-90'}`} />
                  </Button>
                </CollapsibleTrigger>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-3">Optional advanced configuration</p>
                  <CollapsibleContent>
                    <div className="space-y-4 pt-2">
                      <TooltipProvider>
                        {/* MIME Type (Read-only) */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Label>MIME Type</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Automatically determined based on content type</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Badge variant="secondary" className="font-mono">
                            {displayMimeType}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Auto-determined from content type (read-only)
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

                        {/* Supported Content Types (only for rawHtml) */}
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

                        {/* Remote DOM Framework (only when remoteDom is selected) */}
                        {currentResource.contentType === 'remoteDom' && (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <Label className="text-base font-medium">Remote DOM Framework</Label>
                            </div>
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
                                      <Component className="h-4 w-4" />
                                      <span>React</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="webcomponents">
                                    <div className="flex items-center gap-2">
                                      <Puzzle className="h-4 w-4" />
                                      <span>Web Components</span>
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
                          </div>
                        )}
                      </TooltipProvider>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: UI Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <span
                className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: '#6d8d96' }}
              >
                UI Metadata
              </span>
            </CardTitle>
            <CardDescription>Display and rendering configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Size Preset */}
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

            {/* Custom Size Inputs */}
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

            <Separator className="my-6" />

            {/* Renderer Options Section - Collapsible */}
            <Collapsible open={showRendererOptions} onOpenChange={setShowRendererOptions}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-accent mb-4">
                  <span className="flex items-center gap-2 font-semibold">
                    <span
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: '#6d8d96' }}
                    >
                      <Settings className="h-4 w-4" />
                      Renderer Options
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showRendererOptions ? '' : '-rotate-90'}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Configure iframe rendering behavior</p>

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
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
