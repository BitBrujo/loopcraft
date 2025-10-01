import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { MCPServer, MCPServerCreate } from '@/types/database';

// GET /api/mcp-servers - List all MCP servers for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all MCP servers for user
    const servers = await query<any[]>(
      'SELECT id, user_id, name, type, config, enabled, created_at, updated_at FROM mcp_servers WHERE user_id = ? ORDER BY created_at DESC',
      [user.userId]
    );

    // Parse JSON config for each server
    const parsedServers: MCPServer[] = servers.map(server => ({
      ...server,
      config: typeof server.config === 'string' ? JSON.parse(server.config) : server.config,
    }));

    return NextResponse.json(parsedServers, { status: 200 });
  } catch (error) {
    console.error('Get MCP servers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/mcp-servers - Create new MCP server
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as MCPServerCreate;
    const { name, type, config, enabled = true } = body;

    // Validate input
    if (!name || !type || !config) {
      return NextResponse.json(
        { error: 'Name, type, and config are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'stdio' && type !== 'sse') {
      return NextResponse.json(
        { error: 'Type must be either "stdio" or "sse"' },
        { status: 400 }
      );
    }

    // Validate config based on type
    if (type === 'stdio' && !config.command) {
      return NextResponse.json(
        { error: 'Command is required for stdio type' },
        { status: 400 }
      );
    }

    if (type === 'sse' && !config.url) {
      return NextResponse.json(
        { error: 'URL is required for sse type' },
        { status: 400 }
      );
    }

    // Check if server with same name already exists for user
    const existingServer = await query<any[]>(
      'SELECT id FROM mcp_servers WHERE user_id = ? AND name = ?',
      [user.userId, name]
    );

    if (existingServer.length > 0) {
      return NextResponse.json(
        { error: 'MCP server with this name already exists' },
        { status: 409 }
      );
    }

    // Insert MCP server
    const result = await query<any>(
      'INSERT INTO mcp_servers (user_id, name, type, config, enabled) VALUES (?, ?, ?, ?, ?)',
      [user.userId, name, type, JSON.stringify(config), enabled]
    );

    const serverId = result.insertId;

    // Get created server
    const serverRows = await query<any[]>(
      'SELECT id, user_id, name, type, config, enabled, created_at, updated_at FROM mcp_servers WHERE id = ?',
      [serverId]
    );

    if (!serverRows || serverRows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create MCP server' },
        { status: 500 }
      );
    }

    const server = serverRows[0];
    const parsedServer: MCPServer = {
      ...server,
      config: typeof server.config === 'string' ? JSON.parse(server.config) : server.config,
    };

    return NextResponse.json(parsedServer, { status: 201 });
  } catch (error) {
    console.error('Create MCP server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
