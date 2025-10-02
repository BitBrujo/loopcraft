import { createOllama } from "ollama-ai-provider-v2";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText } from "ai";
import { mcpClientManager } from "@/lib/mcp-client";
import { loadMCPConfig } from "@/lib/mcp-config";
import { getUserFromRequest } from "@/lib/auth";
import { query } from "@/lib/db";
import type { MCPServer as DBMCPServer } from "@/types/database";
// import { createUIResource } from "@mcp-ui/server"; // For future use

export const maxDuration = 30;

// Initialize global MCP connections on server start
let globalMCPInitialized = false;

async function initializeGlobalMCP() {
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

async function loadUserMCPServers(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return;

    const dbServers = await query<DBMCPServer[]>(
      'SELECT * FROM mcp_servers WHERE user_id = ? AND enabled = true',
      [user.userId]
    );

    for (const dbServer of dbServers) {
      try {
        const config = typeof dbServer.config === 'string'
          ? JSON.parse(dbServer.config)
          : dbServer.config;

        const mcpServer = {
          name: dbServer.name,
          type: dbServer.type as 'stdio' | 'sse' | 'http',
          command: config.command,
          url: config.url,
          env: config.env,
        };

        // connectToServer is idempotent - will skip if already connected
        await mcpClientManager.connectToServer(mcpServer);
        console.log(`Successfully connected to user's MCP server: ${dbServer.name}`);
      } catch (error) {
        console.warn(`Failed to connect to user's MCP server ${dbServer.name}:`, error);
      }
    }
  } catch (error) {
    console.warn('Failed to load user database servers:', error);
  }
}

export async function POST(req: Request) {
  // Initialize global MCP servers (once)
  await initializeGlobalMCP();

  // Load user-specific MCP servers (every request, idempotent)
  await loadUserMCPServers(req);

  const body = await req.json();
  console.log("Received body:", JSON.stringify(body, null, 2));

  const { messages, system, tools } = body;

  // Validate messages
  if (!messages || !Array.isArray(messages)) {
    console.log("Invalid messages:", messages);
    return new Response("Invalid messages format", { status: 400 });
  }

  // Convert UI messages to model messages format
  const convertedMessages = messages.map((message: { role: "user" | "assistant" | "system" | "tool"; parts?: { type: string; text: string }[]; content?: string }) => {
    if (message.parts && Array.isArray(message.parts)) {
      // Convert from UI message format (with parts) to model message format
      const content = message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

      return {
        role: message.role,
        content: content
      };
    }

    // If already in correct format, return as is
    return message;
  });

  // Configure Ollama provider
  const ollama = createOllama({
    baseURL: process.env.OLLAMA_BASE_URL,
  });

  const modelName = process.env.OLLAMA_MODEL || 'llama3.2:latest';

  try {
    console.log("Model name:", modelName);
    console.log("Original messages:", JSON.stringify(messages, null, 2));
    console.log("Converted messages:", JSON.stringify(convertedMessages, null, 2));

    // Get MCP tools and convert them to AI SDK format
    const mcpTools = await mcpClientManager.getAllTools();
    console.log("MCP tools fetched:", JSON.stringify(mcpTools, null, 2));
    const mcpToolsForAI = mcpTools.reduce((acc, tool) => {
      acc[`mcp_${tool.serverName}_${tool.name}`] = {
        description: tool.description,
        parameters: tool.inputSchema || {},
        execute: async (args: Record<string, unknown>) => {
          try {
            const result = await mcpClientManager.callTool(tool.serverName, tool.name, args);
            // Return the MCP tool result as-is in standard MCP format
            return result;
          } catch (error) {
            console.error(`Error calling MCP tool ${tool.name}:`, error);
            return { error: `Failed to call tool: ${error}` };
          }
        }
      };
      return acc;
    }, {} as Record<string, { description?: string; parameters: object; execute: (args: Record<string, unknown>) => Promise<unknown> }>);

    // Define MCP resource fetcher tool separately to avoid type inference issues
    const getMCPResourceTool = {
      description: "Fetch a resource from an MCP server",
      parameters: {
        type: "object",
        properties: {
          serverName: { type: "string", description: "Name of the MCP server" },
          uri: { type: "string", description: "URI of the resource to fetch" }
        },
        required: ["serverName", "uri"]
      },
      execute: async ({ serverName, uri }: { serverName: string; uri: string }) => {
        try {
          const resource = await mcpClientManager.getResource(serverName, uri);
          // Return the MCP resource as-is in standard MCP format
          return resource;
        } catch (error) {
          console.error(`Error fetching MCP resource ${uri}:`, error);
          return { error: `Failed to fetch resource: ${error}` };
        }
      }
    } as { description: string; parameters: object; execute: (args: Record<string, unknown>) => Promise<unknown> };

    const result = streamText({
      model: ollama(modelName),
      // @ts-expect-error - Type conversion is correct, TS inference issue
      messages: convertedMessages,
      system: system || "You are LoopCraft, an advanced AI assistant with access to Model Context Protocol (MCP) tools and resources. You can interact with various external services, file systems, and data sources through MCP. You can also render interactive UI components. You are knowledgeable, helpful, and provide clear, detailed responses.",
      tools: {
        ...frontendTools(tools || {}),
        ...mcpToolsForAI,
        // @ts-expect-error - Tool schema type inference issue with AI SDK
        getMCPResource: getMCPResourceTool,
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("API Error:", error);

    // Provide more helpful error messages
    let errorMessage = "An error occurred while processing your request.";
    let statusCode = 500;

    if ((error as Error).message?.includes("connect") || (error as Error).message?.includes("ECONNREFUSED")) {
      errorMessage = `Unable to connect to Ollama server at ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}. Please ensure Ollama is running.`;
      statusCode = 503;
    } else if ((error as Error).message?.includes("model") || (error as Error).message?.includes("not found")) {
      errorMessage = `Model "${modelName}" not found. Please ensure the model is available in Ollama. Try running: ollama pull ${modelName}`;
      statusCode = 404;
    } else if ((error as Error).message) {
      errorMessage = (error as Error).message;
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      model: modelName,
      baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434"
    }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" }
    });
  }
}
