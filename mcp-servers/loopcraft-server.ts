#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { createUIResource } from '@mcp-ui/server';

// Companion UI Server for sequential-thinking
// Provides visual interface for sequential-thinking tools
// NOTE: Both this server AND sequential-thinking must be connected

const server = new FastMCP({
  name: 'sequential-thinking-ui',
  version: '1.0.0',
});

// Add UI tool
server.addTool({
  name: 'get_ui',
  description: 'call think button',
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

<button onclick="executeTool()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Execute Tool
</button>

<script>
  function executeTool() {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_sequentialthining_sequentialthinking',
        params: {
          key: 'value'
        }
      }
    }, '*');
  }
</script>

</body>
</html>`;

    const uiResource = createUIResource({
      uri: 'ui://loopcraft/new-resource',
      content: { type: 'rawHtml', htmlString: htmlContent },
      // mimeType: 'text/html' (default)
      encoding: 'text',
      metadata: {
        title: 'call think button',
        description: 'call think button',
        lastModified: '2025-10-17T02:03:47.387Z'
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
  console.error('sequential-thinking-ui MCP server running on stdio');
}, 100);
