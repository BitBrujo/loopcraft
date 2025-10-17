'use client';

import { useEffect, useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Info, Check, AlertCircle, Server, ChevronDown, Component, Puzzle, Settings, Layers } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';

interface MCPServer {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
}

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
  const {
    currentResource,
    updateResource,
    companionMode,
    targetServerName,
    availableTools,
    selectedTools,
    setCompanionMode,
    setTargetServerName,
    setAvailableTools,
    toggleToolSelection,
  } = useUIBuilderStore();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [isLoadingServers, setIsLoadingServers] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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
          setMcpServers(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch MCP servers:', error);
      } finally {
        setIsLoadingServers(false);
      }
    };

    fetchServers();
  }, []);

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

  const handleTargetServerChange = async (serverName: string) => {
    setTargetServerName(serverName);

    // Fetch available tools from this server
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mcp/servers/${serverName}/tools`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableTools(data.tools || []);
      } else {
        setAvailableTools([]);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      setAvailableTools([]);
    }
  };

  const enabledServers = mcpServers.filter(s => s.enabled);
  const displayMimeType = getMimeTypeForContentType(currentResource.contentType);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-5xl mx-auto pb-20">

        {/* Section 1: Basic Configuration */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
                Basic Configuration
              </Badge>
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

            {/* Deployment Mode */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Deployment Mode</Label>
              <RadioGroup
                value={companionMode}
                onValueChange={(value: 'disabled' | 'enabled') => setCompanionMode(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disabled" id="integration" />
                  <Label htmlFor="integration" className="font-normal cursor-pointer">
                    Standalone Resource
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6 mb-2">
                  Creating standalone resource - you can deploy it as a new server
                </p>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enabled" id="companion" />
                  <Label htmlFor="companion" className="font-normal cursor-pointer">
                    Companion Server
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Create a UI-only server that works with an existing server&apos;s tools
                </p>
              </RadioGroup>
            </div>

            {/* Conditional Server Selection based on deployment mode */}
            {companionMode === 'disabled' && (
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
                    <SelectValue placeholder="Select server" />
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
                <div className="rounded-lg border bg-muted/30 p-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex w-full justify-between hover:bg-accent -m-4 mb-0 mr-0 p-4 py-6 rounded-t-lg">
                      <span className="flex items-center gap-2 font-semibold">
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
                          Advanced Content Options
                        </Badge>
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedOptions ? '' : '-rotate-90'}`} />
                    </Button>
                  </CollapsibleTrigger>
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
                              <SelectTrigger id="encoding" className="-mx-4 px-4">
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
                              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
                                Remote DOM Framework
                              </Badge>
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
            )}

            {/* Companion Mode Configuration */}
            {companionMode === 'enabled' && (
              <Card className="border-orange-500/30 bg-orange-50/30 dark:bg-orange-950/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Puzzle className="h-4 w-4 text-orange-600" />
                    Companion Server Configuration
                  </CardTitle>
                  <CardDescription>
                    Select a target server and which tools this UI will interact with
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Target server selection */}
                  <div className="space-y-2">
                    <Label htmlFor="targetServer">Target MCP Server</Label>
                    <Select
                      value={targetServerName || ''}
                      onValueChange={handleTargetServerChange}
                    >
                      <SelectTrigger id="targetServer">
                        <SelectValue placeholder="Select server to companion" />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledServers.map((server) => (
                          <SelectItem key={server.id} value={server.name}>
                            {server.name} <span className="text-muted-foreground">({server.type})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {enabledServers.length === 0 && !isLoadingServers && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          No MCP servers configured. Go to <strong>Settings</strong> to add servers.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Tool selection checkboxes */}
                  {availableTools.length > 0 && (
                    <div className="space-y-2">
                      <Label>Available Tools</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                        {availableTools.map((tool) => (
                          <div key={tool.name} className="flex items-start space-x-2">
                            <Checkbox
                              id={`tool-${tool.name}`}
                              checked={selectedTools.includes(tool.name)}
                              onCheckedChange={() => toggleToolSelection(tool.name)}
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`tool-${tool.name}`}
                                className="font-medium cursor-pointer"
                              >
                                {tool.name}
                              </Label>
                              {tool.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {tool.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedTools.length} of {availableTools.length} tools
                      </p>
                    </div>
                  )}

                  {targetServerName && availableTools.length === 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No tools found for <strong>{targetServerName}</strong>. Make sure the server is properly connected.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
