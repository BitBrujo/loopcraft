'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info, CheckCircle2, ArrowRight, AlertCircle, Component, Puzzle } from 'lucide-react';
import { ToolSchema, UIResource, ContentType, TabId } from '@/types/ui-builder';
import { CompanionFlowDiagram } from './CompanionFlowDiagram';

interface MCPServer {
  id: number;
  name: string;
  enabled: boolean;
}

interface CompanionWizardProps {
  targetServerName: string | null;
  availableTools: ToolSchema[];
  selectedTools: string[];
  enabledServers: MCPServer[];
  currentResource: UIResource;
  onTargetServerChange: (serverName: string) => void;
  onToolToggle: (toolName: string) => void;
  updateResource: (updates: Partial<UIResource>) => void;
  handleContentTypeChange: (type: ContentType) => void;
  setActiveTab: (tab: TabId) => void;
}

export function CompanionWizard({
  targetServerName,
  availableTools,
  selectedTools,
  enabledServers,
  currentResource,
  onTargetServerChange,
  onToolToggle,
  updateResource,
  handleContentTypeChange,
  setActiveTab,
}: CompanionWizardProps) {
  const isStep1Complete = targetServerName !== '';
  const isStep2Complete = selectedTools.length > 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Flow Diagram - Always Visible at Top */}
      <Card>
        <CardHeader>
          <CardTitle>How the Companion Pattern Works</CardTitle>
          <CardDescription>
            Understanding the architecture of portable companion servers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanionFlowDiagram targetServerName={targetServerName} />
        </CardContent>
      </Card>

      {/* 2-Column Grid: Steps 1, 2, 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:items-stretch">
        {/* Left Column: Steps 1 and 2 */}
        <div className="flex flex-col gap-4 md:gap-6">
        {/* Step 1: Select Target Server */}
        <Card className={isStep1Complete ? 'border-orange-500/50' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 border-2 border-primary text-primary bg-transparent">
                  1
                </span>
                <CardTitle>Which server will this UI companion?</CardTitle>
              </div>
              {isStep1Complete && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
            <CardDescription>
              Your companion UI server will run alongside {targetServerName || 'the target server'}, both connecting to the same MCP client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-4">Target MCP Server</label>
              <Select value={targetServerName ?? undefined} onValueChange={onTargetServerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a server..." />
                </SelectTrigger>
                <SelectContent>
                  {enabledServers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No enabled servers found. Add servers in Settings.
                    </div>
                  ) : (
                    enabledServers.map((server) => (
                      <SelectItem key={server.id} value={server.name}>
                        {server.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select Tools */}
        <Card className={`flex-1 ${isStep2Complete ? 'border-orange-500/50' : ''}`} style={{ opacity: isStep1Complete ? 1 : 0.5 }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 border-2 border-primary text-primary bg-transparent">
                  2
                </span>
                <CardTitle>Which tools should be accessible from the UI?</CardTitle>
              </div>
              {isStep2Complete && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-500/30">
                    {selectedTools.length} selected
                  </Badge>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            <CardDescription>
              These tools will have auto-generated code snippets in the Design tab
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isStep1Complete ? (
              <p className="text-sm text-muted-foreground">Select a target server first</p>
            ) : availableTools.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No tools available from {targetServerName}. Make sure the server is running and connected.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3 h-[24rem] overflow-y-auto">
                {availableTools.map((tool) => (
                  <div key={tool.name} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id={tool.name}
                      checked={selectedTools.includes(tool.name)}
                      onCheckedChange={() => onToolToggle(tool.name)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={tool.name}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {tool.name}
                      </label>
                      {tool.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {tool.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Step 3 */}
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Step 3: Configure Resource */}
        {isStep2Complete && (
          <Card className="border-primary/30 h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 border-2 border-primary text-primary bg-transparent">
                  3
                </span>
                <CardTitle>Configure Resource</CardTitle>
              </div>
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
                  <p className="text-xs text-muted-foreground mt-2">
                    {currentResource.remoteDomConfig?.framework === 'react'
                      ? 'Use React components via @remote-dom/core/client'
                      : 'Use native Web Components with customElements API'}
                  </p>
                </div>
              )}

              {/* Next Button - Inside Step 4 */}
              <div className="flex justify-center md:justify-end pt-4">
                <Button
                  className="gap-2"
                  onClick={() => setActiveTab('design')}
                  disabled={!currentResource.uri.startsWith('ui://')}
                >
                  Next: Continue to Design
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}
