"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, StopCircle, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";

export function TestTab() {
  const router = useRouter();
  const {
    currentResource,
    actionMappings,
    isTestServerActive,
    testServerName,
    testServerId,
    startTestServer,
    stopTestServer,
  } = useUIBuilderStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // Cleanup on unmount if test server is active
  useEffect(() => {
    return () => {
      if (isTestServerActive && testServerId) {
        handleStopTest(true); // silent cleanup
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateServerCode = () => {
    if (!currentResource) return "";

    const serverName = currentResource.uri.split('/')[2] || 'test-server';
    let code = `#!/usr/bin/env node\n`;
    code += `import { Server } from '@modelcontextprotocol/sdk/server/index.js';\n`;
    code += `import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';\n`;
    code += `import { createUIResource } from '@mcp-ui/server';\n\n`;

    code += `const server = new Server(\n`;
    code += `  { name: '${serverName}', version: '1.0.0' },\n`;
    code += `  { capabilities: { resources: {}, tools: {} } }\n`;
    code += `);\n\n`;

    // Add resource handler
    code += `server.setRequestHandler('resources/list', async () => ({\n`;
    code += `  resources: [{ uri: '${currentResource.uri}', name: '${currentResource.title || 'Test UI'}', mimeType: 'application/vnd.mcp.ui+json' }]\n`;
    code += `}));\n\n`;

    code += `server.setRequestHandler('resources/read', async (request) => {\n`;
    code += `  if (request.params.uri === '${currentResource.uri}') {\n`;
    const resourceDataStr = JSON.stringify({
      uri: currentResource.uri,
      contentType: currentResource.contentType,
      content: currentResource.content,
      preferredSize: currentResource.preferredSize,
    }, null, 6).replace(/\n/g, '\n    ');
    code += `    const uiResource = createUIResource(${resourceDataStr});\n`;
    code += `    return { contents: [{ uri: request.params.uri, ...uiResource }] };\n`;
    code += `  }\n`;
    code += `  throw new Error('Resource not found');\n`;
    code += `});\n\n`;

    // Add tool handlers
    if (actionMappings.length > 0) {
      code += `server.setRequestHandler('tools/list', async () => ({\n`;
      code += `  tools: [\n`;
      actionMappings.forEach((mapping, index) => {
        code += `    { name: '${mapping.toolName}', description: 'Handle ${mapping.uiElementId}', inputSchema: { type: 'object', properties: ${JSON.stringify(mapping.parameterBindings)} } }`;
        if (index < actionMappings.length - 1) code += ',';
        code += '\n';
      });
      code += `  ]\n`;
      code += `}));\n\n`;

      code += `server.setRequestHandler('tools/call', async (request) => {\n`;
      code += `  const { name, arguments: args } = request.params;\n\n`;
      actionMappings.forEach((mapping, index) => {
        code += `  ${index > 0 ? 'else ' : ''}if (name === '${mapping.toolName}') {\n`;
        code += `    console.error('Tool called:', name, args);\n`;
        code += `    return { content: [{ type: 'text', text: 'Tool executed: ' + JSON.stringify(args) }] };\n`;
        code += `  }\n`;
      });
      code += `\n  throw new Error(\`Unknown tool: \${name}\`);\n`;
      code += `});\n\n`;
    }

    code += `async function main() {\n`;
    code += `  const transport = new StdioServerTransport();\n`;
    code += `  await server.connect(transport);\n`;
    code += `  console.error('Test MCP Server running');\n`;
    code += `}\n\n`;
    code += `main().catch(console.error);\n`;

    return code;
  };

  const handleExportAndTest = async () => {
    if (!currentResource) {
      setError("No resource to test");
      return;
    }

    setIsExporting(true);
    setError(null);
    setStatus("Generating server code...");

    try {
      // Generate server code
      const serverCode = generateServerCode();
      const timestamp = Date.now();
      const serverName = `__test_${timestamp}`;
      const fileName = `mcp-ui-test-${timestamp}.js`;

      setStatus("Creating temporary server file...");

      // Create temp server via API (we'll use /api/ui-builder/test endpoint)
      const response = await fetch('/api/ui-builder/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          serverCode,
          fileName,
          serverName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create test server');
      }

      const { serverId, filePath } = await response.json();

      setStatus("Test server created!");

      // Update store
      startTestServer(serverName, serverId, filePath);

      // Navigate to chat after a short delay
      setTimeout(() => {
        setStatus("Navigating to chat...");
        router.push('/chat');
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStatus("");
    } finally {
      setIsExporting(false);
    }
  };

  const handleStopTest = async (silent = false) => {
    if (!testServerId) return;

    if (!silent) setIsStopping(true);
    setError(null);

    try {
      // Delete server from database
      const response = await fetch(`/api/mcp-servers/${testServerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok && !silent) {
        throw new Error('Failed to delete test server');
      }

      // Clear state
      stopTestServer();
      if (!silent) setStatus("Test stopped successfully");
      setTimeout(() => setStatus(""), 2000);

    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to stop test');
      }
    } finally {
      if (!silent) setIsStopping(false);
    }
  };

  if (!currentResource) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">No Resource to Test</h2>
          <p className="text-sm text-muted-foreground">
            Create a UI resource in the Design tab first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Test Integration</h2>
        <p className="text-sm text-muted-foreground">
          Test your MCP-UI resource in LoopCraft chat with one click
        </p>
      </div>

      {/* Resource Summary */}
      <div className="border rounded-lg p-4 space-y-3 bg-card">
        <h3 className="font-semibold">Resource Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">URI:</span>
            <span className="font-mono text-xs">{currentResource.uri}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Content Type:</span>
            <span>{currentResource.contentType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Action Mappings:</span>
            <span>{actionMappings.length}</span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {status && (
        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-blue-700 dark:text-blue-300">{status}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {isTestServerActive && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Test Server Active
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Server: {testServerName}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isTestServerActive ? (
          <Button
            onClick={handleExportAndTest}
            disabled={isExporting}
            className="flex-1"
            size="lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5 mr-2" />
                Export & Test in Chat
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => handleStopTest(false)}
            disabled={isStopping}
            variant="destructive"
            className="flex-1"
            size="lg"
          >
            {isStopping ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <StopCircle className="h-5 w-5 mr-2" />
                Stop Test Server
              </>
            )}
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="border-t pt-6 space-y-3">
        <h3 className="font-semibold">How It Works</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Click &quot;Export & Test&quot; to create a temporary MCP server</li>
          <li>The server will be added to your MCP settings automatically</li>
          <li>You&apos;ll be redirected to chat to test the UI</li>
          <li>Try prompts like: &quot;{currentResource.description || `Show me the ${currentResource.uri.split('/').pop()} UI`}&quot;</li>
          <li>Click &quot;Stop Test Server&quot; when done to clean up</li>
        </ol>
      </div>
    </div>
  );
}
