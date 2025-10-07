/**
 * Code Generation Utilities for MCP-UI Builder
 *
 * Functions for generating TypeScript, JSON, server code, etc.
 */

import type { UIResource, CustomTool, ActionMapping } from '@/types/ui-builder';

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

export function generateServerCode(
  resource: UIResource,
  customTools: CustomTool[] = [],
  actionMappings: ActionMapping[] = [],
  toolImplementations?: Map<string, string> // AI-generated implementations
): string {
  const serverName = resource.uri.split('/')[2] || 'my-ui-server';
  const agentPlaceholders = resource.templatePlaceholders || [];
  const modeComment = `// Interactive UI - Includes ${customTools.length} custom tool${customTools.length !== 1 ? 's' : ''} for user interactions`;

  let code = `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createUIResource } from '@mcp-ui/server';

// MCP Server for ${resource.uri}
${modeComment}

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
`;

  // Add helper function for placeholder replacement if needed
  if (agentPlaceholders.length > 0) {
    code += `
// Helper function to replace agent placeholders in HTML
function fillAgentPlaceholders(html, agentContext) {
  let result = html;
`;
    agentPlaceholders.forEach(placeholder => {
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      code += `  if (agentContext['${placeholder}'] !== undefined) {
    result = result.replace(/\\{\\{${escapedPlaceholder}\\}\\}/g, agentContext['${placeholder}']);
  }
`;
    });
    code += `  return result;
}
`;
  }

  // List Tools - include get_ui + all custom tools
  code += `
// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_ui',
      description: '${resource.description || 'Get the interactive UI component'}',
      inputSchema: {
        type: 'object',
        properties: {
`;

  // Add agent placeholder parameters to get_ui tool
  agentPlaceholders.forEach((placeholder, index) => {
    code += `          '${placeholder}': { type: 'string', description: 'Value for ${placeholder}' }`;
    if (index < agentPlaceholders.length - 1 || customTools.length > 0) code += ',';
    code += '\n';
  });

  code += `        },
      },
    },`;

  // Add custom tools to the list
  customTools.forEach((tool, toolIndex) => {
    code += `
    {
      name: '${tool.name}',
      description: '${tool.description || ''}',
      inputSchema: {
        type: 'object',
        properties: {
`;
    tool.parameters.forEach((param, paramIndex) => {
      code += `          '${param.name}': { type: '${param.type}', description: '${param.description || ''}' }`;
      if (paramIndex < tool.parameters.length - 1) code += ',';
      code += '\n';
    });
    code += `        },
        required: [${tool.parameters.filter(p => p.required).map(p => `'${p.name}'`).join(', ')}],
      },
    }`;
    if (toolIndex < customTools.length - 1) code += ',';
  });

  code += `
  ],
}));

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Handle get_ui tool
  if (name === 'get_ui') {
    let htmlContent = \`${resource.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
`;

  if (agentPlaceholders.length > 0) {
    code += `
    // Fill agent placeholders
    htmlContent = fillAgentPlaceholders(htmlContent, args || {});
`;
  }

  code += `
    const uiResource = createUIResource({
      uri: '${resource.uri}',
      content: { type: '${resource.contentType}', htmlString: htmlContent },
      encoding: 'text'`;

  if (resource.title || resource.description) {
    code += `,
      metadata: {`;
    if (resource.title) code += `\n        title: '${resource.title}',`;
    if (resource.description) code += `\n        description: '${resource.description}'`;
    code += `\n      }`;
  }

  code += `
    });

    return {
      content: [{
        type: 'text',
        text: '__MCP_UI_RESOURCE__:' + JSON.stringify(uiResource),
      }],
    };
  }
`;

  // Generate handlers for custom tools
  customTools.forEach(tool => {
    // Use AI-generated implementation if available, otherwise use stub
    const aiImplementation = toolImplementations?.get(tool.name);

    if (aiImplementation) {
      // Use AI-generated code
      code += `\n  ${aiImplementation}\n`;
    } else {
      // Fallback to stub implementation
      code += `
  // Handle ${tool.name} tool
  if (name === '${tool.name}') {
    // TODO: Implement ${tool.name} logic
    // Available parameters: ${tool.parameters.map(p => p.name).join(', ')}

    // Example: Extract parameters from args
    ${tool.parameters.map(p => `const ${p.name} = args?.['${p.name}'];`).join('\n    ')}

    // Your tool implementation here
    const result = {
      success: true,
      message: '${tool.name} executed successfully',
      // Add your response data here
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result),
      }],
    };
  }
`;
    }
  });

  code += `
  throw new Error(\`Tool not found: \${name}\`);
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
  const modeDescription = 'This is an **interactive UI** with user interactions (forms, buttons) that trigger MCP tool calls.';

  return `# Quick Start Guide

## UI Mode
${modeDescription}

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
- Save it as \`server.js\` in your project

### 3. Add to LoopCraft via Settings
1. Navigate to Settings > MCP Servers
2. Click "Add Server"
3. Configure:
   - **Name**: my-ui-server
   - **Type**: stdio
   - **Command**: \`["node", "/absolute/path/to/server.js"]\`
4. Enable the server

### 4. Test in Chat
1. Navigate to Chat
2. Ask the AI: "Use the get_ui tool to show me the UI"${agentSlots > 0 ? `
3. The AI will automatically fill agent placeholders with contextual data` : ''}
${agentSlots > 0 ? `4. The interactive UI will appear with all placeholders filled` : `3. The interactive UI will appear`}

## Agent Context Slots

${agentSlots > 0 ? `Your UI includes ${agentSlots} agent-fillable slot${agentSlots !== 1 ? 's' : ''}.

**How it works:**
1. The AI calls \`get_ui\` tool with agent context parameters
2. Server replaces \`{{placeholders}}\` with provided values
3. UI renders with filled-in data

**Example flow:**
- HTML: \`<p>Welcome {{agent.name}}!</p>\`
- AI provides: \`{ "agent.name": "Alice" }\`
- Result: \`<p>Welcome Alice!</p>\`

**Testing:**
Ask: "Show me the UI with agent name 'Bob' and summary 'Product manager'"` : 'No agent slots detected. Add `{{placeholder}}` syntax to your HTML to make it dynamic.'}

## User Interactions

${userActions > 0 ? `Your UI has ${userActions} interactive element${userActions !== 1 ? 's' : ''} mapped to MCP tools.
When users interact with these elements, the configured tools will be called.` : 'No user interactions configured. Go to the Actions tab to map UI elements to MCP tools.'}

## Troubleshooting

- **Server not connecting**: Check absolute path in command and ensure Node.js is available
- **UI not rendering**: Verify the tool returns data with \`__MCP_UI_RESOURCE__:\` prefix
- **Agent slots not filling**: Ask AI to provide values (e.g., "show UI with agent.name as 'Alice'")
- **Placeholders still showing**: Ensure AI called \`get_ui\` with all required parameters
- **Form submissions failing**: Check parameter source types and values in Actions tab

## Next Steps

1. Test the UI in Chat with different agent context values
2. Refine placeholders to match your use case
3. Add more interactive elements and tool mappings
4. Deploy your MCP server for production use
`;
}
