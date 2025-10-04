import { mcpClientManager } from "@/lib/mcp-client";
import { loadMCPConfig } from "@/lib/mcp-config";
import { getUserFromRequest } from "@/lib/auth";
import { query } from "@/lib/db";
import type { MCPServer as DBMCPServer } from "@/types/database";

// Track initialization state
let globalMCPInitialized = false;

/**
 * Initialize global MCP servers from config file or environment variable.
 * This function is idempotent and safe to call multiple times.
 */
export async function initializeGlobalMCP(): Promise<void> {
  if (globalMCPInitialized) return;

  try {
    const config = loadMCPConfig();

    // Connect to configured MCP servers from config file
    for (const server of config.servers) {
      try {
        await mcpClientManager.connectToServer(server);
        console.log(`Successfully connected to global MCP server: ${server.name}`);
      } catch (error) {
        console.warn(`Failed to connect to global MCP server ${server.name}:`, error);
      }
    }

    globalMCPInitialized = true;
  } catch (error) {
    console.error("Failed to initialize global MCP:", error);
  }
}

/**
 * Load and connect user-specific MCP servers from database.
 * This function is idempotent (connectToServer skips if already connected).
 * Returns silently if user is not authenticated.
 */
export async function loadUserMCPServers(request: Request): Promise<void> {
  console.log('[MCP-INIT] loadUserMCPServers called');

  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      console.log('[MCP-INIT] No authenticated user found, skipping server initialization');
      return;
    }

    console.log(`[MCP-INIT] User authenticated: userId=${user.userId}, email=${user.email}`);

    const dbServers = await query<DBMCPServer[]>(
      'SELECT * FROM mcp_servers WHERE user_id = ? AND enabled = true',
      [user.userId]
    );

    console.log(`[MCP-INIT] Found ${dbServers.length} enabled servers for user ${user.userId}`);

    // Track current server names for cleanup
    const currentServerNames: string[] = [];

    for (const dbServer of dbServers) {
      console.log(`[MCP-INIT] Processing server: ${dbServer.name} (type: ${dbServer.type})`);

      try {
        const config = typeof dbServer.config === 'string'
          ? JSON.parse(dbServer.config)
          : dbServer.config;

        console.log(`[MCP-INIT] Config for ${dbServer.name}:`, JSON.stringify(config));

        const mcpServer = {
          name: dbServer.name,
          type: dbServer.type as 'stdio' | 'sse' | 'http',
          command: config.command,
          url: config.url,
          env: config.env,
        };

        console.log(`[MCP-INIT] Attempting to connect to ${dbServer.name}...`);

        // connectToServer is idempotent - will skip if already connected
        await mcpClientManager.connectToServer(mcpServer);
        mcpClientManager.trackUserServer(user.userId, dbServer.name);
        currentServerNames.push(dbServer.name);
        console.log(`[MCP-INIT] ✓ Successfully connected to user's MCP server: ${dbServer.name}`);
      } catch (error) {
        console.error(`[MCP-INIT] ✗ Failed to connect to user's MCP server ${dbServer.name}:`, error);
      }
    }

    // Clean up any servers that were deleted from the database
    console.log(`[MCP-INIT] Cleaning up deleted servers for user ${user.userId}`);
    await mcpClientManager.cleanupUserServers(user.userId, currentServerNames);
    console.log('[MCP-INIT] Server initialization complete');
  } catch (error) {
    console.error('[MCP-INIT] Failed to load user database servers:', error);
  }
}

/**
 * Initialize all MCP servers (global + user-specific).
 * Convenience function that calls both initialization functions.
 */
export async function initializeAllMCPServers(request: Request): Promise<void> {
  await initializeGlobalMCP();
  await loadUserMCPServers(request);
}
