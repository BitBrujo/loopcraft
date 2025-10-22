/**
 * Code Generation Utilities for MCP-UI Builder
 * Aligned with @mcp-ui/server specification
 *
 * Generates FastMCP companion server code for portable MCP servers.
 */

import type {
  UIResource,
  ContentType,
  ToolBinding,
  InteractiveElement,
} from '@/types/ui-builder';
import { getToolResponseHandlerCode } from './action-snippets';

/**
 * Generate tool bindings comment for server code
 */
function generateToolBindingsComment(resource: UIResource, targetServerName?: string): string {
  const bindings = resource.toolBindings || [];
  if (bindings.length === 0) return '';

  const lines: string[] = [
    '//\n// ⚙️  TOOL-TO-ACTION BINDINGS:',
    `//   This UI has ${bindings.length} configured tool binding${bindings.length !== 1 ? 's' : ''}:`,
  ];

  bindings.forEach((binding, index) => {
    lines.push(`//   ${index + 1}. ${binding.toolName} → #${binding.triggerId || 'unconfigured'}`);

    const paramCount = Object.keys(binding.parameterMappings).length;
    if (paramCount > 0) {
      lines.push(`//      Parameters (${paramCount}):`);
      Object.entries(binding.parameterMappings).forEach(([param, mapping]) => {
        const source = mapping.source === 'static' ? `static: "${mapping.value}"` : `form field: #${mapping.value}`;
        lines.push(`//        - ${param}: ${source}`);
      });
    }
  });

  if (targetServerName) {
    lines.push('//');
    lines.push(`//   When UI renders, these actions will call tools from ${targetServerName} server`);
    lines.push(`//   Tool names will be prefixed: mcp_${targetServerName}_toolname`);
  }

  lines.push('//');
  return lines.join('\n');
}

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

/**
 * Generate HTML + JavaScript code from a tool binding
 * Creates ready-to-insert code for mapped tool actions
 */
export function generateBindingCode(
  binding: ToolBinding,
  targetServerName: string,
  element: InteractiveElement
): string {
  const { toolName, triggerId, parameterMappings } = binding;
  const fullToolName = `mcp_${targetServerName}_${toolName}`;

  // Build parameter extraction code
  const paramExtraction: string[] = [];
  Object.entries(parameterMappings).forEach(([paramName, mapping]) => {
    if (mapping.source === 'static') {
      paramExtraction.push(`          ${paramName}: ${JSON.stringify(mapping.value)},`);
    } else if (mapping.source === 'form') {
      // Form field - get value from element
      paramExtraction.push(`          ${paramName}: document.getElementById('${mapping.value}')?.value || '',`);
    }
  });

  const paramsCode = paramExtraction.length > 0
    ? `{
${paramExtraction.join('\n')}
        }`
    : '{}';

  // Generate code based on element type
  if (element.type === 'button') {
    return `<!-- Call ${toolName} tool from ${targetServerName} -->
<button
  id="${triggerId}"
  onclick="call_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}()"
  class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
>
  ${element.text || 'Execute ' + toolName}
</button>

<script>
  function call_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}() {
    // Show loading indicator if response handler is present
    if (typeof showLoading === 'function') {
      showLoading();
    }

    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: '${fullToolName}',
        params: ${paramsCode}
      }
    }, '*');
  }
</script>`;
  } else if (element.type === 'form') {
    return `<!-- Call ${toolName} tool from ${targetServerName} -->
<form id="${triggerId}" onsubmit="handleSubmit_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}(event)">
  <!-- Your form fields here -->
  <button type="submit" class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">
    Submit
  </button>
</form>

<script>
  function handleSubmit_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}(event) {
    event.preventDefault();

    // Show loading indicator if response handler is present
    if (typeof showLoading === 'function') {
      showLoading();
    }

    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: '${fullToolName}',
        params: ${paramsCode}
      }
    }, '*');
  }
</script>`;
  } else {
    // Generic element
    return `<!-- Call ${toolName} tool from ${targetServerName} -->
<script>
  document.getElementById('${triggerId}')?.addEventListener('click', function() {
    // Show loading indicator if response handler is present
    if (typeof showLoading === 'function') {
      showLoading();
    }

    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: '${fullToolName}',
        params: ${paramsCode}
      }
    }, '*');
  });
</script>`;
  }
}

/**
 * Generate Standalone MCP server code using @modelcontextprotocol/sdk
 * Full MCP server implementation with stdio transport
 */
export function generateServerCode(
  resource: UIResource,
  options?: {
    targetServerName?: string;
    selectedTools?: string[];
  }
): string {
  // Always use FastMCP format (companion mode is the only mode)
  return generateFastMCPCode(resource, options);
}

/**
 * Generate FastMCP companion server code
 * Lightweight, declarative MCP server using fastmcp package
 */
