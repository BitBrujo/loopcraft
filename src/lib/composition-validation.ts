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

  // Check if pattern exists (handles legacy patterns like 'multi-step' that were removed)
  if (!patternMeta) {
    errors.push('Invalid pattern type. Please select a valid pattern.');
    return { valid: false, errors };
  }

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

  // Check if pattern exists (handles legacy patterns like 'multi-step' that were removed)
  if (!patternMeta) {
    errors.push('Invalid pattern type. Please select a valid pattern.');
    return { valid: false, errors };
  }

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
            } else if (param.valueSource === 'previousResult' && !param.previousResultPath) {
              errors.push(`Parameter "${param.name}" is required but has no result path specified`);
            }
          }

          // Validate previousResult parameters
          // Note: Empty path means "use entire result object" which is valid
          if (param.valueSource === 'previousResult') {
            // previousResultPath can be empty (means entire result)
            // No validation needed here - empty string is valid
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

  // Check if pattern exists (handles legacy patterns like 'multi-step' that were removed)
  if (!patternMeta) {
    errors.push('Invalid pattern type. Please select a valid pattern.');
    return { valid: false, errors };
  }

  // Validate handler type is supported by pattern
  if (!patternMeta.handlerTypes.includes(handlerConfig.handlerType)) {
    errors.push(`Handler type "${handlerConfig.handlerType}" is not supported for this pattern. Supported types: ${patternMeta.handlerTypes.join(', ')}`);
  }

  // Validate response destination for tool actions with non-none handlers
  // Note: Only tool actions have response destinations, and UI only shows this for tool actions
  if (patternMeta.actionType === 'tool' && handlerConfig.handlerType !== 'none') {
    if (!handlerConfig.responseDestination) {
      errors.push('Response destination is required (choose where to send the tool response)');
    }
  }

  // Handler-specific validation
  // Note: responseContainerId is no longer required - responses are shown via notifications

  if (handlerConfig.handlerType === 'notification' || handlerConfig.handlerType === 'both') {
    if (!handlerConfig.successMessage || handlerConfig.successMessage.trim() === '') {
      errors.push('Success message is required for notification handler');
    }
  }

  // Note: enableChaining is just a flag that controls whether the "Chain Another Tool"
  // button appears in the success dialog. No validation needed here since the user
  // will configure the next tool after generating the current pattern code.

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
