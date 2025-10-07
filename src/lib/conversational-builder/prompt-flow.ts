/**
 * Progressive Prompt Flow Engine
 * Manages guided conversation flows for building UI components
 */

import { UITemplate, uiTemplates, UICategory } from '@/lib/ui-templates';

export type PromptFlowStage = 'category' | 'template' | 'customization';

export interface PromptFlow {
  id: string;
  stage: PromptFlowStage;
  category?: UICategory;
  templateId?: string;
  followUpPrompts: PromptButton[];
}

export interface PromptButton {
  id: string;
  label: string;
  category?: UICategory;
  templateId?: string;
  description?: string;
}

/**
 * Initial category prompts shown when conversation is empty
 */
export const INITIAL_CATEGORY_PROMPTS: PromptButton[] = [
  {
    id: 'forms',
    label: '📝 Create a Form',
    category: 'forms',
    description: 'Contact forms, signup forms, surveys, and more',
  },
  {
    id: 'dashboards',
    label: '📊 Build a Dashboard',
    category: 'dashboards',
    description: 'Analytics, metrics, charts, and data visualization',
  },
  {
    id: 'tables',
    label: '📋 Design a Table',
    category: 'tables',
    description: 'Data tables, lists, grids with sorting and filtering',
  },
  {
    id: 'charts',
    label: '📈 Add Charts',
    category: 'charts',
    description: 'Bar charts, line graphs, pie charts, and more',
  },
  {
    id: 'galleries',
    label: '🖼️ Create a Gallery',
    category: 'galleries',
    description: 'Image galleries, product showcases, portfolios',
  },
  {
    id: 'custom',
    label: '✨ Custom Component',
    category: 'custom',
    description: 'Tell me what you need and I\'ll help build it',
  },
];

/**
 * Get template prompts for a specific category
 */
export function getTemplatePrompts(category: UICategory): PromptButton[] {
  const templates = uiTemplates.filter(t => t.category === category);

  return templates.map(template => ({
    id: `template-${template.id}`,
    label: template.name,
    templateId: template.id,
    description: template.description,
  }));
}

/**
 * Get customization prompts for a specific template
 */
export function getCustomizationPrompts(templateId: string): PromptButton[] {
  const template = uiTemplates.find(t => t.id === templateId);
  if (!template) return [];

  const prompts: PromptButton[] = [];

  // Category-specific customization prompts
  switch (template.category) {
    case 'forms':
      prompts.push(
        { id: 'add-fields', label: 'Add more fields', description: 'Add phone, address, or custom fields' },
        { id: 'change-colors', label: 'Change button colors', description: 'Customize the color scheme' },
        { id: 'add-validation', label: 'Add validation', description: 'Add input validation rules' },
        { id: 'change-layout', label: 'Change layout', description: 'Make it multi-column or wider' }
      );
      break;

    case 'dashboards':
      prompts.push(
        { id: 'add-charts', label: 'Add charts', description: 'Add bar charts, line graphs, or pie charts' },
        { id: 'show-metrics', label: 'Show more metrics', description: 'Add KPIs and statistics' },
        { id: 'add-filters', label: 'Add filters', description: 'Add date range or category filters' },
        { id: 'customize-cards', label: 'Customize cards', description: 'Change card layout and styling' }
      );
      break;

    case 'tables':
      prompts.push(
        { id: 'add-columns', label: 'Add more columns', description: 'Add additional data columns' },
        { id: 'add-sorting', label: 'Add sorting', description: 'Enable column sorting' },
        { id: 'add-pagination', label: 'Add pagination', description: 'Add page navigation' },
        { id: 'add-search', label: 'Add search', description: 'Add search/filter functionality' }
      );
      break;

    case 'charts':
      prompts.push(
        { id: 'change-type', label: 'Change chart type', description: 'Switch between bar, line, pie, etc.' },
        { id: 'add-labels', label: 'Customize labels', description: 'Change axis labels and titles' },
        { id: 'change-colors', label: 'Change colors', description: 'Customize color palette' },
        { id: 'add-legend', label: 'Add legend', description: 'Show data legend' }
      );
      break;

    case 'galleries':
      prompts.push(
        { id: 'change-grid', label: 'Change grid layout', description: 'Adjust columns and spacing' },
        { id: 'add-captions', label: 'Add captions', description: 'Show titles and descriptions' },
        { id: 'add-lightbox', label: 'Add lightbox', description: 'Enable image zoom/preview' },
        { id: 'add-filters', label: 'Add category filters', description: 'Filter by category or tags' }
      );
      break;

    case 'custom':
      prompts.push(
        { id: 'add-sections', label: 'Add more sections', description: 'Add new content sections' },
        { id: 'change-style', label: 'Change styling', description: 'Customize colors and fonts' },
        { id: 'add-interactivity', label: 'Make it interactive', description: 'Add buttons and actions' },
        { id: 'responsive', label: 'Make it responsive', description: 'Optimize for mobile devices' }
      );
      break;
  }

  // Common prompts for all templates
  prompts.push(
    { id: 'add-placeholders', label: 'Add dynamic data', description: 'Use {{placeholders}} for agent context' },
    { id: 'deploy', label: 'Deploy & test', description: 'Ready to test in chat!' }
  );

  return prompts;
}

