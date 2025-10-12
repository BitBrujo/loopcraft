import { createOllama } from "ollama-ai-provider-v2";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText } from "ai";
import { mcpClientManager } from "@/lib/mcp-client";
import { initializeAllMCPServers } from "@/lib/mcp-init";
import { getUserFromRequest } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { Setting } from "@/types/database";
// import { createUIResource } from "@mcp-ui/server"; // For future use

export const maxDuration = 30;

export async function POST(req: Request) {
  // Initialize all MCP servers (global + user-specific)
  await initializeAllMCPServers(req);

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

  // Get AI configuration (user settings or environment variables)
  let baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api';
  let modelName = process.env.OLLAMA_MODEL || 'llama3.2:latest';

  // Check for user-specific AI settings
  const user = getUserFromRequest(req);
  if (user) {
    try {
      const userApiUrl = await queryOne<Setting>(
        'SELECT * FROM settings WHERE user_id = ? AND `key` = ?',
        [user.userId, 'ollama_base_url']
      );

      const userModelName = await queryOne<Setting>(
        'SELECT * FROM settings WHERE user_id = ? AND `key` = ?',
        [user.userId, 'ollama_model']
      );

      // Use user settings if they exist
      if (userApiUrl && userApiUrl.value) {
        baseURL = userApiUrl.value;
      }
      if (userModelName && userModelName.value) {
        modelName = userModelName.value;
      }
    } catch (error) {
      console.error('Error fetching user AI settings:', error);
      // Continue with environment variable defaults
    }
  }

  // Configure Ollama provider
  const ollama = createOllama({
    baseURL,
  });

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

            // Check if result contains content
            // MCP format: { content: [{ type: "text" | "resource", ...}] }
            if (result && typeof result === 'object' && 'content' in result) {
              const content = (result as { content: unknown }).content;
              if (Array.isArray(content) && content.length > 0) {
                const firstContent = content[0] as { type?: string; resource?: unknown; text?: string };

                // If it's text content, return as-is
                if (firstContent.type === "text" && firstContent.text) {
                  return firstContent.text;
                }

                // Legacy: If it's a resource type (shouldn't happen anymore)
                if (firstContent.type === "resource" && firstContent.resource) {
                  return "__MCP_UI_RESOURCE__:" + JSON.stringify(result);
                }
              }
            }

            // For other formats, stringify to ensure it passes validation
            return JSON.stringify(result);
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
      errorMessage = `Unable to connect to Ollama server at ${baseURL}. Please ensure Ollama is running.`;
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
      baseURL
    }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" }
    });
  }
}
