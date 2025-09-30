import { query, queryOne } from '../mysql-client';
import { MCPServer, CreateMCPServer, UpdateMCPServer } from './types';

// ============================================================================
// MCP Server Operations
// ============================================================================

/**
 * Create a new MCP server configuration
 */
export async function createMCPServer(data: CreateMCPServer): Promise<MCPServer> {
  const result = await query(
    `INSERT INTO mcp_servers (user_id, name, command, type, env, enabled, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id,
      data.name,
      JSON.stringify(data.command),
      data.type,
      JSON.stringify(data.env || {}),
      data.enabled,
      data.description,
    ]
  );

  const insertId = (result as any).insertId;
  const server = await getMCPServerById(insertId);
  if (!server) throw new Error('Failed to create MCP server');
  return server;
}

/**
 * Get MCP server by ID
 */
export async function getMCPServerById(id: string): Promise<MCPServer | null> {
  const server = await queryOne<any>(
    'SELECT * FROM mcp_servers WHERE id = ?',
    [id]
  );

  if (!server) return null;

  return parseMCPServerJson(server);
}

/**
 * Get MCP server by user ID and name
 */
export async function getMCPServerByName(
  userId: string,
  name: string
): Promise<MCPServer | null> {
  const server = await queryOne<any>(
    'SELECT * FROM mcp_servers WHERE user_id = ? AND name = ?',
    [userId, name]
  );

  if (!server) return null;

  return parseMCPServerJson(server);
}

/**
 * Get all MCP servers for a user
 */
export async function getMCPServersByUserId(userId: string): Promise<MCPServer[]> {
  const servers = await query<any[]>(
    'SELECT * FROM mcp_servers WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  return servers.map(parseMCPServerJson);
}

/**
 * Get enabled MCP servers for a user
 */
export async function getEnabledMCPServers(userId: string): Promise<MCPServer[]> {
  const servers = await query<any[]>(
    'SELECT * FROM mcp_servers WHERE user_id = ? AND enabled = true ORDER BY created_at DESC',
    [userId]
  );

  return servers.map(parseMCPServerJson);
}

/**
 * Update MCP server
 */
export async function updateMCPServer(
  id: string,
  data: UpdateMCPServer
): Promise<MCPServer | null> {
  const fields = Object.keys(data)
    .map(key => `${key} = ?`)
    .join(', ');

  if (!fields) return getMCPServerById(id);

  const values = Object.entries(data).map(([key, value]) => {
    if (key === 'command' || key === 'env') {
      return JSON.stringify(value);
    }
    return value;
  });

  await query(
    `UPDATE mcp_servers SET ${fields} WHERE id = ?`,
    [...values, id]
  );

  return getMCPServerById(id);
}

/**
 * Toggle MCP server enabled state
 */
export async function toggleMCPServer(id: string): Promise<MCPServer | null> {
  await query(
    'UPDATE mcp_servers SET enabled = NOT enabled WHERE id = ?',
    [id]
  );
  return getMCPServerById(id);
}

/**
 * Delete MCP server
 */
export async function deleteMCPServer(id: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM mcp_servers WHERE id = ?',
    [id]
  );
  return (result as any).affectedRows > 0;
}

/**
 * Check if user owns MCP server
 */
export async function userOwnsMCPServer(userId: string, serverId: string): Promise<boolean> {
  const server = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM mcp_servers WHERE id = ?',
    [serverId]
  );
  return server?.user_id === userId;
}

// Helper function to parse JSON fields
function parseMCPServerJson(server: any): MCPServer {
  return {
    ...server,
    command: typeof server.command === 'string' ? JSON.parse(server.command) : server.command,
    env: typeof server.env === 'string' ? JSON.parse(server.env) : server.env,
  };
}