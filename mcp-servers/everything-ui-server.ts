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
//   1. sampleLLM → #primary-btn
//      Parameters (2):
//        - prompt: static: "who is god?"
//        - maxTokens: static: "100"
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
  description: 'god question ui',
  parameters: z.object({}),
  execute: async (args) => {
    // Prepare content
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Template</title>

<!-- Call sampleLLM tool from everything -->
<button
  id="primary-btn"
  onclick="call_sampleLLM()"
  class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
>
  Click Me
</button>

<script>
  function call_sampleLLM() {
    // Show loading indicator if response handler is present
    if (typeof showLoading === 'function') {
      showLoading();
    }

    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_everything_sampleLLM',
        params: {
          prompt: "who is god?",
          maxTokens: "100",
        }
      }
    }, '*');
  }
</script>

  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-8 max-w-4xl mx-auto">


<!-- Tool Response Display Area -->
<div id="result-container" style="margin-top: 1.5rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; display: none;">
  <h3 style="color: #16a34a; margin-bottom: 0.75rem;">Result:</h3>
  <div id="result-content"></div>
</div>

<div id="loading" style="margin-top: 1rem; display: none; color: #2563eb;">
  ⏳ Loading...
</div>

<script>
  // Universal MCP Tool Response Handler
  // Handles all MCP content types: text, image, resource, etc.
  window.addEventListener('message', (event) => {
    console.log('📥 iframe received message:', event.data);

    // Listen for ui-message-response from @mcp-ui/client library
    if (event.data.type === 'ui-message-response') {
      console.log('✅ Processing ui-message-response');
      const loading = document.getElementById('loading');
      const container = document.getElementById('result-container');
      const content = document.getElementById('result-content');

      // Hide loading, show result
      if (loading) loading.style.display = 'none';
      if (container) container.style.display = 'block';
      if (content) content.innerHTML = ''; // Clear previous

      // Extract result from payload (library wraps it)
      let result = event.data.payload;
      console.log('📦 Tool result (raw):', result);

      // Unwrap MCP SDK response envelope if present (defensive)
      // Some responses may have: { response: { content: [...] } }
      if (result && result.response && !result.content) {
        console.log('📦 Unwrapping SDK envelope');
        result = result.response;
      }
      console.log('📦 Tool result (unwrapped):', result);

      // Handle different response formats
      // 1. API-level errors (network, server issues)
      if (event.data.error) {
        content.innerHTML = '<div style="color: #dc2626; padding: 0.5rem; background: #fee2e2; border-radius: 0.375rem;">Error: ' + event.data.error + '</div>';
      }
      // 2. MCP tool results (success or error)
      else if (result && result.content && Array.isArray(result.content)) {
        if (result.isError) {
          // Tool returned error result
          const errorText = result.content[0]?.text || 'Tool execution failed';
          content.innerHTML = '<div style="color: #dc2626; padding: 0.5rem; background: #fee2e2; border-radius: 0.375rem;">Error: ' + errorText + '</div>';
        } else {
          // Tool success - render content array (supports ALL MCP types)
          renderMCPContent(result.content, content);
        }
      }
      // 3. Fallback for unexpected format
      else {
        content.innerHTML = '<pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto;">' + JSON.stringify(result, null, 2) + '</pre>';
      }
    }
  });

  // Render MCP content array (supports text, image, resource, etc.)
  function renderMCPContent(contentArray, container) {
    if (!Array.isArray(contentArray)) {
      container.innerHTML = '<pre>' + JSON.stringify(contentArray, null, 2) + '</pre>';
      return;
    }

    contentArray.forEach(item => {
      // Text content
      if (item.type === 'text' && item.text) {
        const pre = document.createElement('pre');
        pre.style.cssText = 'background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.875rem; margin: 0.5rem 0;';
        pre.textContent = item.text;
        container.appendChild(pre);
      }
      // Image content
      else if (item.type === 'image' && item.data) {
        const img = document.createElement('img');
        img.src = 'data:' + (item.mimeType || 'image/png') + ';base64,' + item.data;
        img.alt = item.text || 'MCP Image';
        img.style.cssText = 'max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.5rem 0; border: 1px solid #e5e7eb;';
        container.appendChild(img);

        // Add caption if provided
        if (item.text) {
          const caption = document.createElement('p');
          caption.style.cssText = 'font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;';
          caption.textContent = item.text;
          container.appendChild(caption);
        }
      }
      // Resource content
      else if (item.type === 'resource' && item.resource) {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 0.75rem; background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 0.375rem; margin: 0.5rem 0;';
        div.innerHTML = '<strong style="color: #1e40af;">Resource:</strong> ' + (item.resource.uri || 'Unknown');
        if (item.resource.name) {
          div.innerHTML += '<br><span style="color: #6b7280; font-size: 0.875rem;">' + item.resource.name + '</span>';
        }
        container.appendChild(div);
      }
      // Fallback for unknown types
      else {
        const pre = document.createElement('pre');
        pre.style.cssText = 'background: #fef3c7; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; margin: 0.5rem 0; border: 1px solid #fbbf24;';
        pre.textContent = JSON.stringify(item, null, 2);
        container.appendChild(pre);
      }
    });
  }

  // Helper function to show loading indicator
  function showLoading() {
    const loading = document.getElementById('loading');
    const container = document.getElementById('result-container');
    if (loading) loading.style.display = 'block';
    if (container) container.style.display = 'none';
  }