/**
 * Create a prompt flow from a category selection
 */
export function createFlowFromCategory(category: UICategory): PromptFlow {
  return {
    id: `flow-${category}-${Date.now()}`,
    stage: 'template',
    category,
    followUpPrompts: getTemplatePrompts(category),
  };
}

/**
 * Create a prompt flow from a template selection
 */
export function createFlowFromTemplate(templateId: string): PromptFlow {
  const template = uiTemplates.find(t => t.id === templateId);

  return {
    id: `flow-${templateId}-${Date.now()}`,
    stage: 'customization',
    category: template?.category,
    templateId,
    followUpPrompts: getCustomizationPrompts(templateId),
  };
}

/**
 * Convert a prompt button click to a natural language message
 */
export function promptToMessage(prompt: PromptButton, stage: PromptFlowStage): string {
  switch (stage) {
    case 'category':
      if (prompt.category === 'custom') {
        return 'I want to create a custom component. Can you help me?';
      }
      return `I want to create a ${prompt.category === 'forms' ? 'form' : prompt.category === 'dashboards' ? 'dashboard' : prompt.category === 'tables' ? 'table' : prompt.category === 'charts' ? 'chart' : 'gallery'}.`;

    case 'template':
      return `Use the "${prompt.label}" template.`;

    case 'customization':
      // Convert customization prompt to natural language
      const customizationMessages: Record<string, string> = {
        'add-fields': 'Can you add more fields to this form?',
        'change-colors': 'Let\'s change the button colors.',
        'add-validation': 'Add validation to the form fields.',
        'change-layout': 'Can you make it wider with multiple columns?',
        'add-charts': 'Add some charts to show the data.',
        'show-metrics': 'Show more metrics and statistics.',
        'add-filters': 'Add date range and category filters.',
        'customize-cards': 'Let\'s customize the card layout.',
        'add-columns': 'Add more data columns to the table.',
        'add-sorting': 'Enable sorting on the columns.',
        'add-pagination': 'Add pagination to the table.',
        'add-search': 'Add a search box to filter results.',
        'change-type': 'Can we try a different chart type?',
        'add-labels': 'Customize the axis labels and titles.',
        'add-legend': 'Add a legend to explain the data.',
        'change-grid': 'Adjust the grid layout with more columns.',
        'add-captions': 'Add titles and captions to the images.',
        'add-lightbox': 'Enable click-to-zoom on images.',
        'add-sections': 'Add more content sections.',
        'change-style': 'Let\'s change the colors and styling.',
        'add-interactivity': 'Make this more interactive with buttons.',
        'responsive': 'Optimize this for mobile devices.',
        'add-placeholders': 'Add some dynamic data placeholders for the AI agent.',
        'deploy': 'This looks great! I\'m ready to deploy and test it.',
      };

      return customizationMessages[prompt.id] || prompt.label;

    default:
      return prompt.label;
  }
}

/**
 * Detect if a user message is selecting a template
 */
export function detectTemplateSelection(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  for (const template of uiTemplates) {
    if (lowerMessage.includes(template.name.toLowerCase()) ||
        lowerMessage.includes(template.id)) {
      return template.id;
    }
  }

  return null;
}

/**
 * Detect if a user message is requesting deployment
 */
export function detectDeploymentIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const deployKeywords = ['deploy', 'test', 'ready', 'done', 'finish', 'complete'];

  return deployKeywords.some(keyword => lowerMessage.includes(keyword));
}
