/**
 * Code Generation Utilities for MCP-UI Builder
 *
 * Functions for generating TypeScript, JSON, server code, etc.
 */

import type { UIResource } from '@/types/ui-builder';

export function generateTypeScriptCode(resource: UIResource): string {
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

export function generateServerCode(resource: UIResource): string {
  const serverName = resource.uri.split('/')[2] || 'my-ui-server';

  const code = `#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createUIResource } from '@mcp-ui/server';

// MCP Server for ${resource.uri}

const server = new Server(
  {
    name: '${serverName}',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// UI Resource
const uiResource = createUIResource({
  uri: '${resource.uri}',
  content: ${resource.contentType === 'rawHtml' ? `{ type: 'rawHtml', htmlString: \`${resource.content}\` }` : `{ type: 'externalUrl', iframeUrl: "${resource.content}" }`},
  encoding: 'text',
});

// List Resources
server.setRequestHandler('resources/list', async () => ({
  resources: [{
    uri: '${resource.uri}',
    name: '${resource.title || 'UI Component'}',
    description: '${resource.description || 'Interactive UI component'}',
    mimeType: 'application/vnd.mcp.ui+json',
  }],
}));

// Read Resource
server.setRequestHandler('resources/read', async (request) => {
  if (request.params.uri === '${resource.uri}') {
    return {
      contents: [{
        uri: uiResource.uri,
        mimeType: 'application/vnd.mcp.ui+json',
        text: JSON.stringify(uiResource),
      }],
    };
  }
  throw new Error('Resource not found');
});

// List Tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'get_ui',
      description: 'Get the interactive UI component',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// Call Tool
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'get_ui') {
    return {
      content: [{
        type: 'text',
        text: '__MCP_UI_RESOURCE__:' + JSON.stringify(uiResource),
      }],
    };
  }
  throw new Error('Tool not found');
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${serverName} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;

  return code;
}

export function generateUIToolCode(resource: UIResource): string {
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

export function generateQuickStartGuide(
  agentSlots: number,
  userActions: number,
  tools: number
): string {
  return `# Quick Start Guide

## Integration Summary
- **Agent-fillable slots**: ${agentSlots}
- **User interactions**: ${userActions}
- **MCP tools used**: ${tools}

## Setup Instructions

### 1. Install Dependencies
\`\`\`bash
npm install @mcp-ui/server @modelcontextprotocol/sdk
\`\`\`

### 2. Copy Generated Code
- Use the **Server** tab to copy complete MCP server code
- Save it as \`server.ts\` or \`server.js\` in your project

### 3. Add to LoopCraft via Settings
1. Navigate to Settings > MCP Servers
2. Click "Add Server"
3. Configure:
   - **Name**: my-ui-server
   - **Type**: stdio
   - **Command**: \`["npx", "tsx", "/path/to/server.ts"]\`
4. Enable the server

### 4. Test in Chat
1. Navigate to Chat
2. Ask the AI: "Show me the UI component"
3. The AI will call your MCP server and display the interactive UI

## Agent Context Slots

${agentSlots > 0 ? `Your UI includes ${agentSlots} agent-fillable slot${agentSlots !== 1 ? 's' : ''}.
The AI will automatically populate these with context-aware data when rendering the UI.

Example: \`{{agent.summary}}\` will be replaced with a summary generated by the AI.` : 'No agent slots detected. Add `{{placeholder}}` syntax to your HTML to make it dynamic.'}

## User Interactions

${userActions > 0 ? `Your UI has ${userActions} interactive element${userActions !== 1 ? 's' : ''} mapped to MCP tools.
When users interact with these elements, the configured tools will be called.` : 'No user interactions configured. Go to the Actions tab to map UI elements to MCP tools.'}

## Troubleshooting

- **Server not connecting**: Check command path and ensure \`npx tsx\` is available
- **UI not rendering**: Verify the tool returns data with \`__MCP_UI_RESOURCE__:\` prefix
- **Agent slots not filling**: Ensure placeholders match exactly in both HTML and mappings
- **Form submissions failing**: Check parameter source types and values in Actions tab

## Next Steps

1. Test the UI in Chat
2. Refine agent slot placeholders based on AI context
3. Add more interactive elements and tool mappings
4. Deploy your MCP server for production use
`;
}
