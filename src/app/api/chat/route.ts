import { ollama } from "ollama-ai-provider";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { convertToModelMessages, streamText } from "ai";

export const maxDuration = 30;

// Configure the global base URL for ollama
process.env.OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://ollama:11434";

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json();

  const modelName = process.env.OLLAMA_MODEL || "gpt-oss:20b";

  const result = streamText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: ollama(modelName) as any,
    messages: convertToModelMessages(messages),
    system: system || "You are HyperFace, an advanced AI assistant designed to help with programming, problem-solving, and creative tasks. You are knowledgeable, helpful, and provide clear, detailed responses.",
    tools: {
      ...frontendTools(tools),
      // add backend tools here
    },
  });

  return result.toUIMessageStreamResponse();
}
