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
    isTestServerActive,
    testServerName,
    startTestServer,
    setError,
  } = useServerBuilderStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const [serverName, setServerName] = useState(serverConfig?.name || "my-mcp-server");

  const tools = serverConfig?.tools || [];
  const resources = serverConfig?.resources || [];

  if (!serverConfig || (tools.length === 0 && resources.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            No items added. Please add resources and tools first.
          </p>
          <Button onClick={() => router.push('/mcp-server-builder')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const generateServerCode = () => {
    // Generate MCP server code with ALL tools and resources
    const toolSchemas = tools.map(tool => `      {
        name: '${tool.name}',
        description: '${tool.description}',
        inputSchema: {
          type: 'object',
          properties: {
${tool.parameters
  .map(
    (param) =>
      `            ${param.name}: {
              type: '${param.type}',
              description: '${param.description}',
            },`
  )
  .join('\n')}
          },
          required: [${tool.parameters.filter((p) => p.required).map((p) => `'${p.name}'`).join(', ')}],
        },
      }`).join(',\n');

    const toolHandlers = tools.map(tool => `  if (request.params.name === '${tool.name}') {
    const args = request.params.arguments || {};

    // TODO: Implement ${tool.name} logic here
    // For now, returning mock response
    const result = {
      success: true,
      message: 'Tool ${tool.name} executed successfully',
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
`).join('\n');

    // Generate resource schemas
    const resourceSchemas = resources.map(resource => `      {
        uri: '${resource.uri}',
        name: '${resource.name}',
        description: '${resource.description}',
        mimeType: '${resource.mimeType}',
      }`).join(',\n');

    // Generate resource read handlers
    const resourceHandlers = resources.map(resource => {
      const uriPattern = resource.uri.replace(/\{[^}]+\}/g, '([^/]+)');
      const hasVariables = resource.isTemplate && (resource.uriVariables || []).length > 0;

      return `  // Handle ${resource.name}
  const ${resource.id}Pattern = new RegExp('^${uriPattern}$');
  if (${resource.id}Pattern.test(request.params.uri)) {
${hasVariables ? `    const match = request.params.uri.match(${resource.id}Pattern);
    ${(resource.uriVariables || []).map((v, i) => `const ${v.name} = match[${i + 1}];`).join('\n    ')}

    // TODO: Fetch actual data based on variables
` : '    // TODO: Fetch actual data\n'}    const mockData = ${JSON.stringify(resource.exampleData || {}, null, 6).split('\n').join('\n    ')};

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: '${resource.mimeType}',
          text: typeof mockData === 'string' ? mockData : JSON.stringify(mockData, null, 2),
        },
      ],
    };
  }
`;
    }).join('\n');

    const code = `#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Create MCP server with ${tools.length} tool${tools.length !== 1 ? 's' : ''} and ${resources.length} resource${resources.length !== 1 ? 's' : ''}
const server = new Server(
  {
    name: '${serverConfig.name}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

${tools.length > 0 ? `// List all tools (${tools.length} total)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
${toolSchemas}
    ],
  };
});` : ''}

${resources.length > 0 ? `// List all resources (${resources.length} total)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
${resourceSchemas}
    ],
  };
});` : ''}

${tools.length > 0 ? `// Tool handler - handles all ${tools.length} tool${tools.length > 1 ? 's' : ''}
server.setRequestHandler(CallToolRequestSchema, async (request) => {
${toolHandlers}
  throw new Error(\`Unknown tool: \${request.params.name}\`);
});` : ''}

${resources.length > 0 ? `// Resource read handler - handles all ${resources.length} resource${resources.length > 1 ? 's' : ''}
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
${resourceHandlers}
  throw new Error(\`Unknown resource URI: \${request.params.uri}\`);
});` : ''}

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

      const fileName = `mcp-${serverName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.ts`;

      const response = await fetch('/api/ui-builder/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serverCode: code,
          fileName,
          serverName: serverName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle duplicate server name
        if (response.status === 409) {
          const shouldContinue = window.confirm(
            error.message + '\n\nDo you want to go to Settings to delete it?'
          );

          if (shouldContinue) {
            router.push('/settings');
          }
          setIsGenerating(false);
          return;
        }

        throw new Error(error.message || error.error || 'Failed to create test server');
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

        {/* Server Summary */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Server Summary</h3>
            <div className="flex items-center gap-2">
              {resources.length > 0 && (
                <div className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  {resources.length} Resource{resources.length !== 1 ? 's' : ''}
                </div>
              )}
              {tools.length > 0 && (
                <div className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  {tools.length} Tool{tools.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Resources Section */}
            {resources.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">RESOURCES</h4>
                {resources.map((resource) => (
                  <div key={resource.id} className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20 mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-mono font-semibold text-sm">{resource.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{resource.description}</div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">URI</div>
                      <div className="text-xs bg-background px-2 py-1 rounded inline-block font-mono">
                        {resource.uri}
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">MIME Type</div>
                      <div className="text-xs bg-background px-2 py-1 rounded inline-block">
                        {resource.mimeType}
                      </div>
                    </div>

                    {resource.isTemplate && resource.uriVariables && resource.uriVariables.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          URI Variables ({resource.uriVariables.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {resource.uriVariables.map((variable, i) => (
                            <div
                              key={i}
                              className="bg-background px-2 py-1 rounded text-xs flex items-center gap-1"
                            >
                              <span className="font-mono">{variable.name}</span>
                              <span className="text-muted-foreground">({variable.type})</span>
                              {variable.required && (
                                <span className="text-destructive">*</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tools Section */}
            {tools.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3">TOOLS</h4>
                {tools.map((tool) => (
                  <div key={tool.id} className="bg-orange-500/5 rounded-lg p-4 border border-orange-500/20 mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-mono font-semibold text-sm">{tool.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{tool.description}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        Parameters ({tool.parameters.length})
                      </div>
                      {tool.parameters.length === 0 ? (
                        <div className="text-xs italic text-muted-foreground">No parameters</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {tool.parameters.map((param, i) => (
                            <div
                              key={i}
                              className="bg-background px-2 py-1 rounded text-xs flex items-center gap-1"
                            >
                              <span className="font-mono">{param.name}</span>
                              <span className="text-muted-foreground">({param.type})</span>
                              {param.required && (
                                <span className="text-destructive">*</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">Returns</div>
                      <div className="text-xs bg-background px-2 py-1 rounded inline-block mt-1">
                        <span className="font-mono">{tool.returnType}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Server Name Input */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Server Configuration</h3>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Server Name (must be unique)
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="my-mcp-server"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This name will be used to identify your server in the chat
            </p>
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
            disabled={isGenerating || !serverName.trim()}
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
