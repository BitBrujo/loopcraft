// MCP-UI Action Snippets
// Ready-to-use code examples for 4 action types (prompt, link, intent, notify)
// Tool actions are auto-generated in companion mode from selected MCP server tools

export interface ActionSnippet {
  id: string;
  name: string;
  category: 'tool' | 'prompt' | 'link' | 'intent' | 'notify';
  description: string;
  code: string;
  placeholder?: string;        // Text to select after insertion
  requiresServer?: boolean;     // True if snippet needs MCP server connection
  validationNotes?: string;     // Notes on how to validate this snippet
  exampleToolName?: string;     // Example of valid MCP tool name format
}

/**
 * MCP-UI action snippets (4 types: prompt, link, intent, notify)
 * Tool actions are auto-generated in companion mode from selected tools
 */
export const actionSnippets: ActionSnippet[] = [
  // ==================== PROMPT ACTIONS ====================
  {
    id: 'prompt-button',
    name: 'Ask AI Button',
    category: 'prompt',
    description: 'Button that sends a question to the AI assistant',
    code: `<button onclick="askAI()" class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
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
</script>`,
    placeholder: 'Explain how this feature works',
  },
  {
    id: 'prompt-dynamic',
    name: 'Dynamic AI Prompt',
    category: 'prompt',
    description: 'Text input that lets users ask custom AI questions',
    code: `<div class="space-y-2">
  <input type="text" id="question" placeholder="What do you want to know?"
         class="border rounded px-3 py-2 w-full">
  <button onclick="askDynamic()" class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
    Ask AI
  </button>
</div>

<script>
  function askDynamic() {
    const question = document.getElementById('question').value;
    if (!question) return;

    window.parent.postMessage({
      type: 'prompt',
      payload: {
        prompt: question
      }
    }, '*');
  }
</script>`,
  },
  {
    id: 'prompt-contextual',
    name: 'Contextual Help Prompts',
    category: 'prompt',
    description: 'Pre-written help questions users can click',
    code: `<div class="space-y-2">
  <p class="font-semibold">Quick Help:</p>
  <button onclick="askHelp('getting-started')" class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
    How do I get started?
  </button>
  <button onclick="askHelp('features')" class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
    What features are available?
  </button>
  <button onclick="askHelp('troubleshoot')" class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
    Help me troubleshoot
  </button>
</div>

<script>
  const prompts = {
    'getting-started': 'How do I get started with this feature?',
    'features': 'What features are available in this tool?',
    'troubleshoot': 'I need help troubleshooting an issue'
  };

  function askHelp(key) {
    window.parent.postMessage({
      type: 'prompt',
      payload: {
        prompt: prompts[key]
      }
    }, '*');
  }
</script>`,
  },

  // ==================== LINK ACTIONS ====================
  {
    id: 'link-button',
    name: 'Open External Link',
    category: 'link',
    description: 'Button that opens a website in a new browser tab',
    code: `<button onclick="openLink()" class="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600">
  Open Documentation
</button>

<script>
  function openLink() {
    window.parent.postMessage({
      type: 'link',
      payload: {
        url: 'https://example.com/docs'
      }
    }, '*');
  }
</script>`,
    placeholder: 'https://example.com/docs',
  },
  {
    id: 'link-list',
    name: 'Link List',
    category: 'link',
    description: 'Multiple clickable links to external resources',
    code: `<div class="space-y-2">
  <p class="font-semibold">External Resources:</p>
  <a href="#" onclick="openExternal('https://docs.example.com'); return false;"
     class="block text-blue-600 hover:underline">
    📚 Documentation
  </a>
  <a href="#" onclick="openExternal('https://github.com/example/repo'); return false;"
     class="block text-blue-600 hover:underline">
    💻 GitHub Repository
  </a>
  <a href="#" onclick="openExternal('https://example.com/dashboard'); return false;"
     class="block text-blue-600 hover:underline">
    📊 Live Dashboard
  </a>
</div>

<script>
  function openExternal(url) {
    window.parent.postMessage({
      type: 'link',
      payload: { url: url }
    }, '*');
  }
</script>`,
  },

  // ==================== INTENT ACTIONS ====================
  {
    id: 'intent-nav',
    name: 'App Navigation',
    category: 'intent',
    description: 'Navigation buttons to switch between app pages',
    code: `<div class="space-y-2">
  <button onclick="navigate('settings')" class="block w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
    ⚙️ Settings
  </button>
  <button onclick="navigate('chat')" class="block w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
    💬 Chat
  </button>
  <button onclick="navigate('builder')" class="block w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
    🎨 UI Builder
  </button>
  <button onclick="navigate('servers')" class="block w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
    🔌 Servers
  </button>
</div>

<script>
  function navigate(page) {
    window.parent.postMessage({
      type: 'intent',
      payload: {
        intent: page,
        params: {}
      }
    }, '*');
  }
</script>`,
  },
  {
    id: 'intent-custom',
    name: 'Custom Intent with Params',
    category: 'intent',
    description: 'Trigger custom app actions with parameters',
    code: `<button onclick="customAction()" class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
  Trigger Custom Action
</button>

<script>
  function customAction() {
    window.parent.postMessage({
      type: 'intent',
      payload: {
        intent: 'navigate',
        params: {
          path: '/custom-page',
          query: { id: 123 }
        }
      }
    }, '*');
  }
</script>`,
    placeholder: '/custom-page',
  },

  // ==================== NOTIFY ACTIONS ====================
  {
    id: 'notify-success',
    name: 'Success Notification',
    category: 'notify',
    description: 'Show a green success toast notification',
    code: `<button onclick="showSuccess()" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
  Show Success
</button>

<script>
  function showSuccess() {
    window.parent.postMessage({
      type: 'notify',
      payload: {
        message: 'Operation completed successfully!'
      }
    }, '*');
  }
</script>`,
    placeholder: 'Operation completed successfully!',
  },
  {
    id: 'notify-error',
    name: 'Error Notification',
    category: 'notify',
    description: 'Show a red error toast notification',
    code: `<button onclick="showError()" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
  Show Error
</button>

<script>
  function showError() {
    window.parent.postMessage({
      type: 'notify',
      payload: {
        message: 'An error occurred. Please try again.'
      }
    }, '*');
  }
</script>`,
    placeholder: 'An error occurred. Please try again.',
  },
  {
    id: 'notify-variants',
    name: 'All Notification Variants',
    category: 'notify',
    description: 'Demo all 4 toast types (success, error, warning, info)',
    code: `<div class="space-y-2">
  <button onclick="notify('Changes saved successfully!')" class="block w-full px-3 py-2 bg-green-500 text-white rounded">
    Success (auto-detected)
  </button>
  <button onclick="notify('An error occurred while saving')" class="block w-full px-3 py-2 bg-red-500 text-white rounded">
    Error (auto-detected)
  </button>
  <button onclick="notify('Warning: This action cannot be undone')" class="block w-full px-3 py-2 bg-yellow-500 text-white rounded">
    Warning (auto-detected)
  </button>
  <button onclick="notify('Processing your request...')" class="block w-full px-3 py-2 bg-blue-500 text-white rounded">
    Default
  </button>
</div>

<script>
  function notify(message) {
    window.parent.postMessage({
      type: 'notify',
      payload: { message: message }
    }, '*');
  }
</script>`,
  },

  // ==================== TOOL RESPONSE HANDLER ====================
  {
    id: 'tool-response-handler',
    name: 'Tool Response Display',
    category: 'tool',
    description: 'Universal handler for MCP tool responses (text, images, and all content types)',
    code: `<!-- Tool Response Display Area -->
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
    if (event.data.type === 'mcp-ui-tool-response') {
      const loading = document.getElementById('loading');
      const container = document.getElementById('result-container');
      const content = document.getElementById('result-content');

      // Hide loading, show result
      if (loading) loading.style.display = 'none';
      if (container) container.style.display = 'block';
      if (content) content.innerHTML = ''; // Clear previous

      const result = event.data.result;

      // Handle different response formats
      if (result && result.success && result.data && result.data.content) {
        renderMCPContent(result.data.content, content);
      } else if (result && result.error) {
        content.innerHTML = '<div style="color: #dc2626; padding: 0.5rem; background: #fee2e2; border-radius: 0.375rem;">Error: ' + result.error + '</div>';
      } else {
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
</script>`,
    validationNotes: 'Add this snippet once per UI. Place it after all tool buttons. Call showLoading() before sending tool requests.',
  },
];

