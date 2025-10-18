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
  description: 'call brain',
  parameters: z.object({}),
  execute: async (args) => {
    // Prepare content
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Template</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-8 max-w-4xl mx-auto">
  <button onclick="callAsyncTool()" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
  Call Tool
</button>
<div id="result" class="mt-2 p-2 bg-gray-100 rounded hidden"></div>

<script>
  const messageId = 'msg-' + Date.now();

  function callAsyncTool() {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'async_tool',
        params: { data: 'value' },
        messageId: messageId
      }
    }, '*');
  }

  // Listen for response
  window.addEventListener('message', function(event) {
    if (event.data.type === 'mcp-ui-tool-response' && event.data.messageId === messageId) {
      const result = document.getElementById('result');
      result.textContent = JSON.stringify(event.data.result, null, 2);
      result.classList.remove('hidden');
    }
  });
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
      uri: 'ui://sequential-thinking/buttons',
      content: { type: 'rawHtml', htmlString: htmlContent },
      // mimeType: 'text/html' (default)
      encoding: 'text',
      metadata: {
        title: 'Brain Button',
        description: 'call brain',
        lastModified: '2025-10-18T20:47:33.002Z'
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
