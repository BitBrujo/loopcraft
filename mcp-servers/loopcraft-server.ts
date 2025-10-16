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
  description: 'get help',
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

<div class="space-y-2">
  <p class="font-semibold">Quick Help:</p>
  <button onclick="askHelp('getting-started')" class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
    How do I get started?
  </button>
  <button onclick="askHelp('features')" class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
    What features are available?
  </button>
  <button onclick="askHelp('troubleshoot')" class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
    Help me troubleshoot
  </button>
</div>

<script>
  const prompts = {
    'getting-started': 'How do I get started with this feature?',
    'features': 'What features are available in this tool?',
    'troubleshoot': 'I need help troubleshooting an issue'
  };

  function askHelp(key) {
    window.parent.postMessage({
      type: 'prompt',
      payload: {
        prompt: prompts[key]
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
        title: 'help',
        description: 'get help',
        lastModified: '2025-10-16T21:47:37.749Z'
      },
      uiMetadata: {
        'preferred-frame-size': ['800px', '600px'],
        'auto-resize-iframe': true,
        'container-style': {"borderColor":"#ff0000"}
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
