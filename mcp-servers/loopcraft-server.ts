#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { createUIResource } from '@mcp-ui/server';

// MCP Server for ui://loopcraft/new-resource
// Built with FastMCP framework for cleaner code and built-in features

const server = new FastMCP({
  name: 'loopcraft',
  version: '1.0.0',
});

// Helper function to replace agent placeholders in HTML
function fillAgentPlaceholders(html, agentContext) {
  let result = html;
  if (agentContext['user.avatar'] !== undefined) {
    result = result.replace(/\{\{user\.avatar\}\}/g, agentContext['user.avatar']);
  }
  if (agentContext['user.name'] !== undefined) {
    result = result.replace(/\{\{user\.name\}\}/g, agentContext['user.name']);
  }
  if (agentContext['user.email'] !== undefined) {
    result = result.replace(/\{\{user\.email\}\}/g, agentContext['user.email']);
  }
  if (agentContext['user.role'] !== undefined) {
    result = result.replace(/\{\{user\.role\}\}/g, agentContext['user.role']);
  }
  if (agentContext['user.memberSince'] !== undefined) {
    result = result.replace(/\{\{user\.memberSince\}\}/g, agentContext['user.memberSince']);
  }
  if (agentContext['user.location'] !== undefined) {
    result = result.replace(/\{\{user\.location\}\}/g, agentContext['user.location']);
  }
  return result;
}

// Add UI tool
server.addTool({
  name: 'get_ui',
  description: 'A new MCP-UI resource',
  parameters: z.object({
    'user.avatar': z.string().optional(),
    'user.name': z.string().optional(),
    'user.email': z.string().optional(),
    'user.role': z.string().optional(),
    'user.memberSince': z.string().optional(),
    'user.location': z.string().optional()
  }),
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
<body>
<div class="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div class="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
    <div class="px-6 pb-6">
      <div class="-mt-16 mb-4">
        <img src="{{user.avatar}}" alt="Profile" class="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{user.name}}</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{{user.email}}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
          <p class="text-gray-900 dark:text-white">{{user.role}}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
          <p class="text-gray-900 dark:text-white">{{user.memberSince}}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
          <p class="text-gray-900 dark:text-white">{{user.location}}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <p class="text-green-600">Active</p>
        </div>
      </div>
      <button id="edit-profile-btn"
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
        Edit Profile
      </button>
    </div>
  </div>
</div>
</body>
</html>`;

    // Fill agent placeholders
    htmlContent = fillAgentPlaceholders(htmlContent, args || {});

    const uiResource = createUIResource({
      uri: 'ui://loopcraft/new-resource',
      content: { type: 'rawHtml', htmlString: htmlContent },
      // mimeType: 'text/html' (default)
      encoding: 'text',
      metadata: {
        title: 'New UI Resource',
        description: 'A new MCP-UI resource',
        lastModified: '2025-10-18T15:06:49.594Z'
      },
      uiMetadata: {
        'preferred-frame-size': ['800px', '600px'],
        'auto-resize-iframe': false
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
  console.error('loopcraft MCP server running on stdio');
}, 100);
