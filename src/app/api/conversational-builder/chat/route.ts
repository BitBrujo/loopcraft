import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';
import { getAIConfig } from '@/lib/ai-config';
import {
  ConversationResponse,
  ConversationalContext,
  ConversationPhase,
  PromptButton,
} from '@/types/conversational-builder';
import { UIResource } from '@/types/ui-builder';
import { IntentAnalyzer } from '@/lib/conversational-builder/intent-analyzer';
import { UIGenerator } from '@/lib/conversational-builder/ui-generator';
import { ClarificationEngine } from '@/lib/conversational-builder/clarification-engine';
import {
  detectTemplateSelection,
  createFlowFromTemplate,
  getTemplatePrompts,
  INITIAL_CATEGORY_PROMPTS,
} from '@/lib/conversational-builder/prompt-flow';
import { uiTemplates, UICategory } from '@/lib/ui-templates';

const SYSTEM_PROMPT = `You are an expert MCP-UI builder assistant. Your role is to help users create beautiful, functional UI components through natural conversation.

Your capabilities:
1. Understand UI needs and detect intent (form, dashboard, table, chart, gallery, etc.)
2. Extract UI elements (form fields, buttons, layout patterns, styling preferences, data sources)
3. Ask clarifying questions about layout, styling, interactions, and data binding
4. Suggest relevant UI component templates from the library
5. Generate clean, accessible HTML with Tailwind CSS
6. Detect and manage template placeholders for agent context ({{user.name}}, {{metrics.revenue}}, etc.)
7. Help map interactive elements to tool actions when needed

Guidelines:
- Be conversational and friendly, but concise
- Ask ONE clarifying question at a time
- When you detect a UI intent, acknowledge it and suggest a template
- Focus on clean, accessible, responsive design
- For forms: Ask about required fields and what happens on submit
- For dashboards: Ask about data sources and which metrics to display
- For tables: Ask about columns and data source
- Use Tailwind CSS classes for styling (always include dark mode support)
- When user mentions dynamic data, suggest using template placeholders like {{placeholder.name}}

Current conversation phase: {phase}
Detected UI intent: {intent}
Detected UI elements: {entities}
Required UI capabilities: {capabilities}

Respond naturally to the user's message, and help them build their UI component step by step.`;

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

    // Detect template selection first
    const selectedTemplateId = detectTemplateSelection(message);
    let appliedTemplate: typeof uiTemplates[0] | null = null;
    let followUpPrompts: PromptButton[] = [];

    if (selectedTemplateId) {
      appliedTemplate = uiTemplates.find((t) => t.id === selectedTemplateId) || null;
    }

    // Detect category selection
    let selectedCategory: UICategory | null = null;
    const lowerMessage = message.toLowerCase();
    for (const prompt of INITIAL_CATEGORY_PROMPTS) {
      if (prompt.category && lowerMessage.includes(prompt.category)) {
        selectedCategory = prompt.category as UICategory;
        break;
      }
    }

    // Analyze user message
    const intent = IntentAnalyzer.detectUIIntent(message) || context.userIntent;
    const newEntities = IntentAnalyzer.extractUIElements(message);
    const allEntities = [...context.detectedEntities, ...newEntities];
    const capabilities = IntentAnalyzer.inferUICapabilities(intent, allEntities);

    // Merge with existing capabilities
    const mergedCapabilities = [...context.requiredCapabilities];
    for (const cap of capabilities) {
      if (!mergedCapabilities.find((c) => c.id === cap.id)) {
        mergedCapabilities.push(cap);
      }
    }

    // Determine current phase
    // Handle both string and object content types for backward compatibility
    const content = context.currentUI.content;
    const htmlContent = typeof content === 'string'
      ? content
      : (content as { type?: string; htmlString?: string }).type === 'rawHtml'
        ? (content as { type?: string; htmlString?: string }).htmlString || ''
        : '';
    let currentPhase: ConversationPhase = 'discovery';

    if (htmlContent.length > 50) {
      currentPhase = 'refinement';
    } else if (intent && allEntities.length > 0) {
      currentPhase = 'design';
    }

    // Check for action mapping request
    const actionRequested = IntentAnalyzer.detectActionMappingRequest(message);
    if (actionRequested && htmlContent.length > 50) {
      currentPhase = 'actions';
    }

    // Check for deployment request
    const deployRequested = IntentAnalyzer.detectDeploymentRequest(message);
    if (deployRequested && htmlContent.length > 50) {
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

    // Find matching UI component templates
    const matchingComponents = UIGenerator.findMatchingUIComponents(updatedContext);

    // Generate follow-up prompts based on selection
    if (selectedCategory && !appliedTemplate) {
      // User selected a category, show template options
      followUpPrompts = getTemplatePrompts(selectedCategory);
    } else if (appliedTemplate) {
      // User selected a template, show customization options
      const flow = createFlowFromTemplate(appliedTemplate.id);
      followUpPrompts = flow.followUpPrompts;
    }

    // Build AI prompt
    const aiConfig = await getAIConfig(request);
    const ollama = createOllama({
      baseURL: aiConfig.baseURL,
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
- UI Intent: ${intent?.description || 'Unknown'}
- UI Elements: ${allEntities.map((e) => `${e.type}:${e.value}`).join(', ')}
- Capabilities: ${mergedCapabilities.map((c) => `${c.name} (${c.type})`).join(', ')}
- Current HTML: ${htmlContent.length > 0 ? `${htmlContent.length} characters generated` : 'Not yet created'}
- Placeholders: ${context.currentUI.templatePlaceholders?.length || 0}

${matchingComponents.length > 0 ? `\nSuggested UI Components (top 3):\n${matchingComponents.slice(0, 3).map((m) => `- ${m.templateName} (${Math.round(m.confidence * 100)}% match: ${m.reason})`).join('\n')}` : ''}

${questions.length > 0 ? `\nPending Questions:\n${questions.map((q) => `- ${q.question}`).join('\n')}` : ''}

User message: ${message}
`;

    // Stream AI response
    const result = await streamText({
      model: ollama(aiConfig.modelName),
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
    });

    // Build response with structured data
    const response: ConversationResponse & { followUpPrompts?: PromptButton[]; updatedUI?: UIResource } = {
      message: '', // Will be filled by stream
      phase: currentPhase,
      intent,
      entities: newEntities,
      capabilities: capabilities.filter(
        (cap) => !context.requiredCapabilities.find((c) => c.id === cap.id)
      ),
      questions: questions.slice(0, 2), // Only show top 2 questions
      suggestions: matchingComponents.slice(0, 5).map((match) => ({
        id: `ui_component-${match.templateId}`,
        type: 'ui_component' as const,
        title: match.templateName,
        description: `${Math.round(match.confidence * 100)}% match: ${match.reason}`,
        confidence: match.confidence,
        actionLabel: 'Use This Template',
        action: () => {}, // Will be handled client-side
      })),
      followUpPrompts,
    };

    // If template was selected, include the HTML
    if (appliedTemplate) {
      const uiResource = UIGenerator.templateToUIResource(appliedTemplate.id);
      if (uiResource) {
        response.updatedUI = uiResource;
      }
    }

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
