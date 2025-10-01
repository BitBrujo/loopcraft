import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export interface MCPServer {
  name: string;
  command?: string[];
  args?: string[];
  url?: string;
  type: 'stdio' | 'sse';
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport | SSEClientTransport> = new Map();

  async connectToServer(server: MCPServer): Promise<void> {
    try {
      let transport;

      if (server.type === 'stdio' && server.command) {
        transport = new StdioClientTransport({
          command: server.command[0],
          args: server.command.slice(1),
        });
      } else if (server.type === 'sse' && server.url) {
        transport = new SSEClientTransport(new URL(server.url));
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