import { MCPServer } from './mcp-client';

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

// Load MCP configuration from environment or file
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
  // In the future, this could load from a config file
  return defaultMCPConfig;
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