</script>
</body>
</html>`;

    return createUIResourceHelper(htmlContent, args || {});
  },
});

// Add resource for UI discovery (Resources API)
server.addResource({
  uri: 'ui://everything-ui/resource',
  name: 'New UI Resource',
  description: 'god question ui',
  mimeType: 'text/html',
  load: async () => {
    // Prepare content
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Template</title>

<!-- Call sampleLLM tool from everything -->
<button
  id="primary-btn"
  onclick="call_sampleLLM()"
  class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
>
  Click Me
</button>

<script>
  function call_sampleLLM() {
    // Show loading indicator if response handler is present
    if (typeof showLoading === 'function') {
      showLoading();
    }

    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_everything_sampleLLM',
        params: {
          prompt: "who is god?",
          maxTokens: "100",
        }
      }
    }, '*');
  }
</script>

  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-8 max-w-4xl mx-auto">


<!-- Tool Response Display Area -->
<div id="result-container" style="margin-top: 1.5rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; display: none;">
  <h3 style="color: #16a34a; margin-bottom: 0.75rem;">Result:</h3>
  <div id="result-content"></div>
</div>

<div id="loading" style="margin-top: 1rem; display: none; color: #2563eb;">
  ⏳ Loading...
</div>

<script>
  // Universal MCP Tool Response Handler
  // Handles all MCP content types: text, image, resource, etc.
  window.addEventListener('message', (event) => {
    console.log('📥 iframe received message:', event.data);

    // Listen for ui-message-response from @mcp-ui/client library
    if (event.data.type === 'ui-message-response') {
      console.log('✅ Processing ui-message-response');
      const loading = document.getElementById('loading');
      const container = document.getElementById('result-container');
      const content = document.getElementById('result-content');

      // Hide loading, show result
      if (loading) loading.style.display = 'none';
      if (container) container.style.display = 'block';
      if (content) content.innerHTML = ''; // Clear previous

      // Extract result from payload (library wraps it)
      let result = event.data.payload;
      console.log('📦 Tool result (raw):', result);

      // Unwrap MCP SDK response envelope if present (defensive)
      // Some responses may have: { response: { content: [...] } }
      if (result && result.response && !result.content) {
        console.log('📦 Unwrapping SDK envelope');
        result = result.response;
      }
      console.log('📦 Tool result (unwrapped):', result);

      // Handle different response formats
      // 1. API-level errors (network, server issues)
      if (event.data.error) {
        content.innerHTML = '<div style="color: #dc2626; padding: 0.5rem; background: #fee2e2; border-radius: 0.375rem;">Error: ' + event.data.error + '</div>';
      }
      // 2. MCP tool results (success or error)
      else if (result && result.content && Array.isArray(result.content)) {
        if (result.isError) {
          // Tool returned error result
          const errorText = result.content[0]?.text || 'Tool execution failed';
          content.innerHTML = '<div style="color: #dc2626; padding: 0.5rem; background: #fee2e2; border-radius: 0.375rem;">Error: ' + errorText + '</div>';
        } else {
          // Tool success - render content array (supports ALL MCP types)
          renderMCPContent(result.content, content);
        }
      }
      // 3. Fallback for unexpected format
      else {
        content.innerHTML = '<pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto;">' + JSON.stringify(result, null, 2) + '</pre>';
      }
    }
  });

  // Render MCP content array (supports text, image, resource, etc.)
  function renderMCPContent(contentArray, container) {
    if (!Array.isArray(contentArray)) {
      container.innerHTML = '<pre>' + JSON.stringify(contentArray, null, 2) + '</pre>';
      return;
    }

    contentArray.forEach(item => {
      // Text content
      if (item.type === 'text' && item.text) {
        const pre = document.createElement('pre');
        pre.style.cssText = 'background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.875rem; margin: 0.5rem 0;';
        pre.textContent = item.text;
        container.appendChild(pre);
      }
      // Image content
      else if (item.type === 'image' && item.data) {
        const img = document.createElement('img');
        img.src = 'data:' + (item.mimeType || 'image/png') + ';base64,' + item.data;
        img.alt = item.text || 'MCP Image';
        img.style.cssText = 'max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.5rem 0; border: 1px solid #e5e7eb;';
        container.appendChild(img);

        // Add caption if provided
        if (item.text) {
          const caption = document.createElement('p');
          caption.style.cssText = 'font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;';
          caption.textContent = item.text;
          container.appendChild(caption);
        }
      }
      // Resource content
      else if (item.type === 'resource' && item.resource) {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 0.75rem; background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 0.375rem; margin: 0.5rem 0;';
        div.innerHTML = '<strong style="color: #1e40af;">Resource:</strong> ' + (item.resource.uri || 'Unknown');
        if (item.resource.name) {
          div.innerHTML += '<br><span style="color: #6b7280; font-size: 0.875rem;">' + item.resource.name + '</span>';
        }
        container.appendChild(div);
      }
      // Fallback for unknown types
      else {
        const pre = document.createElement('pre');
        pre.style.cssText = 'background: #fef3c7; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; margin: 0.5rem 0; border: 1px solid #fbbf24;';
        pre.textContent = JSON.stringify(item, null, 2);
        container.appendChild(pre);
      }
    });
  }

  // Helper function to show loading indicator
  function showLoading() {
    const loading = document.getElementById('loading');
    const container = document.getElementById('result-container');
    if (loading) loading.style.display = 'block';
    if (container) container.style.display = 'none';
  }
</script>
</body>
</html>`;

    // Create UI resource
    const uiResource = createUIResourceHelper(htmlContent, {});

    // Return as text content
    return {
      text: '__MCP_UI_RESOURCE__:' + JSON.stringify(uiResource),
      mimeType: 'text/html',
      uri: 'ui://everything-ui/resource'
    };
  }
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
        description: 'god question ui',
        lastModified: '2025-10-22T02:48:06.966Z'
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
