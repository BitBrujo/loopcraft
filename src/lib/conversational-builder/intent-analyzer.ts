import {
  UserIntent,
  DetectedEntity,
  Capability,
} from '@/types/conversational-builder';

/**
 * Analyzes user messages to detect UI patterns, extract UI elements, and infer capabilities
 */
export class IntentAnalyzer {
  /**
   * Detect UI intent from message
   */
  static detectUIIntent(message: string): UserIntent | undefined {
    const lowerMessage = message.toLowerCase();

    // Form intent
    if (
      lowerMessage.includes('form') ||
      lowerMessage.includes('input') ||
      lowerMessage.includes('submit') ||
      lowerMessage.includes('field') ||
      lowerMessage.includes('contact') ||
      lowerMessage.includes('signup') ||
      lowerMessage.includes('login') ||
      lowerMessage.includes('registration') ||
      lowerMessage.includes('feedback') ||
      lowerMessage.includes('survey')
    ) {
      return {
        type: 'form',
        description: 'Form for data collection and submission',
        confidence: 0.8,
      };
    }

    // Dashboard intent
    if (
      lowerMessage.includes('dashboard') ||
      lowerMessage.includes('analytics') ||
      lowerMessage.includes('metrics') ||
      lowerMessage.includes('stats') ||
      lowerMessage.includes('overview') ||
      lowerMessage.includes('admin panel') ||
      lowerMessage.includes('control panel')
    ) {
      return {
        type: 'dashboard',
        description: 'Dashboard for data visualization and metrics',
        confidence: 0.8,
      };
    }

    // Table intent
    if (
      lowerMessage.includes('table') ||
      lowerMessage.includes('list') ||
      lowerMessage.includes('directory') ||
      lowerMessage.includes('grid') ||
      lowerMessage.includes('rows') ||
      lowerMessage.includes('data table') ||
      lowerMessage.includes('user list')
    ) {
      return {
        type: 'table',
        description: 'Table for displaying structured data',
        confidence: 0.8,
      };
    }

    // Chart intent
    if (
      lowerMessage.includes('chart') ||
      lowerMessage.includes('graph') ||
      lowerMessage.includes('visualization') ||
      lowerMessage.includes('data viz') ||
      lowerMessage.includes('bar chart') ||
      lowerMessage.includes('line chart') ||
      lowerMessage.includes('pie chart')
    ) {
      return {
        type: 'chart',
        description: 'Chart for data visualization',
        confidence: 0.8,
      };
    }

    // Gallery intent
    if (
      lowerMessage.includes('gallery') ||
      lowerMessage.includes('images') ||
      lowerMessage.includes('showcase') ||
      lowerMessage.includes('portfolio') ||
      lowerMessage.includes('photo') ||
      lowerMessage.includes('image grid')
    ) {
      return {
        type: 'gallery',
        description: 'Gallery for displaying images or media',
        confidence: 0.8,
      };
    }

    // Custom/unknown UI
    if (lowerMessage.includes('page') || lowerMessage.includes('interface') || lowerMessage.includes('ui')) {
      return {
        type: 'custom',
        description: message,
        confidence: 0.5,
      };
    }

    return undefined;
  }

