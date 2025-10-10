// MCP-UI Action Snippets
// Ready-to-use code examples for all 5 MCP-UI action types

export interface ActionSnippet {
  id: string;
  name: string;
  category: 'tool' | 'prompt' | 'link' | 'intent' | 'notify';
  description: string;
  code: string;
  placeholder?: string; // Text to select after insertion
}

/**
 * All 5 MCP-UI action types with ready-to-use examples
 * These snippets can be inserted into HTML in the UI Builder
 */
export const actionSnippets: ActionSnippet[] = [
  // ==================== TOOL ACTIONS ====================
  {
    id: 'tool-button',
    name: 'Tool Call Button',
    category: 'tool',
    description: 'Execute an MCP tool when button is clicked',
    code: `<button onclick="executeTool()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Execute Tool
</button>

<script>
  function executeTool() {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'my_tool_name',
        params: {
          key: 'value'
        }
      }
    }, '*');
  }
</script>`,
    placeholder: 'my_tool_name',
  },
  {
    id: 'tool-form',
    name: 'Form Submission Tool',
    category: 'tool',
    description: 'Submit form data to an MCP tool',
    code: `<form id="myForm" class="space-y-4">
  <input type="text" name="name" placeholder="Enter name" class="border rounded px-3 py-2 w-full">
  <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
    Submit
  </button>
</form>

<script>
  document.getElementById('myForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'submit_form',
        params: data
      }
    }, '*');
  });
</script>`,
    placeholder: 'submit_form',
  },
  {
    id: 'tool-async',
    name: 'Async Tool with Response',
    category: 'tool',
    description: 'Call tool and handle response asynchronously',
    code: `<button onclick="callAsyncTool()" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
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
</script>`,
    placeholder: 'async_tool',
  },

  // ==================== PROMPT ACTIONS ====================
  {
    id: 'prompt-button',
    name: 'Ask AI Button',
    category: 'prompt',
    description: 'Send a prompt to the AI assistant',
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
    description: 'Build prompt from user input',
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
    description: 'Pre-defined help questions for users',
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
    description: 'Open a URL in new browser tab',
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
    description: 'List of external resources',
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
    description: 'Navigate to app pages',
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
    description: 'Trigger custom app action',
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
    description: 'Show success toast message',
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
    description: 'Show error toast message',
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
    description: 'Demo all toast notification types',
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
];

/**
 * Get snippets by category
 */
export function getSnippetsByCategory(category: ActionSnippet['category']) {
  return actionSnippets.filter(s => s.category === category);
}

/**
 * Category metadata for UI display
 * Icons are Lucide icon names (rendered by consuming components)
 */
export const categoryMetadata = {
  tool: {
    label: 'Tool Actions',
    icon: 'wrench',
    description: 'Execute MCP tools from buttons and forms',
    color: 'bg-blue-500',
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
