/**
 * Code Generation Utilities for MCP-UI Builder
 * Aligned with @mcp-ui/server specification
 *
 * Functions for generating TypeScript, JSON, server code, etc.
 */

import type { UIResource, ContentType } from '@/types/ui-builder';

/**
 * Get default MIME type for a content type
 */
function getDefaultMimeType(contentType: ContentType): string {
  switch (contentType) {
    case 'rawHtml':
      return 'text/html';
    case 'externalUrl':
      return 'text/uri-list';
    case 'remoteDom':
      return 'application/vnd.mcp-ui.remote-dom';
    default:
      return 'text/html';
  }
}

export function generateTypeScriptCode(resource: UIResource): string {
  // Generate content configuration based on type
  let contentParam: string;

  if (resource.contentType === "rawHtml") {
    contentParam = `content: { type: 'rawHtml', htmlString: \`${resource.content.replace(/`/g, '\\`')}\` }`;
  } else if (resource.contentType === "externalUrl") {
    contentParam = `content: { type: 'externalUrl', iframeUrl: "${resource.content}" }`;
  } else {
    // remoteDom
    const framework = resource.remoteDomConfig?.framework || 'react';
    contentParam = `content: {
    type: 'remoteDom',
    script: \`${resource.content.replace(/`/g, '\\`')}\`,
    framework: '${framework}'
  }`;
  }

  // Generate standard metadata (maps to _meta)
  const hasMetadata = resource.metadata?.title || resource.metadata?.description ||
                      resource.audience || resource.priority !== undefined || resource.lastModified;

  const metadataParts: string[] = [];
  if (resource.metadata?.title) metadataParts.push(`title: "${resource.metadata.title}"`);
  if (resource.metadata?.description) metadataParts.push(`description: "${resource.metadata.description}"`);

  // Add resource annotations if configured
  if (resource.audience) {
    metadataParts.push(`audience: ${JSON.stringify(resource.audience)} // Audience: Only visible to ${resource.audience.join(' and ')}`);
  }
  if (resource.priority !== undefined) {
    metadataParts.push(`priority: ${resource.priority} // Priority: ${resource.priority} (higher priority UIs display first)`);
  }
  if (resource.lastModified) {
    metadataParts.push(`lastModified: "${resource.lastModified}"`);
  }

  const metadataParam = hasMetadata
    ? `metadata: {\n    ${metadataParts.join(',\n    ')}\n  },`
    : "";

  // Generate UI metadata (prefixed with mcpui.dev/ui-)
  const hasUiMetadata = resource.uiMetadata?.['preferred-frame-size'] ||
                        resource.uiMetadata?.['initial-render-data'] ||
                        resource.uiMetadata?.['auto-resize-iframe'] ||
                        resource.uiMetadata?.['sandbox-permissions'] ||
                        resource.uiMetadata?.['iframe-title'] ||
                        resource.uiMetadata?.['container-style'];

  const uiMetadataParams: string[] = [];
  if (resource.uiMetadata?.['preferred-frame-size']) {
    uiMetadataParams.push(`'preferred-frame-size': ['${resource.uiMetadata['preferred-frame-size'][0]}', '${resource.uiMetadata['preferred-frame-size'][1]}']`);
  }
  if (resource.uiMetadata?.['initial-render-data']) {
    uiMetadataParams.push(`'initial-render-data': ${JSON.stringify(resource.uiMetadata['initial-render-data'])}`);
  }
  if (resource.uiMetadata?.['auto-resize-iframe'] !== undefined) {
    uiMetadataParams.push(`'auto-resize-iframe': ${JSON.stringify(resource.uiMetadata['auto-resize-iframe'])}`);
  }
  if (resource.uiMetadata?.['sandbox-permissions']) {
    uiMetadataParams.push(`'sandbox-permissions': '${resource.uiMetadata['sandbox-permissions']}'`);
  }
  if (resource.uiMetadata?.['iframe-title']) {
    uiMetadataParams.push(`'iframe-title': '${resource.uiMetadata['iframe-title']}'`);
  }
  if (resource.uiMetadata?.['container-style']) {
    uiMetadataParams.push(`'container-style': ${JSON.stringify(resource.uiMetadata['container-style'])}`);
  }

  const uiMetadataParam = hasUiMetadata
    ? `uiMetadata: {\n    ${uiMetadataParams.join(',\n    ')}\n  }`
    : "";

  // Determine encoding and MIME type
  const encoding = resource.encoding || 'text';
  const mimeType = resource.mimeType || getDefaultMimeType(resource.contentType);
  const useCustomMimeType = resource.mimeType && resource.mimeType !== getDefaultMimeType(resource.contentType);

  return `import { createUIResource } from '@mcp-ui/server';

const uiResource = createUIResource({
  uri: "${resource.uri}",
  ${contentParam},
  ${useCustomMimeType ? `mimeType: '${mimeType}', // Custom MIME type` : `// mimeType: '${mimeType}' (default)`}
  encoding: '${encoding}'${encoding === 'base64' ? ' // Encoding: base64 (binary-safe encoding)' : ''},${hasMetadata ? `\n  ${metadataParam}` : ""}${hasUiMetadata ? `\n  ${uiMetadataParam}` : ""}
});

