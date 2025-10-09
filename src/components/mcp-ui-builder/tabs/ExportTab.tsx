'use client';

import { useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Download, Check, Info, FileCode, Server } from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { generateServerCode, generateTypeScriptCode } from '@/lib/code-generation';
import type { ExportFormat, ExportLanguage } from '@/types/ui-builder';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export function ExportTab() {
  const { currentResource } = useUIBuilderStore();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('integration');
  const [language, setLanguage] = useState<ExportLanguage>('typescript');
  const [copied, setCopied] = useState(false);

  if (!currentResource) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No resource loaded</AlertDescription>
      </Alert>
    );
  }

  // Generate code based on selected format and language
  const generateCode = (): string => {
    if (exportFormat === 'integration') {
      // Integration snippet - just the createUIResource call
      return generateTypeScriptCode(currentResource);
    } else {
      // Standalone server - complete runnable server
      return generateServerCode(currentResource);
    }
  };

  const code = generateCode();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = exportFormat === 'integration'
      ? `ui-resource.${language === 'typescript' ? 'ts' : 'js'}`
      : `mcp-server.${language === 'typescript' ? 'ts' : 'js'}`;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEditorLanguage = () => {
    return language === 'typescript' ? 'typescript' : 'javascript';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Choose how you want to use this UI resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="integration" id="integration" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="integration" className="font-semibold cursor-pointer flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    Integration Snippet
                    <Badge variant="secondary">Recommended</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Code snippet to add this UI resource to your existing MCP server.
                    Copy and paste into your server&apos;s tool handler.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="standalone" id="standalone" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="standalone" className="font-semibold cursor-pointer flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Standalone Test Server
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete MCP server file ready to run. Great for testing and prototyping.
                    Deploy immediately, then integrate into your real server later.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

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

      <Separator />

      {/* Generated Code */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Code</CardTitle>
          <CardDescription>
            {exportFormat === 'integration'
              ? 'Add this code to your MCP server'
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

      <Separator />

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportFormat === 'integration' ? (
            <div className="space-y-3 text-sm">
              <h4 className="font-semibold">Integration Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Copy the generated code above</li>
                <li>Open your existing MCP server file</li>
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
          ) : (
            <div className="space-y-3 text-sm">
              <h4 className="font-semibold">Standalone Server Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Download the generated server file</li>
                <li>Save it as <code className="bg-muted px-1 rounded">server.js</code> (or .ts)</li>
                <li>Install dependencies: <code className="bg-muted px-1 rounded">npm install @mcp-ui/server @modelcontextprotocol/sdk</code></li>
                <li>Test locally: <code className="bg-muted px-1 rounded">node server.js</code></li>
                <li>Add to your app via Settings &gt; MCP Servers</li>
                <li>Configure as stdio server with command: <code className="bg-muted px-1 rounded">{`["node", "/path/to/server.js"]`}</code></li>
                <li>Enable the server and test in chat</li>
              </ol>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This standalone server is great for testing. Once you&apos;re happy with it,
                  integrate the UI resource into your main server using the Integration Snippet format.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Official Documentation:</h4>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <a
                href="https://docs.mcp.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                → MCP Protocol Specification
              </a>
              <a
                href="https://mcp-ui.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                → MCP-UI Documentation
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
