"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UIResource, ActionMapping, MCPContext } from "@/types/ui-builder";

interface ExportDialogProps {
  onClose: () => void;
  resource: UIResource | null;
  actionMappings: ActionMapping[];
  mcpContext: MCPContext;
}

type ExportFormat = "typescript" | "json" | "curl" | "handlers" | "server" | "guide";

function generateTypeScriptCode(resource: UIResource): string {
  const contentParam =
    resource.contentType === "rawHtml"
      ? `content: { type: 'rawHtml', htmlString: \`${resource.content}\` }`
      : resource.contentType === "externalUrl"
      ? `content: { type: 'externalUrl', iframeUrl: "${resource.content}" }`
      : `content: {
    type: 'remoteDom',
    script: \`${resource.content}\`,
    framework: 'react'
  }`;

  const hasMetadata = resource.title || resource.description;
  const metadataParam = hasMetadata
    ? `metadata: {
    ${resource.title ? `title: "${resource.title}",` : ""}
    ${resource.description ? `description: "${resource.description}"` : ""}
  },`
    : "";

  const hasUiMetadata = resource.preferredSize || resource.initialData;
  const uiMetadataParam = hasUiMetadata
    ? `uiMetadata: {
    ${resource.preferredSize ? `'preferred-frame-size': ['${resource.preferredSize.width}px', '${resource.preferredSize.height}px'],` : ""}
    ${resource.initialData ? `'initial-render-data': ${JSON.stringify(resource.initialData)}` : ""}
  }`
    : "";

  return `import { createUIResource } from '@mcp-ui/server';

const uiResource = createUIResource({
  uri: "${resource.uri}",
  ${contentParam},
  encoding: 'text',${hasMetadata ? `\n  ${metadataParam}` : ""}${hasUiMetadata ? `\n  ${uiMetadataParam}` : ""}
});

export default uiResource;`;
}

function generateJSON(resource: UIResource): string {
  return JSON.stringify(resource, null, 2);
}

function generateCurl(resource: UIResource): string {
  return `# Example curl command to return this UI resource from an MCP tool

curl -X POST http://localhost:3000/api/your-tool \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(resource, null, 2)}'`;
}

function generateActionHandlers(actionMappings: ActionMapping[], mcpContext: MCPContext): string {
  if (actionMappings.length === 0) {
    return '// No action mappings configured';
  }

  let code = `import { mcpClientManager } from '@/lib/mcp-client';\n\n`;
  code += `// Action Handlers for UI Element Interactions\n\n`;

  actionMappings.forEach((mapping) => {
    const tool = mcpContext.selectedTools.find(
      t => t.name === mapping.toolName && t.serverName === mapping.serverName
    );

    const paramTypes: string[] = [];
    if (tool?.inputSchema) {
      const schema = tool.inputSchema as { properties?: Record<string, { type?: string }> };
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([name, prop]) => {
          paramTypes.push(`  ${name}: ${prop.type || 'any'}`);
        });
      }
    }

    const handlerName = `handle${mapping.uiElementId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    code += `async function ${handlerName}(data: {\n${paramTypes.join(',\n') || '  [key: string]: any'}\n}) {\n`;
    code += `  try {\n`;
    code += `    // Call MCP tool\n`;
    code += `    const result = await mcpClientManager.callTool(\n`;
    code += `      '${mapping.serverName}',\n`;
    code += `      '${mapping.toolName}',\n`;
    code += `      data\n`;
    code += `    );\n\n`;

    if (mapping.responseHandler === 'show-notification') {
      code += `    // Show notification\n`;
      code += `    console.log('Tool executed successfully:', result);\n`;
      code += `    // TODO: Show UI notification\n`;
    } else if (mapping.responseHandler === 'update-ui') {
      code += `    // Update UI with result\n`;
      code += `    console.log('Tool result:', result);\n`;
      code += `    // TODO: Update UI component state\n`;
    } else {
      code += `    // Custom handler\n`;
      code += `    console.log('Tool result:', result);\n`;
      code += `    // TODO: Implement custom response handling\n`;
    }

    code += `  } catch (error) {\n`;
    code += `    console.error('Error calling tool:', error);\n`;
    code += `    // TODO: Show error notification\n`;
    code += `  }\n`;
    code += `}\n\n`;
  });

  code += `// Export handlers\n`;
  code += `export const actionHandlers = {\n`;
  actionMappings.forEach((mapping, index) => {
    const handlerName = `handle${mapping.uiElementId.replace(/[^a-zA-Z0-9]/g, '_')}`;
    code += `  '${mapping.uiElementId}': ${handlerName}`;
    if (index < actionMappings.length - 1) code += ',';
    code += '\n';
  });
  code += `};\n`;

  return code;
}

