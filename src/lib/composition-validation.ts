/**
 * Validation Logic for Composition Workflow
 * Validates each step of the pattern building process
 */

import type {
  PatternType,
  ElementConfig,
  ActionConfig,
  HandlerConfig,
  ValidationResult,
} from '@/components/mcp-ui-builder/tabs/composition/types';
import { getPattern } from './composition-patterns';

/**
 * Validate Step 1: Pattern Selection
 */
export function validateStep1(pattern: PatternType | null): ValidationResult {
  const errors: string[] = [];

  if (!pattern) {
    errors.push('Please select a pattern type');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Step 2: Element Configuration
 */
export function validateStep2(
  pattern: PatternType | null,
  elementConfig: ElementConfig | null
): ValidationResult {
  const errors: string[] = [];

  if (!pattern) {
    errors.push('No pattern selected');
    return { valid: false, errors };
  }

  if (!elementConfig) {
    errors.push('Element configuration is required');
    return { valid: false, errors };
  }

  // Validate element ID (required for all types)
  if (!elementConfig.id || elementConfig.id.trim() === '') {
    errors.push('Element ID is required');
  } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(elementConfig.id)) {
    errors.push('Element ID must start with a letter and contain only letters, numbers, hyphens, and underscores');
  }

  // Pattern-specific validation
  const patternMeta = getPattern(pattern);

  switch (patternMeta.elementType) {
    case 'button':
      if (!elementConfig.buttonText || elementConfig.buttonText.trim() === '') {
        errors.push('Button text is required');
      }
      break;

    case 'form':
      if (!elementConfig.formFields || elementConfig.formFields.length === 0) {
        errors.push('At least one form field is required');
      } else {
        // Validate each form field
        elementConfig.formFields.forEach((field, index) => {
          if (!field.name || field.name.trim() === '') {
            errors.push(`Form field ${index + 1}: Name is required`);
          }
          if (!field.label || field.label.trim() === '') {
            errors.push(`Form field ${index + 1}: Label is required`);
          }
        });

        // Check for duplicate field names
        const fieldNames = elementConfig.formFields.map(f => f.name);
        const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
        if (duplicates.length > 0) {
          errors.push(`Duplicate form field names: ${duplicates.join(', ')}`);
        }
      }
      break;

    case 'input':
      if (!elementConfig.inputPlaceholder || elementConfig.inputPlaceholder.trim() === '') {
        errors.push('Input placeholder is required');
      }
      break;

    case 'link':
      if (!elementConfig.linkText || elementConfig.linkText.trim() === '') {
        errors.push('Link text is required');
      }
      if (!elementConfig.linkHref || elementConfig.linkHref.trim() === '') {
        errors.push('Link href is required');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Step 3: Action Configuration
 */
export function validateStep3(
  pattern: PatternType | null,
  actionConfig: ActionConfig | null
): ValidationResult {
  const errors: string[] = [];

  if (!pattern) {
    errors.push('No pattern selected');
    return { valid: false, errors };
  }

  if (!actionConfig) {
    errors.push('Action configuration is required');
    return { valid: false, errors };
  }

  const patternMeta = getPattern(pattern);

  // Validate action type matches pattern
  if (actionConfig.actionType !== patternMeta.actionType) {
    errors.push(`Action type must be "${patternMeta.actionType}" for this pattern`);
  }

  // Action-specific validation
  switch (actionConfig.actionType) {
    case 'tool':
      if (!actionConfig.toolName || actionConfig.toolName.trim() === '') {
        errors.push('Tool name is required');
      }
      if (actionConfig.toolParameters) {
        // Validate required parameters have values
        actionConfig.toolParameters.forEach((param, index) => {
          if (param.required) {
            if (param.valueSource === 'static' && !param.staticValue) {
              errors.push(`Parameter "${param.name}" is required but has no value`);
            } else if (param.valueSource === 'formField' && !param.formFieldName) {
              errors.push(`Parameter "${param.name}" is required but has no form field mapping`);
            }
          }
        });
      }
      break;

    case 'prompt':
      if (!actionConfig.promptText || actionConfig.promptText.trim() === '') {
        errors.push('Prompt text is required');
      }
      break;

    case 'link':
      if (!actionConfig.linkUrl || actionConfig.linkUrl.trim() === '') {
        errors.push('Link URL is required');
      }
      break;

    case 'intent':
      if (!actionConfig.intentName || actionConfig.intentName.trim() === '') {
        errors.push('Intent name is required');
      }
      break;

    case 'notify':
      if (!actionConfig.notificationMessage || actionConfig.notificationMessage.trim() === '') {
        errors.push('Notification message is required');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Step 4: Handler Configuration
 */
export function validateStep4(
  pattern: PatternType | null,
  handlerConfig: HandlerConfig | null
): ValidationResult {
  const errors: string[] = [];

  if (!pattern) {
    errors.push('No pattern selected');
    return { valid: false, errors };
  }

  if (!handlerConfig) {
    errors.push('Handler configuration is required');
    return { valid: false, errors };
  }

  const patternMeta = getPattern(pattern);

  // Validate handler type is supported by pattern
  if (!patternMeta.handlerTypes.includes(handlerConfig.handlerType)) {
    errors.push(`Handler type "${handlerConfig.handlerType}" is not supported for this pattern. Supported types: ${patternMeta.handlerTypes.join(', ')}`);
  }

  // Handler-specific validation
  // Note: responseContainerId is no longer required - responses are shown via notifications

  if (handlerConfig.handlerType === 'notification' || handlerConfig.handlerType === 'both') {
    if (!handlerConfig.successMessage || handlerConfig.successMessage.trim() === '') {
      errors.push('Success message is required for notification handler');
    }
  }

  // Validate chained tool config if enabled
  if (handlerConfig.enableChaining) {
    if (!handlerConfig.nextToolConfig) {
      errors.push('Chained tool configuration is required when chaining is enabled');
    } else {
      // Validate chained tool config
      const chainedValidation = validateStep3(pattern, handlerConfig.nextToolConfig);
      if (!chainedValidation.valid) {
        errors.push(...chainedValidation.errors.map(e => `Chained tool: ${e}`));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate entire composition state
 */
export function validateCompositionState(
  pattern: PatternType | null,
  elementConfig: ElementConfig | null,
  actionConfig: ActionConfig | null,
  handlerConfig: HandlerConfig | null
): {
  step1: ValidationResult;
  step2: ValidationResult;
  step3: ValidationResult;
  step4: ValidationResult;
  allValid: boolean;
} {
  const step1 = validateStep1(pattern);
  const step2 = validateStep2(pattern, elementConfig);
  const step3 = validateStep3(pattern, actionConfig);
  const step4 = validateStep4(pattern, handlerConfig);

  return {
    step1,
    step2,
    step3,
    step4,
    allValid: step1.valid && step2.valid && step3.valid && step4.valid,
  };
}
