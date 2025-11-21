/**
 * TypeScript type definitions for Weave integration
 */

/**
 * Weave configuration options
 */
export interface WeaveConfig {
  /** Weights & Biases API key */
  apiKey?: string;
  /** Project name for Weave tracking */
  project?: string;
  /** Whether Weave tracing is enabled */
  enabled: boolean;
}

/**
 * Metadata for traced operations
 */
export interface TraceMetadata {
  /** Type of operation being traced */
  type: 'chat_completion' | 'mcp_tool_call' | 'mcp_connection' | 'custom';
  /** AI provider name (for chat completions) */
  provider?: string;
  /** Model name (for chat completions) */
  model?: string;
  /** MCP server name (for MCP operations) */
  serverName?: string;
  /** MCP tool name (for tool calls) */
  toolName?: string;
  /** Custom metadata fields */
  [key: string]: unknown;
}

/**
 * Result of a traced operation
 */
export interface TraceResult<T = unknown> {
  /** Operation result data */
  data: T;
  /** Duration in milliseconds */
  duration: number;
  /** Whether the operation succeeded */
  success: boolean;
  /** Error if operation failed */
  error?: Error;
  /** Metadata about the operation */
  metadata?: TraceMetadata;
}

/**
 * Chat completion trace data
 */
export interface ChatCompletionTrace {
  /** AI provider used */
  provider: 'ollama' | 'anthropic';
  /** Model name */
  model: string;
  /** Number of messages in the request */
  messageCount: number;
  /** Token usage (if available) */
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  /** Response time in milliseconds */
  responseTime: number;
  /** Whether the request succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * MCP tool call trace data
 */
export interface MCPToolCallTrace {
  /** Name of the MCP server */
  serverName: string;
  /** Name of the tool being called */
  toolName: string;
  /** Tool arguments */
  arguments: Record<string, unknown>;
  /** Tool result */
  result?: unknown;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Whether the call succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * MCP server connection trace data
 */
export interface MCPConnectionTrace {
  /** Name of the MCP server */
  serverName: string;
  /** Server type (stdio, sse, http) */
  serverType: 'stdio' | 'sse' | 'http';
  /** Connection time in milliseconds */
  connectionTime: number;
  /** Whether the connection succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Number of available tools */
  toolCount?: number;
  /** Number of available resources */
  resourceCount?: number;
}

/**
 * Weave initialization status
 */
export interface WeaveStatus {
  /** Whether Weave is initialized */
  initialized: boolean;
  /** Whether Weave is enabled */
  enabled: boolean;
  /** Project name being used */
  project?: string;
  /** Initialization error if any */
  error?: string;
}
