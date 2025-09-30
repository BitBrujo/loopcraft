import { createOllama } from "ollama-ai-provider-v2";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText } from "ai";
import { mcpClientManager } from "@/lib/mcp-client";
import { loadMCPConfigWithUser } from "@/lib/mcp-config";
import { verifyToken, getUserFromRequest } from "@/lib/auth";
import { cookies } from 'next/headers';
import { createMessage } from "@/lib/dal/messages";
import { getConversationById, createConversation } from "@/lib/dal/conversations";
// import { createUIResource } from "@mcp-ui/server"; // For future use

export const maxDuration = 30;

// Initialize MCP connections on server start
let mcpInitialized = false;

// Helper to get user ID from request
async function getUserIdFromRequest(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return undefined;

    const payload = verifyToken(token);
    return payload?.userId;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return undefined;
  }
}

async function initializeMCP(userId?: string) {
  if (mcpInitialized) return;

  try {
    const config = await loadMCPConfigWithUser(userId);
    console.log("🔧 Initializing MCP with config:", JSON.stringify(config, null, 2));

    // Connect to configured MCP servers
    for (const server of config.servers) {
      try {
        console.log(`📡 Attempting to connect to MCP server: ${server.name}`);
        console.log(`   Command: ${server.command?.join(' ')}`);
        await mcpClientManager.connectToServer(server);
        console.log(`✅ Successfully connected to MCP server: ${server.name}`);
      } catch (error) {
        console.error(`❌ Failed to connect to MCP server ${server.name}:`);
        console.error(`   Error:`, error);
        console.error(`   Stack:`, (error as Error).stack);
      }
    }

    mcpInitialized = true;
    console.log("🎉 MCP initialization complete");
  } catch (error) {
    console.error("💥 Failed to initialize MCP:", error);
  }
}

export async function POST(req: Request) {
  // Get authenticated user ID to load their MCP servers
  const userId = await getUserIdFromRequest();

  // Initialize MCP with user-specific servers if authenticated
  await initializeMCP(userId);

  // Get authenticated user (optional for now - can allow anonymous chat)
  const user = await getUserFromRequest(req);

  const body = await req.json();
  console.log("Received body:", JSON.stringify(body, null, 2));

  const { messages, system, tools, conversationId } = body;

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

  const modelName = process.env.OLLAMA_MODEL || "llama3.2:latest";

  try {
    console.log("Model name:", modelName);
    console.log("Original messages:", JSON.stringify(messages, null, 2));
    console.log("Converted messages:", JSON.stringify(convertedMessages, null, 2));

    // Get MCP tools and convert them to AI SDK format
    const mcpTools = await mcpClientManager.getAllTools();
    console.log(`🔧 Found ${mcpTools.length} MCP tools:`, mcpTools.map(t => `${t.serverName}/${t.name}`));

    const mcpToolsForAI = {} as Record<string, { description?: string; execute: (args: Record<string, unknown>) => Promise<unknown> }>;

    for (const tool of mcpTools) {
      mcpToolsForAI[`mcp_${tool.serverName}_${tool.name}`] = {
        description: tool.description,
        execute: async (args: Record<string, unknown>) => {
          try {
            console.log(`🔨 Calling MCP tool: ${tool.serverName}/${tool.name} with args:`, args);
            const result = await mcpClientManager.callTool(tool.serverName, tool.name, args);
            console.log(`✅ Tool result:`, JSON.stringify(result, null, 2));

            // Check if the result contains UI resources
            if (result && typeof result === 'object' && 'content' in result) {
              const resultContent = (result as { content?: Array<{ type?: string; resource?: { uri?: string } }> }).content;
              if (Array.isArray(resultContent)) {
                for (const content of resultContent) {
                  if (content.type === 'resource' && content.resource?.uri?.startsWith('ui://')) {
                    // This is a UI resource, return it in a format that can be rendered
                    return {
                      type: 'ui-resource',
                      resource: content.resource
                    };
                  }
                }
              }
            }

            return result;
          } catch (error) {
            console.error(`Error calling MCP tool ${tool.name}:`, error);
            return { error: `Failed to call tool: ${error}` };
          }
        }
      };
    }

    const result = streamText({
      model: ollama(modelName),
      // @ts-expect-error - Type conversion is correct, TS inference issue
      messages: convertedMessages,
      system: system || "You are LoopCraft, an advanced AI assistant with access to Model Context Protocol (MCP) tools and resources. You can interact with various external services, file systems, and data sources through MCP. You can also render interactive UI components. You are knowledgeable, helpful, and provide clear, detailed responses.",
      tools: {
        ...frontendTools(tools || {}),
        ...mcpToolsForAI,
      },
      onFinish: async ({ text, toolCalls, toolResults }) => {
        // Save messages to database if user is authenticated
        if (user && conversationId) {
          try {
            // Verify conversation exists and belongs to user
            const conversation = await getConversationById(conversationId);
            if (conversation && conversation.user_id === user.id) {
              // Save user message
              const userMessage = convertedMessages[convertedMessages.length - 1];
              if (userMessage && userMessage.role === 'user') {
                await createMessage({
                  conversation_id: conversationId,
                  role: 'user',
                  content: userMessage.content || '',
                  metadata: {},
                });
              }

              // Save assistant message
              await createMessage({
                conversation_id: conversationId,
                role: 'assistant',
                content: text,
                tool_calls: toolCalls || {},
                tool_results: toolResults || {},
                metadata: {},
              });
            }
          } catch (error) {
            console.error('Failed to save messages to database:', error);
          }
        }
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
