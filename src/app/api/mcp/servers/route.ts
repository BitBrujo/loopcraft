import { NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';

export async function GET() {
  const connectedServers = mcpClientManager.getConnectedServers();

  const servers = connectedServers.map((serverName) => ({
    name: serverName,
    type: 'stdio' as const,
    status: mcpClientManager.isConnected(serverName) ? 'connected' as const : 'disconnected' as const,
  }));

  return NextResponse.json({ servers });
}
