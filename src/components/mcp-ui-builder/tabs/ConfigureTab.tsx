'use client';

import { useEffect, useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Component, Puzzle, ArrowRight, ArrowLeft } from 'lucide-react';
import type { ContentType } from '@/types/ui-builder';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompanionWizard } from '../CompanionWizard';

interface MCPServer {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
}

export function ConfigureTab() {
  const {
    currentResource,
    updateResource,
    targetServerName,
    availableTools,
    selectedTools,
    setTargetServerName,
    setAvailableTools,
    toggleToolSelection,
    setActiveTab,
  } = useUIBuilderStore();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [serverFetchError, setServerFetchError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Fetch MCP servers on mount
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setServerFetchError('Please log in to load your MCP servers');
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
          setServerFetchError(null);
        } else if (response.status === 401) {
          setServerFetchError('Session expired. Please log in again.');
        } else {
          setServerFetchError(`Failed to load servers (${response.status}). Please try again.`);
        }
      } catch (error) {
        console.error('Failed to fetch MCP servers:', error);
        setServerFetchError('Network error. Please check your connection and try again.');
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

    // Auto-fill URI with server name and default resource name
    if (serverName) {
      updateResource({
        uri: `ui://${serverName}-ui/resource`
      });
    }
  };

  const enabledServers = mcpServers.filter(s => s.enabled);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-5xl mx-auto pb-20">
        {/* Error State */}
        {serverFetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error loading servers:</strong> {serverFetchError}
              {serverFetchError.includes('log in') && (
                <a href="/login" className="block mt-2 underline text-sm">
                  Go to Login →
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Companion Wizard - 3-Step Workflow */}
        <CompanionWizard
          targetServerName={targetServerName}
          availableTools={availableTools}
          selectedTools={selectedTools}
          enabledServers={enabledServers}
          onTargetServerChange={handleTargetServerChange}
          onToolToggle={toggleToolSelection}
        />

        {/* Resource Configuration Card - Only show on step 2 */}
        {currentStep === 2 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Resource Configuration</CardTitle>
            <CardDescription>
              Configure the UI resource for your companion server
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
              {!currentResource.uri.startsWith('ui://') && currentResource.uri && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    URI must start with &quot;ui://&quot;
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                Format: ui://[server-name]/[resource-name]
              </p>
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

            {/* Remote DOM Framework (only when remoteDom is selected) */}
            {currentResource.contentType === 'remoteDom' && (
              <div className="pt-2 border-t">
                <Label htmlFor="framework" className="block mb-4">Remote DOM Framework</Label>
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
            )}
          </CardContent>
        </Card>
        )}

        {/* Navigation Buttons - Show on step 2 */}
        {currentStep === 2 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tool Selection
            </Button>
            <Button
              onClick={() => setActiveTab('design')}
              disabled={!currentResource.uri.startsWith('ui://')}
              className="gap-2"
            >
              Next: Design UI
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
