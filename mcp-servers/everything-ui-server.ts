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
//   1. printEnv → #primary-btn
//
//   When UI renders, these actions will call tools from everything server
//   Tool names will be prefixed: mcp_everything_toolname
//// ============================================================

const server = new FastMCP({
  name: 'everything-ui',
  version: '1.0.0',
});

// Tool to access UI resource
// No dynamic placeholders - UI is static
server.addTool({
  name: 'get_resource',
  description: 'ui for env list',
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
  <h1>Environment Variables</h1>
  <p>Click the button below to fetch and display environment variables from the everything server.</p>

  <!-- Button to call printEnv -->
  <button
    onclick="call_printEnv()"
    class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
  >
    Load Environment Variables
  </button>

  <!-- Result display area -->
  <div id="result-container" style="margin-top: 1.5rem; display: none;">
    <h3 style="color: #16a34a;">Result:</h3>
    <pre id="result" style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.875rem;"></pre>
  </div>

  <!-- Loading indicator -->
  <div id="loading" style="margin-top: 1rem; display: none; color: #2563eb;">
    ⏳ Loading...
  </div>

<script>
  function call_printEnv() {
    // Show loading indicator
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result-container').style.display = 'none';

    // Send tool request to parent
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_everything_printEnv',
        params: {}
      }
    }, '*');
  }

  // Listen for tool responses from parent
  window.addEventListener('message', (event) => {
    if (event.data.type === 'mcp-ui-tool-response') {
      // Hide loading indicator
      document.getElementById('loading').style.display = 'none';

      const result = event.data.result;

      // Display result
      const resultElement = document.getElementById('result');
      const containerElement = document.getElementById('result-container');

      if (result && result.success && result.data) {
        // Parse and format the result
        const content = result.data.content;
        if (Array.isArray(content) && content.length > 0 && content[0].text) {
          resultElement.textContent = content[0].text;
          containerElement.style.display = 'block';
        } else {
          resultElement.textContent = JSON.stringify(result, null, 2);
          containerElement.style.display = 'block';
        }
      } else if (result && result.error) {
        resultElement.textContent = 'Error: ' + result.error;
        containerElement.style.display = 'block';
      } else {
        resultElement.textContent = JSON.stringify(result, null, 2);
        containerElement.style.display = 'block';
      }
    }
  });
</script>

</body>
</html>`;

    return createUIResourceHelper(htmlContent, args || {});
  },
});

// Helper function to create UI resource
function createUIResourceHelper(content: string, args: Record<string, never>) {
  const filledContent = content;

  const uiResource = createUIResource({
    uri: 'ui://everything-ui/resource',
    content: { type: 'rawHtml', htmlString: filledContent },
    // mimeType: 'text/html' (default)
    encoding: 'text',
      metadata: {
        title: 'New UI Resource',
        description: 'ui for env list',
        lastModified: '2025-10-21T01:32:07.665Z'
      },
      uiMetadata: {
        'preferred-frame-size': ['800px', '600px']
      }
    });

  return {
    type: 'text' as const,
    text: '__MCP_UI_RESOURCE__:' + JSON.stringify(uiResource),
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
