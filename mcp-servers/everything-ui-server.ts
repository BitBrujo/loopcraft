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
  description: 'A new MCP-UI resource',
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
      id="sub"
      class="px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
    >
      Get Image
    </button>

    <!-- Results Display Container -->
    <div id="results" class="mt-4 hidden">
      <h2 class="text-lg font-semibold mb-2 text-gray-700">Results:</h2>
      <div id="results-content" class="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-96"></div>
    </div>
  </div>

    <script>
    // Action: tool
    const element = document.getElementById('sub');
    element.addEventListener('click', async (e) => {
      

            try {
        showLoading(true);
        const params = {};


        // Call MCP tool via postMessage
        window.parent.postMessage({
          type: 'tool',
          payload: {
            toolName: 'mcp_everything_getTinyImage',
            params: params
          }
        }, '*');

        // Listen for response - DON'T use { once: true } because we need to ignore acknowledgment
        window.addEventListener('message', handleToolResponse);
      } catch (error) {
        showError(error.message || 'An error occurred');
      }
    });

    // Tool response handler
    function handleToolResponse(event) {
      console.log('📨 Message received:', event.data);

      // Ignore acknowledgment message - keep listening for actual response
      if (event.data.type === 'ui-message-received') {
        console.log('⏳ Acknowledgment received, waiting for result...');
        return; // Keep listener active
      }

      // Handle response message types: ui-message-response (from @mcp-ui/client) and mcp-ui-tool-response (legacy)
      if (event.data.type === 'ui-message-response' || event.data.type === 'mcp-ui-tool-response') {
        console.log('✅ Tool response received!');

        // Remove listener now that we got the response
        window.removeEventListener('message', handleToolResponse);

        showLoading(false);
        // Extract result from correct location:
        // - @mcp-ui/client sends: event.data.payload.response
        // - Legacy format: event.data.result
        const result = event.data.payload?.response || event.data.result;

        if (result.error) {
          showError(result.error);
        } else {
          console.log('Tool result:', result);

          // Display result in UI
          displayToolResult(result);
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

    // Display tool result in UI
    function displayToolResult(result) {
      const resultsDiv = document.getElementById('results');
      const resultsContent = document.getElementById('results-content');

      if (!result.content || result.content.length === 0) {
        resultsContent.innerHTML = '<p class="text-gray-500">No data returned</p>';
        resultsDiv.classList.remove('hidden');
        return;
      }

      // Clear previous results
      resultsContent.innerHTML = '';

      // Process each content item
      result.content.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'mb-3 last:mb-0';

        if (item.type === 'text') {
          // Try to parse as JSON for pretty printing
          try {
            const jsonData = JSON.parse(item.text);
            const pre = document.createElement('pre');
            pre.className = 'bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto';
            pre.textContent = JSON.stringify(jsonData, null, 2);
            itemDiv.appendChild(pre);
          } catch {
            // Not JSON, display as plain text
            const p = document.createElement('p');
            p.className = 'text-gray-800 whitespace-pre-wrap';
            p.textContent = item.text;
            itemDiv.appendChild(p);
          }
        } else if (item.type === 'image') {
          const img = document.createElement('img');
          // Convert base64 data to data URL for proper display
          const mimeType = item.mimeType || 'image/png';
          if (item.data.startsWith('data:')) {
            img.src = item.data;  // Already a data URL
          } else {
            img.src = 'data:' + mimeType + ';base64,' + item.data;  // Convert base64 to data URL
          }
          img.alt = item.alt || 'Tool result image';
          img.className = 'max-w-full h-auto rounded border border-gray-300';
          itemDiv.appendChild(img);
        } else if (item.type === 'resource') {
          const link = document.createElement('a');
          link.href = item.uri || '#';
          link.textContent = item.uri || 'Resource';
          link.className = 'text-blue-600 hover:underline';
          link.target = '_blank';
          itemDiv.appendChild(link);
        } else {
          // Unknown type, display as string
          const p = document.createElement('p');
          p.className = 'text-gray-600 italic';
          p.textContent = JSON.stringify(item);
          itemDiv.appendChild(p);
        }

        resultsContent.appendChild(itemDiv);
      });

      // Show the results container
      resultsDiv.classList.remove('hidden');

      // Also show a success notification
      showNotification('Results loaded successfully', 'success');
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
        description: 'A new MCP-UI resource',
        lastModified: '2025-10-28T15:39:56.752Z'
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
