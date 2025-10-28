#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { createUIResource } from '@mcp-ui/server';

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
// ============================================================

const server = new FastMCP({
  name: 'everything-ui',
  version: '1.0.0',
});

// Tool to access UI resource
// No dynamic placeholders - UI is static
server.addTool({
  name: 'get_resource',
  description: 'call UI to see ENV',
  parameters: z.object({}),
  execute: async (args) => {
    // Prepare content
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New UI Resource</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Hello from MCP-UI!</h1>
  <p>Edit this HTML to create your custom UI resource.</p>
  <p>Use the <strong>Configure</strong> tab to set metadata and frame size.</p>
</body>
</html>`;

    return createUIResourceHelper(htmlContent, args || {});
  },
});

// Helper function to create UI resource
function createUIResourceHelper(content: string, args: Record<string, unknown>) {
  const filledContent = content;

  const uiResource = createUIResource({
    uri: 'ui://everything-ui/resource',
    content: { type: 'rawHtml', htmlString: filledContent },
    // mimeType: 'text/html' (default)
    encoding: 'text',
      metadata: {
        title: 'New UI Resource',
        description: 'call UI to see ENV',
        lastModified: '2025-10-28T12:38:38.573Z'
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
