import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { cwd } from 'process';

// POST /api/ui-builder/test - Create temporary test MCP server
export async function POST(req: NextRequest) {
  try {
    // Verify user authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serverCode, fileName, serverName } = await req.json();

    if (!serverCode || !fileName || !serverName) {
      return NextResponse.json(
        { error: 'Missing required fields: serverCode, fileName, serverName' },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(tmpdir(), 'mcp-ui-builder');
    await mkdir(tempDir, { recursive: true }).catch(() => {
      // Directory might already exist, ignore error
    });

    // Write server code to temp file
    const filePath = join(tempDir, fileName);
    await writeFile(filePath, serverCode, 'utf-8');

    // Get NODE_PATH to include project's node_modules
    const nodePath = join(cwd(), 'node_modules');

    // Create server config using npx tsx to handle TypeScript/ESM
    const config = {
      type: 'stdio',
      command: ['npx', '-y', 'tsx', filePath],
      env: {
        NODE_PATH: nodePath,
      },
    };

    // Check if server with this name already exists
    const existing = await query<Array<{ id: number }>>(
      `SELECT id FROM mcp_servers WHERE user_id = ? AND name = ?`,
      [user.userId, serverName]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'duplicate', message: `A server named "${serverName}" already exists. Please delete it first or choose a different name.` },
        { status: 409 }
      );
    }

    // Insert into database
    const result = await query<{ insertId: number }>(
      `INSERT INTO mcp_servers (user_id, name, type, config, enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [user.userId, serverName, 'stdio', JSON.stringify(config), 1]
    );

    const serverId = (result as { insertId: number }).insertId;

    return NextResponse.json({
      success: true,
      serverId,
      filePath,
      serverName,
    });
  } catch (error) {
    console.error('Error creating test server:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
