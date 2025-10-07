/**
 * Intelligent HTML Analyzer
 *
 * Analyzes HTML to automatically detect:
 * - What backend tools are needed
 * - What those tools should actually DO (not just stubs)
 * - How UI elements should map to tools
 */

import { parseHTMLForInteractiveElements, type InteractiveElement } from './html-parser';
import type { CustomTool, ToolParameter, ActionMapping } from '@/types/ui-builder';
import { generateId } from './utils';

export interface ToolInference {
  toolName: string;
  description: string;
  purpose: string; // What the tool actually does
  implementationType: 'database' | 'api-call' | 'email' | 'file-operation' | 'calculation' | 'custom';
  parameters: ToolParameter[];
  suggestedImplementation: string; // Hints for AI code generation
  confidence: number; // 0-1
  relatedElements: string[]; // UI element IDs this tool serves
}

export interface AnalysisResult {
  inferredTools: ToolInference[];
  suggestedMappings: ActionMapping[];
  warnings: string[];
  insights: string[]; // Human-readable explanations
}

/**
 * Analyze HTML content to infer required tools and their implementations
 */
export function analyzeHTMLForTools(htmlContent: string): AnalysisResult {
  const elements = parseHTMLForInteractiveElements(htmlContent);
  const inferredTools: ToolInference[] = [];
  const warnings: string[] = [];
  const insights: string[] = [];

  // Analyze forms
  const forms = elements.filter(el => el.type === 'form');
  forms.forEach(form => {
    const toolInference = analyzeForm(form, htmlContent);
    if (toolInference) {
      inferredTools.push(toolInference);
      insights.push(`Detected form "${form.id}" - needs backend submission handler`);
    }
  });

  // Analyze standalone buttons
  const buttons = elements.filter(el => el.type === 'button' && !isPartOfForm(el, forms));
  buttons.forEach(button => {
    const toolInference = analyzeButton(button, htmlContent);
    if (toolInference) {
      inferredTools.push(toolInference);
      insights.push(`Detected action button "${button.id}" - needs backend handler`);
    }
  });

  // Detect data display elements (tables, charts, dashboards)
  const dataDisplays = detectDataDisplays(htmlContent);
  dataDisplays.forEach(display => {
    const toolInference = analyzeDataDisplay(display);
    if (toolInference) {
      inferredTools.push(toolInference);
      insights.push(`Detected ${display.type} - needs data fetching logic`);
    }
  });

  // Generate suggested mappings
  const suggestedMappings = generateAutoMappings(elements, inferredTools);

  // Add warnings for complex cases
  if (inferredTools.length === 0 && elements.length > 0) {
    warnings.push('Interactive elements detected but could not infer tool requirements. Manual configuration may be needed.');
  }

  return {
    inferredTools,
    suggestedMappings,
    warnings,
    insights,
  };
}

/**
 * Analyze a form to infer the submission tool needed
 */
function analyzeForm(form: InteractiveElement, htmlContent: string): ToolInference | null {
  if (!form.formFields || form.formFields.length === 0) {
    return null;
  }

  const formId = form.id;
  const fields = form.formFields;

  // Infer purpose from form fields and ID
  const purpose = inferFormPurpose(formId, fields);
  const implementationType = inferFormImplementationType(formId, fields);

  // Convert form fields to tool parameters
  const parameters: ToolParameter[] = fields.map(field => ({
    name: field.name || field.id,
    type: mapHTMLTypeToToolType(field.type),
    description: `Value from ${field.name || field.id} field`,
    required: field.required,
  }));

  // Generate implementation hints
  const suggestedImplementation = generateFormImplementationHint(purpose, implementationType, fields);

  return {
    toolName: `submit_${formId}`,
    description: `Handle ${formId} form submission`,
    purpose,
    implementationType,
    parameters,
    suggestedImplementation,
    confidence: 0.9,
    relatedElements: [formId],
  };
}

/**
 * Analyze a button to infer its backend action
 */
