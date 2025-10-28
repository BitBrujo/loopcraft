/**
 * MCP Tool Validation Utilities
 * Prevents tool call failures by validating names, payloads, and context
 */

import type {
  ToolInfo,
  ParsedToolName,
  ToolValidationResult,
  PayloadValidationResult,
  ToolCallSnippet,
  ToolInputSchema,
} from '@/types/tool-selector';

/**
 * Parse MCP tool name into components
 * Expected format: mcp_servername_toolname
 *
 * @param toolName - Tool name to parse
 * @returns Parsed components with validation status
 */
export function parseToolName(toolName: string): ParsedToolName {
  const trimmed = toolName.trim();

  // Check for MCP prefix and at least 2 underscores
  const mcpPattern = /^mcp_([^_]+)_(.+)$/;
  const match = trimmed.match(mcpPattern);

  if (match) {
    return {
      fullName: trimmed,
      serverName: match[1],
      toolName: match[2],
      isValidFormat: true,
    };
  }

  // Invalid format
  return {
    fullName: trimmed,
    serverName: null,
    toolName: null,
    isValidFormat: false,
  };
}

/**
 * Format tool name to MCP standard
 * Ensures mcp_server_tool format
 *
 * @param serverName - Server name
 * @param toolName - Tool name (with or without mcp_ prefix)
 * @returns Properly formatted MCP tool name
 */
export function formatToolName(serverName: string, toolName: string): string {
  // Remove existing mcp_ prefix if present
  const cleanToolName = toolName.replace(/^mcp_[^_]+_/, '');
  return `mcp_${serverName}_${cleanToolName}`;
}

/**
 * Validate tool exists in available tools
 *
 * @param toolName - Tool name to validate
 * @param availableTools - Tools from connected MCP servers
 * @returns Validation result with status and suggestions
 */
export function validateToolExists(
  toolName: string,
  availableTools: ToolInfo[]
): ToolValidationResult {
  // No servers connected
  if (availableTools.length === 0) {
    return {
      isValid: false,
      status: 'no-servers',
      message: 'No MCP servers connected. Add servers in Settings.',
      suggestions: [],
    };
  }

  // Parse tool name
  const parsed = parseToolName(toolName);

  // Invalid format
  if (!parsed.isValidFormat) {
    return {
      isValid: false,
      status: 'invalid',
      message: `Invalid tool name format. Expected: mcp_servername_toolname`,
      suggestions: getSimilarToolNames(toolName, availableTools, 3),
    };
  }

  // Find exact match
  const exactMatch = availableTools.find(t => t.name === toolName);
  if (exactMatch) {
    return {
      isValid: true,
      status: 'valid',
      message: `Valid tool from server: ${exactMatch.serverName}`,
      tool: exactMatch,
      suggestions: [],
    };
  }

  // Tool not found but format is correct
  return {
    isValid: false,
    status: 'unknown',
    message: `Tool not found in connected servers. Check server connection or tool name.`,
    suggestions: getSimilarToolNames(toolName, availableTools, 5),
  };
}

/**
 * Get similar tool names using Levenshtein distance
 * Helps users find the correct tool name
 *
 * @param input - User input
 * @param availableTools - Available tools
 * @param limit - Max suggestions
 * @returns Array of similar tool names
 */
function getSimilarToolNames(
  input: string,
  availableTools: ToolInfo[],
  limit: number
): string[] {
  if (availableTools.length === 0) return [];

  // Calculate similarity scores
  const scored = availableTools.map(tool => ({
    name: tool.name,
    score: levenshteinDistance(input.toLowerCase(), tool.name.toLowerCase()),
  }));

  // Sort by similarity (lower score = more similar)
  scored.sort((a, b) => a.score - b.score);

  // Return top N suggestions
  return scored.slice(0, limit).map(s => s.name);
}

/**
 * Levenshtein distance algorithm
 * Measures string similarity
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Get tool schema by name
 *
 * @param toolName - Tool name
 * @param availableTools - Available tools
 * @returns Tool input schema or null
 */
export function getToolSchema(
  toolName: string,
  availableTools: ToolInfo[]
): ToolInputSchema | null {
  const tool = availableTools.find(t => t.name === toolName);
  return tool?.inputSchema || null;
}

/**
 * Validate tool call payload against schema
 *
 * @param payload - Payload object to validate
 * @param schema - Tool input schema
 * @returns Validation result with errors and warnings
 */
