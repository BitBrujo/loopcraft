// MCP-UI Action Snippets
// Ready-to-use code examples for all 5 MCP-UI action types
// Enhanced with validation metadata to prevent tool call failures

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
 * All 5 MCP-UI action types with ready-to-use examples
 * These snippets can be inserted into HTML in the UI Builder
 */
export const actionSnippets: ActionSnippet[] = [
  // ==================== TOOL ACTIONS ====================
  {
    id: 'tool-button',
    name: 'Tool Call Button',
    category: 'tool',
    description: 'Simple button that calls an MCP tool when clicked',
    requiresServer: true,
    validationNotes: 'Replace mcp_server_tool with actual tool name from connected MCP server. Use "Browse Tools" button to find valid tools.',
    exampleToolName: 'mcp_filesystem_read_file',
    code: `<button onclick="executeTool()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Execute Tool
</button>

<script>
  function executeTool() {
    // IMPORTANT: Replace 'mcp_server_tool' with actual MCP tool name
    // Format: mcp_servername_toolname (e.g., mcp_filesystem_read_file)
    // Use "Browse Tools" button to find valid tool names
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_server_tool', // ⚠️ REPLACE with valid MCP tool name
        params: {
          // Add required parameters for your tool here
          key: 'value'
        }
      }
    }, '*');
  }
</script>`,
    placeholder: 'mcp_server_tool',
  },
  {
    id: 'tool-form',
    name: 'Form Submission Tool',
    category: 'tool',
    description: 'Form that collects user input and sends it to an MCP tool',
    requiresServer: true,
    validationNotes: 'Ensure toolName matches MCP format and params object is always valid. Form data is automatically converted to object.',
    exampleToolName: 'mcp_database_insert_record',
    code: `<form id="myForm" class="space-y-4">
  <input type="text" name="name" placeholder="Enter name" class="border rounded px-3 py-2 w-full" required>
  <input type="email" name="email" placeholder="Enter email" class="border rounded px-3 py-2 w-full" required>
  <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
    Submit Form
  </button>
</form>

<script>
  document.getElementById('myForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData); // Guaranteed to be object

    // IMPORTANT: Replace 'mcp_server_tool' with actual MCP tool name
    // Use "Browse Tools" to find tools that accept form data
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_server_tool', // ⚠️ REPLACE with valid MCP tool name
        params: data || {} // Always send object (never undefined/null)
      }
    }, '*');
  });
</script>`,
    placeholder: 'mcp_server_tool',
  },
  {
    id: 'tool-async',
    name: 'Async Tool with Response',
    category: 'tool',
    description: 'Call a tool and display the response in the UI',
    requiresServer: true,
    validationNotes: 'Use messageId to match responses. Parent window posts result back with type "mcp-ui-tool-response".',
    exampleToolName: 'mcp_search_query',
    code: `<button onclick="callAsyncTool()" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
  Call Tool
</button>
<div id="result" class="mt-2 p-2 bg-gray-100 rounded hidden"></div>

<script>
  const messageId = 'msg-' + Date.now(); // Unique ID for matching response

  function callAsyncTool() {
    // IMPORTANT: Replace 'mcp_server_tool' with actual MCP tool name
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_server_tool', // ⚠️ REPLACE with valid MCP tool name
        params: {
          // Add your tool parameters here
          query: 'example'
        },
        messageId: messageId // For matching async response
      }
    }, '*');
  }

  // Listen for tool response from parent window
  window.addEventListener('message', function(event) {
    // Match response by messageId
    if (event.data.type === 'mcp-ui-tool-response' && event.data.messageId === messageId) {
      const result = document.getElementById('result');

      // Handle success or error
      if (event.data.result) {
        result.textContent = JSON.stringify(event.data.result, null, 2);
        result.classList.remove('hidden');
      } else if (event.data.error) {
        result.textContent = 'Error: ' + event.data.error;
        result.classList.remove('hidden');
        result.classList.add('text-red-600');
      }
    }
  });
</script>`,
    placeholder: 'mcp_server_tool',
  },

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
