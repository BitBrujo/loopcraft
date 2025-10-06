import {
  ConversationalContext,
  UserIntent,
  DetectedEntity,
  Capability,
  TemplateMatch,
} from '@/types/conversational-builder';
import {
  ServerConfig,
  ToolDefinition,
  ResourceDefinition,
  ToolCategory,
} from '@/types/server-builder';
import { toolTemplates } from '../tool-templates';
import { resourceTemplates } from '../resource-templates';

/**
 * Generates ServerConfig from conversational context
 */
export class SchemaGenerator {
  /**
   * Generate initial server configuration from user intent
   */
  static generateInitialConfig(intent: UserIntent, entities: DetectedEntity[]): ServerConfig {
    const serverName = this.generateServerName(intent, entities);
    const description = this.generateDescription(intent, entities);

    return {
      name: serverName,
      description,
      version: '1.0.0',
      tools: [],
      resources: [],
    };
  }

  /**
   * Find matching tool templates based on context
   */
  static findMatchingTools(context: ConversationalContext): TemplateMatch[] {
    const matches: TemplateMatch[] = [];
    const { userIntent, detectedEntities, requiredCapabilities } = context;

    for (const template of toolTemplates) {
      let confidence = 0;
      let reasons: string[] = [];

      // Match by category
      if (userIntent && this.categoriesMatch(template.category, userIntent.type)) {
        confidence += 0.3;
        reasons.push('category match');
      }

      // Match by capabilities
      for (const capability of requiredCapabilities) {
        if (this.toolMatchesCapability(template, capability)) {
          confidence += 0.3;
          reasons.push(`${capability.type} capability`);
        }
      }

      // Match by entities (e.g., "PostgreSQL" matches database tools)
      for (const entity of detectedEntities) {
        if (this.toolMatchesEntity(template, entity)) {
          confidence += 0.2;
          reasons.push(`${entity.value} detected`);
        }
      }

      // Match by keywords in description
      if (userIntent && this.descriptionMatches(template.description, userIntent.description)) {
        confidence += 0.2;
        reasons.push('description match');
      }

      if (confidence > 0.3) {
        matches.push({
          templateId: template.id,
          templateName: template.name,
          type: 'tool',
          confidence: Math.min(confidence, 1.0),
          reason: reasons.join(', '),
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  /**
   * Find matching resource templates based on context
   */
  static findMatchingResources(context: ConversationalContext): TemplateMatch[] {
    const matches: TemplateMatch[] = [];
    const { userIntent, detectedEntities, requiredCapabilities } = context;

    for (const template of resourceTemplates) {
      let confidence = 0;
      let reasons: string[] = [];

      // Match by category
      if (userIntent && this.categoriesMatch(template.category, userIntent.type)) {
        confidence += 0.3;
        reasons.push('category match');
      }

      // Match by capabilities
      for (const capability of requiredCapabilities) {
        if (this.resourceMatchesCapability(template, capability)) {
          confidence += 0.3;
          reasons.push(`${capability.type} capability`);
        }
      }

      // Match by entities
      for (const entity of detectedEntities) {
        if (this.resourceMatchesEntity(template, entity)) {
          confidence += 0.2;
          reasons.push(`${entity.value} detected`);
        }
      }

      // Match by keywords
      if (userIntent && this.descriptionMatches(template.description, userIntent.description)) {
        confidence += 0.2;
        reasons.push('description match');
      }

      if (confidence > 0.3) {
        matches.push({
          templateId: template.id,
          templateName: template.name,
          type: 'resource',
          confidence: Math.min(confidence, 1.0),
          reason: reasons.join(', '),
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  /**
   * Convert template to tool definition
   */
  static templateToTool(templateId: string): ToolDefinition | null {
    const template = toolTemplates.find((t) => t.id === templateId);
    if (!template) return null;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      parameters: template.parameters || [],
      returnType: template.returnType || 'object',
    };
  }

  /**
   * Convert template to resource definition
   */
  static templateToResource(templateId: string): ResourceDefinition | null {
    const template = resourceTemplates.find((t) => t.id === templateId);
    if (!template) return null;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      uri: template.uri,
      mimeType: template.mimeType,
      variables: template.variables || [],
      exampleData: template.exampleData,
    };
  }

  // Helper methods

  private static generateServerName(intent: UserIntent, entities: DetectedEntity[]): string {
    const tech = entities.find((e) => e.type === 'technology')?.value;
    if (tech) {
      return `${tech.toLowerCase().replace(/\s+/g, '-')}-server`;
    }
    return `${intent.type}-server`;
  }

  private static generateDescription(intent: UserIntent, entities: DetectedEntity[]): string {
    return intent.description || `MCP server for ${intent.type} operations`;
  }

  private static categoriesMatch(templateCategory: ToolCategory, intentType: string): boolean {
    const categoryMap: Record<string, ToolCategory[]> = {
      database: ['💾 Save & Store', '🔍 Search & Find', '📊 Show Information'],
      api: ['🌐 External Services', '🔄 Process Data', '📊 Show Information'],
      file_system: ['📁 Files & Media', '💾 Save & Store', '🔍 Search & Find'],
      notification: ['🔔 Send Messages'],
      custom: Object.values(toolTemplates).map((t) => t.category),
    };

    return categoryMap[intentType]?.includes(templateCategory) || false;
  }

  private static toolMatchesCapability(template: any, capability: Capability): boolean {
    const capabilityKeywords: Record<string, string[]> = {
      CRUD: ['create', 'read', 'update', 'delete', 'save', 'get', 'modify', 'remove'],
      authentication: ['auth', 'login', 'verify', 'token', 'session'],
      real_time: ['subscribe', 'listen', 'watch', 'notify', 'stream'],
      file_upload: ['upload', 'file', 'attach', 'media'],
      search: ['search', 'find', 'query', 'filter', 'lookup'],
    };

    const keywords = capabilityKeywords[capability.type] || [];
    const text = `${template.name} ${template.description}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  }

  private static resourceMatchesCapability(template: any, capability: Capability): boolean {
    return this.toolMatchesCapability(template, capability);
  }

  private static toolMatchesEntity(template: any, entity: DetectedEntity): boolean {
    const text = `${template.name} ${template.description}`.toLowerCase();
    return text.includes(entity.value.toLowerCase());
  }

  private static resourceMatchesEntity(template: any, entity: DetectedEntity): boolean {
    return this.toolMatchesEntity(template, entity);
  }

  private static descriptionMatches(templateDesc: string, intentDesc: string): boolean {
    const templateWords = templateDesc.toLowerCase().split(/\s+/);
    const intentWords = intentDesc.toLowerCase().split(/\s+/);
    const matchCount = intentWords.filter((word) =>
      templateWords.some((tw) => tw.includes(word) || word.includes(tw))
    ).length;
    return matchCount / intentWords.length > 0.3;
  }
}
