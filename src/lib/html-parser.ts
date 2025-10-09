/**
 * HTML Parser Utilities
 * Extracts template placeholders from HTML content
 */

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
