import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';
import { loadMCPConfig } from '@/lib/mcp-config';

export const dynamic = 'force-dynamic';

// GET /api/mcp/servers - List all configured MCP servers
export async function GET() {
  try {
    const config = loadMCPConfig();
    const connectedServers = mcpClientManager.getConnectedServers();

    const servers = config.servers.map((server) => ({
      id: server.name,
      name: server.name,
      command: server.command || [],
      type: server.type,
      env: server.args ? { args: server.args } : {},
      enabled: true,
      connected: connectedServers.includes(server.name),
      description: `${server.type === 'stdio' ? 'Local' : 'Remote'} MCP Server`,
    }));

    return NextResponse.json({
      success: true,
      servers,
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

// POST /api/mcp/servers - Connect to an MCP server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverName } = body;

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
    console.error(`❌ Error connecting to MCP server ${serverName}:`, error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to server',
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

// DELETE /api/mcp/servers/:name - Disconnect from an MCP server
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const serverName = url.searchParams.get('name');

    if (!serverName) {
      return NextResponse.json({
        success: false,
        error: 'Server name is required',
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
    console.error(`❌ Error disconnecting from MCP server ${serverName}:`, error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect from server',
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}