function analyzeButton(button: InteractiveElement, htmlContent: string): ToolInference | null {
  const buttonId = button.id;
  const buttonText = button.text || '';

  // Infer action from button ID and text
  const purpose = inferButtonPurpose(buttonId, buttonText);
  const implementationType = inferButtonImplementationType(buttonId, buttonText);

  if (!purpose) {
    return null; // Can't infer purpose
  }

  // Buttons typically have simple parameters
  const parameters: ToolParameter[] = [{
    name: 'context',
    type: 'object',
    description: 'Context data from the UI',
    required: false,
  }];

  const suggestedImplementation = generateButtonImplementationHint(purpose, implementationType);

  return {
    toolName: `handle_${buttonId}`,
    description: `Handle ${buttonId} button action`,
    purpose,
    implementationType,
    parameters,
    suggestedImplementation,
    confidence: 0.7,
    relatedElements: [buttonId],
  };
}

/**
 * Detect data display elements (tables, charts, etc.)
 */
interface DataDisplay {
  type: 'table' | 'chart' | 'dashboard' | 'list';
  id: string;
  attributes: Record<string, string>;
}

function detectDataDisplays(htmlContent: string): DataDisplay[] {
  const displays: DataDisplay[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Detect tables
  const tables = doc.querySelectorAll('table[id]');
  tables.forEach(table => {
    displays.push({
      type: 'table',
      id: table.id,
      attributes: Array.from(table.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {} as Record<string, string>),
    });
  });

  // Detect elements with data-* attributes suggesting data binding
  const dataElements = doc.querySelectorAll('[data-source], [data-fetch], [data-endpoint]');
  dataElements.forEach(el => {
    if (el.id) {
      displays.push({
        type: 'dashboard',
        id: el.id,
        attributes: Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {} as Record<string, string>),
      });
    }
  });

  return displays;
}

/**
 * Analyze a data display element
 */
function analyzeDataDisplay(display: DataDisplay): ToolInference | null {
  const { type, id, attributes } = display;

  // Infer what data this display needs
  const dataType = inferDataType(id, attributes);
  const fetchParams = inferFetchParameters(id, attributes);

  return {
    toolName: `fetch_${id}_data`,
    description: `Fetch data for ${type}: ${id}`,
    purpose: `Retrieve ${dataType} data for display in ${type}`,
    implementationType: 'database',
    parameters: fetchParams,
    suggestedImplementation: `Query database for ${dataType} and return as JSON array/object`,
    confidence: 0.8,
    relatedElements: [id],
  };
}

/**
 * Generate automatic action mappings based on inferred tools
 */
function generateAutoMappings(
  elements: InteractiveElement[],
  tools: ToolInference[]
): ActionMapping[] {
  const mappings: ActionMapping[] = [];

  tools.forEach(tool => {
    tool.relatedElements.forEach(elementId => {
      const element = elements.find(el => el.id === elementId);
      if (element) {
        // Auto-generate parameter sources based on element type
        const parameterSources = generateParameterSources(element, tool);

        mappings.push({
          id: generateId(),
          uiElementId: elementId,
          uiElementType: element.type,
          toolName: tool.toolName,
          serverName: 'custom',
          parameterBindings: {}, // Legacy
          parameterSources,
          responseHandler: 'show-notification',
        });
      }
    });
  });

  return mappings;
}

/**
 * Auto-generate parameter sources for a mapping
 */
function generateParameterSources(
  element: InteractiveElement,
  tool: ToolInference
): Record<string, { sourceType: 'static' | 'form' | 'agent' | 'tool'; sourceValue: string }> {
  const sources: Record<string, { sourceType: 'static' | 'form' | 'agent' | 'tool'; sourceValue: string }> = {};

  if (element.type === 'form' && element.formFields) {
    // Map form fields to tool parameters
    element.formFields.forEach(field => {
      const paramName = field.name || field.id;
      sources[paramName] = {
        sourceType: 'form',
        sourceValue: field.id,
      };
    });
  } else if (element.type === 'button') {
    // For buttons, use static or agent context
    tool.parameters.forEach(param => {
      if (param.name === 'context') {
        sources[param.name] = {
          sourceType: 'static',
          sourceValue: '{}',
        };
      }
    });
  }

  return sources;
}

// ====== Helper Functions ======

function isPartOfForm(element: InteractiveElement, forms: InteractiveElement[]): boolean {
  // Simple heuristic: buttons with IDs containing form IDs
  return forms.some(form => element.id.includes(form.id));
}