function generateMCPServer(resource: UIResource, actionMappings: ActionMapping[], mcpContext: MCPContext): string {
  const serverName = resource.uri.split('/')[2] || 'my-ui-server';

  let code = `import { Server } from '@modelcontextprotocol/sdk/server/index.js';\n`;
  code += `import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';\n`;
  code += `import { createUIResource } from '@mcp-ui/server';\n\n`;

  code += `// MCP Server for ${resource.uri}\n\n`;

  code += `const server = new Server(\n`;
  code += `  {\n`;
  code += `    name: '${serverName}',\n`;
  code += `    version: '1.0.0',\n`;
  code += `  },\n`;
  code += `  {\n`;
  code += `    capabilities: {\n`;
  code += `      resources: {},\n`;
  code += `      tools: {},\n`;
  code += `    },\n`;
  code += `  }\n`;
  code += `);\n\n`;

  // Add resource handler
  code += `// Resource: UI Component\n`;
  code += `server.setRequestHandler('resources/list', async () => ({\n`;
  code += `  resources: [{\n`;
  code += `    uri: '${resource.uri}',\n`;
  code += `    name: '${resource.title || 'UI Component'}',\n`;
  code += `    description: '${resource.description || 'Interactive UI component'}',\n`;
  code += `    mimeType: 'application/vnd.mcp.ui+json',\n`;
  code += `  }],\n`;
  code += `}));\n\n`;

  code += `server.setRequestHandler('resources/read', async (request) => {\n`;
  code += `  if (request.params.uri === '${resource.uri}') {\n`;
  const resourceDataStr = JSON.stringify({
    uri: resource.uri,
    contentType: resource.contentType,
    content: resource.content,
    preferredSize: resource.preferredSize,
  }, null, 6).replace(/\n/g, '\n    ');
  code += `    const uiResource = createUIResource(${resourceDataStr});\n`;
  code += `    return { contents: [{ uri: request.params.uri, ...uiResource }] };\n`;
  code += `  }\n`;
  code += `  throw new Error('Resource not found');\n`;
  code += `});\n\n`;

  // Add tool handlers for each action
  if (actionMappings.length > 0) {
    code += `// Tools for UI Actions\n`;
    code += `server.setRequestHandler('tools/list', async () => ({\n`;
    code += `  tools: [\n`;
    actionMappings.forEach((mapping, index) => {
      code += `    {\n`;
      code += `      name: '${mapping.toolName}',\n`;
      code += `      description: 'Handle ${mapping.uiElementId} interaction',\n`;
      code += `      inputSchema: {\n`;
      code += `        type: 'object',\n`;
      const bindingsStr = JSON.stringify(mapping.parameterBindings, null, 8).replace(/\n/g, '\n        ');
      code += `        properties: ${bindingsStr},\n`;
      code += `      },\n`;
      code += `    }`;
      if (index < actionMappings.length - 1) code += ',';
      code += '\n';
    });
    code += `  ],\n`;
    code += `}));\n\n`;

    code += `server.setRequestHandler('tools/call', async (request) => {\n`;
    code += `  const { name, arguments: args } = request.params;\n\n`;
    actionMappings.forEach((mapping, index) => {
      code += `  ${index > 0 ? 'else ' : ''}if (name === '${mapping.toolName}') {\n`;
      code += `    // TODO: Implement tool logic\n`;
      code += `    console.log('Tool called:', name, args);\n`;
      code += `    return { content: [{ type: 'text', text: 'Tool executed successfully' }] };\n`;
      code += `  }\n`;
    });
    code += `\n  throw new Error(\`Unknown tool: \${name}\`);\n`;
    code += `});\n\n`;
  }

  // Start server
  code += `// Start server\n`;
  code += `async function main() {\n`;
  code += `  const transport = new StdioServerTransport();\n`;
  code += `  await server.connect(transport);\n`;
  code += `  console.error('MCP Server running on stdio');\n`;
  code += `}\n\n`;
  code += `main().catch(console.error);\n`;

  return code;
}

