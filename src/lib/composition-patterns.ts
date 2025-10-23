/**
 * Pattern Library
 * Definitions for all supported interactive patterns
 */

import type { Pattern, PatternType, HandlerType } from '@/components/mcp-ui-builder/tabs/composition/types';

/**
 * All supported patterns
 */
export const PATTERNS: Record<PatternType, Pattern> = {
  'button-tool-call': {
    id: 'button-tool-call',
    name: 'Button → Tool Call',
    description: 'A button that executes an MCP tool when clicked. Displays the result in a container.',
    requiredSteps: ['element', 'action', 'handler'],
    elementType: 'button',
    actionType: 'tool',
    handlerTypes: ['response', 'notification', 'both', 'none'],
    icon: '🔘',
  },

  'form-tool-call': {
    id: 'form-tool-call',
    name: 'Form Submit → Tool Call',
    description: 'A form that collects user input and passes it to an MCP tool. Maps form fields to tool parameters.',
    requiredSteps: ['element', 'action', 'handler'],
    elementType: 'form',
    actionType: 'tool',
    handlerTypes: ['response', 'notification', 'both', 'none'],
    icon: '📝',
  },

  'search-filter': {
    id: 'search-filter',
    name: 'Search Input → Filter Tool',
    description: '',
    requiredSteps: ['element', 'action', 'handler'],
    elementType: 'input',
    actionType: 'tool',
    handlerTypes: ['response', 'notification', 'both'],
    icon: '🔍',
  },

  'multi-step': {
    id: 'multi-step',
    name: 'Multi-Step Workflow',
    description: 'A sequence of actions where the output of one tool feeds into the next. Supports tool chaining.',
    requiredSteps: ['element', 'action', 'handler'],
    elementType: 'button',
    actionType: 'tool',
    handlerTypes: ['response', 'both'], // Must handle response for chaining
    icon: '🔗',
  },

  'ai-helper': {
    id: 'ai-helper',
    name: 'AI Helper Button',
    description: 'A button that sends a contextual prompt to the AI assistant. Useful for getting help or explanations.',
    requiredSteps: ['element', 'action', 'handler'],
    elementType: 'button',
    actionType: 'prompt',
    handlerTypes: ['notification', 'none'], // Prompt doesn't need response handler
    icon: '🤖',
  },

  'link-tool-call': {
    id: 'link-tool-call',
    name: 'Link with Tool Call',
    description: 'A clickable link that triggers an MCP tool before navigation. Useful for logging or analytics.',
    requiredSteps: ['element', 'action', 'handler'],
    elementType: 'link',
    actionType: 'tool',
    handlerTypes: ['notification', 'none'], // Fire and forget
    icon: '🔗',
  },
};

/**
 * Get pattern by ID
 */
export function getPattern(id: PatternType): Pattern {
  return PATTERNS[id];
}

/**
 * Get all patterns as array
 */
export function getAllPatterns(): Pattern[] {
  return Object.values(PATTERNS);
}

/**
 * Check if pattern supports handler type
 */
export function supportsHandlerType(patternId: PatternType, handlerType: string): boolean {
  const pattern = PATTERNS[patternId];
  return pattern.handlerTypes.includes(handlerType as HandlerType);
}
