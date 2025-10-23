/**
 * Pattern Types and Configuration for Composition Tab
 */

// Pattern type identifier
export type PatternType =
  | 'button-tool-call'
  | 'form-tool-call'
  | 'search-filter'
  | 'multi-step'
  | 'ai-helper'
  | 'link-tool-call';

// Element types supported by patterns
export type ElementType = 'button' | 'form' | 'input' | 'link';

// Action types (MCP-UI actions)
export type ActionType = 'tool' | 'prompt' | 'link' | 'intent' | 'notify';

// Handler types for tool responses
export type HandlerType = 'response' | 'notification' | 'both' | 'none';

// Button style variants
export type ButtonStyle = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

// Notification variants
export type NotificationVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Pattern Definition
 * Describes metadata and requirements for each pattern type
 */
export interface Pattern {
  id: PatternType;
  name: string;
  description: string;
  requiredSteps: ('element' | 'action' | 'handler')[];
  elementType: ElementType;
  actionType: ActionType;
  handlerTypes: HandlerType[];
  icon: string; // emoji or icon name
}

/**
 * Element Configuration (Step 2)
 * HTML element setup
 */
export interface ElementConfig {
  elementType: ElementType;
  id: string; // element ID (must be unique)

  // Button-specific
  buttonText?: string;
  buttonStyle?: ButtonStyle;

  // Form-specific
  formFields?: FormField[];

  // Input-specific
  inputPlaceholder?: string;
  inputType?: 'text' | 'search' | 'number' | 'email';

  // Link-specific
  linkText?: string;
  linkHref?: string;
}

/**
 * Form Field Definition
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'password' | 'checkbox' | 'select';
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select fields
}

/**
 * Action Configuration (Step 3)
 * MCP action setup
 */
export interface ActionConfig {
  actionType: ActionType;

  // Tool call specific
  toolName?: string;
  toolParameters?: ToolParameter[];

  // Prompt specific
  promptText?: string;

  // Link specific
  linkUrl?: string;
  linkTarget?: '_blank' | '_self';

  // Intent specific
  intentName?: string;
  intentData?: Record<string, unknown>;

  // Notify specific
  notificationMessage?: string;
  notificationVariant?: NotificationVariant;
}

/**
 * Tool Parameter Configuration
 */
export interface ToolParameter {
  name: string;
  type: string; // JSON schema type
  required: boolean;
  description?: string;
  valueSource: 'static' | 'formField';
  staticValue?: string | number | boolean;
  formFieldName?: string; // if valueSource is 'formField'
}

/**
 * Handler Configuration (Step 4)
 * Response handling setup
 */
export interface HandlerConfig {
  handlerType: HandlerType;

  // Response display
  responseContainerId?: string;
  showLoadingIndicator?: boolean;
  handleErrors?: boolean;
  supportAllContentTypes?: boolean;

  // Notification
  successMessage?: string;
  successVariant?: NotificationVariant;
  errorMessage?: string;
  errorVariant?: NotificationVariant;

  // Tool chaining (multi-step)
  enableChaining?: boolean;
  nextToolConfig?: ActionConfig; // for chained tool calls
}

/**
 * Complete Composition State
 * All configuration for a single pattern
 */
export interface CompositionState {
  currentStep: 1 | 2 | 3 | 4;
  selectedPattern: PatternType | null;
  elementConfig: ElementConfig | null;
  actionConfig: ActionConfig | null;
  handlerConfig: HandlerConfig | null;
  isValid: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
  };
  generatedCode: string | null;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
