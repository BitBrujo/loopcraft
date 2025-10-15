import { NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';
import { initializeAllMCPServers } from '@/lib/mcp-init';

export async function GET(
  request: Request,
  { params }: { params: { serverName: string } }
) {
  try {
    // Initialize all MCP servers (user-specific only)
    await initializeAllMCPServers(request);

    const { serverName } = params;

    // Check if server is connected
    if (!mcpClientManager.isConnected(serverName)) {
      return NextResponse.json(
        { error: `Server "${serverName}" is not connected` },
        { status: 404 }
      );
    }

    // Get all tools from all connected servers
    const allTools = await mcpClientManager.getAllTools();

    // Filter tools for this specific server
    const serverTools = allTools.filter(tool => tool.serverName === serverName);

    // Transform to ToolSchema format
    const tools = serverTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Error fetching server tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server tools' },
      { status: 500 }
    );
  }
}
