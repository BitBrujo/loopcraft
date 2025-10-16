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
  description: 'ask thinking',
  parameters: z.object({}),
  execute: async (args) => {
    // Prepare content
    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Contact Form</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: 500; }
    input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    button { background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0052a3; }
  </style>
</head>
<body>
 
<button onclick="askAI()" class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
  Ask AI
</button>

<script>
  function askAI() {
    window.parent.postMessage({
      type: 'prompt',
      payload: {
        prompt: 'Explain how this feature works'
      }
    }, '*');
  }
</script>

<button onclick="askAI()" class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
  Ask AI
</button>

<script>
  function askAI() {
    window.parent.postMessage({
      type: 'prompt',
      payload: {
        prompt: 'Explain how this feature works'
      }
    }, '*');
  }
</script>

</body>
</html>`;

    const uiResource = createUIResource({
      uri: 'ui://loopcraft/com-sev',
      content: { type: 'rawHtml', htmlString: htmlContent },
      // mimeType: 'text/html' (default)
      encoding: 'text',
      metadata: {
        title: 'ask thinking',
        description: 'ask thinking',
        lastModified: '2025-10-16T21:15:07.134Z'
      },
      uiMetadata: {
        'auto-resize-iframe': true,
        'container-style': {"borderColor":"#06c12b"}
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
