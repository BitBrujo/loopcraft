'use client';

import { useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Download, Check, Rocket, BookOpen, Puzzle, ChevronDown } from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { generateFastMCPCode } from '@/lib/code-generation';
import type { ExportLanguage } from '@/types/ui-builder';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DeploymentProgressModal } from '@/components/mcp-ui-builder/DeploymentProgressModal';
import { copyToClipboard } from '@/lib/utils';

export function ExportTab() {
  const {
    currentResource,
    targetServerName,
    selectedTools,
  } = useUIBuilderStore();
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

  // Always use FastMCP format for companion servers
  const generateCode = (): string => {
    const options = targetServerName
      ? {
          companionMode: true,
          targetServerName,
          selectedTools: selectedTools || [],
        }
      : undefined;

    return generateFastMCPCode(currentResource, options);
  };

  const code = generateCode();

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const filename = targetServerName
      ? `${targetServerName}-ui-server.${language === 'typescript' ? 'ts' : 'js'}`
      : `companion-ui-server.${language === 'typescript' ? 'ts' : 'js'}`;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
            <Puzzle className="h-4 w-4 text-orange-600" />
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
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-orange-600" />
              Deploy Companion Server
            </CardTitle>
            <CardDescription>
              {targetServerName
                ? `Creates a portable FastMCP server that works with ${targetServerName}`
                : 'Create a companion UI server'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <CardTitle>Generated FastMCP Server</CardTitle>
            <CardDescription>
              Lightweight, portable MCP server using the FastMCP framework
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
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
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
