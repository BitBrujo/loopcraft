import { createUIResource } from "@mcp-ui/server";

/**
 * Helper functions for creating MCP UI resources with proper metadata
 */

/**
 * Create a simple HTML UI resource
 */
export function createHtmlUIResource(options: {
  uri: `ui://${string}`;
  htmlString: string;
  title?: string;
  description?: string;
  preferredSize?: { width?: number; height?: number };
  initialData?: Record<string, unknown>;
}) {
  return createUIResource({
    uri: options.uri as `ui://${string}`,
    content: {
      type: 'rawHtml',
      htmlString: options.htmlString,
    },
    encoding: 'text',
    metadata: {
      title: options.title,
      description: options.description,
    },
    uiMetadata: {
      ...(options.preferredSize && {
        'preferred-frame-size': [
          String(options.preferredSize.width || 800),
          String(options.preferredSize.height || 600)
        ] as [string, string],
      }),
      ...(options.initialData && {
        'initial-render-data': options.initialData,
      }),
    },
  });
}

/**
 * Create an external URL UI resource (iframe)
 */
export function createExternalUrlUIResource(options: {
  uri: `ui://${string}`;
  iframeUrl: string;
  title?: string;
  description?: string;
  preferredSize?: { width?: number; height?: number };
  initialData?: Record<string, unknown>;
}) {
  return createUIResource({
    uri: options.uri as `ui://${string}`,
    content: {
      type: 'externalUrl',
      iframeUrl: options.iframeUrl,
    },
    encoding: 'text',
    metadata: {
      title: options.title,
      description: options.description,
    },
    uiMetadata: {
      ...(options.preferredSize && {
        'preferred-frame-size': [
          String(options.preferredSize.width || 800),
          String(options.preferredSize.height || 600)
        ] as [string, string],
      }),
      ...(options.initialData && {
        'initial-render-data': options.initialData,
      }),
    },
  });
}

/**
 * Create a Remote DOM UI resource
 */
export function createRemoteDomUIResource(options: {
  uri: `ui://${string}`;
  script: string;
  framework?: 'react' | 'webcomponents';
  title?: string;
  description?: string;
  preferredSize?: { width?: number; height?: number };
}) {
  return createUIResource({
    uri: options.uri as `ui://${string}`,
    content: {
      type: 'remoteDom',
      script: options.script,
      framework: options.framework || 'react',
    },
    encoding: 'text',
    metadata: {
      title: options.title,
      description: options.description,
    },
    uiMetadata: {
      ...(options.preferredSize && {
        'preferred-frame-size': [
          String(options.preferredSize.width || 800),
          String(options.preferredSize.height || 600)
        ] as [string, string],
      }),
    },
  });
}

/**
 * Example: Create an interactive dashboard UI
 */
export function createDashboardExample() {
  const dashboardHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .dashboard {
      max-width: 600px;
      margin: 0 auto;
    }
    h2 {
      margin-top: 0;
    }
    .card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin: 15px 0;
      backdrop-filter: blur(10px);
    }
    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 10px 0;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
    }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
      width: 100%;
      margin-top: 10px;
    }
    button:hover {
      transform: scale(1.05);
    }
    button:active {
      transform: scale(0.95);
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <h2>📊 MCP Dashboard Example</h2>

    <div class="card">
      <h3>System Metrics</h3>
      <div class="metric">
        <span>Active Connections</span>
        <span class="metric-value" id="connections">3</span>
      </div>
      <div class="metric">
        <span>Tool Calls</span>
        <span class="metric-value" id="toolcalls">127</span>
      </div>
      <div class="metric">
        <span>Success Rate</span>
        <span class="metric-value" id="success">98%</span>
      </div>
    </div>

    <div class="card">
      <h3>Quick Actions</h3>
      <button onclick="callTool('refresh-metrics')">🔄 Refresh Metrics</button>
      <button onclick="callTool('export-data')">📥 Export Data</button>
      <button onclick="sendPrompt('Show me detailed analytics')">📈 View Analytics</button>
    </div>
  </div>

  <script>
    // Handle tool calls
    function callTool(toolName) {
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'mcp_dashboard_' + toolName,
          params: {
            timestamp: new Date().toISOString()
          }
        }
      }, '*');
    }

    // Handle prompt injection
    function sendPrompt(prompt) {
      window.parent.postMessage({
        type: 'prompt',
        payload: {
          prompt: prompt
        }
      }, '*');
    }

    // Simulate live updates
    setInterval(() => {
      const rand = () => Math.floor(Math.random() * 10);
      document.getElementById('connections').textContent = 3 + rand();
      document.getElementById('toolcalls').textContent = 127 + rand() * 5;
      document.getElementById('success').textContent = (95 + rand() * 0.5).toFixed(1) + '%';
    }, 3000);
  </script>
</body>
</html>
  `;

  return createHtmlUIResource({
    uri: 'ui://examples/dashboard',
    htmlString: dashboardHtml,
    title: 'MCP Interactive Dashboard',
    description: 'Example dashboard showing MCP metrics with interactive controls',
    preferredSize: { width: 650, height: 500 },
    initialData: {
      theme: 'dark',
      refreshInterval: 3000,
    },
  });
}

/**
 * Example: Create a form UI
 */
export function createFormExample() {
  const formHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 24px;
      margin: 0;
      background: #f8f9fa;
    }
    .form-container {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h3 {
      margin-top: 0;
      color: #333;
    }
    label {
      display: block;
      margin-top: 16px;
      margin-bottom: 4px;
      font-weight: 500;
      color: #555;
    }
    input, select, textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }
    textarea {
      resize: vertical;
      min-height: 80px;
    }
    button {
      margin-top: 20px;
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover {
      background: #5568d3;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <h3>📝 Contact Form</h3>
    <form id="contactForm">
      <label for="name">Name</label>
      <input type="text" id="name" required>

      <label for="email">Email</label>
      <input type="email" id="email" required>

      <label for="category">Category</label>
      <select id="category">
        <option>General Inquiry</option>
        <option>Technical Support</option>
        <option>Feature Request</option>
        <option>Bug Report</option>
      </select>

      <label for="message">Message</label>
      <textarea id="message" required></textarea>

      <button type="submit">Submit</button>
    </form>
  </div>

  <script>
    document.getElementById('contactForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        category: document.getElementById('category').value,
        message: document.getElementById('message').value,
      };

      // Send form data as a tool call
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'mcp_form_submit',
          params: formData
        }
      }, '*');

      // Show notification
      window.parent.postMessage({
        type: 'notify',
        payload: {
          message: 'Form submitted successfully!'
        }
      }, '*');

      // Reset form
      e.target.reset();
    });
  </script>
</body>
</html>
  `;

  return createHtmlUIResource({
    uri: 'ui://examples/contact-form',
    htmlString: formHtml,
    title: 'Interactive Contact Form',
    description: 'Example form demonstrating MCP UI interactions',
    preferredSize: { width: 450, height: 550 },
  });
}
