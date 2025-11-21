/**
 * Weave AI Tracing Initialization
 *
 * Initializes the Weave client for tracing AI operations throughout the application.
 * Weave is used to monitor and debug AI workflows including:
 * - Chat completions (Ollama/Anthropic)
 * - MCP tool calls
 * - MCP server connections
 */

import { init, op } from 'weave';

let weaveInitialized = false;
let weaveEnabled = false;

/**
 * Initialize Weave with project configuration
 * Should be called once at application startup or on first API request
 *
 * @returns Promise that resolves when Weave is initialized
 */
export async function initializeWeave(): Promise<void> {
  if (weaveInitialized) {
    return;
  }

  try {
    // Check if Weave is enabled via environment variable
    const enabled = process.env.WEAVE_ENABLED === 'true';

    if (!enabled) {
      console.log('[Weave] Tracing disabled (WEAVE_ENABLED not set to true)');
      weaveInitialized = true;
      weaveEnabled = false;
      return;
    }

    // Check for required configuration
    const apiKey = process.env.WANDB_API_KEY;
    const project = process.env.WANDB_PROJECT || 'loopcraft-ai-monitoring';

    if (!apiKey) {
      console.warn('[Weave] WANDB_API_KEY not set, tracing will be disabled');
      weaveInitialized = true;
      weaveEnabled = false;
      return;
    }

    // Initialize Weave
    await init(project);

    weaveInitialized = true;
    weaveEnabled = true;
    console.log(`[Weave] Initialized successfully for project: ${project}`);
  } catch (error) {
    console.error('[Weave] Failed to initialize:', error);
    weaveInitialized = true;
    weaveEnabled = false;
  }
}

/**
 * Check if Weave is enabled and initialized
 */
export function isWeaveEnabled(): boolean {
  return weaveEnabled;
}

/**
 * Wrap a function with Weave tracing
 * If Weave is disabled, returns the original function unchanged
 *
 * @param fn - The function to trace
 * @param name - Optional name for the traced operation
 * @returns Traced function or original function if Weave is disabled
 */
export function traceFunction<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name?: string
): T {
  if (!weaveEnabled) {
    return fn;
  }

  try {
    // Use op() decorator to trace the function
    const traced = op(fn, { name });
    return traced as T;
  } catch (error) {
    console.error('[Weave] Failed to trace function:', error);
    return fn;
  }
}

/**
 * Create a traced async function with custom metadata
 *
 * @param name - Name of the operation
 * @param fn - Async function to trace
 * @param metadata - Additional metadata to attach
 * @returns Traced function
 */
export function createTracedOperation<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  fn: T,
  metadata?: Record<string, unknown>
): T {
  if (!weaveEnabled) {
    return fn;
  }

  const wrappedFn = async (...args: Parameters<T>) => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      // Log success metrics
      if (metadata?.logSuccess !== false) {
        console.log(`[Weave] ${name} completed in ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Weave] ${name} failed after ${duration}ms:`, error);
      throw error;
    }
  };

  return traceFunction(wrappedFn as T, name);
}

/**
 * Trace a chat completion operation
 * Specialized wrapper for AI chat completions
 *
 * @param provider - AI provider name (e.g., 'ollama', 'anthropic')
 * @param model - Model name
 * @param fn - Function that performs the chat completion
 * @returns Traced function
 */
export function traceChatCompletion<T extends (...args: unknown[]) => Promise<unknown>>(
  provider: string,
  model: string,
  fn: T
): T {
  return createTracedOperation(
    `chat_completion_${provider}`,
    fn,
    { provider, model }
  );
}

/**
 * Trace an MCP tool call
 *
 * @param serverName - Name of the MCP server
 * @param toolName - Name of the tool being called
 * @param fn - Function that executes the tool
 * @returns Traced function
 */
export function traceMCPToolCall<T extends (...args: unknown[]) => Promise<unknown>>(
  serverName: string,
  toolName: string,
  fn: T
): T {
  return createTracedOperation(
    `mcp_tool_${serverName}_${toolName}`,
    fn,
    { serverName, toolName, type: 'mcp_tool_call' }
  );
}

/**
 * Trace MCP server connection
 *
 * @param serverName - Name of the MCP server
 * @param fn - Function that connects to the server
 * @returns Traced function
 */
export function traceMCPConnection<T extends (...args: unknown[]) => Promise<unknown>>(
  serverName: string,
  fn: T
): T {
  return createTracedOperation(
    `mcp_connect_${serverName}`,
    fn,
    { serverName, type: 'mcp_connection' }
  );
}

// Auto-initialize on module load (lazy initialization)
// This ensures Weave is ready for the first API request
let initPromise: Promise<void> | null = null;

export function ensureWeaveInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeWeave();
  }
  return initPromise;
}
