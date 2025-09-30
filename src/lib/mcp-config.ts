import { MCPServer } from './mcp-client';
import { getMCPServersByUserId, getEnabledMCPServers } from './dal/mcp-servers';
import type { MCPServer as DBMCPServer } from './dal/types';

export interface MCPConfig {
  servers: MCPServer[];
  defaultModel?: string;
}

// Default MCP configuration
export const defaultMCPConfig: MCPConfig = {
  servers: [
    // Example stdio server configuration
    // {
    //   name: "filesystem",
    //   command: ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
    //   type: "stdio"
    // },
    // Example SSE server configuration
    // {
    //   name: "web-search",
    //   url: "http://localhost:3001/sse",
    //   type: "sse"
    // }
  ],
  defaultModel: process.env.OLLAMA_MODEL || "llama3.2:latest"
};

// Load MCP configuration from environment only
export function loadMCPConfig(): MCPConfig {
  // Try to load from environment variable
  const envConfig = process.env.MCP_CONFIG;
  console.log("DEBUG: MCP_CONFIG env var:", envConfig ? `${envConfig.substring(0, 100)}...` : "NOT SET");

  if (envConfig) {
    try {
      const parsed = JSON.parse(envConfig);
      console.log("DEBUG: Parsed MCP config successfully, servers:", parsed.servers?.length || 0);
      return parsed;
    } catch (error) {
      console.warn("Failed to parse MCP_CONFIG environment variable:", error);
      console.warn("  Value was:", envConfig);
    }
  } else {
    console.warn("MCP_CONFIG environment variable not set, using default (empty) config");
  }

  // For now, return default config
  return defaultMCPConfig;
}

// Convert database MCP server to client MCP server format
function dbServerToClientServer(dbServer: DBMCPServer): MCPServer {
  return {
    name: dbServer.name,
    command: dbServer.command,
    type: dbServer.type as 'stdio' | 'sse',
    args: [],
    env: dbServer.env,
  };
}

// Load MCP configuration with user-specific servers from database
export async function loadMCPConfigWithUser(userId?: string): Promise<MCPConfig> {
  const envConfig = loadMCPConfig();

  if (!userId) {
    return envConfig;
  }

  try {
    // Load enabled servers from database for this user
    const dbServers = await getEnabledMCPServers(userId);
    const userServers = dbServers.map(dbServerToClientServer);

    // Merge env and user servers (avoid duplicates by name)
    const envServerNames = new Set(envConfig.servers.map(s => s.name));
    const uniqueUserServers = userServers.filter(s => !envServerNames.has(s.name));

    return {
      ...envConfig,
      servers: [...envConfig.servers, ...uniqueUserServers],
    };
  } catch (error) {
    console.error('Error loading user MCP servers from database:', error);
    return envConfig;
  }
}

// Example MCP servers you can use:
export const exampleMCPServers: MCPServer[] = [
  {
    name: "filesystem",
    command: ["npx", "-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
    type: "stdio"
  },
  {
    name: "brave-search",
    command: ["npx", "-y", "@modelcontextprotocol/server-brave-search"],
    type: "stdio"
  },
  {
    name: "memory",
    command: ["npx", "-y", "@modelcontextprotocol/server-memory"],
    type: "stdio"
  }
];