/**
 * Get snippets by category
 */
export function getSnippetsByCategory(category: ActionSnippet['category']) {
  return actionSnippets.filter(s => s.category === category);
}

/**
 * Get the tool response handler snippet code
 * Used for injecting into generated UIs automatically
 */
export function getToolResponseHandlerCode(): string {
  const handler = actionSnippets.find(s => s.id === 'tool-response-handler');
  return handler?.code || '';
}

/**
 * Category metadata for UI display (5 action types)
 * Tool actions include both companion-generated snippets and response handler
 * Icons are Lucide icon names (rendered by consuming components)
 */
export const categoryMetadata = {
  tool: {
    label: 'Tool Response Handler',
    icon: 'code-2',
    description: 'Handle and display MCP tool responses',
    color: 'bg-purple-500',
  },
  prompt: {
    label: 'Prompt Actions',
    icon: 'message-square',
    description: 'Send prompts to AI assistant',
    color: 'bg-indigo-500',
  },
  link: {
    label: 'Link Actions',
    icon: 'link',
    description: 'Open external URLs in new tab',
    color: 'bg-cyan-500',
  },
  intent: {
    label: 'Intent Actions',
    icon: 'target',
    description: 'Trigger app navigation and actions',
    color: 'bg-orange-500',
  },
  notify: {
    label: 'Notify Actions',
    icon: 'bell',
    description: 'Show toast notifications',
    color: 'bg-green-500',
  },
} as const;
