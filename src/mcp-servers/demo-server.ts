/**
 * Demo MCP Server with UI Resources
 *
 * This is a simple MCP server that demonstrates how to return UI resources
 * from MCP tools. It's designed for testing the MCP-UI Function Builder.
 *
 * To run: npm run mcp:demo
 * To remove: See DEMO_SERVER_README.md
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamable.js';
import { createUIResource } from '@mcp-ui/server';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

// In-memory storage for form submissions (for demo purposes)
const formSubmissions: Array<{ id: string; data: Record<string, unknown>; timestamp: string }> = [];

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Store active transports
const transports: Record<string, StreamableHTTPServerTransport> = {};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Demo UI MCP Server',
    version: '1.0.0',
    status: 'running',
    tools: ['get_contact_form', 'get_dashboard', 'submit_form'],
  });
});

// MCP endpoint handler
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      transports[sessionId] = transport;
      console.log(`[MCP] Session initialized: ${sessionId}`);
    },
  });

  // Create MCP server instance
  const server = new Server(
    {
      name: 'demo-ui',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Tool 1: Contact Form - Returns HTML form UI
  server.setRequestHandler('tools/list', async () => ({
    tools: [
      {
        name: 'get_contact_form',
        description: 'Returns an interactive HTML contact form with name, email, and message fields',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_dashboard',
        description: 'Returns an embedded external URL showing a demo dashboard',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to embed (default: example.com)',
            },
          },
        },
      },
      {
        name: 'submit_form',
        description: 'Processes form submission data from the contact form',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Contact name',
            },
            email: {
              type: 'string',
              description: 'Contact email',
            },
            message: {
              type: 'string',
              description: 'Message content',
            },
          },
          required: ['name', 'email', 'message'],
        },
      },
    ],
  }));

  // Tool call handler
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'get_contact_form') {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 1.5rem;
      font-size: 1.75rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      color: #555;
      font-weight: 500;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    input, textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    textarea {
      resize: vertical;
      min-height: 120px;
    }
    button {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .success {
      background: #10b981;
      color: white;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Contact Us</h1>
    <form id="contactForm">
      <div class="form-group">
        <label for="name">Name *</label>
        <input type="text" id="name" name="name" required placeholder="John Doe">
      </div>
      <div class="form-group">
        <label for="email">Email *</label>
        <input type="email" id="email" name="email" required placeholder="john@example.com">
      </div>
      <div class="form-group">
        <label for="message">Message *</label>
        <textarea id="message" name="message" required placeholder="Your message here..."></textarea>
      </div>
      <button type="submit" id="submitBtn">Send Message</button>
    </form>
    <div class="success" id="successMsg">Message sent successfully! ✓</div>
  </div>

  <script>
    document.getElementById('contactForm').addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
      };

      // Send tool call to MCP server
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'submit_form',
          params: formData
        }
      }, '*');

      // Show success message
      document.getElementById('successMsg').style.display = 'block';
      document.getElementById('contactForm').reset();

      // Hide success message after 3 seconds
      setTimeout(() => {
        document.getElementById('successMsg').style.display = 'none';
      }, 3000);
    });
  </script>
</body>
</html>
      `.trim();

      const uiResource = createUIResource({
        uri: 'ui://demo/contact-form',
        content: {
          type: 'rawHtml',
          htmlString: htmlContent,
        },
        encoding: 'text',
        metadata: {
          title: 'Contact Form',
          description: 'Interactive contact form with validation',
          'mcpui.dev/ui-preferred-frame-size': ['600px', '500px'],
        },
      });

      return {
        content: [uiResource],
      };
    }

    if (name === 'get_dashboard') {
      const url = (args as { url?: string })?.url || 'https://example.com';

      const uiResource = createUIResource({
        uri: 'ui://demo/dashboard',
        content: {
          type: 'externalUrl',
          iframeUrl: url,
        },
        encoding: 'text',
        metadata: {
          title: 'External Dashboard',
          description: `Embedded view of ${url}`,
          'mcpui.dev/ui-preferred-frame-size': ['800px', '600px'],
        },
      });

      return {
        content: [uiResource],
      };
    }

    if (name === 'submit_form') {
      const formData = args as { name: string; email: string; message: string };

      // Store submission
      const submission = {
        id: randomUUID(),
        data: formData,
        timestamp: new Date().toISOString(),
      };
      formSubmissions.push(submission);

      console.log('[MCP] Form submitted:', submission);

      return {
        content: [
          {
            type: 'text',
            text: `Form submitted successfully!\n\nID: ${submission.id}\nName: ${formData.name}\nEmail: ${formData.email}\nMessage: ${formData.message}\n\nTotal submissions: ${formSubmissions.length}`,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  // Connect transport to server
  await transport.handleRequest(req, res, server);
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Demo MCP Server with UI Resources                 ║
╚═══════════════════════════════════════════════════════════╝

Server running on: http://localhost:${PORT}
MCP endpoint: http://localhost:${PORT}/mcp

Available tools:
  • get_contact_form - Interactive HTML form
  • get_dashboard - External URL embed
  • submit_form - Form submission handler

To use with LoopCraft:
  1. Go to Settings > MCP Servers
  2. Click "Add Server"
  3. Configure:
     - Name: demo-ui
     - Type: sse
     - URL: http://localhost:${PORT}/mcp
  4. Enable the server
  5. Go to MCP-UI Builder to test!

Press Ctrl+C to stop the server
  `);
});
