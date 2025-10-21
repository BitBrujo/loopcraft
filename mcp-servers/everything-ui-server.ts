#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { createUIResource } from '@mcp-ui/server';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// ============================================================
// Companion UI Server for everything
// Resource URI: ui://everything-ui/resource
// ============================================================
//
// This is a COMPANION SERVER that provides a visual UI for
// tools from the "everything" server.
//
// ⚠️ IMPORTANT - Both Servers Must Be Connected:
//   1. This companion UI server: "everything-ui"
//   2. Target server: "everything"
//
// When calling tools from everything:
//   window.parent.postMessage({
//     type: 'tool',
//     payload: {
//       toolName: 'mcp_everything_toolname',
//       params: {}
//     }
//   }, '*');
//
// 💡 Use "Browse Tools" to see available tools from everything
//
// ⚙️  TOOL-TO-ACTION BINDINGS:
//   This UI has 1 configured tool binding:
//   1. getTinyImage → #primary-btn
//
//   When UI renders, these actions will call tools from everything server
//   Tool names will be prefixed: mcp_everything_toolname
//// ============================================================

const server = new FastMCP({
  name: 'everything-ui',
  version: '1.0.0',
});

// HTML content for the UI (with placeholder example)
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Generator UI</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { color: #2563eb; }
    .placeholder-demo {
      background: #f0f9ff;
      border: 2px dashed #3b82f6;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }
  </style>
</head>
<body>
  <h1>Hello, {{agent.name}}!</h1>
  <div class="placeholder-demo">
    <p><strong>Placeholder Demo:</strong> The heading above uses <code>{{agent.name}}</code></p>
    <p>When AI calls <code>get_resource({ "agent.name": "Alice" })</code>, it renders as "Hello, Alice!"</p>
  </div>
  <p>This demonstrates dynamic placeholder filling in MCP-UI companion servers.</p>

<button id="primary-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Click Me
</button>


<!-- Call getTinyImage tool from everything -->
<button
  id="primary-btn"
  onclick="call_getTinyImage()"
  class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
>
  Click Me
</button>

<script>
  function call_getTinyImage() {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_everything_getTinyImage',
        params: {}
      }
    }, '*');
  }
</script>

</body>
</html>`;

// Helper function to replace agent placeholders in HTML
function fillAgentPlaceholders(html: string, agentContext: Record<string, string>): string {
  let result = html;
  if (agentContext['agent.name'] !== undefined) {
    result = result.replace(/\{\{agent\.name\}\}/g, agentContext['agent.name']);
  }
  return result;
}

// Helper function to create UI resource
function createUIResourceHelper(content: string, args: Record<string, string>): { content: Array<{ type: 'text'; text: string }> } {
  // Fill placeholders if provided
  const filledContent = fillAgentPlaceholders(content, args);
  const uiResource = createUIResource({
    uri: 'ui://everything-ui/resource',
    content: { type: 'rawHtml', htmlString: filledContent },
    // mimeType: 'text/html' (default)
    encoding: 'text',
    metadata: {
      title: 'Image Generator UI',
      description: 'image generator ui',
      lastModified: '2025-10-21T00:45:30.193Z'
    },
    uiMetadata: {
      'preferred-frame-size': ['800px', '600px']
    }
  });

  return {
    content: [{
      type: 'text' as const,
      text: '__MCP_UI_RESOURCE__:' + JSON.stringify(uiResource),
    }],
  };
}

// Tool for dynamic placeholder filling
// Allows AI to personalize UI with context: {{agent.name}}
server.addTool({
  name: 'get_resource',
  description: 'Get image generator UI with agent context',
  parameters: z.object({
    'agent.name': z.string().optional()
  }),
  execute: async (args) => {
    return createUIResourceHelper(htmlContent, args || {});
  },
});

// ============================================================
// Resources API - Standard MCP-UI Pattern for Discoverability
// ============================================================
//
// This allows MCP clients to discover and fetch UI resources
// via the standard resources/list and resources/read endpoints.
//
// Benefits:
// ✅ Portable across all MCP clients
// ✅ Discoverable without calling tools
// ✅ Standard MCP-UI specification compliant
//

// List available UI resources
// @ts-expect-error - FastMCP internal API access
server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [{
    uri: 'ui://everything-ui/resource',
    name: 'Image Generator UI',
    description: 'image generator ui',
    mimeType: 'text/html',
  }],
}));

// Read a specific UI resource
// @ts-expect-error - FastMCP internal API access
server.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri !== 'ui://everything-ui/resource') {
    throw new Error(`Unknown resource: ${request.params.uri}`);
  }

  // Return UI resource without agent context (direct resource reads)
  return createUIResourceHelper(htmlContent, {});
});

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
  console.error('everything-ui MCP server running on stdio');
}, 100);
