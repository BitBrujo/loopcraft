import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { MCPServer, MCPServerUpdate, MCPServerConfig } from '@/types/database';

// Database row type where config is still a JSON string
interface MCPServerRow {
  id: number;
  user_id: number;
  name: string;
  type: 'stdio' | 'sse';
  config: string | MCPServerConfig;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

// GET /api/mcp-servers/[id] - Get specific MCP server
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get MCP server
    const server = await queryOne<MCPServerRow>(
      'SELECT id, user_id, name, type, config, enabled, created_at, updated_at FROM mcp_servers WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    if (!server) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      );
    }

    // Parse JSON config
    const parsedServer: MCPServer = {
      ...server,
      config: typeof server.config === 'string' ? JSON.parse(server.config) : server.config,
    };

    return NextResponse.json(parsedServer, { status: 200 });
  } catch (error) {
    console.error('Get MCP server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/mcp-servers/[id] - Update MCP server
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as MCPServerUpdate;
    const { name, type, config, enabled } = body;

    // Validate at least one field is provided
    if (name === undefined && type === undefined && config === undefined && enabled === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (type !== undefined && type !== 'stdio' && type !== 'sse') {
      return NextResponse.json(
        { error: 'Type must be either "stdio" or "sse"' },
        { status: 400 }
      );
    }

    // Check if MCP server exists and belongs to user
    const existingServer = await queryOne<{ id: number; type: 'stdio' | 'sse' }>(
      'SELECT id, type FROM mcp_servers WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    if (!existingServer) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      );
    }

    // Validate config based on type
    const serverType = type || existingServer.type;
    if (config) {
      if (serverType === 'stdio' && !config.command) {
        return NextResponse.json(
          { error: 'Command is required for stdio type' },
          { status: 400 }
        );
      }

      if (serverType === 'sse' && !config.url) {
        return NextResponse.json(
          { error: 'URL is required for sse type' },
          { status: 400 }
        );
      }
    }

    // If name is being updated, check for duplicates
    if (name) {
      const duplicateServer = await queryOne<{ id: number }>(
        'SELECT id FROM mcp_servers WHERE user_id = ? AND name = ? AND id != ?',
        [user.userId, name, id]
      );

      if (duplicateServer) {
        return NextResponse.json(
          { error: 'MCP server with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }

    if (config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(config));
    }

    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(enabled);
    }

    values.push(id, user.userId);

    await query(
      `UPDATE mcp_servers SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    // Get updated MCP server
    const updatedServer = await queryOne<MCPServerRow>(
      'SELECT id, user_id, name, type, config, enabled, created_at, updated_at FROM mcp_servers WHERE id = ?',
      [id]
    );

    if (!updatedServer) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated MCP server' },
        { status: 500 }
      );
    }

    // Parse JSON config
    const parsedServer: MCPServer = {
      ...updatedServer,
      config: typeof updatedServer.config === 'string' ? JSON.parse(updatedServer.config) : updatedServer.config,
    };

    return NextResponse.json(parsedServer, { status: 200 });
  } catch (error) {
    console.error('Update MCP server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/mcp-servers/[id] - Delete MCP server
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if MCP server exists and belongs to user
    const existingServer = await queryOne<{ id: number }>(
      'SELECT id FROM mcp_servers WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    if (!existingServer) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      );
    }

    // Delete MCP server
    await query(
      'DELETE FROM mcp_servers WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    return NextResponse.json(
      { message: 'MCP server deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete MCP server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
