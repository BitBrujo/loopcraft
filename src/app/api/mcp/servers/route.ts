import { NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';
import { initializeAllMCPServers } from '@/lib/mcp-init';

export async function GET(request: Request) {
  // Initialize all MCP servers (global + user-specific)
  await initializeAllMCPServers(request);

  // Get connected servers from mcpClientManager
  const connectedServers = mcpClientManager.getConnectedServers();

  const servers: Array<{
    name: string;
    type: 'stdio' | 'sse' | 'http';
    status: 'connected' | 'disconnected';
    error?: string;
  }> = connectedServers.map((serverName) => {
    const error = mcpClientManager.getConnectionError(serverName);
    return {
      name: serverName,
      type: 'stdio' as 'stdio' | 'sse' | 'http',
      status: mcpClientManager.isConnected(serverName) ? 'connected' as const : 'disconnected' as const,
      ...(error && { error }),
    };
  });

  return NextResponse.json({ servers });
}