function generateIntegrationGuide(resource: UIResource, actionMappings: ActionMapping[], mcpContext: MCPContext): string {
  let guide = `# Integration Guide: ${resource.title || resource.uri}\n\n`;

  guide += `## Overview\n\n`;
  guide += `This guide explains how to integrate the "${resource.title || 'UI Component'}" into your MCP-enabled application.\n\n`;

  guide += `## Prerequisites\n\n`;
  guide += `- Node.js 18+ installed\n`;
  guide += `- MCP SDK: \`npm install @modelcontextprotocol/sdk\`\n`;
  guide += `- MCP-UI Server: \`npm install @mcp-ui/server\`\n`;
  guide += `- MCP-UI Client: \`npm install @mcp-ui/client\`\n\n`;

  guide += `## Configuration\n\n`;
  guide += `Add this MCP server to your \`MCP_CONFIG\` environment variable:\n\n`;
  guide += `\`\`\`json\n`;
  guide += `{\n`;
  guide += `  "servers": [\n`;
  guide += `    {\n`;
  guide += `      "name": "${resource.uri.split('/')[2] || 'my-ui-server'}",\n`;
  guide += `      "command": ["node", "./path/to/server.js"],\n`;
  guide += `      "type": "stdio"\n`;
  guide += `    }\n`;
  guide += `  ]\n`;
  guide += `}\n`;
  guide += `\`\`\`\n\n`;

  guide += `## Action Mappings\n\n`;
  if (actionMappings.length > 0) {
    guide += `The following UI elements are mapped to MCP tools:\n\n`;
    guide += `| Element ID | Element Type | MCP Tool | Server | Response Handler |\n`;
    guide += `|-----------|-------------|----------|--------|------------------|\n`;
    actionMappings.forEach(mapping => {
      guide += `| \`${mapping.uiElementId}\` | ${mapping.uiElementType} | \`${mapping.toolName}\` | ${mapping.serverName} | ${mapping.responseHandler} |\n`;
    });
    guide += `\n`;
  } else {
    guide += `No action mappings configured.\n\n`;
  }

  guide += `## Setup Instructions\n\n`;
  guide += `1. **Install Dependencies**\n`;
  guide += `   \`\`\`bash\n`;
  guide += `   npm install @modelcontextprotocol/sdk @mcp-ui/server\n`;
  guide += `   \`\`\`\n\n`;

  guide += `2. **Create MCP Server** (see "Server" tab)\n`;
  guide += `   - Copy the generated server code to \`server.js\`\n`;
  guide += `   - Implement tool logic for each action\n\n`;

  guide += `3. **Create Action Handlers** (see "Handlers" tab)\n`;
  guide += `   - Copy the generated handlers to your frontend\n`;
  guide += `   - Wire up handlers to UI events\n\n`;

  guide += `4. **Test the Integration**\n`;
  guide += `   - Start your MCP server: \`node server.js\`\n`;
  guide += `   - Load the UI resource in your MCP client\n`;
  guide += `   - Test each action mapping\n\n`;

  guide += `## Deployment\n\n`;
  guide += `### Server Deployment\n`;
  guide += `- Package your MCP server as a standalone Node.js application\n`;
  guide += `- Deploy to npm: \`npm publish\` (optional)\n`;
  guide += `- Users can install via: \`npx -y your-package-name\`\n\n`;

  guide += `### Client Integration\n`;
  guide += `- Add MCP client to your application\n`;
  guide += `- Configure server in \`MCP_CONFIG\`\n`;
  guide += `- Use \`UIResourceRenderer\` from \`@mcp-ui/client\` to render the UI\n\n`;

  guide += `## Troubleshooting\n\n`;
  guide += `- **Server not connecting**: Check stdio transport configuration\n`;
  guide += `- **Tools not appearing**: Verify \`tools/list\` handler implementation\n`;
  guide += `- **UI not rendering**: Check resource URI and content type\n`;
  guide += `- **Actions not working**: Verify parameter bindings match tool schema\n\n`;

  guide += `---\n\n`;
  guide += `🤖 Generated with MCP-UI Function Builder\n`;

  return guide;
}

export function ExportDialog({ onClose, resource, actionMappings, mcpContext }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("typescript");
  const [copied, setCopied] = useState(false);

  if (!resource) {
    return null;
  }

  const code =
    format === "typescript"
      ? generateTypeScriptCode(resource)
      : format === "json"
      ? generateJSON(resource)
      : format === "curl"
      ? generateCurl(resource)
      : format === "handlers"
      ? generateActionHandlers(actionMappings, mcpContext)
      : format === "server"
      ? generateMCPServer(resource, actionMappings, mcpContext)
      : generateIntegrationGuide(resource, actionMappings, mcpContext);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Export Code</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Format tabs */}
        <div className="flex gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
          <button
            className={`px-4 py-2 text-sm rounded whitespace-nowrap ${
              format === "typescript"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("typescript")}
          >
            TypeScript
          </button>
          <button
            className={`px-4 py-2 text-sm rounded whitespace-nowrap ${
              format === "json"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("json")}
          >
            JSON
          </button>
          <button
            className={`px-4 py-2 text-sm rounded whitespace-nowrap ${
              format === "curl"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("curl")}
          >
            cURL
          </button>
          <button
            className={`px-4 py-2 text-sm rounded whitespace-nowrap ${
              format === "handlers"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("handlers")}
            disabled={actionMappings.length === 0}
          >
            Handlers
          </button>
          <button
            className={`px-4 py-2 text-sm rounded whitespace-nowrap ${
              format === "server"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("server")}
          >
            Server
          </button>
          <button
            className={`px-4 py-2 text-sm rounded whitespace-nowrap ${
              format === "guide"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("guide")}
          >
            Guide
          </button>
        </div>

        {/* Code display */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
