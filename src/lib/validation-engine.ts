/**
 * Validation Engine for MCP-UI Builder
 *
 * Validates action mappings against tool schemas and HTML content.
 * Provides type checking and completeness validation.
 */

import type { ActionMapping, ValidationStatus, TypeMismatch, MCPTool } from '@/types/ui-builder';
import { parseHTMLForInteractiveElements, validateElementId } from './html-parser';

/**
 * JSON Schema type to TypeScript type mapping
 */
const JSON_SCHEMA_TO_TS_TYPE: Record<string, string> = {
  string: 'string',
  number: 'number',
  integer: 'number',
  boolean: 'boolean',
  array: 'array',
  object: 'object',
  null: 'null',
};

/**
 * HTML input type to TypeScript type mapping
 */
const HTML_INPUT_TO_TS_TYPE: Record<string, string> = {
  text: 'string',
  email: 'string',
  url: 'string',
  tel: 'string',
  password: 'string',
  search: 'string',
  textarea: 'string',
  number: 'number',
  range: 'number',
  checkbox: 'boolean',
  radio: 'string',
  select: 'string',
  'select-multiple': 'array',
  date: 'string',
  time: 'string',
  'datetime-local': 'string',
  month: 'string',
  week: 'string',
  color: 'string',
  file: 'string',
};

/**
 * Validate all action mappings
 */
export function validateActionMappings(
  mappings: ActionMapping[],
  htmlContent: string,
  availableTools: MCPTool[]
): ValidationStatus {
  const missingMappings: string[] = [];
  const typeMismatches: TypeMismatch[] = [];
  const warnings: string[] = [];

  // Get all interactive elements from HTML
  const interactiveElements = parseHTMLForInteractiveElements(htmlContent);

  // Check for unmapped interactive elements
  const mappedElementIds = new Set(mappings.map(m => m.uiElementId));
  interactiveElements.forEach(element => {
    if (!mappedElementIds.has(element.id)) {
      warnings.push(`Interactive element "${element.id}" (${element.type}) is not mapped to any tool`);
    }
  });

  // Validate each mapping
  mappings.forEach(mapping => {
    // Check if element exists in HTML
    if (!validateElementId(htmlContent, mapping.uiElementId)) {
      missingMappings.push(`Element "${mapping.uiElementId}" not found in HTML`);
      return;
    }

    // Find the tool
    const tool = availableTools.find(
      t => t.name === mapping.toolName && t.serverName === mapping.serverName
    );

    if (!tool) {
      missingMappings.push(`Tool "${mapping.toolName}" from server "${mapping.serverName}" not found`);
      return;
    }

    // Validate parameter bindings
    if (tool.inputSchema) {
      const schema = tool.inputSchema as {
        type?: string;
        properties?: Record<string, { type?: string; required?: boolean }>;
        required?: string[];
      };

      // Check required parameters
      const requiredParams = schema.required || [];
      requiredParams.forEach(paramName => {
        if (!mapping.parameterBindings[paramName]) {
          missingMappings.push(
            `Required parameter "${paramName}" not mapped for element "${mapping.uiElementId}"`
          );
        }
      });

      // Check parameter types
      if (schema.properties) {
        Object.entries(mapping.parameterBindings).forEach(([paramName, htmlFieldId]) => {
          const paramSchema = schema.properties?.[paramName];
          if (!paramSchema) {
            warnings.push(
              `Parameter "${paramName}" not found in tool schema for element "${mapping.uiElementId}"`
            );
            return;
          }

          // Get expected type from schema
          const expectedType = paramSchema.type || 'any';
          const expectedTsType = JSON_SCHEMA_TO_TS_TYPE[expectedType] || 'any';

          // Get actual type from HTML field
          const actualType = getHTMLFieldType(htmlContent, htmlFieldId);
          const actualTsType = HTML_INPUT_TO_TS_TYPE[actualType] || 'string';

          // Check type compatibility
          if (expectedTsType !== 'any' && actualTsType !== expectedTsType) {
            typeMismatches.push({
              field: `${mapping.uiElementId}.${paramName}`,
              expected: expectedTsType,
              actual: actualTsType,
            });
          }
        });
      }
    }
  });

  return {
    missingMappings,
    typeMismatches,
    warnings,
  };
}

/**
 * Get HTML field type
 */
function getHTMLFieldType(htmlContent: string, fieldId: string): string {
  if (typeof window === 'undefined') {
    return 'text';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  let element = doc.getElementById(fieldId);
  if (!element) {
    element = doc.querySelector(`[name="${fieldId}"]`) as HTMLElement;
  }
  if (!element) {
    element = doc.querySelector(`[data-field-id="${fieldId}"]`) as HTMLElement;
  }

  if (!element) {
    return 'text';
  }

  const tagName = element.tagName.toLowerCase();

  if (tagName === 'input') {
    return (element as HTMLInputElement).type || 'text';
  } else if (tagName === 'select') {
    const multiple = element.hasAttribute('multiple');
    return multiple ? 'select-multiple' : 'select';
  } else if (tagName === 'textarea') {
    return 'textarea';
  }

  return 'text';
}

/**
 * Debounced validation function
 */
let validationTimeout: NodeJS.Timeout | null = null;

export function validateActionMappingsDebounced(
  mappings: ActionMapping[],
  htmlContent: string,
  availableTools: MCPTool[],
  callback: (status: ValidationStatus) => void,
  delay: number = 300
): void {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }

  validationTimeout = setTimeout(() => {
    const status = validateActionMappings(mappings, htmlContent, availableTools);
    callback(status);
  }, delay);
}

/**
 * Check if validation status is valid (no errors)
 */
export function isValidationValid(status: ValidationStatus): boolean {
  return status.missingMappings.length === 0 && status.typeMismatches.length === 0;
}

/**
 * Get validation summary message
 */
export function getValidationSummary(status: ValidationStatus): string {
  const errors = status.missingMappings.length + status.typeMismatches.length;
  const warnings = status.warnings.length;

  if (errors === 0 && warnings === 0) {
    return 'All validations passed';
  }

  const parts: string[] = [];
  if (errors > 0) {
    parts.push(`${errors} error${errors > 1 ? 's' : ''}`);
  }
  if (warnings > 0) {
    parts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}
