import type { Template } from '@/types/ui-builder';

export const builtInTemplates: Template[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    category: 'custom',
    description: 'Start from scratch with a blank HTML template',
    resource: {
      uri: 'ui://loopcraft/blank',
      contentType: 'rawHtml',
      content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Custom UI</title>\n  <style>\n    body { font-family: system-ui, sans-serif; padding: 20px; }\n  </style>\n</head>\n<body>\n  <h1>Your Custom UI</h1>\n  <p>Start building here...</p>\n</body>\n</html>',
    },
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'forms',
    description: 'A simple contact form with validation',
    resource: {
      uri: 'ui://loopcraft/contact-form',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
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
  <h2>Contact Us</h2>
  <form id="contactForm">
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="name" required>
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="email" required>
    </div>
    <div class="form-group">
      <label>Message</label>
      <textarea id="message" rows="5" required></textarea>
    </div>
    <button type="submit">Send Message</button>
  </form>
  <script>
    document.getElementById('contactForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
      };
      window.parent.postMessage({ type: 'tool', payload: { toolName: 'submitForm', params: data } }, '*');
    });
  </script>
</body>
</html>`,
    },
  },
  {
    id: 'dashboard',
    name: 'Metrics Dashboard',
    category: 'dashboards',
    description: 'Display key metrics and statistics',
    resource: {
      uri: 'ui://loopcraft/dashboard',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Dashboard</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-value { font-size: 32px; font-weight: bold; color: #0066cc; }
    .metric-label { color: #666; margin-top: 8px; }
  </style>
</head>
<body>
  <h2>Dashboard</h2>
  <div class="grid">
    <div class="card">
      <div class="metric-value">1,234</div>
      <div class="metric-label">Total Users</div>
    </div>
    <div class="card">
      <div class="metric-value">56</div>
      <div class="metric-label">Active Now</div>
    </div>
    <div class="card">
      <div class="metric-value">89%</div>
      <div class="metric-label">Success Rate</div>
    </div>
    <div class="card">
      <div class="metric-value">$12.5K</div>
      <div class="metric-label">Revenue</div>
    </div>
  </div>
</body>
</html>`,
    },
  },
  {
    id: 'data-table',
    name: 'Data Table',
    category: 'data-display',
    description: 'Sortable table with row selection',
    resource: {
      uri: 'ui://loopcraft/data-table',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Data Table</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; cursor: pointer; user-select: none; }
    th:hover { background: #e5e5e5; }
    tr:hover { background: #f9f9f9; }
    .selected { background: #e3f2fd !important; }
  </style>
</head>
<body>
  <h2>Users</h2>
  <table id="dataTable">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Alice Johnson</td><td>alice@example.com</td><td>Active</td><td>2024-01-15</td></tr>
      <tr><td>Bob Smith</td><td>bob@example.com</td><td>Active</td><td>2024-02-20</td></tr>
      <tr><td>Carol Davis</td><td>carol@example.com</td><td>Inactive</td><td>2024-03-10</td></tr>
    </tbody>
  </table>
  <script>
    document.querySelectorAll('tbody tr').forEach(row => {
      row.addEventListener('click', () => row.classList.toggle('selected'));
    });
  </script>
</body>
</html>`,
    },
  },
  {
    id: 'settings-panel',
    name: 'Settings Panel',
    category: 'interactive',
    description: 'Configuration panel with toggles and inputs',
    resource: {
      uri: 'ui://loopcraft/settings',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Settings</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 600px; }
    .setting { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; }
    .setting-label { font-weight: 500; }
    .setting-desc { font-size: 14px; color: #666; margin-top: 4px; }
    .toggle { width: 50px; height: 26px; background: #ccc; border-radius: 13px; position: relative; cursor: pointer; }
    .toggle.active { background: #4CAF50; }
    .toggle::after { content: ''; position: absolute; width: 22px; height: 22px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: 0.3s; }
    .toggle.active::after { left: 26px; }
    button { background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px; }
  </style>
</head>
<body>
  <h2>Settings</h2>
  <div class="setting">
    <div>
      <div class="setting-label">Notifications</div>
      <div class="setting-desc">Receive email notifications</div>
    </div>
    <div class="toggle" onclick="this.classList.toggle('active')"></div>
  </div>
  <div class="setting">
    <div>
      <div class="setting-label">Dark Mode</div>
      <div class="setting-desc">Use dark theme</div>
    </div>
    <div class="toggle" onclick="this.classList.toggle('active')"></div>
  </div>
  <button onclick="alert('Settings saved!')">Save Changes</button>
</body>
</html>`,
    },
  },
  {
    id: 'notification-center',
    name: 'Notification Center',
    category: 'interactive',
    description: 'Display alerts and notifications',
    resource: {
      uri: 'ui://loopcraft/notifications',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Notifications</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 600px; }
    .notification { padding: 15px; border-left: 4px solid; margin-bottom: 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: start; }
    .info { background: #e3f2fd; border-color: #2196F3; }
    .success { background: #e8f5e9; border-color: #4CAF50; }
    .warning { background: #fff3e0; border-color: #FF9800; }
    .error { background: #ffebee; border-color: #f44336; }
    .close { cursor: pointer; font-size: 20px; color: #666; }
  </style>
</head>
<body>
  <h2>Notifications</h2>
  <div class="notification info">
    <div><strong>New Update</strong><br>Version 2.0 is now available</div>
    <span class="close" onclick="this.parentElement.remove()">&times;</span>
  </div>
  <div class="notification success">
    <div><strong>Success</strong><br>Your changes have been saved</div>
    <span class="close" onclick="this.parentElement.remove()">&times;</span>
  </div>
  <div class="notification warning">
    <div><strong>Warning</strong><br>Your storage is almost full</div>
    <span class="close" onclick="this.parentElement.remove()">&times;</span>
  </div>
  <div class="notification error">
    <div><strong>Error</strong><br>Failed to connect to server</div>
    <span class="close" onclick="this.parentElement.remove()">&times;</span>
  </div>
</body>
</html>`,
    },
  },
  {
    id: 'chart-display',
    name: 'Chart Display',
    category: 'data-display',
    description: 'Simple bar chart visualization',
    resource: {
      uri: 'ui://loopcraft/chart',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Chart</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; }
    .chart { display: flex; align-items: flex-end; height: 300px; gap: 10px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
    .bar-container { flex: 1; display: flex; flex-direction: column; align-items: center; }
    .bar { width: 100%; background: linear-gradient(180deg, #0066cc 0%, #0052a3 100%); border-radius: 4px 4px 0 0; transition: 0.3s; }
    .bar:hover { opacity: 0.8; }
    .label { margin-top: 8px; font-size: 14px; }
  </style>
</head>
<body>
  <h2>Monthly Revenue</h2>
  <div class="chart">
    <div class="bar-container">
      <div class="bar" style="height: 70%;"></div>
      <div class="label">Jan</div>
    </div>
    <div class="bar-container">
      <div class="bar" style="height: 85%;"></div>
      <div class="label">Feb</div>
    </div>
    <div class="bar-container">
      <div class="bar" style="height: 60%;"></div>
      <div class="label">Mar</div>
    </div>
    <div class="bar-container">
      <div class="bar" style="height: 95%;"></div>
      <div class="label">Apr</div>
    </div>
    <div class="bar-container">
      <div class="bar" style="height: 80%;"></div>
      <div class="label">May</div>
    </div>
  </div>
</body>
</html>`,
    },
  },
  {
    id: 'ai-assistant-helper',
    name: 'AI Assistant Helper',
    category: 'interactive',
    description: 'Prompt action example - Send questions to AI',
    resource: {
      uri: 'ui://loopcraft/ai-helper',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>AI Assistant</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 500px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
    .container { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    h2 { margin: 0 0 20px 0; color: #333; }
    .prompt-btn { width: 100%; padding: 15px; margin: 8px 0; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; text-align: left; transition: all 0.2s; }
    .prompt-btn:hover { background: #5568d3; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
    .prompt-btn::before { content: '💬 '; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Ask AI Assistant</h2>
    <button class="prompt-btn" onclick="askAI('Explain what MCP servers are and how they work')">
      Explain MCP servers
    </button>
    <button class="prompt-btn" onclick="askAI('Show me how to create a new UI resource')">
      How to create UI resources
    </button>
    <button class="prompt-btn" onclick="askAI('What are the available action types in MCP-UI?')">
      Available action types
    </button>

    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <input type="text" id="customQuestion" placeholder="Type your own question..."
             style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; font-size: 15px; font-family: system-ui, sans-serif;">
      <button class="prompt-btn" onclick="askCustomQuestion()">Ask Custom Question</button>
    </div>
  </div>
  <script>
    function askAI(prompt) {
      window.parent.postMessage({
        type: 'prompt',
        payload: { prompt: prompt }
      }, '*');
    }

    function askCustomQuestion() {
      const question = document.getElementById('customQuestion').value;
      if (question.trim()) {
        window.parent.postMessage({
          type: 'prompt',
          payload: { prompt: question }
        }, '*');
        document.getElementById('customQuestion').value = ''; // Clear input after sending
      }
    }
  </script>
</body>
</html>`,
    },
  },
  {
    id: 'documentation-viewer',
    name: 'Documentation Viewer',
    category: 'interactive',
    description: 'Link action example - Open external URLs',
    resource: {
      uri: 'ui://loopcraft/docs',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Documentation</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 600px; }
    h2 { color: #333; margin-bottom: 20px; }
    .doc-link { display: block; padding: 15px 20px; margin: 10px 0; background: #f5f5f5; border-left: 4px solid #0066cc; border-radius: 4px; text-decoration: none; color: #333; transition: all 0.2s; cursor: pointer; }
    .doc-link:hover { background: #e5e5e5; border-left-color: #0052a3; transform: translateX(5px); }
    .doc-link .title { font-weight: 600; margin-bottom: 5px; }
    .doc-link .desc { font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <h2>📚 Documentation</h2>
  <a class="doc-link" onclick="openDoc('https://modelcontextprotocol.io')">
    <div class="title">MCP Protocol Docs</div>
    <div class="desc">Official Model Context Protocol documentation</div>
  </a>
  <a class="doc-link" onclick="openDoc('https://github.com/modelcontextprotocol/servers')">
    <div class="title">MCP Servers Repository</div>
    <div class="desc">Community MCP server implementations</div>
  </a>
  <a class="doc-link" onclick="openDoc('https://github.com/modelcontextprotocol/typescript-sdk')">
    <div class="title">TypeScript SDK</div>
    <div class="desc">Official MCP TypeScript SDK documentation</div>
  </a>
  <script>
    function openDoc(url) {
      window.parent.postMessage({
        type: 'link',
        payload: { url: url }
      }, '*');
    }
  </script>
</body>
</html>`,
    },
  },
  {
    id: 'navigation-panel',
    name: 'Navigation Panel',
    category: 'interactive',
    description: 'Intent action example - Navigate between pages',
    resource: {
      uri: 'ui://loopcraft/nav',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Navigation</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 400px; }
    h2 { color: #333; margin-bottom: 20px; }
    .nav-btn { width: 100%; padding: 15px 20px; margin: 8px 0; background: white; border: 2px solid #0066cc; color: #0066cc; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
    .nav-btn:hover { background: #0066cc; color: white; transform: scale(1.02); }
    .nav-btn .icon { font-size: 20px; }
  </style>
</head>
<body>
  <h2>🧭 Quick Navigation</h2>
  <button class="nav-btn" onclick="navigate('settings')">
    <span class="icon">⚙️</span>
    <span>Settings</span>
  </button>
  <button class="nav-btn" onclick="navigate('chat')">
    <span class="icon">💬</span>
    <span>Chat</span>
  </button>
  <button class="nav-btn" onclick="navigate('builder')">
    <span class="icon">🛠️</span>
    <span>UI Builder</span>
  </button>
  <button class="nav-btn" onclick="navigate('servers')">
    <span class="icon">🔌</span>
    <span>MCP Servers</span>
  </button>
  <script>
    function navigate(intent) {
      window.parent.postMessage({
        type: 'intent',
        payload: { intent: intent, params: {} }
      }, '*');
    }
  </script>
</body>
</html>`,
    },
  },
  {
    id: 'status-notifier',
    name: 'Status Notifier',
    category: 'interactive',
    description: 'Notify action example - Show toast notifications',
    resource: {
      uri: 'ui://loopcraft/status',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Status Notifications</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 500px; }
    h2 { color: #333; margin-bottom: 20px; }
    .notify-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .notify-btn { padding: 15px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; color: white; }
    .notify-btn:hover { transform: translateY(-2px); opacity: 0.9; }
    .success { background: #10b981; }
    .error { background: #ef4444; }
    .warning { background: #f59e0b; }
    .info { background: #3b82f6; }
  </style>
</head>
<body>
  <h2>🔔 Notifications Demo</h2>
  <div class="notify-grid">
    <button class="notify-btn success" onclick="notify('Changes saved successfully!')">
      ✓ Success
    </button>
    <button class="notify-btn error" onclick="notify('Error: Failed to save changes')">
      ✗ Error
    </button>
    <button class="notify-btn warning" onclick="notify('Warning: Connection unstable')">
      ⚠ Warning
    </button>
    <button class="notify-btn info" onclick="notify('Processing your request...')">
      ℹ Info
    </button>
  </div>
  <script>
    function notify(message) {
      window.parent.postMessage({
        type: 'notify',
        payload: { message: message }
      }, '*');
    }
  </script>
</body>
</html>`,
    },
  },
  {
    id: 'multi-action-demo',
    name: 'Multi-Action Demo',
    category: 'interactive',
    description: 'All 5 action types in one interactive playground',
    resource: {
      uri: 'ui://loopcraft/playground',
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Action Playground</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 700px; margin: 0 auto; background: #f5f5f5; }
    h2 { color: #333; margin-bottom: 10px; }
    .subtitle { color: #666; margin-bottom: 25px; }
    .section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section h3 { margin: 0 0 15px 0; color: #555; font-size: 16px; }
    .action-btn { padding: 12px 20px; margin: 5px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
    .action-btn:hover { transform: translateY(-2px); opacity: 0.9; }
    .tool-btn { background: #8b5cf6; color: white; }
    .prompt-btn { background: #0ea5e9; color: white; }
    .link-btn { background: #10b981; color: white; }
    .intent-btn { background: #f59e0b; color: white; }
    .notify-btn { background: #ef4444; color: white; }
    input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h2>🎮 MCP-UI Action Playground</h2>
  <p class="subtitle">Test all 5 action types interactively</p>

  <div class="section">
    <h3>🔧 Tool Action</h3>
    <input type="text" id="toolInput" placeholder="Enter your name">
    <button class="action-btn tool-btn" onclick="callTool()">Execute Tool</button>
  </div>

  <div class="section">
    <h3>💬 Prompt Action</h3>
    <button class="action-btn prompt-btn" onclick="sendPrompt('What are MCP action types?')">Ask AI Question</button>
  </div>

  <div class="section">
    <h3>🔗 Link Action</h3>
    <button class="action-btn link-btn" onclick="openLink('https://modelcontextprotocol.io')">Open MCP Docs</button>
  </div>

  <div class="section">
    <h3>🎯 Intent Action</h3>
    <button class="action-btn intent-btn" onclick="triggerIntent('settings')">Go to Settings</button>
  </div>

  <div class="section">
    <h3>🔔 Notify Action</h3>
    <button class="action-btn notify-btn" onclick="showNotification('Success: All actions working!')">Show Toast</button>
  </div>

  <script>
    function callTool() {
      const name = document.getElementById('toolInput').value || 'World';
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'greet_user',
          params: { name: name }
        }
      }, '*');
    }

    function sendPrompt(prompt) {
      window.parent.postMessage({
        type: 'prompt',
        payload: { prompt: prompt }
      }, '*');
    }

    function openLink(url) {
      window.parent.postMessage({
        type: 'link',
        payload: { url: url }
      }, '*');
    }

    function triggerIntent(intent) {
      window.parent.postMessage({
        type: 'intent',
        payload: { intent: intent, params: {} }
      }, '*');
    }

    function showNotification(message) {
      window.parent.postMessage({
        type: 'notify',
        payload: { message: message }
      }, '*');
    }
  </script>
</body>
</html>`,
    },
  },
  {
    id: 'external-url',
    name: 'External Website',
    category: 'media',
    description: 'Embed an external URL',
    resource: {
      uri: 'ui://loopcraft/external',
      contentType: 'externalUrl',
      content: 'https://example.com',
    },
  },
  // Remote DOM Templates
  {
    id: 'remote-dom-react-button',
    name: 'Remote DOM: React Button',
    category: 'interactive',
    description: 'Interactive button using React Remote DOM framework',
    resource: {
      uri: 'ui://loopcraft/remote-react-button',
      contentType: 'remoteDom',
      remoteDomConfig: { framework: 'react' },
      content: `// React Remote DOM Button Example
// This script runs in a sandboxed Web Worker
import { h, render } from '@remote-dom/core/client';

// Create interactive button with event handler
const button = h(
  'button',
  {
    onClick: () => {
      // Send notification to parent
      window.parent.postMessage({
        type: 'notify',
        payload: { message: 'React button clicked!' }
      }, '*');
    },
    style: {
      padding: '12px 24px',
      background: '#0066cc',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600'
    }
  },
  'Click Me (React)'
);

// Create container
const container = h('div', {
  style: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px'
  }
}, [button]);

// Render to root
const root = document.querySelector('#root');
if (root) {
  render(container, root);
}`,
    },
  },
  {
    id: 'remote-dom-webcomponent-card',
    name: 'Remote DOM: Web Component Card',
    category: 'interactive',
    description: 'Custom card element using Web Components',
    resource: {
      uri: 'ui://loopcraft/remote-wc-card',
      contentType: 'remoteDom',
      remoteDomConfig: { framework: 'webcomponents' },
      content: `// Web Components Remote DOM Card Example
// Define custom card element
class InfoCard extends HTMLElement {
  connectedCallback() {
    // Set shadow DOM
    this.attachShadow({ mode: 'open' });

    // Card template
    this.shadowRoot.innerHTML = \`
      <style>
        .card {
          padding: 24px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 400px;
          margin: 20px auto;
        }
        .card h2 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 20px;
        }
        .card p {
          margin: 0;
          color: #666;
          line-height: 1.5;
        }
        .card button {
          margin-top: 16px;
          padding: 10px 20px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .card button:hover {
          background: #059669;
        }
      </style>
      <div class="card">
        <h2>🧩 Web Component Card</h2>
        <p>This is a custom element built with native Web Components API. It's rendered via Remote DOM for secure, sandboxed execution.</p>
        <button id="actionBtn">Take Action</button>
      </div>
    \`;

    // Add event listener
    const btn = this.shadowRoot.querySelector('#actionBtn');
    btn.addEventListener('click', () => {
      window.parent.postMessage({
        type: 'notify',
        payload: { message: 'Web Component action triggered!' }
      }, '*');
    });
  }
}

// Register custom element
customElements.define('info-card', InfoCard);

// Append to document
const card = document.createElement('info-card');
document.body.appendChild(card);`,
    },
  },
  {
    id: 'remote-dom-react-form',
    name: 'Remote DOM: React Form',
    category: 'forms',
    description: 'Interactive form with React Remote DOM and tool calling',
    resource: {
      uri: 'ui://loopcraft/remote-react-form',
      contentType: 'remoteDom',
      remoteDomConfig: { framework: 'react' },
      content: `// React Remote DOM Form Example
import { h, render, useState } from '@remote-dom/core/client';

// Form component with state
function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Call MCP tool with form data
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'submit_contact',
        params: { name, email, message }
      }
    }, '*');

    // Reset form
    setName('');
    setEmail('');
    setMessage('');
  };

  return h('div', {
    style: {
      padding: '24px',
      maxWidth: '500px',
      margin: '20px auto',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
    }
  }, [
    h('h2', {
      style: { margin: '0 0 20px 0', color: '#333' }
    }, 'Contact Form (React)'),

    h('form', { onSubmit: handleSubmit }, [
      h('div', { style: { marginBottom: '16px' } }, [
        h('label', {
          style: { display: 'block', marginBottom: '6px', fontWeight: '500' }
        }, 'Name'),
        h('input', {
          type: 'text',
          value: name,
          onInput: (e) => setName(e.target.value),
          required: true,
          style: {
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }
        })
      ]),

      h('div', { style: { marginBottom: '16px' } }, [
        h('label', {
          style: { display: 'block', marginBottom: '6px', fontWeight: '500' }
        }, 'Email'),
        h('input', {
          type: 'email',
          value: email,
          onInput: (e) => setEmail(e.target.value),
          required: true,
          style: {
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }
        })
      ]),

      h('div', { style: { marginBottom: '16px' } }, [
        h('label', {
          style: { display: 'block', marginBottom: '6px', fontWeight: '500' }
        }, 'Message'),
        h('textarea', {
          value: message,
          onInput: (e) => setMessage(e.target.value),
          required: true,
          rows: 4,
          style: {
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }
        })
      ]),

      h('button', {
        type: 'submit',
        style: {
          padding: '12px 24px',
          background: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600'
        }
      }, 'Submit Form')
    ])
  ]);
}

// Render form
const root = document.querySelector('#root');
if (root) {
  render(h(ContactForm), root);
}`,
    },
  },
];

export function getTemplatesByCategory(category: string): Template[] {
  return builtInTemplates.filter((t) => t.category === category);
}

export function getAllCategories(): string[] {
  const categories = new Set(builtInTemplates.map((t) => t.category));
  return Array.from(categories);
}

export function getTemplateById(id: string): Template | undefined {
  return builtInTemplates.find((t) => t.id === id);
}
