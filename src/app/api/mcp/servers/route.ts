import { NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import type { MCPServer as DBMCPServer } from '@/types/database';

export async function GET(request: Request) {
  // Get connected servers from mcpClientManager
  const connectedServers = mcpClientManager.getConnectedServers();

  const servers: Array<{
    name: string;
    type: 'stdio' | 'sse' | 'http';
    status: 'connected' | 'disconnected';
  }> = connectedServers.map((serverName) => ({
    name: serverName,
    type: 'stdio' as 'stdio' | 'sse' | 'http',
    status: mcpClientManager.isConnected(serverName) ? 'connected' as const : 'disconnected' as const,
  }));

  // If user is authenticated, also load and connect their database servers
  const user = await getUserFromRequest(request);
  if (user) {
    try {
      // Fetch user's enabled servers from database
      const dbServers = await query<DBMCPServer[]>(
        'SELECT * FROM mcp_servers WHERE user_id = ? AND enabled = true',
        [user.userId]
      );

      // Attempt to connect each database server
      for (const dbServer of dbServers) {
        try {
          // Parse the JSON config if it's a string
          const config = typeof dbServer.config === 'string'
            ? JSON.parse(dbServer.config)
            : dbServer.config;

          // Convert database MCPServer to mcpClientManager MCPServer format
          const mcpServer = {
            name: dbServer.name,
            type: dbServer.type as 'stdio' | 'sse' | 'http',
            command: config.command,
            url: config.url,
            env: config.env,
          };

          // Try to connect (idempotent - will skip if already connected)
          await mcpClientManager.connectToServer(mcpServer);

          // Add to servers list if not already present
          if (!servers.find(s => s.name === dbServer.name)) {
            servers.push({
              name: dbServer.name,
              type: dbServer.type as 'stdio' | 'sse' | 'http',
              status: mcpClientManager.isConnected(dbServer.name) ? 'connected' as const : 'disconnected' as const,
            });
          }
        } catch (error) {
          console.error(`Failed to connect database server ${dbServer.name}:`, error);
          // Add as disconnected if connection failed
          if (!servers.find(s => s.name === dbServer.name)) {
            servers.push({
              name: dbServer.name,
              type: dbServer.type as 'stdio' | 'sse' | 'http',
              status: 'disconnected' as const,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch/connect database servers:', error);
      // Don't fail the entire request, just log the error
    }
  }

  return NextResponse.json({ servers });
}
