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

type ExportFormat = "typescript" | "json" | "curl" | "handlers" | "server" | "ui-tool" | "quickstart" | "guide";

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
  -H "Content-Type": "application/json" \\
  -d '${JSON.stringify(resource, null, 2)}'`;
}

function generateUIToolCode(resource: UIResource): string {
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

  const toolName = resource.uri ? resource.uri.split('/').pop() || 'get_ui' : 'get_ui';

  return `// MCP Tool that returns a UI Resource
// This tool can be added to your MCP server's tool list

import { createUIResource } from '@mcp-ui/server';

// Tool Definition
const uiTool = {
  name: "${toolName}",
  description: "${resource.description || `Get an interactive UI for ${toolName}`}",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

// Tool Handler
async function handle_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}() {
  const uiResource = createUIResource({
    uri: "${resource.uri}",
    ${contentParam},
    encoding: 'text',${hasMetadata ? `\n    ${metadataParam}` : ""}${hasUiMetadata ? `\n    ${uiMetadataParam}` : ""}
  });

  // Return with special prefix for MCP protocol
  return {
    content: [{
      type: "text",
      text: "__MCP_UI_RESOURCE__:" + JSON.stringify(uiResource)
    }]
  };
}

// Usage in CallToolRequestSchema handler:
/*
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "${toolName}") {
    return await handle_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}();
  }

  // ... other tools
});
*/

