/**
 * Type definitions for MCP Tool Selector and Validation
 * Prevents tool call failures by ensuring proper MCP format
 */

/**
 * Tool information with server context
 * Fetched from /api/mcp/tools
 */
export interface ToolInfo {
  name: string;                    // Full MCP format: mcp_servername_toolname
  serverName: string;              // Server providing this tool
  description?: string;            // Tool description
  inputSchema?: ToolInputSchema;   // JSON Schema for parameters
}

/**
 * JSON Schema for tool parameters
 */
export interface ToolInputSchema {
  type: 'object';
  properties?: Record<string, ToolParameterSchema>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Individual parameter schema
 */
export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: unknown[];
  items?: ToolParameterSchema;
  properties?: Record<string, ToolParameterSchema>;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Tool validation result
 */
export interface ToolValidationResult {
  isValid: boolean;
  status: 'valid' | 'unknown' | 'invalid' | 'no-servers';
  message?: string;
  suggestions?: string[];        // Suggested tool names from available tools
  tool?: ToolInfo;              // Matched tool info (if found)
}

/**
 * Parsed tool name components
 */
export interface ParsedToolName {
  fullName: string;              // Original input
  serverName: string | null;     // Extracted server name
  toolName: string | null;       // Extracted tool name
  isValidFormat: boolean;        // Matches mcp_server_tool pattern
}

/**
 * Payload validation result
 */
export interface PayloadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Generated tool call snippet
 */
export interface ToolCallSnippet {
  html: string;                  // HTML button/form
  script: string;                // JavaScript postMessage code
  fullCode: string;              // Combined HTML + script
  toolInfo: ToolInfo;            // Tool metadata
}

/**
 * ToolSelector component props
 */
export interface ToolSelectorProps {
  onToolSelect: (snippet: ToolCallSnippet) => void;
  onClose: () => void;
  isOpen: boolean;
  preselectedServer?: string;    // Pre-filter by server
}

/**
 * Tool category for organization
 */
export type ToolCategory =
  | 'data-access'    // Read/fetch data
  | 'data-mutation'  // Create/update/delete
  | 'search'         // Search/query
  | 'notification'   // Send messages
  | 'processing'     // Transform/calculate
  | 'ui'             // UI resources
  | 'other';

/**
 * Tool with category metadata
 */
export interface CategorizedTool extends ToolInfo {
  category: ToolCategory;
}

/**
 * Server group for tool browser
 */
export interface ServerGroup {
  serverName: string;
  tools: ToolInfo[];
  isConnected: boolean;
  hasUIResources: boolean;
}
