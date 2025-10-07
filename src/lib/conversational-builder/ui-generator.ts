import {
  ConversationalContext,
  UserIntent,
  DetectedEntity,
  TemplateMatch,
} from '@/types/conversational-builder';
import { UIResource } from '@/types/ui-builder';
import { uiTemplates, UICategory, findUITemplate } from '../ui-templates';
import { extractTemplatePlaceholders } from '../html-parser';

/**
 * Generates UIResource from conversational context
 */
export class UIGenerator {
  /**
   * Generate initial UI resource from user intent
   */
  static generateInitialUI(intent: UserIntent, entities: DetectedEntity[]): UIResource {
    return {
      uri: 'ui://conversational-builder/initial',
      contentType: 'rawHtml',
      content: '<div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"><p class="text-gray-900 dark:text-white">Your UI will appear here...</p></div>',
      preferredSize: { width: 800, height: 600 },
      templatePlaceholders: [],
      metadata: {
        title: 'New UI Component',
        description: intent.description,
      },
    };
  }

  /**
   * Find matching UI component templates based on context
   */
  static findMatchingUIComponents(context: ConversationalContext): TemplateMatch[] {
    const matches: TemplateMatch[] = [];
    const { userIntent, detectedEntities } = context;

    for (const template of uiTemplates) {
      let confidence = 0;
      const reasons: string[] = [];

      // Match by UI intent type
      if (userIntent && this.intentMatchesTemplate(userIntent.type, template.category)) {
        confidence += 0.4;
        reasons.push(`${userIntent.type} intent`);
      }

      // Match by detected UI elements
      for (const entity of detectedEntities) {
        if (entity.type === 'ui_component') {
          if (template.description.toLowerCase().includes(entity.value.toLowerCase())) {
            confidence += 0.2;
            reasons.push(`contains ${entity.value}`);
          }
        }

        if (entity.type === 'form_field') {
          if (template.htmlContent.toLowerCase().includes(entity.value.toLowerCase())) {
            confidence += 0.15;
            reasons.push(`has ${entity.value} field`);
          }
        }

        if (entity.type === 'data_source') {
          if (template.templatePlaceholders?.some(p => p.toLowerCase().includes(entity.value.toLowerCase()))) {
            confidence += 0.2;
            reasons.push(`uses ${entity.value} data`);
          }
        }
      }

      // Match by keywords in user needs
      if (userIntent && this.descriptionMatches(template.userNeeds, userIntent.description)) {
        confidence += 0.2;
        reasons.push('similar requirements');
      }

      if (confidence > 0.3) {
        matches.push({
          templateId: template.id,
          templateName: template.name,
          type: 'ui_component',
          confidence: Math.min(confidence, 1.0),
          reason: reasons.join(', '),
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  /**
   * Convert template to UIResource
   */
  static templateToUIResource(templateId: string): UIResource | null {
    const template = findUITemplate(templateId);
    if (!template) return null;

    const placeholders = template.templatePlaceholders || extractTemplatePlaceholders(template.htmlContent);

    return {
      uri: `ui://conversational-builder/${templateId}`,
      contentType: 'rawHtml',
      content: template.htmlContent,
      preferredSize: { width: 800, height: 600 },
      templatePlaceholders: placeholders,
      metadata: {
        title: template.name,
        description: template.description,
      },
    };
  }

  /**
   * Generate HTML from user description using AI (placeholder - would integrate with Ollama)
   */
  static async generateHTMLFromDescription(description: string): Promise<string> {
    // TODO: Integrate with Ollama API to generate HTML
    // For now, return a basic template
    return `<div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Generated UI</h2>
  <p class="text-gray-600 dark:text-gray-400">${description}</p>
</div>`;
  }

  // Helper methods

  /**
   * Check if intent type matches template category
   */
  private static intentMatchesTemplate(intentType: UserIntent['type'], templateCategory: UICategory): boolean {
    const matchMap: Record<UserIntent['type'], UICategory[]> = {
      form: ['forms'],
      dashboard: ['dashboards'],
      table: ['tables'],
      chart: ['charts'],
      gallery: ['galleries'],
      custom: ['custom', 'forms', 'dashboards', 'tables', 'charts', 'galleries'],
    };

    return matchMap[intentType]?.includes(templateCategory) || false;
  }

  /**
   * Check if descriptions match
   */
  private static descriptionMatches(templateDesc: string, userDesc: string): boolean {
    const templateWords = templateDesc.toLowerCase().split(/\s+/);
    const userWords = userDesc.toLowerCase().split(/\s+/);
    const matchCount = userWords.filter((word) =>
      templateWords.some((tw) => tw.includes(word) || word.includes(tw))
    ).length;
    return matchCount / userWords.length > 0.3;
  }

  /**
   * Merge HTML content with existing UIResource
   */
  static mergeHTML(current: UIResource, newHTML: string): UIResource {
    const placeholders = extractTemplatePlaceholders(newHTML);

    return {
      ...current,
      content: newHTML,
      templatePlaceholders: placeholders,
    };
  }

  /**
   * Add placeholder to UIResource
   */
  static addPlaceholder(current: UIResource, placeholder: string): UIResource {
    if (current.templatePlaceholders?.includes(placeholder)) {
      return current;
    }

    return {
      ...current,
      templatePlaceholders: [...(current.templatePlaceholders || []), placeholder],
    };
  }

  /**
   * Generate suggested action element IDs from HTML
   */
  static suggestActionElements(htmlContent: string): string[] {
    const suggestions: string[] = [];
    const idRegex = /id="([^"]+)"/g;
    let match;

    while ((match = idRegex.exec(htmlContent)) !== null) {
      const id = match[1];
      // Suggest button, submit, form elements
      if (id.includes('btn') || id.includes('submit') || id.includes('form')) {
        suggestions.push(id);
      }
    }

    return suggestions;
  }
}
