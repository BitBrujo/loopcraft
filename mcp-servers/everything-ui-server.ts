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

// Add UI tool
server.addTool({
  name: 'get_ui',
  description: 'A new MCP-UI resource',
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

    const uiResource = createUIResource({
      uri: 'ui://everything-ui/resource',
      content: { type: 'rawHtml', htmlString: htmlContent },
      // mimeType: 'text/html' (default)
      encoding: 'text',
      metadata: {
        title: 'New UI Resource',
        description: 'A new MCP-UI resource',
        lastModified: '2025-10-20T21:51:50.069Z'
      },
      uiMetadata: {
        'preferred-frame-size': ['800px', '600px']
      }
    });

    return {
      content: [{
        type: 'text',
        text: '__MCP_UI_RESOURCE__:' + JSON.stringify(uiResource),
      }],
    };
  },
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
