'use client';

import { useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Download, Check, Rocket, BookOpen, Puzzle, ChevronDown, FileText, Package } from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { generateFastMCPCode, generateHTMLFile } from '@/lib/code-generation';
import type { ExportLanguage, ExportFormat } from '@/types/ui-builder';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DeploymentProgressModal } from '@/components/mcp-ui-builder/DeploymentProgressModal';
import { copyToClipboard } from '@/lib/utils';

export function ExportTab() {
  const {
    currentResource,
    targetServerName,
    selectedTools,
  } = useUIBuilderStore();
  const [exportMode, setExportMode] = useState<ExportFormat>('single-file');
  const [language, setLanguage] = useState<ExportLanguage>('typescript');
  const [copied, setCopied] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  if (!currentResource) {
    return (
      <Alert>
        <AlertDescription>No resource loaded</AlertDescription>
      </Alert>
    );
  }

  // Always use FastMCP format (companion-only mode)
  const generateCode = (): string => {
    const options = targetServerName
      ? {
          targetServerName,
          selectedTools: selectedTools || [],
          mode: exportMode,
        }
      : {
          mode: exportMode,
        };

    return generateFastMCPCode(currentResource, options);
  };

  const code = generateCode();

  // Generate HTML file for two-file mode (only for rawHtml)
  const htmlCode = currentResource.contentType === 'rawHtml' && exportMode === 'two-file'
    ? generateHTMLFile(currentResource)
    : null;

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const baseFilename = targetServerName
      ? `${targetServerName}-ui-server`
      : `companion-ui-server`;
    const ext = language === 'typescript' ? 'ts' : 'js';

    // Download server file
    const serverBlob = new Blob([code], { type: 'text/plain' });
    const serverUrl = URL.createObjectURL(serverBlob);
    const serverLink = document.createElement('a');
    serverLink.href = serverUrl;
    serverLink.download = `${baseFilename}.${ext}`;
    serverLink.click();
    URL.revokeObjectURL(serverUrl);

    // Download HTML file if in two-file mode
    if (htmlCode) {
      setTimeout(() => {
        const htmlBlob = new Blob([htmlCode], { type: 'text/html' });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        const htmlLink = document.createElement('a');
        htmlLink.href = htmlUrl;
        htmlLink.download = 'ui.html';
        htmlLink.click();
        URL.revokeObjectURL(htmlUrl);
      }, 100); // Small delay to avoid browser blocking multiple downloads
    }
  };

  const handleDeploy = () => {
    setShowDeploymentModal(true);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">
        {/* Companion Mode Info Banner */}
        {targetServerName && (
          <Alert className="border-orange-500/30 bg-orange-50/30 dark:bg-orange-950/10">
            <AlertTitle className="text-orange-900 dark:text-orange-100">
              Portable Companion UI for {targetServerName}
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                <strong>Tools:</strong> {selectedTools && selectedTools.length > 0 ? selectedTools.join(', ') : 'None selected'}
              </p>
              <p className="text-sm">
                This creates an independent MCP server that provides visual interfaces for {targetServerName} tools.
                Both servers connect to the same MCP client, which routes tools by prefix automatically.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Deployment Progress Modal */}
        {currentResource && (
          <DeploymentProgressModal
            open={showDeploymentModal}
            onOpenChange={setShowDeploymentModal}
            resource={currentResource}
            format="fastmcp"
            language={language}
            exportMode={exportMode}
            htmlContent={htmlCode || undefined}
            onDeploymentComplete={(result) => {
              if (result.success) {
                console.log('Deployment successful:', result);
              } else {
                console.error('Deployment failed:', result.error);
              }
            }}
          />
        )}

        {/* Deploy Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              Deploy Companion Server
            </CardTitle>
            <CardDescription>
              {targetServerName
                ? `Creates a portable FastMCP server that works with ${targetServerName}`
                : 'Create a companion UI server'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Mode Selection */}
            <div className="space-y-2">
              <Label>Export Mode</Label>
              <RadioGroup value={exportMode} onValueChange={(v) => setExportMode(v as ExportFormat)}>
                <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="two-file" id="two-file" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="two-file" className="font-medium cursor-pointer flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Two-File FastMCP (Recommended)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clean separation: server.ts + ui.html. Easy to edit HTML with full IDE support.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="single-file" id="single-file" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="single-file" className="font-medium cursor-pointer flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Single-File FastMCP (Portable)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      All-in-one: HTML embedded in server file. Zero dependencies, single file portability.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label>Language</Label>
              <RadioGroup value={language} onValueChange={(v) => setLanguage(v as ExportLanguage)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="typescript" id="typescript" />
                  <Label htmlFor="typescript" className="font-normal cursor-pointer">
                    TypeScript (Recommended)
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

            {/* Deploy Button */}
            <Button onClick={handleDeploy} size="lg" className="w-full">
              <Rocket className="h-4 w-4 mr-2" />
              Deploy Now
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Automatically writes file, installs deps, validates, and connects server
            </p>
          </CardContent>
        </Card>

        {/* Code Preview */}
        <Card>
          <CardHeader>
            <CardTitle>
              {exportMode === 'two-file' ? 'Generated Server File (server.ts)' : 'Generated FastMCP Server'}
            </CardTitle>
            <CardDescription>
              {exportMode === 'two-file'
                ? 'Server file with fs.readFileSync() - HTML loaded from ui.html'
                : 'Lightweight, portable MCP server with embedded HTML'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md overflow-hidden border">
              <Editor
                height="400px"
                language={language === 'typescript' ? 'typescript' : 'javascript'}
                value={code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineNumbers: 'on',
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Server Code'}
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                {exportMode === 'two-file' ? 'Download Files (2)' : 'Download File'}
              </Button>
            </div>

            {/* Two-file mode info */}
            {exportMode === 'two-file' && htmlCode && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Two-file mode:</strong> Download will provide both <code className="text-xs bg-muted px-1 py-0.5 rounded">server.{language === 'typescript' ? 'ts' : 'js'}</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">ui.html</code> files. Place them in the same directory.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <Collapsible open={showQuickStart} onOpenChange={setShowQuickStart}>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4 w-4" />
                    Quick Start Guide
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showQuickStart ? '' : '-rotate-90'}`} />
                </Button>
              </CollapsibleTrigger>
              <CardDescription>
                How to deploy and use your companion server
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Deployment Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Deploy this companion server using the button above</li>
                    <li>Ensure {targetServerName || 'your target server'} is running and connected</li>
                    <li>Connect both servers to your MCP client (LoopCraft, Claude Desktop, etc.)</li>
                    <li>Test the UI in chat - both servers will be available</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">How It Works:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Both servers run independently as separate processes</li>
                    <li>• Both connect to the same MCP client</li>
                    <li>• MCP client routes tools by prefix: <code className="text-xs bg-muted px-1 py-0.5 rounded">mcp_{targetServerName}_toolname</code></li>
                    <li>• Portable: Works with any MCP client, not just LoopCraft</li>
                    <li>• No changes to {targetServerName || 'the target server'} needed</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Manual Setup (Alternative):</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Download the generated file</li>
                    <li>Run <code className="text-xs bg-muted px-1 py-0.5 rounded">npm install fastmcp zod @mcp-ui/server</code></li>
                    <li>Run <code className="text-xs bg-muted px-1 py-0.5 rounded">node {targetServerName || 'companion'}-ui-server.{language === 'typescript' ? 'ts' : 'js'}</code></li>
                    <li>Add both servers to your MCP client configuration</li>
                  </ol>
                </div>

                <Alert>
                  <BookOpen className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Documentation:</strong> Learn more about the MCP protocol and multi-server patterns at{' '}
                    <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="underline">
                      modelcontextprotocol.io
                    </a>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  );
}
