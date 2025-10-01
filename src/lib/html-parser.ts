/**
 * HTML Parser for MCP-UI Builder
 *
 * Parses HTML content to detect interactive elements that can be mapped to MCP tools.
 * Uses native browser DOMParser for client-side parsing.
 */

export interface InteractiveElement {
  id: string;
  type: 'button' | 'form' | 'link' | 'input' | 'select' | 'textarea' | 'custom';
  tagName: string;
  attributes: Record<string, string>;
  text?: string;
  formFields?: FormField[];
}

export interface FormField {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

/**
 * Parse HTML content and extract interactive elements
 */
export function parseHTMLForInteractiveElements(htmlContent: string): InteractiveElement[] {
  if (typeof window === 'undefined') {
    // Server-side: return empty array
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    console.error('HTML parsing error:', parserError.textContent);
    return [];
  }

  const elements: InteractiveElement[] = [];

  // Find all interactive elements
  const interactiveSelectors = [
    'button',
    'a[href]',
    'form',
    'input[type="button"]',
    'input[type="submit"]',
    '[data-action]',
  ];

  const nodes = doc.querySelectorAll(interactiveSelectors.join(', '));

  nodes.forEach((node, index) => {
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    // Generate ID if not present
    let elementId = element.id || element.getAttribute('data-action-id') || '';
    if (!elementId) {
      // Try to use name attribute
      elementId = element.getAttribute('name') || '';
    }
    if (!elementId) {
      // Generate from tag and index
      elementId = `${tagName}-${index}`;
    }

    // Extract attributes
    const attributes: Record<string, string> = {};
    Array.from(element.attributes).forEach(attr => {
      attributes[attr.name] = attr.value;
    });

    // Determine element type
    let type: InteractiveElement['type'] = 'custom';
    if (tagName === 'button' || (tagName === 'input' && (element.getAttribute('type') === 'button' || element.getAttribute('type') === 'submit'))) {
      type = 'button';
    } else if (tagName === 'form') {
      type = 'form';
    } else if (tagName === 'a') {
      type = 'link';
    } else if (tagName === 'input') {
      type = 'input';
    } else if (tagName === 'select') {
      type = 'select';
    } else if (tagName === 'textarea') {
      type = 'textarea';
    } else if (element.hasAttribute('data-action')) {
      type = 'custom';
    }

    // Get text content
    const text = element.textContent?.trim() || '';

    // Special handling for forms
    let formFields: FormField[] | undefined;
    if (type === 'form') {
      formFields = extractFormFields(element as HTMLFormElement);
    }

    elements.push({
      id: elementId,
      type,
      tagName,
      attributes,
      text: text || undefined,
      formFields,
    });
  });

  return elements;
}

/**
 * Extract form fields from a form element
 */
function extractFormFields(form: HTMLFormElement): FormField[] {
  const fields: FormField[] = [];
  const formElements = form.querySelectorAll('input, select, textarea');

  formElements.forEach((element) => {
    const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const id = input.id || input.name || '';
    const name = input.name || input.id || '';
    const type = input.getAttribute('type') || input.tagName.toLowerCase();
    const required = input.hasAttribute('required');

    if (id || name) {
      fields.push({
        id,
        name,
        type,
        required,
      });
    }
  });

  return fields;
}

/**
 * Validate element ID exists in HTML
 */
export function validateElementId(htmlContent: string, elementId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Check by ID
  const byId = doc.getElementById(elementId);
  if (byId) return true;

  // Check by data-action-id
  const byDataId = doc.querySelector(`[data-action-id="${elementId}"]`);
  if (byDataId) return true;

  // Check by name
  const byName = doc.querySelector(`[name="${elementId}"]`);
  if (byName) return true;

  return false;
}

/**
 * Get element type from HTML
 */
export function getElementType(htmlContent: string, elementId: string): InteractiveElement['type'] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  let element = doc.getElementById(elementId);
  if (!element) {
    element = doc.querySelector(`[data-action-id="${elementId}"]`) as HTMLElement;
  }
  if (!element) {
    element = doc.querySelector(`[name="${elementId}"]`) as HTMLElement;
  }

  if (!element) return null;

  const tagName = element.tagName.toLowerCase();

  if (tagName === 'button' || (tagName === 'input' && (element.getAttribute('type') === 'button' || element.getAttribute('type') === 'submit'))) {
    return 'button';
  } else if (tagName === 'form') {
    return 'form';
  } else if (tagName === 'a') {
    return 'link';
  } else if (tagName === 'input') {
    return 'input';
  } else if (tagName === 'select') {
    return 'select';
  } else if (tagName === 'textarea') {
    return 'textarea';
  } else if (element.hasAttribute('data-action')) {
    return 'custom';
  }

  return 'custom';
}
