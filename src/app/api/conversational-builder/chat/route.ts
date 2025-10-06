import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';
import { getAIConfig } from '@/lib/ai-config';
import {
  ConversationRequest,
  ConversationResponse,
  ConversationalContext,
  UserIntent,
  DetectedEntity,
  Capability,
  ClarificationQuestion,
  ConversationPhase,
} from '@/types/conversational-builder';
import { IntentAnalyzer } from '@/lib/conversational-builder/intent-analyzer';
import { SchemaGenerator } from '@/lib/conversational-builder/schema-generator';
import { ClarificationEngine } from '@/lib/conversational-builder/clarification-engine';
import { ServerConfig } from '@/types/server-builder';

const SYSTEM_PROMPT = `You are an expert MCP (Model Context Protocol) server builder assistant. Your role is to help users create functional MCP servers through natural conversation.

Your capabilities:
1. Understand user needs and detect intent (database, API, file system, notifications, etc.)
2. Extract entities (technologies, data types, capabilities, requirements)
3. Ask clarifying questions about authentication, data structures, and operations
4. Suggest relevant tools and resources from a template library
5. Generate complete server configurations with tools and resources
6. Recommend MCP-UI components for interactive interfaces

Guidelines:
- Be conversational and friendly, but concise
- Ask ONE clarifying question at a time
- When you detect an intent, acknowledge it and ask for specifics
- Suggest concrete examples based on detected technologies
- For databases: Ask about tables, operations (read/write), authentication
- For APIs: Ask about endpoints, authentication, data formats
- For file systems: Ask about operations, storage location, file types
- Always think about both backend tools AND user interface needs

Current conversation phase: {phase}
Detected intent: {intent}
Detected entities: {entities}
Required capabilities: {capabilities}

Respond naturally to the user's message, and help them build their MCP server step by step.`;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context } = body as {
      message: string;
      context: ConversationalContext;
    };

    // Analyze user message
    const intent = IntentAnalyzer.detectIntent(message) || context.userIntent;
    const newEntities = IntentAnalyzer.extractEntities(message);
    const allEntities = [...context.detectedEntities, ...newEntities];
    const capabilities = IntentAnalyzer.inferCapabilities(intent, allEntities);

    // Merge with existing capabilities
    const mergedCapabilities = [...context.requiredCapabilities];
    for (const cap of capabilities) {
      if (!mergedCapabilities.find((c) => c.id === cap.id)) {
        mergedCapabilities.push(cap);
      }
    }

    // Determine current phase
    let currentPhase: ConversationPhase = 'discovery';
    if (context.currentConfig.tools.length > 0 || context.currentConfig.resources.length > 0) {
      currentPhase = 'refinement';
    } else if (intent && allEntities.length > 0) {
      currentPhase = 'drafting';
    }

    // Check for UI request
    const uiRequested = IntentAnalyzer.detectUIRequest(message);
    if (uiRequested) {
      currentPhase = 'ui_design';
    }

    // Check for deployment request
    const deployRequested = IntentAnalyzer.detectDeploymentRequest(message);
    if (deployRequested && context.currentConfig.tools.length > 0) {
      currentPhase = 'deployment';
    }

    // Generate clarifying questions
    const updatedContext: ConversationalContext = {
      ...context,
      userIntent: intent,
      detectedEntities: allEntities,
      requiredCapabilities: mergedCapabilities,
    };

    const questions = ClarificationEngine.generateQuestions(updatedContext);

    // Find matching templates
    const matchingTools = SchemaGenerator.findMatchingTools(updatedContext);
    const matchingResources = SchemaGenerator.findMatchingResources(updatedContext);

    // Build AI prompt
    const aiConfig = await getAIConfig(user.id);
    const ollama = createOllama({
      baseURL: aiConfig.baseUrl,
    });

    const systemPrompt = SYSTEM_PROMPT.replace('{phase}', currentPhase)
      .replace('{intent}', intent?.description || 'not detected yet')
      .replace('{entities}', allEntities.map((e) => e.value).join(', ') || 'none')
      .replace(
        '{capabilities}',
        mergedCapabilities.map((c) => c.name).join(', ') || 'none'
      );

    // Prepare context message for AI
    const contextMessage = `
Conversation Context:
- Phase: ${currentPhase}
- Intent: ${intent?.description || 'Unknown'}
- Entities: ${allEntities.map((e) => `${e.type}:${e.value}`).join(', ')}
- Capabilities: ${mergedCapabilities.map((c) => `${c.name} (${c.type})`).join(', ')}

${matchingTools.length > 0 ? `\nSuggested Tools (top 3):\n${matchingTools.slice(0, 3).map((m) => `- ${m.templateName} (${Math.round(m.confidence * 100)}% match: ${m.reason})`).join('\n')}` : ''}

${matchingResources.length > 0 ? `\nSuggested Resources (top 3):\n${matchingResources.slice(0, 3).map((m) => `- ${m.templateName} (${Math.round(m.confidence * 100)}% match: ${m.reason})`).join('\n')}` : ''}

${questions.length > 0 ? `\nPending Questions:\n${questions.map((q) => `- ${q.question}`).join('\n')}` : ''}

User message: ${message}
`;

    // Stream AI response
    const result = await streamText({
      model: ollama(aiConfig.model),
      system: systemPrompt,
      messages: [
        ...context.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: contextMessage,
        },
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Build response with structured data
    const response: ConversationResponse = {
      message: '', // Will be filled by stream
      phase: currentPhase,
      intent,
      entities: newEntities,
      capabilities: capabilities.filter(
        (cap) => !context.requiredCapabilities.find((c) => c.id === cap.id)
      ),
      questions: questions.slice(0, 2), // Only show top 2 questions
      suggestions: [
        ...matchingTools.slice(0, 3).map((match) => ({
          id: `tool-${match.templateId}`,
          type: 'tool' as const,
          title: match.templateName,
          description: `${Math.round(match.confidence * 100)}% match: ${match.reason}`,
          confidence: match.confidence,
          actionLabel: 'Add Tool',
          action: () => {}, // Will be handled client-side
        })),
        ...matchingResources.slice(0, 3).map((match) => ({
          id: `resource-${match.templateId}`,
          type: 'resource' as const,
          title: match.templateName,
          description: `${Math.round(match.confidence * 100)}% match: ${match.reason}`,
          confidence: match.confidence,
          actionLabel: 'Add Resource',
          action: () => {}, // Will be handled client-side
        })),
      ],
    };

    // Return streaming response with metadata
    return new Response(
      new ReadableStream({
        async start(controller) {
          // Send metadata first
          const metadataChunk = `data: ${JSON.stringify({
            type: 'metadata',
            ...response,
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(metadataChunk));

          // Stream AI response
          for await (const chunk of result.textStream) {
            const textChunk = `data: ${JSON.stringify({
              type: 'text',
              content: chunk,
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(textChunk));
          }

          // Send done signal
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error('Conversational builder chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