export default uiResource;`;
}

export function generateServerCode(resource: UIResource): string {
  const serverName = resource.uri.split('/')[2] || 'my-ui-server';
  const agentPlaceholders = resource.templatePlaceholders || [];

  // Generate content configuration based on type
  let contentConfig: string;
  let contentVariable = 'content';

  if (resource.contentType === 'rawHtml') {
    contentVariable = 'htmlContent';
    contentConfig = `let ${contentVariable} = \`${resource.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;`;
  } else if (resource.contentType === 'externalUrl') {
    contentConfig = `const ${contentVariable} = { type: 'externalUrl', iframeUrl: '${resource.content}' };`;
  } else {
    // remoteDom
    const framework = resource.remoteDomConfig?.framework || 'react';
    contentConfig = `const ${contentVariable} = {
      type: 'remoteDom',
      script: \`${resource.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
      framework: '${framework}'
    };`;
  }

  let code = `#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createUIResource } from '@mcp-ui/server';

// MCP Server for ${resource.uri}
// Standalone test server with single get_ui tool

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

  // Add helper function for placeholder replacement if needed (HTML only)
  if (agentPlaceholders.length > 0 && resource.contentType === 'rawHtml') {
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

  // List Tools
  code += `
// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_ui',
      description: '${resource.metadata?.description || 'Get the UI resource'}',
      inputSchema: {
        type: 'object',
        properties: {
`;

  // Add agent placeholder parameters to get_ui tool (HTML only)
  agentPlaceholders.forEach((placeholder, index) => {
    code += `          '${placeholder}': { type: 'string', description: 'Value for ${placeholder}' }`;
    if (index < agentPlaceholders.length - 1) code += ',';
    code += '\n';
  });

  code += `        },
      },
    },
  ],
}));

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_ui') {
    // Prepare content
    ${contentConfig}
`;

  // Add placeholder filling for HTML
  if (agentPlaceholders.length > 0 && resource.contentType === 'rawHtml') {
    code += `
    // Fill agent placeholders
    htmlContent = fillAgentPlaceholders(htmlContent, args || {});
