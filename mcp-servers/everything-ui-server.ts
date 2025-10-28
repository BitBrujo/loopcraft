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
  description: 'call UI',
  parameters: z.object({}),
  execute: async (args) => {
    // Prepare content
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Button → Tool Call</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error {
      background-color: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }
    .success {
      background-color: #efe;
      border: 1px solid #cfc;
      color: #3c3;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">Button → Tool Call</h1>

        <button
      id="ui"
      class="px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
    >
      Call ENV
    </button>

    
  </div>

    <script>
    // Action: tool
    const element = document.getElementById('ui');
    element.addEventListener('click', async (e) => {
      

            try {
        showLoading(true);
        const params = {};


        // Call MCP tool via postMessage
        window.parent.postMessage({
          type: 'tool',
          payload: {
            toolName: 'printEnv',
            params: params
          }
        }, '*');

        // Listen for response
        window.addEventListener('message', handleToolResponse, { once: true });
      } catch (error) {
        showError(error.message || 'An error occurred');
      }
    });

    // Tool response handler
    function handleToolResponse(event) {
      if (event.data.type === 'mcp-ui-tool-response') {
        showLoading(false);
        const result = event.data.result;

        if (result.error) {
          showError(result.error);
        } else {
          console.log('Tool result:', result);

          // Route response based on destination: ui
          // Send to UI
          showNotification('Operation completed successfully', 'success');
        }
      }
    }
    // Helper functions
    function showLoading(show) {
      if (show) {
        console.log('Loading...');
      }
    }

    function showError(message) {
      console.error('Error:', message);
      showNotification('Error: ' + message, 'error');
    }

    function showNotification(message, variant = 'info') {
      window.parent.postMessage({
        type: 'notify',
        payload: {
          message: message,
          variant: variant
        }
      }, '*');
    }
  </script>
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
        description: 'call UI',
        lastModified: '2025-10-28T12:51:09.161Z'
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
