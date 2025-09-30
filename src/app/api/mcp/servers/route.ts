import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';
import { loadMCPConfig } from '@/lib/mcp-config';
import {
  getMCPServersByUserId,
  createMCPServer,
  updateMCPServer,
  deleteMCPServer
} from '@/lib/dal/mcp-servers';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Helper to get user from request
async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  return payload?.userId || null;
}

// GET /api/mcp/servers - List all configured MCP servers (env + database)
export async function GET(request: NextRequest) {
  try {
    // Get user ID (optional for now, but recommended)
    const userId = await getUserFromRequest(request);

    // Load from environment config
    const envConfig = loadMCPConfig();
    const connectedServers = mcpClientManager.getConnectedServers();

    // Load from database if user is authenticated
    let dbServers: any[] = [];
    if (userId) {
      const userServers = await getMCPServersByUserId(userId);
      dbServers = userServers.map((server) => ({
        id: server.id,
        name: server.name,
        command: server.command,
        type: server.type,
        env: server.env || {},
        enabled: server.enabled,
        connected: connectedServers.includes(server.name),
        description: server.description || '',
        source: 'database' as const,
      }));
    }

    // Merge env and database servers
    const envServers = envConfig.servers.map((server) => ({
      id: `env_${server.name}`,
      name: server.name,
      command: server.command || [],
      type: server.type,
      env: server.args ? { args: server.args } : {},
      enabled: true,
      connected: connectedServers.includes(server.name),
      description: `${server.type === 'stdio' ? 'Local' : 'Remote'} MCP Server`,
      source: 'environment' as const,
    }));

    const allServers = [...dbServers, ...envServers];

    return NextResponse.json({
      success: true,
      servers: allServers,
    });
  } catch (error) {
    console.error('❌ Error fetching MCP servers:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch servers',
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

// POST /api/mcp/servers - Connect to an MCP server OR create/update server in database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverName, serverData } = body;

    // Case 1: Save server to database
    if (serverData) {
      const userId = await getUserFromRequest(request);
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Authentication required to save servers',
        }, { status: 401 });
      }

      // Create or update server in database
      const server = await createMCPServer({
        user_id: userId,
        name: serverData.name,
        command: serverData.command,
        type: serverData.type,
        env: serverData.env || {},
        enabled: serverData.enabled !== false,
        description: serverData.description || '',
      });

      return NextResponse.json({
        success: true,
        message: `Server ${server.name} saved successfully`,
        server: {
          id: server.id,
          name: server.name,
          command: server.command,
          type: server.type,
          env: server.env,
          enabled: server.enabled,
          description: server.description,
        },
      });
    }

    // Case 2: Connect to a server
    if (!serverName) {
      return NextResponse.json({
        success: false,
        error: 'Server name is required',
      }, { status: 400 });
    }

    const config = loadMCPConfig();
    const server = config.servers.find(s => s.name === serverName);

    if (!server) {
      return NextResponse.json({
        success: false,
        error: `Server '${serverName}' not found in configuration`,
      }, { status: 404 });
    }

    // Check if already connected
    if (mcpClientManager.isConnected(serverName)) {
      return NextResponse.json({
        success: true,
        message: `Already connected to ${serverName}`,
        connected: true,
      });
    }

    // Connect to the server
    console.log(`🔄 Attempting to connect to MCP server: ${serverName}`);
    console.log(`   Command: ${server.command?.join(' ')}`);
    await mcpClientManager.connectToServer(server);
    console.log(`✅ Successfully connected to MCP server: ${serverName}`);

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${serverName}`,
      connected: true,
    });
  } catch (error) {
    console.error(`❌ Error in POST /api/mcp/servers:`, error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request',
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

// PUT /api/mcp/servers - Update an existing server configuration
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const body = await request.json();
    const { serverId, serverData } = body;

    if (!serverId || !serverData) {
      return NextResponse.json({
        success: false,
        error: 'Server ID and data are required',
      }, { status: 400 });
    }

    // Update server in database
    const updatedServer = await updateMCPServer(serverId, {
      command: serverData.command,
      type: serverData.type,
      env: serverData.env,
      enabled: serverData.enabled,
      description: serverData.description,
    });

    if (!updatedServer) {
      return NextResponse.json({
        success: false,
        error: 'Server not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Server ${updatedServer.name} updated successfully`,
      server: updatedServer,
    });
  } catch (error) {
    console.error('❌ Error updating MCP server:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update server',
    }, { status: 500 });
  }
}

// DELETE /api/mcp/servers - Disconnect from an MCP server OR delete from database
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const serverName = url.searchParams.get('name');
    const serverId = url.searchParams.get('id');

    // Case 1: Delete from database
    if (serverId) {
      const userId = await getUserFromRequest(request);
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Authentication required',
        }, { status: 401 });
      }

      const deleted = await deleteMCPServer(serverId);
      if (!deleted) {
        return NextResponse.json({
          success: false,
          error: 'Server not found',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Server deleted successfully',
      });
    }

    // Case 2: Disconnect from server
    if (!serverName) {
      return NextResponse.json({
        success: false,
        error: 'Server name or ID is required',
      }, { status: 400 });
    }

    if (!mcpClientManager.isConnected(serverName)) {
      return NextResponse.json({
        success: true,
        message: `Server ${serverName} is not connected`,
      });
    }

    await mcpClientManager.disconnectFromServer(serverName);

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected from ${serverName}`,
    });
  } catch (error) {
    console.error(`❌ Error in DELETE /api/mcp/servers:`, error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request',
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}