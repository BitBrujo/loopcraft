"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useServerBuilderStore } from "@/lib/stores/server-builder-store";
import { Button } from "@/components/ui/button";
import { Play, Code, Loader2, CheckCircle } from "lucide-react";

export function TestServerTab() {
  const router = useRouter();
  const {
    serverConfig,
    activeTool,
    isTestServerActive,
    testServerName,
    startTestServer,
    setError,
  } = useServerBuilderStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [showCode, setShowCode] = useState(false);

  if (!activeTool || !serverConfig) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            No tool selected. Please customize a tool first.
          </p>
          <Button onClick={() => router.push('/mcp-server-builder')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const generateServerCode = () => {
    // Generate MCP server code
    const code = `#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create MCP server
const server = new Server(
  {
    name: '${serverConfig.name}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: ${activeTool.name}
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: '${activeTool.name}',
        description: '${activeTool.description}',
        inputSchema: {
          type: 'object',
          properties: {
${activeTool.parameters
  .map(
    (param) =>
      `            ${param.name}: {
              type: '${param.type}',
              description: '${param.description}',
            },`
  )
  .join('\n')}
          },
          required: [${activeTool.parameters.filter((p) => p.required).map((p) => `'${p.name}'`).join(', ')}],
        },
      },
    ],
  };
});

// Tool handler
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === '${activeTool.name}') {
    const args = request.params.arguments || {};

    // TODO: Implement your tool logic here
    // For now, returning mock response
    const result = {
      success: true,
      message: 'Tool executed successfully',
      input: args,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  throw new Error(\`Unknown tool: \${request.params.name}\`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${serverConfig.name} MCP server running on stdio');
}

main().catch(console.error);
`;

    return code;
  };

  const handleGenerateAndTest = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Generate server code
      const code = generateServerCode();
      setGeneratedCode(code);

      // Create temp server file and add to database
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const fileName = `mcp-${serverConfig.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.ts`;

      const response = await fetch('/api/ui-builder/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serverCode: code,
          fileName,
          serverName: serverConfig.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create test server');
      }

      const data = await response.json();

      // Update store with test server info
      startTestServer(data.serverName, data.serverId, data.filePath);

      // Navigate to chat for testing
      setTimeout(() => {
        router.push('/chat');
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate server');
      console.error('Failed to generate test server:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Test Your Server</h2>
          <p className="text-muted-foreground">
            Generate a working MCP server and test it in chat
          </p>
        </div>

        {/* Tool Summary */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Tool Summary</h3>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tool Name</div>
              <div className="font-mono bg-muted/50 p-2 rounded">{activeTool.name}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Description</div>
              <div className="bg-muted/50 p-2 rounded">{activeTool.description}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Parameters ({activeTool.parameters.length})
              </div>
              {activeTool.parameters.length === 0 ? (
                <div className="text-sm italic text-muted-foreground">No parameters</div>
              ) : (
                <div className="space-y-2">
                  {activeTool.parameters.map((param, i) => (
                    <div key={i} className="bg-muted/50 p-2 rounded flex items-center gap-2">
                      <span className="font-mono text-sm">{param.name}</span>
                      <span className="text-xs text-muted-foreground">({param.type})</span>
                      {param.required && (
                        <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                          required
                        </span>
                      )}
                      <span className="text-sm ml-auto">{param.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Returns</div>
              <div className="bg-muted/50 p-2 rounded">
                <span className="font-mono text-sm">{activeTool.returnType}</span>
                <span className="text-sm ml-2">- {activeTool.returnDescription}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Status */}
        {isTestServerActive && testServerName && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="font-semibold">Test server is active</div>
              <div className="text-sm text-muted-foreground">
                Server &quot;{testServerName}&quot; is ready for testing in chat
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <Button
            onClick={handleGenerateAndTest}
            disabled={isGenerating}
            size="lg"
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Server...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Generate & Test in Chat
              </>
            )}
          </Button>

          <Button
            onClick={() => {
              setGeneratedCode(generateServerCode());
              setShowCode(true);
            }}
            variant="outline"
            className="w-full gap-2"
          >
            <Code className="h-5 w-5" />
            View Generated Code
          </Button>
        </div>

        {/* Generated Code Preview */}
        {showCode && generatedCode && (
          <div className="mt-6 bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Generated Server Code</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                }}
              >
                Copy Code
              </Button>
            </div>
            <pre className="bg-muted/50 p-4 rounded overflow-x-auto text-sm">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-6 bg-muted/30 rounded-lg p-6">
          <h3 className="font-semibold mb-3">What happens next?</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Server code is generated with your tool</li>
            <li>Temporary server is created in /tmp/mcp-server-builder/</li>
            <li>Server is automatically added to your MCP servers</li>
            <li>You&apos;ll be redirected to chat to test it immediately</li>
            <li>Try asking the AI to use your tool!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