`;
  }

  // Build createUIResource call
  const hasMetadata = resource.metadata?.title || resource.metadata?.description ||
                      resource.audience || resource.priority !== undefined || resource.lastModified;
  const hasUiMetadata = resource.uiMetadata?.['preferred-frame-size'] ||
                        resource.uiMetadata?.['initial-render-data'] ||
                        resource.uiMetadata?.['auto-resize-iframe'] ||
                        resource.uiMetadata?.['sandbox-permissions'] ||
                        resource.uiMetadata?.['iframe-title'] ||
                        resource.uiMetadata?.['container-style'];

  // Determine encoding and MIME type
  const encoding = resource.encoding || 'text';
  const mimeType = resource.mimeType || getDefaultMimeType(resource.contentType);
  const useCustomMimeType = resource.mimeType && resource.mimeType !== getDefaultMimeType(resource.contentType);

  code += `
    const uiResource = createUIResource({
      uri: '${resource.uri}',
      content: ${resource.contentType === 'rawHtml' ? `{ type: 'rawHtml', htmlString: ${contentVariable} }` : contentVariable},
      ${useCustomMimeType ? `mimeType: '${mimeType}',` : `// mimeType: '${mimeType}' (default)`}
      encoding: '${encoding}'`;

  if (hasMetadata) {
    code += `,
      metadata: {`;
    const metadataParts: string[] = [];
    if (resource.metadata?.title) metadataParts.push(`title: '${resource.metadata.title}'`);
    if (resource.metadata?.description) metadataParts.push(`description: '${resource.metadata.description}'`);
    if (resource.audience) metadataParts.push(`audience: ${JSON.stringify(resource.audience)}`);
    if (resource.priority !== undefined) metadataParts.push(`priority: ${resource.priority}`);
    if (resource.lastModified) metadataParts.push(`lastModified: '${resource.lastModified}'`);
    code += `\n        ${metadataParts.join(',\n        ')}`;
    code += `\n      }`;
  }

  if (hasUiMetadata) {
    code += `,
      uiMetadata: {`;
    const uiMetadataParts: string[] = [];
    if (resource.uiMetadata?.['preferred-frame-size']) {
      uiMetadataParts.push(`'preferred-frame-size': ['${resource.uiMetadata['preferred-frame-size'][0]}', '${resource.uiMetadata['preferred-frame-size'][1]}']`);
    }
    if (resource.uiMetadata?.['initial-render-data']) {
      uiMetadataParts.push(`'initial-render-data': ${JSON.stringify(resource.uiMetadata['initial-render-data'])}`);
    }
    if (resource.uiMetadata?.['auto-resize-iframe'] !== undefined) {
      uiMetadataParts.push(`'auto-resize-iframe': ${JSON.stringify(resource.uiMetadata['auto-resize-iframe'])}`);
    }
    if (resource.uiMetadata?.['sandbox-permissions']) {
      uiMetadataParts.push(`'sandbox-permissions': '${resource.uiMetadata['sandbox-permissions']}'`);
    }
    if (resource.uiMetadata?.['iframe-title']) {
      uiMetadataParts.push(`'iframe-title': '${resource.uiMetadata['iframe-title']}'`);
    }
    if (resource.uiMetadata?.['container-style']) {
      uiMetadataParts.push(`'container-style': ${JSON.stringify(resource.uiMetadata['container-style'])}`);
    }
    code += `\n        ${uiMetadataParts.join(',\n        ')}`;
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

export function generateFastMCPCode(resource: UIResource): string {
  const serverName = resource.uri.split('/')[2] || 'my-ui-server';
  const agentPlaceholders = resource.templatePlaceholders || [];

  // Generate content configuration based on type
  let contentConfig: string;
  let contentVariable = 'content';

  if (resource.contentType === 'rawHtml') {
    contentVariable = 'htmlContent';
    contentConfig = `let ${contentVariable} = \`${resource.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;`;
  } else if (resource.contentType === 'externalUrl') {
    contentConfig = `const ${contentVariable} = { type: 'externalUrl', iframeUrl: '${resource.content}' };`;
  } else {
    // remoteDom
    const framework = resource.remoteDomConfig?.framework || 'react';
    contentConfig = `const ${contentVariable} = {
      type: 'remoteDom',
      script: \`${resource.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
      framework: '${framework}'
    };`;
  }

  let code = `#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { createUIResource } from '@mcp-ui/server';

// MCP Server for ${resource.uri}
// Built with FastMCP framework for cleaner code and built-in features

const server = new FastMCP({
  name: '${serverName}',
  version: '1.0.0',
});
`;

  // Add helper function for placeholder replacement if needed (HTML only)
  if (agentPlaceholders.length > 0 && resource.contentType === 'rawHtml') {
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

  // Build Zod schema for parameters
  let zodSchema = 'z.object({';
  if (agentPlaceholders.length > 0) {
    zodSchema += '\n';
    agentPlaceholders.forEach((placeholder, index) => {
      zodSchema += `    '${placeholder}': z.string().optional()`;
      if (index < agentPlaceholders.length - 1) zodSchema += ',';
      zodSchema += '\n';
    });
    zodSchema += '  })';
  } else {
    zodSchema += '})';
  }

  // Add tool using FastMCP's addTool method
  code += `
// Add UI tool
server.addTool({
  name: 'get_ui',
  description: '${resource.metadata?.description || 'Get the UI resource'}',
  parameters: ${zodSchema},
  execute: async (args) => {
    // Prepare content
    ${contentConfig}
`;

  // Add placeholder filling for HTML
  if (agentPlaceholders.length > 0 && resource.contentType === 'rawHtml') {
    code += `
    // Fill agent placeholders
    htmlContent = fillAgentPlaceholders(htmlContent, args || {});
`;
  }

  // Build createUIResource call
  const hasMetadata = resource.metadata?.title || resource.metadata?.description ||
                      resource.audience || resource.priority !== undefined || resource.lastModified;
  const hasUiMetadata = resource.uiMetadata?.['preferred-frame-size'] ||
                        resource.uiMetadata?.['initial-render-data'] ||
                        resource.uiMetadata?.['auto-resize-iframe'] ||
                        resource.uiMetadata?.['sandbox-permissions'] ||
                        resource.uiMetadata?.['iframe-title'] ||
                        resource.uiMetadata?.['container-style'];

  // Determine encoding and MIME type
  const encoding = resource.encoding || 'text';
  const mimeType = resource.mimeType || getDefaultMimeType(resource.contentType);
  const useCustomMimeType = resource.mimeType && resource.mimeType !== getDefaultMimeType(resource.contentType);

  code += `
    const uiResource = createUIResource({
      uri: '${resource.uri}',
      content: ${resource.contentType === 'rawHtml' ? `{ type: 'rawHtml', htmlString: ${contentVariable} }` : contentVariable},
      ${useCustomMimeType ? `mimeType: '${mimeType}',` : `// mimeType: '${mimeType}' (default)`}
      encoding: '${encoding}'`;

  if (hasMetadata) {
    code += `,
      metadata: {`;
    const metadataParts: string[] = [];
    if (resource.metadata?.title) metadataParts.push(`title: '${resource.metadata.title}'`);
    if (resource.metadata?.description) metadataParts.push(`description: '${resource.metadata.description}'`);
    if (resource.audience) metadataParts.push(`audience: ${JSON.stringify(resource.audience)}`);
    if (resource.priority !== undefined) metadataParts.push(`priority: ${resource.priority}`);
    if (resource.lastModified) metadataParts.push(`lastModified: '${resource.lastModified}'`);
    code += `\n        ${metadataParts.join(',\n        ')}`;
    code += `\n      }`;
  }

  if (hasUiMetadata) {
    code += `,
      uiMetadata: {`;
    const uiMetadataParts: string[] = [];
    if (resource.uiMetadata?.['preferred-frame-size']) {
      uiMetadataParts.push(`'preferred-frame-size': ['${resource.uiMetadata['preferred-frame-size'][0]}', '${resource.uiMetadata['preferred-frame-size'][1]}']`);
    }
    if (resource.uiMetadata?.['initial-render-data']) {
      uiMetadataParts.push(`'initial-render-data': ${JSON.stringify(resource.uiMetadata['initial-render-data'])}`);
    }
    if (resource.uiMetadata?.['auto-resize-iframe'] !== undefined) {
      uiMetadataParts.push(`'auto-resize-iframe': ${JSON.stringify(resource.uiMetadata['auto-resize-iframe'])}`);
    }
    if (resource.uiMetadata?.['sandbox-permissions']) {
      uiMetadataParts.push(`'sandbox-permissions': '${resource.uiMetadata['sandbox-permissions']}'`);
    }
    if (resource.uiMetadata?.['iframe-title']) {
      uiMetadataParts.push(`'iframe-title': '${resource.uiMetadata['iframe-title']}'`);
    }
    if (resource.uiMetadata?.['container-style']) {
      uiMetadataParts.push(`'container-style': ${JSON.stringify(resource.uiMetadata['container-style'])}`);
    }
    code += `\n        ${uiMetadataParts.join(',\n        ')}`;
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
  },
});

// Start server with stdio transport
server.start({
  transportType: "stdio",
});
`;

  return code;
}