function mapHTMLTypeToToolType(htmlType: string): ToolParameter['type'] {
  const typeMap: Record<string, ToolParameter['type']> = {
    'text': 'string',
    'email': 'string',
    'password': 'string',
    'tel': 'string',
    'url': 'string',
    'number': 'number',
    'range': 'number',
    'checkbox': 'boolean',
    'radio': 'string',
    'select': 'string',
    'textarea': 'string',
    'file': 'string', // File path/URL
  };
  return typeMap[htmlType] || 'string';
}

function inferFormPurpose(formId: string, fields: any[]): string {
  const id = formId.toLowerCase();

  if (id.includes('contact') || id.includes('inquiry')) {
    return 'Save contact form submission and send notification email';
  }
  if (id.includes('signup') || id.includes('register')) {
    return 'Create new user account in database';
  }
  if (id.includes('login') || id.includes('signin')) {
    return 'Authenticate user credentials';
  }
  if (id.includes('feedback') || id.includes('review')) {
    return 'Save feedback to database';
  }
  if (id.includes('search')) {
    return 'Query database for matching records';
  }
  if (id.includes('order') || id.includes('purchase')) {
    return 'Process order and update inventory';
  }

  // Generic fallback
  return `Save ${formId} data to database`;
}

function inferFormImplementationType(
  formId: string,
  fields: any[]
): 'database' | 'api-call' | 'email' | 'file-operation' | 'calculation' | 'custom' {
  const id = formId.toLowerCase();

  if (id.includes('contact') || id.includes('inquiry')) {
    return 'email'; // Contact forms typically send emails
  }
  if (id.includes('search')) {
    return 'database'; // Search queries database
  }

  return 'database'; // Default to database save
}

function generateFormImplementationHint(
  purpose: string,
  type: string,
  fields: any[]
): string {
  const fieldNames = fields.map(f => f.name || f.id).join(', ');

  if (type === 'email') {
    return `Send email with form data (${fieldNames}) using SMTP or email API. Also save to database for records.`;
  }
  if (type === 'database') {
    return `Insert record into database table with fields: ${fieldNames}. Validate input and return success/error response.`;
  }

  return `Process form data: ${fieldNames}. ${purpose}`;
}

function inferButtonPurpose(buttonId: string, buttonText: string): string | null {
  const combined = `${buttonId} ${buttonText}`.toLowerCase();

  if (combined.includes('delete') || combined.includes('remove')) {
    return 'Delete record from database';
  }
  if (combined.includes('save') || combined.includes('update')) {
    return 'Update record in database';
  }
  if (combined.includes('refresh') || combined.includes('reload')) {
    return 'Refresh data from database';
  }
  if (combined.includes('export') || combined.includes('download')) {
    return 'Export data to file';
  }
  if (combined.includes('send') || combined.includes('submit')) {
    return 'Submit data to server';
  }

  return null; // Can't infer
}

function inferButtonImplementationType(
  buttonId: string,
  buttonText: string
): 'database' | 'api-call' | 'email' | 'file-operation' | 'calculation' | 'custom' {
  const combined = `${buttonId} ${buttonText}`.toLowerCase();

  if (combined.includes('delete') || combined.includes('save') || combined.includes('update')) {
    return 'database';
  }
  if (combined.includes('export') || combined.includes('download')) {
    return 'file-operation';
  }
  if (combined.includes('send')) {
    return 'api-call';
  }

  return 'custom';
}

function generateButtonImplementationHint(purpose: string, type: string): string {
  return `${purpose}. Implementation type: ${type}`;
}

function inferDataType(id: string, attributes: Record<string, string>): string {
  const combined = `${id} ${JSON.stringify(attributes)}`.toLowerCase();

  if (combined.includes('user') || combined.includes('profile')) return 'user profiles';
  if (combined.includes('product') || combined.includes('item')) return 'products';
  if (combined.includes('order')) return 'orders';
  if (combined.includes('message') || combined.includes('comment')) return 'messages';
  if (combined.includes('metric') || combined.includes('stat')) return 'metrics';

  return 'records';
}

function inferFetchParameters(id: string, attributes: Record<string, string>): ToolParameter[] {
  // Common fetch parameters
  return [
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of records to return',
      required: false,
    },
    {
      name: 'offset',
      type: 'number',
      description: 'Number of records to skip',
      required: false,
    },
    {
      name: 'filter',
      type: 'object',
      description: 'Filter criteria',
      required: false,
    },
  ];
}
