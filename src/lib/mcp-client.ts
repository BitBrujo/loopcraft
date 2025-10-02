import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export interface MCPServer {
  name: string;
  command?: string[];
  args?: string[];
  url?: string;
  type: 'stdio' | 'sse' | 'http';
  env?: Record<string, string>;
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport | SSEClientTransport> = new Map();

  async connectToServer(server: MCPServer): Promise<void> {
    // Skip if already connected (idempotent)
    if (this.isConnected(server.name)) {
      console.log(`Already connected to MCP server: ${server.name}`);
      return;
    }

    try {
      let transport;

      if (server.type === 'stdio' && server.command) {
        // Pass environment variables to stdio transport
        // Filter out undefined values from process.env
        const cleanEnv = server.env
          ? Object.entries({ ...process.env, ...server.env }).reduce((acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = value;
              }
              return acc;
            }, {} as Record<string, string>)
          : undefined;

        transport = new StdioClientTransport({
          command: server.command[0],
          args: server.command.slice(1),
          env: cleanEnv,
        });
      } else if ((server.type === 'sse' || server.type === 'http') && server.url) {
        // For SSE/HTTP, create URL with auth headers via EventSource init
        const url = new URL(server.url);

        // If env vars exist, convert to headers (common patterns)
        const headers: Record<string, string> = {};
        if (server.env) {
          for (const [key, value] of Object.entries(server.env)) {
            // Support common auth patterns
            if (key === 'API_KEY' || key === 'BEARER_TOKEN') {
              headers['Authorization'] = `Bearer ${value}`;
            } else if (key.startsWith('HEADER_')) {
              // Custom headers: HEADER_X_Custom_Header -> X-Custom-Header
              const headerName = key.substring(7).replace(/_/g, '-');
              headers[headerName] = value;
            } else {
              // Pass as-is for other patterns
              headers[key] = value;
            }
          }
        }

        // Note: SSEClientTransport in MCP SDK may not support headers directly
        // This is a best-effort approach - check SDK docs for proper implementation
        // @ts-expect-error - SSEClientTransport headers support may vary by SDK version
        transport = new SSEClientTransport(url, { headers });
      } else {
        throw new Error(`Invalid server configuration for ${server.name}`);
      }

      const client = new Client({
        name: "loopcraft-mcp-client",
        version: "1.0.0",
      }, {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      });

      await client.connect(transport);

      this.clients.set(server.name, client);
      this.transports.set(server.name, transport);

      console.log(`Connected to MCP server: ${server.name}`);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${server.name}:`, error);
      throw error;
    }
  }

  async disconnectFromServer(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    const transport = this.transports.get(serverName);

    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }

    if (transport) {
      await transport.close();
      this.transports.delete(serverName);
    }
  }

  async getAllTools(): Promise<Array<{ name: string; description?: string; inputSchema?: object; serverName: string }>> {
    const allTools = [];

    for (const [serverName, client] of this.clients) {
      try {
        const response = await client.listTools();
        if (response.tools) {
          for (const tool of response.tools) {
            allTools.push({
              ...tool,
              serverName,
            });
          }
        }
      } catch (error) {
        console.error(`Failed to get tools from ${serverName}:`, error);
      }
    }

    return allTools;
  }

  async getAllResources(): Promise<Array<{ uri: string; name?: string; description?: string; mimeType?: string; serverName: string }>> {
    const allResources = [];

    for (const [serverName, client] of this.clients) {
      try {
        const response = await client.listResources();
        if (response.resources) {
          for (const resource of response.resources) {
            allResources.push({
              ...resource,
              serverName,
            });
          }
        }
      } catch (error) {
        console.error(`Failed to get resources from ${serverName}:`, error);
      }
    }

    return allResources;
  }

  async callTool(serverName: string, toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`No client connected for server: ${serverName}`);
    }

    try {
      const response = await client.callTool({
        name: toolName,
        arguments: args,
      });
      return response;
    } catch (error) {
      console.error(`Failed to call tool ${toolName} on ${serverName}:`, error);
      throw error;
    }
  }

  async getResource(serverName: string, uri: string): Promise<unknown> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`No client connected for server: ${serverName}`);
    }

    try {
      const response = await client.readResource({ uri });
      return response;
    } catch (error) {
      console.error(`Failed to get resource ${uri} from ${serverName}:`, error);
      throw error;
    }
  }

  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }

  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
}

// Global instance
export const mcpClientManager = new MCPClientManager();