/**
 * HTML Parser Utilities
 * Extracts template placeholders and interactive elements from HTML content
 */

import type { InteractiveElement, FormField } from '@/types/ui-builder';

/**
 * Extract template placeholders from HTML content
 * Finds patterns like {{agent.name}}, {{context.data}}, etc.
 * @param htmlContent - HTML string to parse
 * @returns Array of unique placeholder names (without {{}})
 */
export function extractTemplatePlaceholders(htmlContent: string): string[] {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const placeholders = new Set<string>();

  let match;
  while ((match = placeholderRegex.exec(htmlContent)) !== null) {
    placeholders.add(match[1].trim());
  }

  return Array.from(placeholders);
}

/**
 * Check if HTML content has template placeholders
 * @param htmlContent - HTML string to check
 * @returns true if HTML contains any {{...}} patterns
 */
export function hasTemplatePlaceholders(htmlContent: string): boolean {
  return /\{\{[^}]+\}\}/.test(htmlContent);
}

/**
 * Parse HTML and extract interactive elements
 * Finds buttons, forms, inputs, selects, textareas, and elements with data-action attribute
 * @param htmlContent - HTML string to parse
 * @returns Array of interactive elements that can trigger actions
 */
export function parseHTMLForInteractiveElements(htmlContent: string): InteractiveElement[] {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return [];
  }

  const elements: InteractiveElement[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Counter for auto-generating IDs
  let autoIdCounter = 1;
  // Track used IDs to ensure uniqueness
  const usedIds = new Set<string>();

  // Helper to get or generate ID
  const getElementId = (el: Element): string => {
    let id = el.id || el.getAttribute('name') || el.getAttribute('data-action-id') || '';

    // If no ID found, auto-generate one
    if (!id) {
      id = `auto-${el.tagName.toLowerCase()}-${autoIdCounter++}`;
    }

    // Ensure uniqueness by appending suffix if needed
    let uniqueId = id;
    let counter = 2;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }

    usedIds.add(uniqueId);
    return uniqueId;
  };

  // Helper to extract text content
  const getElementText = (el: Element): string => {
    return el.textContent?.trim().substring(0, 50) || '';
  };

  // Helper to parse form fields
  const parseFormFields = (form: HTMLFormElement): FormField[] => {
    const fields: FormField[] = [];
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      const id = getElementId(input);
      const name = input.getAttribute('name') || id;
      const type = input.getAttribute('type') || input.tagName.toLowerCase();
      const required = input.hasAttribute('required');

      fields.push({ id, name, type, required });
    });

    return fields;
  };

  // Find all buttons
  doc.querySelectorAll('button').forEach(button => {
    const id = getElementId(button);
    const text = getElementText(button);

    elements.push({
      id,
      type: 'button',
      tagName: 'button',
      text,
    });
  });

  // Find all forms
  doc.querySelectorAll('form').forEach(form => {
    const id = getElementId(form);
    const formFields = parseFormFields(form as HTMLFormElement);

    elements.push({
      id,
      type: 'form',
      tagName: 'form',
      formFields,
    });
  });

  // Find standalone inputs
  doc.querySelectorAll('input:not(form input)').forEach(input => {
    const id = getElementId(input);
    const type = input.getAttribute('type') || 'text';

    elements.push({
      id,
      type: 'input',
      tagName: 'input',
      text: `Input (${type})`,
    });
  });

  // Find standalone selects
  doc.querySelectorAll('select:not(form select)').forEach(select => {
    const id = getElementId(select);

    elements.push({
      id,
      type: 'select',
      tagName: 'select',
      text: 'Dropdown',
    });
  });

  // Find standalone textareas
  doc.querySelectorAll('textarea:not(form textarea)').forEach(textarea => {
    const id = getElementId(textarea);

    elements.push({
      id,
      type: 'textarea',
      tagName: 'textarea',
      text: 'Text area',
    });
  });

  // Find elements with data-action attribute
  doc.querySelectorAll('[data-action]').forEach(el => {
    // Skip if already added as button/form/etc
    const id = getElementId(el);
    if (elements.some(e => e.id === id)) return;

    const text = getElementText(el);

    elements.push({
      id,
      type: 'custom',
      tagName: el.tagName.toLowerCase(),
      text,
    });
  });

  return elements;
}

/**
 * Validate that an element ID exists in HTML
 * @param htmlContent - HTML string to check
 * @param elementId - Element ID to find
 * @returns true if element exists
 */
export function validateElementId(htmlContent: string, elementId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Check by ID
  if (doc.getElementById(elementId)) return true;

  // Check by name attribute
  if (doc.querySelector(`[name="${elementId}"]`)) return true;

  // Check by data-action-id
  if (doc.querySelector(`[data-action-id="${elementId}"]`)) return true;

  return false;
}
