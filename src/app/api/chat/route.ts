import { createOllama } from "ollama-ai-provider-v2";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
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

  const modelName = process.env.OLLAMA_MODEL;

  try {
    console.log("Model name:", modelName);
    console.log("Original messages:", JSON.stringify(messages, null, 2));
    console.log("Converted messages:", JSON.stringify(convertedMessages, null, 2));

    const result = streamText({
      model: ollama(modelName),
      // @ts-expect-error - Type conversion is correct, TS inference issue
      messages: convertedMessages,
      system: system || "You are HyperFace, an advanced AI assistant designed to help with programming, problem-solving, and creative tasks. You are knowledgeable, helpful, and provide clear, detailed responses.",
      tools: {
        ...frontendTools(tools || {}),
        // add backend tools here
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