export function validateToolPayload(
  payload: unknown,
  schema: ToolInputSchema | null
): PayloadValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check payload is an object
  if (typeof payload !== 'object' || payload === null) {
    errors.push('Payload must be a valid object (not string, array, or null)');
    return { isValid: false, errors, warnings };
  }

  // No schema available - can't validate further
  if (!schema) {
    warnings.push('No schema available for validation');
    return { isValid: true, errors, warnings };
  }

  const payloadObj = payload as Record<string, unknown>;

  // Check required parameters
  if (schema.required) {
    for (const requiredParam of schema.required) {
      if (!(requiredParam in payloadObj)) {
        errors.push(`Missing required parameter: ${requiredParam}`);
      }
    }
  }

  // Check parameter types
  if (schema.properties) {
    for (const [paramName, paramValue] of Object.entries(payloadObj)) {
      const paramSchema = schema.properties[paramName];

      if (!paramSchema) {
        if (schema.additionalProperties === false) {
          warnings.push(`Unexpected parameter: ${paramName}`);
        }
        continue;
      }

      // Type checking
      const actualType = Array.isArray(paramValue) ? 'array' : typeof paramValue;
      if (paramSchema.type !== actualType && paramValue !== null) {
        errors.push(`Parameter "${paramName}" should be ${paramSchema.type}, got ${actualType}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate validated tool call snippet
 * Creates correct window.parent.postMessage() code
 *
 * @param tool - Tool information
 * @param snippetType - 'button' | 'form' | 'async'
 * @returns Complete code snippet
 */
export function generateValidatedSnippet(
  tool: ToolInfo,
  snippetType: 'button' | 'form' | 'async' = 'button'
): ToolCallSnippet {
  const toolName = tool.name;
  const serverName = tool.serverName;
  const description = tool.description || 'Execute tool';

  // Generate parameter example from schema
  const exampleParams = generateExampleParams(tool.inputSchema);
  const paramsStr = JSON.stringify(exampleParams, null, 2).replace(/\n/g, '\n      ');

  let html = '';
  let script = '';

  if (snippetType === 'button') {
    html = `<button onclick="executeTool()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  ${escapeHtml(description)}
</button>`;

    script = `<script>
  function executeTool() {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: '${toolName}', // MCP format: mcp_${serverName}_...
        params: ${paramsStr}
      }
    }, '*');
  }
</script>`;
  } else if (snippetType === 'form') {
    const formFields = generateFormFields(tool.inputSchema);

    html = `<form id="toolForm" class="space-y-4">
${formFields}
  <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
    ${escapeHtml(description)}
  </button>
</form>`;

    script = `<script>
  document.getElementById('toolForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: '${toolName}', // MCP format: mcp_${serverName}_...
        params: data || {} // Always an object
      }
    }, '*');
  });
</script>`;
  } else {
    // async with response
    html = `<button onclick="callAsyncTool()" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
  ${escapeHtml(description)}
</button>
<div id="result" class="mt-2 p-2 bg-gray-100 rounded hidden"></div>`;

    script = `<script>
  const messageId = 'msg-' + Date.now();

  function callAsyncTool() {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: '${toolName}', // MCP format: mcp_${serverName}_...
        params: ${paramsStr},
        messageId: messageId
      }
    }, '*');
  }

  // Listen for response from parent window
  window.addEventListener('message', function(event) {
    // Handle both message types: ui-message-response (from @mcp-ui/client) and mcp-ui-tool-response (legacy)
    if ((event.data.type === 'ui-message-response' || event.data.type === 'mcp-ui-tool-response') && event.data.messageId === messageId) {
      const result = document.getElementById('result');
      // Extract result from correct location:
      // - @mcp-ui/client sends: event.data.payload.response
      // - Legacy format: event.data.result
      const toolResult = event.data.payload?.response || event.data.result;
      result.textContent = JSON.stringify(toolResult, null, 2);
      result.classList.remove('hidden');
    }
  });
</script>`;
  }

  return {
    html,
    script,
    fullCode: html + '\n\n' + script,
    toolInfo: tool,
  };
}

/**
 * Generate example parameters from schema
 */
function generateExampleParams(schema: ToolInputSchema | undefined): Record<string, unknown> {
  if (!schema || !schema.properties) {
    return {};
  }

  const example: Record<string, unknown> = {};

  for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
    if (paramSchema.default !== undefined) {
      example[paramName] = paramSchema.default;
    } else if (paramSchema.enum && paramSchema.enum.length > 0) {
      example[paramName] = paramSchema.enum[0];
    } else {
      example[paramName] = getDefaultValueForType(paramSchema.type);
    }
  }

  return example;
}

/**
 * Get default value for schema type
 */
function getDefaultValueForType(type: string): unknown {
  switch (type) {
    case 'string':
      return 'example';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}

/**
 * Generate form fields from schema
 */
function generateFormFields(schema: ToolInputSchema | undefined): string {
  if (!schema || !schema.properties) {
    return '  <input type="text" name="data" placeholder="Enter data" class="border rounded px-3 py-2 w-full">';
  }

  const fields: string[] = [];

  for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
    const isRequired = schema.required?.includes(paramName) || false;
    const description = paramSchema.description || paramName;

    let inputType = 'text';
    if (paramSchema.type === 'number') inputType = 'number';
    if (paramSchema.type === 'boolean') inputType = 'checkbox';

    if (paramSchema.enum) {
      // Select dropdown for enum
      const options = paramSchema.enum.map(val =>
        `    <option value="${escapeHtml(String(val))}">${escapeHtml(String(val))}</option>`
      ).join('\n');

      fields.push(`  <select name="${paramName}" ${isRequired ? 'required' : ''} class="border rounded px-3 py-2 w-full">
${options}
  </select>`);
    } else {
      fields.push(`  <input type="${inputType}" name="${paramName}" placeholder="${escapeHtml(description)}" ${isRequired ? 'required' : ''} class="border rounded px-3 py-2 w-full">`);
    }
  }

  return fields.join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Extract server name from tool name
 * Helper for quick server extraction
 */
export function extractServerName(toolName: string): string | null {
  const parsed = parseToolName(toolName);
  return parsed.serverName;
}

/**
 * Check if tool name format is valid
 * Quick validation without full lookup
 */
export function isValidToolNameFormat(toolName: string): boolean {
  const parsed = parseToolName(toolName);
  return parsed.isValidFormat;
}
