'use client';

import { useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Download, Check, Info, FileCode, Server, Rocket, BookOpen, ChevronDown, Puzzle } from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { generateServerCode, generateTypeScriptCode, generateFastMCPCode } from '@/lib/code-generation';
import type { ExportFormat, ExportLanguage } from '@/types/ui-builder';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DeploymentProgressModal } from '@/components/mcp-ui-builder/DeploymentProgressModal';
import { copyToClipboard } from '@/lib/utils';

export function ExportTab() {
  const {
    currentResource,
    companionMode,
    targetServerName,
    selectedTools,
  } = useUIBuilderStore();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('integration');
  const [language, setLanguage] = useState<ExportLanguage>('typescript');
  const [copied, setCopied] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false); // Collapsed by default

  if (!currentResource) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No resource loaded</AlertDescription>
      </Alert>
    );
  }

  const hasServerSelected = !!currentResource.selectedServerName;

  // Generate code based on selected format and language
  const generateCode = (): string => {
    const options = companionMode === 'enabled' && targetServerName
      ? {
          companionMode: true,
          targetServerName,
          selectedTools: selectedTools || [],
        }
      : undefined;

    if (exportFormat === 'integration') {
      // Integration snippet - just the createUIResource call (not available in companion mode)
      return generateTypeScriptCode(currentResource);
    } else if (exportFormat === 'fastmcp') {
      // FastMCP server - using fastmcp framework
      return generateFastMCPCode(currentResource, options);
    } else {
      // Standalone server - complete runnable server
      return generateServerCode(currentResource, options);
    }
  };

  const code = generateCode();

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      console.error('Failed to copy code to clipboard');
    }
  };

  const handleDownload = () => {
    const filename = exportFormat === 'integration'
      ? `ui-resource.${language === 'typescript' ? 'ts' : 'js'}`
      : exportFormat === 'fastmcp'
      ? `fastmcp-server.${language === 'typescript' ? 'ts' : 'js'}`
      : `mcp-server.${language === 'typescript' ? 'ts' : 'js'}`;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeploy = () => {
    // Only allow deployment for standalone/fastmcp formats
    if (exportFormat === 'integration') {
      alert('Quick Deploy is only available for Standalone and FastMCP formats. Integration Snippet requires manual integration.');
      return;
    }

    // Open deployment modal
    setShowDeploymentModal(true);
  };

  const getEditorLanguage = () => {
    return language === 'typescript' ? 'typescript' : 'javascript';
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">
      {/* Server Integration Status */}
      {hasServerSelected && (
        <Alert>
          <Server className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Target Server:</strong> {currentResource.selectedServerName}
            </span>
            <Badge variant="secondary">Ready to deploy</Badge>
          </AlertDescription>
        </Alert>
      )}

      {!hasServerSelected && companionMode === 'disabled' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Standalone Resource</strong> - No server selected. You can deploy this as a new server or integrate it later.
          </AlertDescription>
        </Alert>
      )}

      {/* Companion Mode Alert */}
      {companionMode === 'enabled' && targetServerName && (
        <Alert className="border-orange-500/30 bg-orange-50/30 dark:bg-orange-950/10">
          <Puzzle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 dark:text-orange-100">Companion Server Mode</AlertTitle>
          <AlertDescription>
            This will create a UI-only server that interacts with tools from{' '}
            <strong className="text-orange-900 dark:text-orange-100">{targetServerName}</strong>.
            {selectedTools && selectedTools.length > 0 && (
              <span className="block mt-2 text-sm">
                <strong>Selected Tools:</strong> {selectedTools.join(', ')}
              </span>
            )}
            <span className="block mt-2 text-sm italic">
              Note: Both servers (companion UI + {targetServerName}) must be connected in Settings.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Deployment Progress Modal */}
      {currentResource && (
        <DeploymentProgressModal
          open={showDeploymentModal}
          onOpenChange={setShowDeploymentModal}
          resource={currentResource}
          format={exportFormat as 'standalone' | 'fastmcp'}
          language={language}
          onDeploymentComplete={(result) => {
            if (result.success) {
              // Show success message
              console.log('Deployment successful:', result);
            } else {
              // Show error message
              console.error('Deployment failed:', result.error);
            }
          }}
        />
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
              Export Options
            </Badge>
          </CardTitle>
          <CardDescription>
            {hasServerSelected
              ? 'Choose how you want to integrate with your server'
              : 'Choose how you want to use this UI resource'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              {/* Hide Integration Snippet option in companion mode */}
              {companionMode === 'disabled' && (
                <div className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer ${hasServerSelected ? 'border-primary/50 bg-primary/5' : ''}`}>
                  <RadioGroupItem value="integration" id="integration" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="integration" className="font-semibold cursor-pointer flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      Integration Snippet
                      {hasServerSelected && <Badge variant="default">Best for {currentResource.selectedServerName}</Badge>}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasServerSelected
                        ? `Code snippet to manually add this UI to ${currentResource.selectedServerName} server.`
                        : 'Code snippet to add this UI resource to any MCP server.'
                      }
                      Copy and paste into your server&apos;s tool handler.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="standalone" id="standalone" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="standalone" className="font-semibold cursor-pointer flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Standalone Test Server
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete MCP server file ready to run. Great for testing and prototyping.
                    {hasServerSelected && ' Test this before deploying to your production server.'}
                  </p>
                </div>
              </div>

              <div className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer ${!hasServerSelected || companionMode === 'enabled' ? 'border-primary/50 bg-primary/5' : ''}`}>
                <RadioGroupItem value="fastmcp" id="fastmcp" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="fastmcp" className="font-semibold cursor-pointer flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    FastMCP Server
                    {(companionMode === 'enabled' || !hasServerSelected) && <Badge variant="default">Recommended</Badge>}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Modern MCP framework with cleaner code, built-in error handling, and better developer experience.
                    {companionMode === 'enabled' && ' Perfect for companion servers.'}
                    {hasServerSelected && companionMode === 'disabled' && ' Perfect for production deployments.'}
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Quick Deploy Section - Only for standalone/fastmcp */}
          {(exportFormat === 'standalone' || exportFormat === 'fastmcp') && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Quick Deploy
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Automatically deploy this {exportFormat === 'fastmcp' ? 'FastMCP' : 'standalone'} server with one click
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-sm text-muted-foreground flex-1">
                      <p className="font-medium text-foreground mb-2">Deployment steps:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Write server file to disk</li>
                        <li>Install dependencies</li>
                        <li>Test server startup</li>
                        <li>Validate MCP protocol</li>
                        <li>Add to database</li>
                        <li>Enable and connect server</li>
                      </ul>
                    </div>
                    <Button
                      onClick={handleDeploy}
                      className="gap-2 whitespace-nowrap"
                    >
                      <Rocket className="h-4 w-4" />
                      Deploy Now
                    </Button>
                  </div>
                  <Alert className="mt-4 bg-background/50">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Note:</strong> Deployment is fully automated. The server will be ready to use in chat within seconds.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Language Selection */}
          <div className="space-y-3">
            <Label>Language</Label>
            <RadioGroup value={language} onValueChange={(v) => setLanguage(v as ExportLanguage)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="typescript" id="typescript" />
                <Label htmlFor="typescript" className="font-normal cursor-pointer">
                  TypeScript
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="javascript" id="javascript" />
                <Label htmlFor="javascript" className="font-normal cursor-pointer">
                  JavaScript
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Guide - Collapsible */}
      <Collapsible open={showQuickStart} onOpenChange={setShowQuickStart}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <CardTitle className="text-lg font-semibold">
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5 inline-flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quick Start Guide
                </Badge>
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${showQuickStart ? '' : '-rotate-90'}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {exportFormat === 'integration' ? (
                <div className="space-y-3 text-sm">
                  <h4 className="font-semibold">
                    {hasServerSelected
                      ? `Integration Steps for ${currentResource.selectedServerName}:`
                      : 'Integration Steps:'
                    }
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Copy the generated code below</li>
                    <li>Open your {hasServerSelected ? currentResource.selectedServerName : 'MCP'} server file</li>
                    <li>Add the <code className="bg-muted px-1 rounded">createUIResource</code> call</li>
                    <li>Register the tool in your <code className="bg-muted px-1 rounded">ListToolsRequestSchema</code> handler</li>
                    <li>Handle it in your <code className="bg-muted px-1 rounded">CallToolRequestSchema</code> handler</li>
                    <li>Return the resource with <code className="bg-muted px-1 rounded">__MCP_UI_RESOURCE__:</code> prefix</li>
                    <li>Test in chat by asking the AI to use your tool</li>
                  </ol>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      The UI will render automatically when the AI calls your tool.
                      {currentResource.templatePlaceholders && currentResource.templatePlaceholders.length > 0 && (
                        <> Agent placeholders like <code className="bg-muted px-1 rounded">{'{{user.id}}'}</code> will be filled with contextual data.</>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : exportFormat === 'fastmcp' ? (
                <div className="space-y-3 text-sm">
                  <h4 className="font-semibold">
                    {companionMode === 'enabled' ? 'Companion Server Setup:' : 'FastMCP Server Steps:'}
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Download the generated server file</li>
                    <li>Save it as <code className="bg-muted px-1 rounded">
                      {companionMode === 'enabled' ? `${targetServerName}-ui-server.ts` : 'server.ts'}
                    </code> (or .js)</li>
                    <li>Install dependencies: <code className="bg-muted px-1 rounded">
                      npm install fastmcp {companionMode === 'disabled' ? 'zod' : ''} @mcp-ui/server
                    </code></li>
                    <li>Test locally: <code className="bg-muted px-1 rounded">npx tsx {companionMode === 'enabled' ? `${targetServerName}-ui-server.ts` : 'server.ts'}</code></li>
                    <li>Add to your app via Settings &gt; MCP Servers</li>
                    <li>Configure as stdio server with command: <code className="bg-muted px-1 rounded">{`["npx", "-y", "tsx", "/path/to/${companionMode === 'enabled' ? `${targetServerName}-ui-server.ts` : 'server.ts'}"]`}</code></li>
                    {companionMode === 'enabled' && (
                      <li className="text-orange-600 dark:text-orange-400 font-medium">
                        Make sure both <strong>{targetServerName}-ui</strong> and <strong>{targetServerName}</strong> servers are enabled
                      </li>
                    )}
                    <li>Enable the server and test in chat</li>
                  </ol>
                  <Alert className={companionMode === 'enabled' ? 'border-orange-500/30' : ''}>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {companionMode === 'enabled' ? (
                        <>
                          <strong>Companion Pattern:</strong> This UI-only server provides a visual interface for {targetServerName} tools. Both servers must be connected for the UI to function properly.
                        </>
                      ) : (
                        <>
                          <strong>FastMCP Benefits:</strong> Cleaner code (~60% less boilerplate), built-in error handling, type-safe parameters with Zod, and better developer experience.{' '}
                          {hasServerSelected && (
                            <>Once tested, you can use the Integration Snippet format to add to {currentResource.selectedServerName}.</>
                          )}
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <h4 className="font-semibold">Standalone Server Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Download the generated server file</li>
                    <li>Save it as <code className="bg-muted px-1 rounded">server.ts</code> (or .js)</li>
                    <li>Install dependencies: <code className="bg-muted px-1 rounded">npm install @mcp-ui/server @modelcontextprotocol/sdk</code></li>
                    <li>Test locally: <code className="bg-muted px-1 rounded">npx tsx server.ts</code></li>
                    <li>Add to your app via Settings &gt; MCP Servers</li>
                    <li>Configure as stdio server with command: <code className="bg-muted px-1 rounded">{`["npx", "-y", "tsx", "/path/to/server.ts"]`}</code></li>
                    <li>Enable the server and test in chat</li>
                  </ol>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This standalone server is great for testing.{' '}
                      {hasServerSelected && (
                        <>Once you&apos;re happy with it, use the Integration Snippet format to add it to {currentResource.selectedServerName} server.</>
                      )}
                      {!hasServerSelected && (
                        <>Once you&apos;re happy with it, integrate the UI resource into your main server using the Integration Snippet format.</>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Official Documentation:</h4>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <a
                    href="https://github.com/modelcontextprotocol/specification"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    → MCP Protocol Specification
                  </a>
                  <a
                    href="https://github.com/modelcontextprotocol/mcp-ui"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    → MCP-UI Documentation
                  </a>
                  <a
                    href="https://github.com/modelcontextprotocol"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    → Model Context Protocol GitHub
                  </a>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Generated Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
              Generated Code
            </Badge>
          </CardTitle>
          <CardDescription>
            {exportFormat === 'integration'
              ? hasServerSelected
                ? `Add this code to ${currentResource.selectedServerName} server`
                : 'Add this code to your MCP server'
              : exportFormat === 'fastmcp'
              ? 'FastMCP server - cleaner code with built-in features'
              : 'Save this as a .js/.ts file and run with Node.js'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md overflow-hidden">
            <Editor
              height="400px"
              language={getEditorLanguage()}
              value={code}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCopy} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button onClick={handleDownload} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download File
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