  /**
   * Extract UI elements and requirements from message
   */
  static extractUIElements(message: string): DetectedEntity[] {
    const entities: DetectedEntity[] = [];
    const lowerMessage = message.toLowerCase();

    // UI Components
    const uiComponents = [
      'button',
      'input',
      'textarea',
      'select',
      'checkbox',
      'radio',
      'dropdown',
      'modal',
      'card',
      'alert',
      'badge',
      'tooltip',
      'tabs',
      'accordion',
    ];
    for (const component of uiComponents) {
      if (lowerMessage.includes(component)) {
        entities.push({
          type: 'ui_component',
          value: component,
        });
      }
    }

    // Form Fields
    const formFields = [
      'name',
      'email',
      'password',
      'phone',
      'address',
      'message',
      'subject',
      'date',
      'time',
      'file',
      'image',
      'username',
    ];
    for (const field of formFields) {
      if (lowerMessage.includes(field)) {
        entities.push({
          type: 'form_field',
          value: field,
        });
      }
    }

    // Layout Patterns
    if (lowerMessage.includes('grid') || lowerMessage.includes('columns')) {
      entities.push({
        type: 'layout_pattern',
        value: 'grid',
      });
    }
    if (lowerMessage.includes('sidebar')) {
      entities.push({
        type: 'layout_pattern',
        value: 'sidebar',
      });
    }
    if (lowerMessage.includes('header') || lowerMessage.includes('navbar')) {
      entities.push({
        type: 'layout_pattern',
        value: 'header',
      });
    }
    if (lowerMessage.includes('footer')) {
      entities.push({
        type: 'layout_pattern',
        value: 'footer',
      });
    }

    // Styling Preferences
    if (lowerMessage.includes('dark mode') || lowerMessage.includes('dark theme')) {
      entities.push({
        type: 'styling_preference',
        value: 'dark-mode',
      });
    }
    if (lowerMessage.includes('responsive') || lowerMessage.includes('mobile')) {
      entities.push({
        type: 'styling_preference',
        value: 'responsive',
      });
    }
    if (lowerMessage.includes('tailwind')) {
      entities.push({
        type: 'styling_preference',
        value: 'tailwind',
      });
    }

    // Data Sources (for placeholders)
    if (lowerMessage.includes('user') || lowerMessage.includes('profile')) {
      entities.push({
        type: 'data_source',
        value: 'user',
      });
    }
    if (lowerMessage.includes('product') || lowerMessage.includes('item')) {
      entities.push({
        type: 'data_source',
        value: 'product',
      });
    }
    if (lowerMessage.includes('metric') || lowerMessage.includes('stat')) {
      entities.push({
        type: 'data_source',
        value: 'metrics',
      });
    }

    return entities;
  }

  /**
   * Infer required UI capabilities from intent and entities
   */
  static inferUICapabilities(
    intent: UserIntent | undefined,
    entities: DetectedEntity[]
  ): Capability[] {
    const capabilities: Capability[] = [];
    const capabilityMap: Record<string, Capability> = {};

    // Add capability helper
    const addCapability = (id: string, name: string, type: Capability['type']) => {
      if (!capabilityMap[id]) {
        capabilityMap[id] = {
          id,
          name,
          type,
          implemented: false,
        };
      }
    };

    // Interactive capability from intent
    if (intent?.type === 'form') {
      addCapability('interactive', 'Interactive Form', 'interactive');
      addCapability('tool-actions', 'Form Submission', 'tool_actions');
    }

    // Display-only capability
    if (intent?.type === 'dashboard' || intent?.type === 'table' || intent?.type === 'gallery') {
      addCapability('display-only', 'Display Data', 'display_only');
    }

    // Agent context capability from data sources
    const hasDataSources = entities.some((e) => e.type === 'data_source');
    if (hasDataSources) {
      addCapability('agent-context', 'Dynamic Placeholders', 'agent_context');
    }

    // Interactive elements detection
    const interactiveElements = entities.filter(
      (e) => e.type === 'ui_component' && ['button', 'input', 'select', 'checkbox'].includes(e.value)
    );
    if (interactiveElements.length > 0 && intent?.type !== 'form') {
      addCapability('interactive', 'Interactive Elements', 'interactive');
    }

    // Tool actions capability for buttons and forms
    const hasActionableElements = entities.some(
      (e) => e.type === 'ui_component' && ['button', 'form'].includes(e.value)
    );
    if (hasActionableElements) {
      addCapability('tool-actions', 'Tool Integration', 'tool_actions');
    }

    return Object.values(capabilityMap);
  }

  /**
   * Detect if user wants to add agent placeholders
   */
  static detectPlaceholderRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('placeholder') ||
      lowerMessage.includes('dynamic') ||
      lowerMessage.includes('agent') ||
      lowerMessage.includes('fill in') ||
      lowerMessage.includes('populate')
    );
  }

  /**
   * Detect if user wants to add action mappings
   */
  static detectActionMappingRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('action') ||
      lowerMessage.includes('submit') ||
      lowerMessage.includes('click') ||
      lowerMessage.includes('tool') ||
      lowerMessage.includes('map')
    );
  }

  /**
   * Detect deployment readiness request
   */
  static detectDeploymentRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('deploy') ||
      lowerMessage.includes('test') ||
      lowerMessage.includes('ready') ||
      lowerMessage.includes('done') ||
      lowerMessage.includes('finish')
    );
  }
}
