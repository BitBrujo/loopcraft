import { mcpClientManager } from "@/lib/mcp-client";
import { initializeAllMCPServers } from "@/lib/mcp-init";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
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

    // Call the tool
    const result = await mcpClientManager.callTool(serverName, toolName, args || {});

    console.log(`[MCP Tool Result] ${serverName}.${toolName}:`, result);

    // Return result in MCP format
    return new Response(JSON.stringify(result), {
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
