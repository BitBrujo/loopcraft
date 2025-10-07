import {
  ConversationalContext,
  ClarificationQuestion,
  UserIntent,
  DetectedEntity,
  Capability,
} from '@/types/conversational-builder';

/**
 * Generates clarifying questions for UI building based on conversation context
 */
export class ClarificationEngine {
  /**
   * Identify missing UI information and generate questions
   */
  static generateQuestions(context: ConversationalContext): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    // Check for UI type clarification
    if (this.needsUITypeClarification(context)) {
      questions.push(this.createUITypeQuestion(context));
    }

    // Check for layout details
    if (this.needsLayoutClarification(context)) {
      questions.push(...this.createLayoutQuestions(context));
    }

    // Check for styling preferences
    if (this.needsStylingClarification(context)) {
      questions.push(...this.createStylingQuestions(context));
    }

    // Check for interaction details
    if (this.needsInteractionClarification(context)) {
      questions.push(...this.createInteractionQuestions(context));
    }

    // Check for data binding needs
    if (this.needsDataBindingClarification(context)) {
      questions.push(...this.createDataBindingQuestions(context));
    }

    // Check for agent context needs
    if (this.needsAgentContextClarification(context)) {
      questions.push(...this.createAgentContextQuestions(context));
    }

    return questions;
  }

  // UI Type questions

  private static needsUITypeClarification(context: ConversationalContext): boolean {
    const { userIntent } = context;
    return !userIntent || userIntent.type === 'custom';
  }

  private static createUITypeQuestion(context: ConversationalContext): ClarificationQuestion {
    return {
      id: 'ui-type',
      question: 'What type of UI component do you need?',
      category: 'ui_type',
      suggestedAnswers: [
        'Form (collect user input)',
        'Dashboard (display metrics)',
        'Table (show data rows)',
        'Gallery (display images)',
        'Custom (describe it)',
      ],
      required: true,
    };
  }

  // Layout questions

  private static needsLayoutClarification(context: ConversationalContext): boolean {
    const { detectedEntities, currentUI } = context;

    // If we have a UI intent but no layout pattern detected
    const hasLayoutPattern = detectedEntities.some((e) => e.type === 'layout_pattern');
    // Handle both string and object content types for backward compatibility
    const content = currentUI.content;
    const htmlString = typeof content === 'string'
      ? content
      : (content as { htmlString?: string }).htmlString || '';
    const hasContent = htmlString.length > 100;

    return !hasLayoutPattern && !hasContent;
  }

  private static createLayoutQuestions(context: ConversationalContext): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    if (context.userIntent?.type === 'form') {
      questions.push({
        id: 'form-layout',
        question: 'What fields should your form include?',
        category: 'layout',
        required: true,
      });
    }

    if (context.userIntent?.type === 'dashboard') {
      questions.push({
        id: 'dashboard-layout',
        question: 'What should your dashboard display?',
        category: 'layout',
        suggestedAnswers: [
          'Metric cards (numbers and stats)',
          'Charts and graphs',
          'Recent activity feed',
          'All of the above',
        ],
        required: true,
      });
    }

    if (context.userIntent?.type === 'table') {
      questions.push({
        id: 'table-columns',
        question: 'What columns should your table have?',
        category: 'layout',
        required: true,
      });
    }

    return questions;
  }

  // Styling questions

  private static needsStylingClarification(context: ConversationalContext): boolean {
    const { detectedEntities } = context;

    // Check if styling preferences have been mentioned
    const hasStylingPref = detectedEntities.some((e) => e.type === 'styling_preference');
    return !hasStylingPref;
  }

  private static createStylingQuestions(context: ConversationalContext): ClarificationQuestion[] {
    return [
      {
        id: 'theme-preference',
        question: 'Should the UI support dark mode?',
        category: 'styling',
        suggestedAnswers: ['Yes, include dark mode support', 'No, light mode only'],
        required: false,
      },
    ];
  }

  // Interaction questions

  private static needsInteractionClarification(context: ConversationalContext): boolean {
    const { userIntent, requiredCapabilities } = context;

    // Forms need interaction clarification
    if (userIntent?.type === 'form') {
      const hasToolActions = requiredCapabilities.some((c) => c.type === 'tool_actions');
      return !hasToolActions;
    }

    return false;
  }

  private static createInteractionQuestions(context: ConversationalContext): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    if (context.userIntent?.type === 'form') {
      questions.push({
        id: 'form-action',
        question: 'What should happen when the form is submitted?',
        category: 'interactions',
        suggestedAnswers: [
          'Send to an API endpoint',
          'Save to database',
          'Send an email',
          'Just show a confirmation',
        ],
        required: false,
      });
    }

    return questions;
  }

  // Data binding questions

  private static needsDataBindingClarification(context: ConversationalContext): boolean {
    const { userIntent, detectedEntities } = context;

    // Dashboards and tables typically need data
    if (userIntent?.type === 'dashboard' || userIntent?.type === 'table') {
      const hasDataSource = detectedEntities.some((e) => e.type === 'data_source');
      return !hasDataSource;
    }

    return false;
  }

  private static createDataBindingQuestions(context: ConversationalContext): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    if (context.userIntent?.type === 'dashboard') {
      questions.push({
        id: 'dashboard-data-source',
        question: 'Where will the dashboard data come from?',
        category: 'data_binding',
        suggestedAnswers: [
          'AI agent will provide it (use placeholders)',
          'Fetch from an API',
          'Use static demo data',
        ],
        required: true,
      });
    }

    if (context.userIntent?.type === 'table') {
      questions.push({
        id: 'table-data-source',
        question: 'Where will the table data come from?',
        category: 'data_binding',
        suggestedAnswers: [
          'AI agent will provide it (use placeholders)',
          'Fetch from an API',
          'Use static demo data',
        ],
        required: true,
      });
    }

    return questions;
  }

  // Agent context questions

  private static needsAgentContextClarification(context: ConversationalContext): boolean {
    const { currentUI } = context;

    // If we have placeholders but haven't discussed them
    const hasPlaceholders = (currentUI.templatePlaceholders?.length || 0) > 0;
    const discussedPlaceholders = context.conversationHistory.some(
      (msg) => msg.content.toLowerCase().includes('placeholder') ||
               msg.content.toLowerCase().includes('agent') ||
               msg.content.toLowerCase().includes('dynamic')
    );

    return hasPlaceholders && !discussedPlaceholders;
  }

  private static createAgentContextQuestions(context: ConversationalContext): ClarificationQuestion[] {
    const placeholders = context.currentUI.templatePlaceholders || [];

    if (placeholders.length === 0) return [];

    return [
      {
        id: 'agent-placeholders',
        question: `Your UI uses placeholders (${placeholders.slice(0, 3).join(', ')})${placeholders.length > 3 ? '...' : ''}. The AI agent will fill these in when rendering. Is this correct?`,
        category: 'agent_context',
        suggestedAnswers: ['Yes, that is what I want', 'No, use static content instead'],
        required: false,
      },
    ];
  }

  /**
   * Parse user answer and extract structured information
   */
  static parseAnswer(
    questionId: string,
    answer: string
  ): { entities?: DetectedEntity[]; capabilities?: Capability[] } {
    const result: { entities?: DetectedEntity[]; capabilities?: Capability[] } = {};

    // Parse UI type answers
    if (questionId === 'ui-type') {
      if (answer.toLowerCase().includes('form')) {
        result.entities = [{ type: 'ui_component', value: 'form' }];
      } else if (answer.toLowerCase().includes('dashboard')) {
        result.entities = [{ type: 'ui_component', value: 'dashboard' }];
      } else if (answer.toLowerCase().includes('table')) {
        result.entities = [{ type: 'ui_component', value: 'table' }];
      } else if (answer.toLowerCase().includes('gallery')) {
        result.entities = [{ type: 'ui_component', value: 'gallery' }];
      }
    }

    // Parse layout answers
    if (questionId === 'form-layout') {
      const fields: DetectedEntity[] = [];
      const commonFields = ['name', 'email', 'password', 'phone', 'message', 'subject'];

      for (const field of commonFields) {
        if (answer.toLowerCase().includes(field)) {
          fields.push({ type: 'form_field', value: field });
        }
      }

      result.entities = fields;
    }

    // Parse dashboard layout answers
    if (questionId === 'dashboard-layout') {
      const entities: DetectedEntity[] = [];

      if (answer.toLowerCase().includes('metric') || answer.toLowerCase().includes('card')) {
        entities.push({ type: 'ui_component', value: 'card' });
      }
      if (answer.toLowerCase().includes('chart') || answer.toLowerCase().includes('graph')) {
        entities.push({ type: 'ui_component', value: 'chart' });
      }

      result.entities = entities;
    }

    // Parse styling answers
    if (questionId === 'theme-preference') {
      if (answer.toLowerCase().includes('dark')) {
        result.entities = [{ type: 'styling_preference', value: 'dark-mode' }];
      }
    }

    // Parse interaction answers
    if (questionId === 'form-action') {
      const capabilities: Capability[] = [];

      if (answer.toLowerCase().includes('api') ||
          answer.toLowerCase().includes('database') ||
          answer.toLowerCase().includes('email')) {
        capabilities.push({
          id: 'tool-actions',
          name: 'Tool Integration',
          type: 'tool_actions',
          implemented: false,
        });
      }

      result.capabilities = capabilities;
    }

    // Parse data binding answers
    if (questionId === 'dashboard-data-source' || questionId === 'table-data-source') {
      if (answer.toLowerCase().includes('agent') || answer.toLowerCase().includes('placeholder')) {
        result.capabilities = [
          {
            id: 'agent-context',
            name: 'Dynamic Placeholders',
            type: 'agent_context',
            implemented: false,
          },
        ];
      }
    }

    return result;
  }
}
