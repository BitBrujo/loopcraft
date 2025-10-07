/**
 * Validation Engine for MCP-UI Builder
 *
 * Validates action mappings against tool schemas and HTML content.
 * Provides type checking and completeness validation.
 */

import type { ActionMapping, ValidationStatus, TypeMismatch, MCPTool, UIResource } from '@/types/ui-builder';
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
 * Validate all action mappings (with parameter sources)
 */
export function validateActionMappings(
  mappings: ActionMapping[],
  htmlContent: string,
  availableTools: MCPTool[],
  templatePlaceholders?: string[]
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

    // Validate parameter sources (new) or bindings (legacy)
    if (tool.inputSchema) {
      const schema = tool.inputSchema as {
        type?: string;
        properties?: Record<string, { type?: string; required?: boolean }>;
        required?: string[];
      };

      // Check required parameters using parameterSources (or fall back to parameterBindings)
      const requiredParams = schema.required || [];
      requiredParams.forEach(paramName => {
        const source = mapping.parameterSources?.[paramName];
        const binding = mapping.parameterBindings[paramName];

        if (!source && !binding) {
          missingMappings.push(
            `Required parameter "${paramName}" not mapped for element "${mapping.uiElementId}"`
          );
        } else if (source && !source.sourceValue) {
          missingMappings.push(
            `Required parameter "${paramName}" has no source value for element "${mapping.uiElementId}"`
          );
        }
      });

      // Validate parameter sources
      if (schema.properties && mapping.parameterSources) {
        Object.entries(mapping.parameterSources).forEach(([paramName, source]) => {
          const paramSchema = schema.properties?.[paramName];
          if (!paramSchema) {
            warnings.push(
              `Parameter "${paramName}" not found in tool schema for element "${mapping.uiElementId}"`
            );
            return;
          }

          // Validate based on source type
          if (source.sourceType === 'static') {
            // Static values: just check if non-empty
            if (!source.sourceValue) {
              missingMappings.push(
                `Static parameter "${paramName}" has no value for element "${mapping.uiElementId}"`
              );
            }
          } else if (source.sourceType === 'form') {
            // Form fields: validate field exists in HTML
            if (!source.sourceValue) {
              missingMappings.push(
                `Form field parameter "${paramName}" not selected for element "${mapping.uiElementId}"`
              );
            } else {
              // Validate field exists
              const fieldExists = validateElementId(htmlContent, source.sourceValue);
              if (!fieldExists) {
                missingMappings.push(
                  `Form field "${source.sourceValue}" not found in HTML for parameter "${paramName}"`
                );
              } else {
                // Check type compatibility
                const expectedType = paramSchema.type || 'any';
                const expectedTsType = JSON_SCHEMA_TO_TS_TYPE[expectedType] || 'any';
                const actualType = getHTMLFieldType(htmlContent, source.sourceValue);
                const actualTsType = HTML_INPUT_TO_TS_TYPE[actualType] || 'string';

                if (expectedTsType !== 'any' && actualTsType !== expectedTsType) {
                  typeMismatches.push({
                    field: `${mapping.uiElementId}.${paramName}`,
                    expected: expectedTsType,
                    actual: actualTsType,
                  });
                }
              }
            }
          } else if (source.sourceType === 'agent') {
            // Agent placeholders: validate placeholder exists
            if (!source.sourceValue) {
              missingMappings.push(
                `Agent placeholder parameter "${paramName}" not selected for element "${mapping.uiElementId}"`
              );
            } else if (templatePlaceholders && !templatePlaceholders.includes(source.sourceValue)) {
              missingMappings.push(
                `Agent placeholder "{{${source.sourceValue}}}" not found in HTML for parameter "${paramName}"`
              );
            }
          } else if (source.sourceType === 'tool') {
            // Tool results: not yet implemented
            warnings.push(
              `Tool result parameter "${paramName}" is not yet supported for element "${mapping.uiElementId}"`
            );
          }
        });
      }

      // Legacy: also validate old parameterBindings for backward compatibility
      else if (schema.properties && mapping.parameterBindings) {
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
  delay: number = 300,
  templatePlaceholders?: string[]
): void {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }

  validationTimeout = setTimeout(() => {
    const status = validateActionMappings(mappings, htmlContent, availableTools, templatePlaceholders);
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