export { uiTool, handle_${toolName.replace(/[^a-zA-Z0-9]/g, '_')} };`;
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

function generateQuickStart(resource: UIResource, actionMappings: ActionMapping[], _mcpContext: MCPContext): string {
  const serverName = resource.uri.split('/')[2] || 'my-ui-server';
  const toolName = resource.uri ? resource.uri.split('/').pop() || 'get_ui' : 'get_ui';

  let quickStart = `# Quick Start Guide\n\n`;
  quickStart += `Get your MCP-UI server running in 5 minutes.\n\n`;

  quickStart += `## 1. Create package.json\n\n`;
  quickStart += `\`\`\`bash\n`;
  quickStart += `cat > package.json << 'EOF'\n`;
  quickStart += `{\n`;
  quickStart += `  "name": "${serverName}",\n`;
  quickStart += `  "version": "1.0.0",\n`;
  quickStart += `  "type": "module",\n`;
  quickStart += `  "bin": { "${serverName}": "./server.js" },\n`;
  quickStart += `  "dependencies": {\n`;
  quickStart += `    "@modelcontextprotocol/sdk": "^1.0.4",\n`;
  quickStart += `    "@mcp-ui/server": "^0.1.0"\n`;
  quickStart += `  }\n`;
  quickStart += `}\n`;
  quickStart += `EOF\n`;
  quickStart += `\`\`\`\n\n`;

  quickStart += `## 2. Copy Server Code\n\n`;
  quickStart += `Go to the "Server" tab above and copy the complete server code to \`server.js\`.\n\n`;

  quickStart += `## 3. Install Dependencies\n\n`;
  quickStart += `\`\`\`bash\n`;
  quickStart += `npm install\n`;
  quickStart += `\`\`\`\n\n`;

  quickStart += `## 4. Test Locally\n\n`;
  quickStart += `\`\`\`bash\n`;
  quickStart += `# Start server (keep this terminal open)\n`;
  quickStart += `npx tsx server.js\n`;
  quickStart += `# Or if compiled: node server.js\n`;
  quickStart += `\`\`\`\n\n`;

  quickStart += `## 5. Add to LoopCraft\n\n`;
  quickStart += `Navigate to **LoopCraft Settings → MCP Servers → Add Server**:\n\n`;
  quickStart += `\`\`\`json\n`;
  quickStart += `{\n`;
  quickStart += `  "name": "${serverName}",\n`;
  quickStart += `  "type": "stdio",\n`;
  quickStart += `  "command": ["npx", "tsx", "/absolute/path/to/server.js"],\n`;
  quickStart += `  "enabled": true\n`;
  quickStart += `}\n`;
  quickStart += `\`\`\`\n\n`;

  quickStart += `**Important:** Replace \`/absolute/path/to/server.js\` with the actual file path.\n\n`;

  quickStart += `## 6. Test in Chat\n\n`;
  quickStart += `Open LoopCraft chat and send:\n\n`;
  quickStart += `\`\`\`\n`;
  quickStart += `"${resource.description || `Show me the ${toolName} UI`}"\n`;
  quickStart += `\`\`\`\n\n`;

  if (actionMappings.length > 0) {
    quickStart += `The UI should appear with interactive elements:\n`;
    actionMappings.forEach((mapping, index) => {
      quickStart += `${index + 1}. **${mapping.uiElementId}** (${mapping.uiElementType}) → calls \`${mapping.toolName}\`\n`;
    });
    quickStart += `\n`;
  }

  quickStart += `## Troubleshooting\n\n`;
  quickStart += `**Server not showing in Settings:**\n`;
  quickStart += `- Check server is running (terminal shows "MCP Server running on stdio")\n`;
  quickStart += `- Verify absolute path to server.js is correct\n`;
  quickStart += `- Try restarting LoopCraft\n\n`;

  quickStart += `**UI not rendering:**\n`;
  quickStart += `- Check browser console for errors (F12)\n`;
  quickStart += `- Verify HTML content is valid (see "Design" tab)\n`;
  quickStart += `- Try refreshing the chat\n\n`;

  quickStart += `**Actions not working:**\n`;
  quickStart += `- Open browser console (F12) and check for postMessage errors\n`;
  quickStart += `- Verify tool handlers are implemented in server.js\n`;
  quickStart += `- Check \`tools/call\` handler returns proper format\n\n`;

  quickStart += `---\n\n`;
  quickStart += `🚀 **Next Steps:**\n`;
  quickStart += `- Implement tool logic in server.js\n`;
  quickStart += `- Add authentication if needed (see "Guide" tab)\n`;
  quickStart += `- Deploy to npm: \`npm publish\` (optional)\n`;

  return quickStart;
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

  guide += `## Adding to Existing Server\n\n`;
  guide += `If you already have an MCP server, you can add this UI tool to your existing \`CallToolRequestSchema\` handler:\n\n`;
  guide += `\`\`\`typescript\n`;
  guide += `import { createUIResource } from '@mcp-ui/server';\n\n`;
  guide += `server.setRequestHandler(CallToolRequestSchema, async (request) => {\n`;
  guide += `  const { name, arguments: args } = request.params;\n\n`;
  guide += `  // Your existing tools\n`;
  guide += `  if (name === "existing_tool") {\n`;
  guide += `    // ... existing tool logic\n`;
  guide += `  }\n\n`;
  guide += `  // Add new UI tool\n`;
  const toolName = resource.uri ? resource.uri.split('/').pop() || 'get_ui' : 'get_ui';
  guide += `  if (name === "${toolName}") {\n`;
  guide += `    const uiResource = createUIResource({\n`;
  guide += `      uri: "${resource.uri}",\n`;
  guide += `      content: { type: "${resource.contentType}", ... },\n`;
  guide += `      encoding: 'text'\n`;
  guide += `    });\n`;
  guide += `    return {\n`;
  guide += `      content: [{\n`;
  guide += `        type: "text",\n`;
  guide += `        text: "__MCP_UI_RESOURCE__:" + JSON.stringify(uiResource)\n`;
  guide += `      }]\n`;
  guide += `    };\n`;
  guide += `  }\n\n`;
  guide += `  throw new Error(\`Unknown tool: \${name}\`);\n`;
  guide += `});\n`;
  guide += `\`\`\`\n\n`;

  guide += `## Creating New Server from Scratch\n\n`;
  guide += `If you're creating a new MCP server, follow these steps:\n\n`;
  guide += `### 1. Create package.json\n\n`;
  guide += `\`\`\`json\n`;
  guide += `{\n`;
  guide += `  "name": "${resource.uri.split('/')[2] || 'my-ui-server'}",\n`;
  guide += `  "version": "1.0.0",\n`;
  guide += `  "type": "module",\n`;
  guide += `  "bin": {\n`;
  guide += `    "${resource.uri.split('/')[2] || 'my-ui-server'}": "./server.js"\n`;
  guide += `  },\n`;
  guide += `  "dependencies": {\n`;
  guide += `    "@modelcontextprotocol/sdk": "^1.0.4",\n`;
  guide += `    "@mcp-ui/server": "^0.1.0"\n`;
  guide += `  }\n`;
  guide += `}\n`;
  guide += `\`\`\`\n\n`;

  guide += `### 2. Copy Server Code (see "Server" tab)\n\n`;
  guide += `Copy the generated server code from the "Server" export tab to \`server.js\`.\n\n`;

  guide += `### 3. Install Dependencies\n\n`;
  guide += `\`\`\`bash\n`;
  guide += `npm install\n`;
  guide += `\`\`\`\n\n`;

  guide += `### 4. Make Executable (optional for npx distribution)\n\n`;
  guide += `\`\`\`bash\n`;
  guide += `chmod +x server.js\n`;
  guide += `\`\`\`\n\n`;

  guide += `Add shebang to top of server.js: \`#!/usr/bin/env node\`\n\n`;

  guide += `## Testing in LoopCraft Chat\n\n`;
  guide += `### 1. Start Your Server Locally\n\n`;
  guide += `\`\`\`bash\n`;
  guide += `# For stdio servers:\n`;
  guide += `npx tsx server.ts  # Or: node server.js\n`;
  guide += `\`\`\`\n\n`;

  guide += `### 2. Add Server to LoopCraft Settings\n\n`;
  guide += `Navigate to LoopCraft Settings → MCP Servers tab → "Add Server":\n\n`;
  guide += `**For stdio (local) servers:**\n`;
  guide += `- Name: \`${resource.uri.split('/')[2] || 'my-ui-server'}\`\n`;
  guide += `- Type: \`stdio\`\n`;
  guide += `- Command: \`["npx", "tsx", "/path/to/server.ts"]\`\n`;
  guide += `- Enable the server\n\n`;

  guide += `**For SSE (remote) servers:**\n`;
  guide += `- Name: \`${resource.uri.split('/')[2] || 'my-ui-server'}\`\n`;
  guide += `- Type: \`sse\`\n`;
  guide += `- URL: \`http://localhost:3001/mcp\`\n`;
  guide += `- Enable the server\n\n`;

  guide += `### 3. Test in Chat\n\n`;
  guide += `Open the chat and try prompts like:\n\n`;
  guide += `- "${resource.description || `Show me the ${toolName} UI`}"\n`;
  guide += `- "Use ${toolName} from ${resource.uri.split('/')[2] || 'my-ui-server'}"\n\n`;

  guide += `### 4. Verify UI Appears\n\n`;
  guide += `- The UI should render in an iframe in the chat\n`;
  guide += `- Interactive elements (buttons, forms) should be clickable\n`;
  if (actionMappings.length > 0) {
    guide += `- Actions should trigger MCP tool calls: ${actionMappings.map(m => `\`${m.toolName}\``).join(', ')}\n`;
  }
  guide += `\n`;

  guide += `## Bidirectional Communication\n\n`;
  guide += `If your UI has interactive elements that call MCP tools, implement bidirectional communication:\n\n`;
  guide += `### In Your HTML (UI Component)\n\n`;
  guide += `\`\`\`javascript\n`;
  guide += `// Send tool call request to parent\n`;
  guide += `function callMCPTool(toolName, params) {\n`;
  guide += `  window.parent.postMessage({\n`;
  guide += `    type: 'tool',\n`;
  guide += `    payload: { toolName, params }\n`;
  guide += `  }, '*');\n`;
  guide += `}\n\n`;
  guide += `// Listen for tool response\n`;
  guide += `window.addEventListener('message', (event) => {\n`;
  guide += `  if (event.data.type === 'mcp-ui-tool-response') {\n`;
  guide += `    console.log('Tool result:', event.data.result);\n`;
  guide += `    // Update UI with result\n`;
  guide += `  }\n`;
  guide += `});\n\n`;
  guide += `// Example button click\n`;
  guide += `document.getElementById('submit-btn').addEventListener('click', () => {\n`;
  guide += `  const data = { name: 'John', email: 'john@example.com' };\n`;
  guide += `  callMCPTool('submit_form', data);\n`;
  guide += `});\n`;
  guide += `\`\`\`\n\n`;

  guide += `### Authentication\n\n`;
  guide += `Tool calls from UI include the user's JWT token automatically. Your MCP server receives authenticated requests.\n\n`;

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
  guide += `### Server Connection Issues\n`;
  guide += `- **Server not connecting**: Check stdio transport configuration and command path\n`;
  guide += `- **Tools not appearing**: Verify \`tools/list\` handler implementation\n`;
  guide += `- **Server crashes on startup**: Check Node.js version (18+ required)\n\n`;

  guide += `### UI Rendering Issues\n`;
  guide += `- **UI not rendering**: Check resource URI format (\`ui://server/resource\`)\n`;
  guide += `- **Blank iframe**: Verify HTML content is valid and not empty\n`;
  guide += `- **Styling broken**: Check if external CSS/JS URLs are accessible\n\n`;

  guide += `### Bidirectional Communication Issues\n`;
  guide += `- **postMessage not working**: Ensure using \`window.parent.postMessage\`, not \`window.postMessage\`\n`;
  guide += `- **Tool calls failing**: Check message format matches: \`{ type: 'tool', payload: { toolName, params } }\`\n`;
  guide += `- **No response received**: Verify tool handler returns proper MCP response format\n\n`;

  guide += `### Authentication Issues\n`;
  guide += `- **Unauthorized errors**: Ensure JWT token is included in API requests\n`;
  guide += `- **Token expired**: User needs to re-login to LoopCraft\n`;
  guide += `- **Missing user context**: Check \`getUserFromRequest()\` implementation in server\n\n`;

  guide += `### iframe Sandbox Issues\n`;
  guide += `- **Forms not submitting**: Verify \`allow-forms\` sandbox permission is set\n`;
  guide += `- **Scripts not running**: Verify \`allow-scripts\` sandbox permission is set\n`;
  guide += `- **Storage not accessible**: Verify \`allow-same-origin\` if needed (use cautiously)\n\n`;

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
      : format === "ui-tool"
      ? generateUIToolCode(resource)
      : format === "quickstart"
      ? generateQuickStart(resource, actionMappings, mcpContext)
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
              format === "ui-tool"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("ui-tool")}
          >
            UI Tool
          </button>
          <button
            className={`px-4 py-2 text-sm rounded whitespace-nowrap ${
              format === "quickstart"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("quickstart")}
          >
            Quick Start
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
