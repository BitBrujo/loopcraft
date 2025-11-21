import { mcpClientManager } from "@/lib/mcp-client";
import { initializeAllMCPServers } from "@/lib/mcp-init";
import { ensureWeaveInitialized, traceMCPToolCall } from "@/lib/weave-init";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Initialize Weave tracing
    await ensureWeaveInitialized();

    // Initialize MCP servers (including user-specific ones)
    await initializeAllMCPServers(req);

    const body = await req.json();
    const { serverName, toolName, arguments: args } = body;

    // Validate request
    if (!serverName || typeof serverName !== 'string') {
      return new Response(JSON.stringify({
        error: "Missing or invalid serverName"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!toolName || typeof toolName !== 'string') {
      return new Response(JSON.stringify({
        error: "Missing or invalid toolName"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if server is connected
    if (!mcpClientManager.isConnected(serverName)) {
      return new Response(JSON.stringify({
        error: `Server "${serverName}" is not connected`,
        availableServers: mcpClientManager.getConnectedServers()
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`[MCP Tool Call] ${serverName}.${toolName}`, args);

    // Call the tool with Weave tracing
    const tracedToolCall = traceMCPToolCall(
      serverName,
      toolName,
      async () => {
        return await mcpClientManager.callTool(serverName, toolName, args || {});
      }
    );

    const result = await tracedToolCall();

    console.log(`[MCP Tool Result] ${serverName}.${toolName}:`, result);

    // Unwrap MCP SDK response envelope if present
    // SDK returns: { response: { content: [...], isError: false } }
    // We need: { content: [...], isError: false }
    const unwrappedResult = (result as { response?: unknown })?.response || result;

    console.log(`[MCP Tool Result Unwrapped]:`, unwrappedResult);

    // Return unwrapped result in MCP format
    return new Response(JSON.stringify(unwrappedResult), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error calling MCP tool:", error);

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error occurred",
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
