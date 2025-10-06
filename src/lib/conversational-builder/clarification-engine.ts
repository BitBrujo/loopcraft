import {
  ConversationalContext,
  ClarificationQuestion,
  UserIntent,
  DetectedEntity,
  Capability,
} from '@/types/conversational-builder';

/**
 * Generates clarifying questions based on conversation context
 */
export class ClarificationEngine {
  /**
   * Identify missing information and generate questions
   */
  static generateQuestions(context: ConversationalContext): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    // Check for authentication needs
    if (this.needsAuthenticationClarification(context)) {
      questions.push(this.createAuthQuestion(context));
    }

    // Check for data structure details
    if (this.needsDataStructureClarification(context)) {
      questions.push(...this.createDataStructureQuestions(context));
    }

    // Check for capability details
    if (this.needsCapabilityClarification(context)) {
      questions.push(...this.createCapabilityQuestions(context));
    }

    // Check for UI preferences
    if (this.needsUIPreferencesClarification(context)) {
      questions.push(...this.createUIPreferenceQuestions(context));
    }

    // Check for deployment details
    if (this.needsDeploymentClarification(context)) {
      questions.push(...this.createDeploymentQuestions(context));
    }

    return questions;
  }

  // Authentication questions

  private static needsAuthenticationClarification(context: ConversationalContext): boolean {
    const { userIntent, detectedEntities } = context;

    // External services likely need auth
    if (userIntent?.type === 'api' || userIntent?.type === 'database') {
      const hasAuthEntity = detectedEntities.some(
        (e) => e.type === 'requirement' && e.value.toLowerCase().includes('auth')
      );
      return !hasAuthEntity;
    }

    return false;
  }

  private static createAuthQuestion(context: ConversationalContext): ClarificationQuestion {
    return {
      id: 'auth-method',
      question: 'What authentication method does this service require?',
      category: 'authentication',
      suggestedAnswers: [
        'API Key',
        'Bearer Token',
        'OAuth 2.0',
        'Username/Password',
        'No authentication needed',
      ],
      required: true,
    };
  }

  // Data structure questions

  private static needsDataStructureClarification(context: ConversationalContext): boolean {
    const { userIntent, currentConfig } = context;

    if (userIntent?.type === 'database' || userIntent?.type === 'api') {
      return currentConfig.resources.length === 0;
    }

    return false;
  }

  private static createDataStructureQuestions(
    context: ConversationalContext
  ): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    if (context.userIntent?.type === 'database') {
      questions.push({
        id: 'db-tables',
        question: 'Which database tables or collections should be accessible?',
        category: 'data_structure',
        required: true,
      });

      questions.push({
        id: 'db-operations',
        question: 'What operations do you need?',
        category: 'data_structure',
        suggestedAnswers: ['Read only', 'Read and Write', 'Full CRUD'],
        required: true,
      });
    }

    if (context.userIntent?.type === 'api') {
      questions.push({
        id: 'api-endpoints',
        question: 'Which API endpoints should be exposed?',
        category: 'data_structure',
        required: true,
      });
    }

    return questions;
  }

  // Capability questions

  private static needsCapabilityClarification(context: ConversationalContext): boolean {
    const { requiredCapabilities, currentConfig } = context;

    // If we have detected capabilities but no tools, ask for details
    return requiredCapabilities.length > 0 && currentConfig.tools.length === 0;
  }

  private static createCapabilityQuestions(
    context: ConversationalContext
  ): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    for (const capability of context.requiredCapabilities) {
      if (!capability.implemented) {
        questions.push({
          id: `capability-${capability.id}`,
          question: `How should the ${capability.name} capability work?`,
          category: 'capabilities',
          required: false,
        });
      }
    }

    return questions;
  }

  // UI preference questions

  private static needsUIPreferencesClarification(context: ConversationalContext): boolean {
    const { currentConfig } = context;

    // If we have tools but no UI resource, ask about UI needs
    return currentConfig.tools.length > 0 && !context.conversationHistory.some(
      (msg) => msg.content.toLowerCase().includes('ui') || msg.content.toLowerCase().includes('form')
    );
  }

  private static createUIPreferenceQuestions(
    context: ConversationalContext
  ): ClarificationQuestion[] {
    return [
      {
        id: 'ui-needed',
        question: 'Would you like to add a user interface for these tools?',
        category: 'ui_preferences',
        suggestedAnswers: [
          'Yes, create a form',
          'Yes, create a dashboard',
          'Yes, create a custom UI',
          'No, API only',
        ],
        required: false,
      },
    ];
  }

  // Deployment questions

  private static needsDeploymentClarification(context: ConversationalContext): boolean {
    const { currentConfig } = context;

    // If we have a complete config, ask about deployment
    return currentConfig.tools.length > 0 && currentConfig.resources.length > 0;
  }

  private static createDeploymentQuestions(
    context: ConversationalContext
  ): ClarificationQuestion[] {
    return [
      {
        id: 'server-name',
        question: 'What should we name this MCP server?',
        category: 'deployment',
        required: true,
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

    // Parse authentication answers
    if (questionId === 'auth-method') {
      result.entities = [
        {
          type: 'requirement',
          value: answer,
          context: 'authentication method',
        },
      ];
    }

    // Parse operation type answers
    if (questionId === 'db-operations') {
      const capabilities: Capability[] = [];
      if (answer.toLowerCase().includes('read')) {
        capabilities.push({
          id: 'read',
          name: 'Read Data',
          type: 'CRUD',
          implemented: false,
        });
      }
      if (answer.toLowerCase().includes('write') || answer.toLowerCase().includes('crud')) {
        capabilities.push(
          {
            id: 'create',
            name: 'Create Data',
            type: 'CRUD',
            implemented: false,
          },
          {
            id: 'update',
            name: 'Update Data',
            type: 'CRUD',
            implemented: false,
          },
          {
            id: 'delete',
            name: 'Delete Data',
            type: 'CRUD',
            implemented: false,
          }
        );
      }
      result.capabilities = capabilities;
    }

    return result;
  }
}