export function generateFastMCPCode(
  resource: UIResource,
  options?: {
    targetServerName?: string;
    selectedTools?: string[];
  }
): string {
  // Handle server naming (always companion mode now)
  const serverName = options?.targetServerName
    ? `${options.targetServerName}-ui`
    : resource.uri.split('/')[2] || 'my-ui-server';
  const agentPlaceholders = resource.templatePlaceholders || [];

  // Generate content configuration based on type
  let contentConfig: string;
  let contentVariable = 'content';

  if (resource.contentType === 'rawHtml') {
    contentVariable = 'htmlContent';

    // Auto-inject tool response handler if tool bindings exist
    let htmlWithHandler = resource.content;
    const hasToolBindings = resource.toolBindings && resource.toolBindings.length > 0;

    if (hasToolBindings) {
      // Import the response handler code
      const responseHandler = getToolResponseHandlerCode();

      // Inject handler before closing </body> tag
      if (htmlWithHandler.includes('</body>')) {
        htmlWithHandler = htmlWithHandler.replace('</body>', `\n${responseHandler}\n</body>`);
      } else {
        // If no </body> tag, append at the end
        htmlWithHandler += '\n' + responseHandler;
      }
    }

    contentConfig = `let ${contentVariable} = \`${htmlWithHandler.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;`;
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

  // Generate tool bindings comment
  const toolBindingsComment = generateToolBindingsComment(resource, options?.targetServerName);

  // Generate companion-specific comments (always companion mode now)
  const companionComment = options?.targetServerName
    ? `// ============================================================
// Companion UI Server for ${options.targetServerName}
// Resource URI: ${resource.uri}
// ============================================================
//
// This is a COMPANION SERVER that provides a visual UI for
// tools from the "${options.targetServerName}" server.
//
// ⚠️ IMPORTANT - Both Servers Must Be Connected:
//   1. This companion UI server: "${serverName}"
//   2. Target server: "${options.targetServerName}"
//
// When calling tools from ${options.targetServerName}:
//   window.parent.postMessage({
//     type: 'tool',
//     payload: {
//       toolName: 'mcp_${options.targetServerName}_toolname',
//       params: {}
//     }
//   }, '*');
//
// 💡 Use "Browse Tools" to see available tools from ${options.targetServerName}
${toolBindingsComment}// ============================================================

`
    : `// ============================================================
// FastMCP Server: ${serverName}
// Resource URI: ${resource.uri}
// ============================================================
//
// Built with FastMCP framework - cleaner code, built-in features
//
// ⚠️ IMPORTANT - MCP Tool Naming Convention:
//   Tool names from this server will be prefixed as:
//   mcp_${serverName}_toolname
//
//   Example: "get_ui" → "mcp_${serverName}_get_ui"
//
//   When calling tools from UIs, use the full prefixed name:
//   window.parent.postMessage({
//     type: 'tool',
//     payload: {
//       toolName: 'mcp_${serverName}_get_ui',
//       params: {}
//     }
//   }, '*');
//
// 💡 Use "Browse Tools" in the UI Builder to find valid tool names
${toolBindingsComment}// ============================================================

`;

  let code = `#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { createUIResource } from '@mcp-ui/server';

${companionComment}const server = new FastMCP({
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

  // Extract dynamic tool name from resource URI
  const uriParts = resource.uri.split('/');
  const resourceName = uriParts[uriParts.length - 1] || 'ui';
  const toolName = `get_${resourceName.replace(/-/g, '_')}`;

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

  // Always add get_ui tool for consistent access pattern
  const toolDescription = agentPlaceholders.length > 0
    ? `${resource.metadata?.description || `Get ${resourceName} UI with agent context`}`
    : `${resource.metadata?.description || `Get ${resourceName} UI resource`}`;

  const toolComment = agentPlaceholders.length > 0
    ? `// Tool for dynamic placeholder filling
// Allows AI to personalize UI with context: ${agentPlaceholders.map(p => `{{${p}}}`).join(', ')}`
    : `// Tool to access UI resource
// No dynamic placeholders - UI is static`;

  code += `
${toolComment}
server.addTool({
  name: '${toolName}',
  description: '${toolDescription}',
  parameters: ${zodSchema},
  execute: async (args) => {
    // Prepare content
    ${contentConfig}
`;

  // Add placeholder filling for HTML (only if placeholders exist)
  if (resource.contentType === 'rawHtml' && agentPlaceholders.length > 0) {
    code += `
    // Fill agent placeholders
    htmlContent = fillAgentPlaceholders(htmlContent, args || {});
`;
  }

  code += `
    return createUIResourceHelper(${contentVariable}, args || {});
  },
});
`;

  // Determine encoding and MIME type for createUIResource
  const encoding = resource.encoding || 'text';
  const mimeType = resource.mimeType || getDefaultMimeType(resource.contentType);
  const useCustomMimeType = resource.mimeType && resource.mimeType !== getDefaultMimeType(resource.contentType);

  // Build createUIResource call
  const hasMetadata = resource.metadata?.title || resource.metadata?.description ||
                      resource.audience || resource.priority !== undefined || resource.lastModified;
  const hasUiMetadata = resource.uiMetadata?.['preferred-frame-size'] ||
                        resource.uiMetadata?.['initial-render-data'] ||
                        resource.uiMetadata?.['auto-resize-iframe'] ||
                        resource.uiMetadata?.['sandbox-permissions'] ||
                        resource.uiMetadata?.['iframe-title'] ||
                        resource.uiMetadata?.['container-style'];

  code += `
// Helper function to create UI resource
function createUIResourceHelper(content: string, args: Record<string, unknown>) {
  ${resource.contentType === 'rawHtml' && agentPlaceholders.length > 0 ? `// Fill placeholders if provided
  const filledContent = fillAgentPlaceholders(content, args);` : `const filledContent = content;`}

  const uiResource = createUIResource({
    uri: '${resource.uri}',
    content: ${resource.contentType === 'rawHtml' ? `{ type: 'rawHtml', htmlString: filledContent }` : 'content'},
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
      type: 'text' as const,
      text: '__MCP_UI_RESOURCE__:' + JSON.stringify(uiResource),
    }],
  };
}

// Add error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('FATAL SERVER ERROR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

// Start server with stdio transport
server.start({
  transportType: "stdio",
});

// Log after a small delay to ensure transport is initialized
setTimeout(() => {
  console.error('${serverName} MCP server running on stdio');
}, 100);
`;

  return code;
}
