// Component Relationship Mapper
// Analyzes dependencies between MCP tools, resources, and UI components

import type {
  ToolDefinition,
  ResourceDefinition,
  ToolCategory,
  ComponentRelationship,
  RelationshipSuggestion,
  AnalysisContext,
  DependencyWarning,
} from '@/types/server-builder';
import { toolTemplates } from './tool-templates';
import { resourceTemplates } from './resource-templates';

/**
 * Rule-based heuristics for relationship detection
 */

// Category affinity map - which categories naturally work together
const CATEGORY_AFFINITY: Record<ToolCategory, ToolCategory[]> = {
  forms: ['save', 'show', 'security'],
  search: ['show', 'save', 'files'],
  save: ['forms', 'show', 'files'],
  show: ['search', 'save', 'external'],
  process: ['save', 'show', 'external'],
  messages: ['save', 'show', 'security'],
  security: ['forms', 'save', 'show'],
  payments: ['save', 'show', 'security'],
  files: ['save', 'search', 'show'],
  external: ['show', 'process', 'save'],
};

// Common naming patterns that suggest relationships
const NAMING_PATTERNS = [
  { pattern: /create|add|new/i, relatedTo: ['save', 'forms'] },
  { pattern: /search|find|query|filter/i, relatedTo: ['search', 'show'] },
  { pattern: /get|fetch|read|retrieve/i, relatedTo: ['show', 'search'] },
  { pattern: /update|edit|modify/i, relatedTo: ['save', 'forms'] },
  { pattern: /delete|remove/i, relatedTo: ['save', 'show'] },
  { pattern: /list|all|index/i, relatedTo: ['show', 'search'] },
  { pattern: /upload|download/i, relatedTo: ['files', 'save'] },
  { pattern: /send|notify|alert/i, relatedTo: ['messages', 'show'] },
  { pattern: /validate|check|verify/i, relatedTo: ['security', 'process'] },
  { pattern: /pay|charge|invoice/i, relatedTo: ['payments', 'save'] },
];

/**
 * Analyze tool and suggest complementary resources
 */
export function suggestResourcesForTool(
  tool: ToolDefinition,
  existingResources: ResourceDefinition[]
): RelationshipSuggestion[] {
  const suggestions: RelationshipSuggestion[] = [];
  const existingResourceIds = new Set(existingResources.map((r) => r.id));

  // Get templates from related categories
  const relatedCategories = CATEGORY_AFFINITY[tool.category] || [];
  const candidateTemplates = resourceTemplates.filter(
    (template) =>
      relatedCategories.includes(template.category) ||
      template.category === tool.category
  );

  candidateTemplates.forEach((template) => {
    if (existingResourceIds.has(template.resource.id)) return;

    let confidence = 0.3; // Base confidence for category match
    let reason = `Resources in the ${template.category} category often complement ${tool.category} tools`;

    // Boost confidence for same category
    if (template.category === tool.category) {
      confidence += 0.2;
      reason = `Same category (${tool.category}) - likely to work together`;
    }

    // Boost confidence for naming pattern matches
    NAMING_PATTERNS.forEach(({ pattern, relatedTo }) => {
      if (pattern.test(tool.name) && relatedTo.includes(template.category)) {
        confidence += 0.3;
        reason = `Tool name suggests it works with ${template.category} resources`;
      }
    });

    // Cap confidence at 0.9 for rule-based suggestions
    confidence = Math.min(confidence, 0.9);

    if (confidence >= 0.3) {
      suggestions.push({
        id: template.resource.id,
        name: template.name,
        description: template.description,
        category: template.category,
        reason,
        confidence,
        type: 'resource',
      });
    }
  });

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

/**
 * Analyze resource and suggest complementary tools
 */
export function suggestToolsForResource(
  resource: ResourceDefinition,
  existingTools: ToolDefinition[]
): RelationshipSuggestion[] {
  const suggestions: RelationshipSuggestion[] = [];
  const existingToolIds = new Set(existingTools.map((t) => t.id));

  // Get templates from related categories
  const relatedCategories = CATEGORY_AFFINITY[resource.category] || [];
  const candidateTemplates = toolTemplates.filter(
    (template) =>
      relatedCategories.includes(template.category) ||
      template.category === resource.category
  );

  candidateTemplates.forEach((template) => {
    if (existingToolIds.has(template.tool.id)) return;

    let confidence = 0.3; // Base confidence
    let reason = `Tools in the ${template.category} category often work with ${resource.category} resources`;

    // Same category boost
    if (template.category === resource.category) {
      confidence += 0.2;
      reason = `Same category (${resource.category}) - likely to work together`;
    }

    // Resource type specific suggestions
    if (resource.isTemplate) {
      // Template resources suggest CRUD tools
      if (/get|fetch|read/i.test(template.tool.name)) {
        confidence += 0.3;
        reason = `Template resources typically need read/fetch tools`;
      }
    }

    // MIME type specific suggestions
    if (resource.mimeType === 'application/json') {
      if (template.category === 'search' || template.category === 'show') {
        confidence += 0.2;
        reason = `JSON resources work well with ${template.category} tools`;
      }
    }

    confidence = Math.min(confidence, 0.9);

    if (confidence >= 0.3) {
      suggestions.push({
        id: template.tool.id,
        name: template.name,
        description: template.description,
        category: template.category,
        reason,
        confidence,
        type: 'tool',
      });
    }
  });

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

/**
 * Suggest complementary tools based on existing tools
 */
export function suggestComplementaryTools(
  existingTools: ToolDefinition[]
): RelationshipSuggestion[] {
  const suggestions: RelationshipSuggestion[] = [];
  const existingToolIds = new Set(existingTools.map((t) => t.id));

  // Analyze patterns in existing tools
  const hasCreate = existingTools.some((t) => /create|add|new/i.test(t.name));
  const hasRead = existingTools.some((t) => /get|fetch|read/i.test(t.name));
  const hasUpdate = existingTools.some((t) => /update|edit|modify/i.test(t.name));
  const hasDelete = existingTools.some((t) => /delete|remove/i.test(t.name));
  const hasList = existingTools.some((t) => /list|all|search/i.test(t.name));

  // CRUD completeness suggestions
  const crudGaps: { pattern: RegExp; reason: string; boost: number }[] = [];

  if (hasCreate && !hasRead) {
    crudGaps.push({
      pattern: /get|fetch|read/i,
      reason: 'Complete CRUD pattern - you can create but not read',
      boost: 0.5,
    });
  }
  if (hasRead && !hasUpdate) {
    crudGaps.push({
      pattern: /update|edit|modify/i,
      reason: 'Complete CRUD pattern - you can read but not update',
      boost: 0.4,
    });
  }
  if ((hasCreate || hasUpdate) && !hasDelete) {
    crudGaps.push({
      pattern: /delete|remove/i,
      reason: 'Complete CRUD pattern - consider adding delete capability',
      boost: 0.3,
    });
  }
  if ((hasCreate || hasRead) && !hasList) {
    crudGaps.push({
      pattern: /list|all|search/i,
      reason: 'Add list/search to browse multiple items',
      boost: 0.4,
    });
  }

  // Find tools matching CRUD gaps
  toolTemplates.forEach((template) => {
    if (existingToolIds.has(template.tool.id)) return;

    let maxConfidence = 0;
    let bestReason = '';

    crudGaps.forEach(({ pattern, reason, boost }) => {
      if (pattern.test(template.tool.name)) {
        const confidence = 0.4 + boost;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          bestReason = reason;
        }
      }
    });

    if (maxConfidence > 0) {
      suggestions.push({
        id: template.tool.id,
        name: template.name,
        description: template.description,
        category: template.category,
        reason: bestReason,
        confidence: Math.min(maxConfidence, 0.9),
        type: 'tool',
      });
    }
  });

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

/**
 * Validate dependency completeness and generate warnings
 */
export function validateDependencies(
  tools: ToolDefinition[],
  resources: ResourceDefinition[]
): DependencyWarning[] {
  const warnings: DependencyWarning[] = [];

  // Check for common incomplete patterns
  const hasWriteTools = tools.some((t) =>
    /create|add|new|update|edit|save/i.test(t.name)
  );
  const hasReadTools = tools.some((t) => /get|fetch|read|show/i.test(t.name));
  const hasDataResources = resources.length > 0;

  if (hasWriteTools && !hasDataResources) {
    warnings.push({
      type: 'missing-resource',
      severity: 'warning',
      message:
        'You have tools that create/update data but no resources to expose that data. Consider adding a resource.',
    });
  }

  if (hasDataResources && !hasReadTools) {
    warnings.push({
      type: 'missing-tool',
      severity: 'warning',
      message:
        'You have resources but no tools to read/fetch them. Consider adding a read tool.',
    });
  }

  if (tools.length > 0 && resources.length === 0) {
    warnings.push({
      type: 'incomplete-pattern',
      severity: 'info',
      message:
        'Your server only has tools. Consider adding resources to expose data or schemas.',
    });
  }

  if (resources.length > 0 && tools.length === 0) {
    warnings.push({
      type: 'incomplete-pattern',
      severity: 'info',
      message:
        'Your server only has resources. Consider adding tools to manipulate or query data.',
    });
  }

  return warnings;
}

/**
 * Generate AI prompt for relationship analysis
 */
export function generateAnalysisPrompt(context: AnalysisContext): string {
  const { existingTools, existingResources, recentlyAdded } = context;

  let prompt = `You are an expert in MCP (Model Context Protocol) server design. Analyze the following server configuration and suggest complementary components.

**Existing Tools (${existingTools.length}):**
${existingTools.map((t) => `- ${t.name} (${t.category}): ${t.description}`).join('\n')}

**Existing Resources (${existingResources.length}):**
${existingResources.map((r) => `- ${r.name} (${r.category}): ${r.description}`).join('\n')}
`;

  if (recentlyAdded) {
    prompt += `\n**Recently Added:**
The user just added a ${recentlyAdded.type} with ID: ${recentlyAdded.id}
`;
  }

  prompt += `\n**Your Task:**
1. Analyze what's missing to make this server more complete and useful
2. Suggest 3-5 specific components that would complement the existing setup
3. **IMPORTANT**: Suggest BOTH tools AND resources - they work together:
   - If there are tools but no resources, suggest resources that expose data those tools need
   - If there are resources but few tools, suggest tools to manipulate/query those resources
   - Consider which resources would help existing tools be more useful
4. Focus on common patterns like CRUD completeness, data flow, and typical use cases

**IMPORTANT - Available Template IDs:**
You MUST use these exact IDs from the template library. Examples:
- Tools: "submit_contact", "create_account", "search_items", "get_by_id", "update_existing", "delete_item"
- Resources: "contact_form_schema", "user_profile_data", "product_catalog", "settings_config", "form_templates", "search_filters"

**Common Tool-Resource Pairings:**
- "submit_contact" tool + "contact_form_schema" resource (form validation)
- "search_products" tool + "product_catalog" resource (data source)
- "create_account" tool + "user_profile_data" resource (user data)
- "get_settings" tool + "settings_config" resource (configuration data)

**Response Format (JSON only, no markdown):**
{
  "suggestions": [
    {
      "id": "EXACT_TEMPLATE_ID_FROM_ABOVE",
      "name": "Suggested Component Name",
      "type": "tool" or "resource",
      "category": "forms" | "search" | "save" | "show" | "process" | "messages" | "security" | "payments" | "files" | "external",
      "reason": "Why this complements the existing setup",
      "confidence": 0.5 to 0.9
    }
  ],
  "warnings": [
    {
      "type": "missing-tool" | "missing-resource" | "incomplete-pattern",
      "severity": "warning" | "info",
      "message": "Description of the issue"
    }
  ]
}

CRITICAL: The "id" field MUST be a valid template ID that exists in the library, NOT a placeholder like "template_id_from_library".`;

  return prompt;
}

/**
 * Parse AI response into structured format
 */
export function parseAIResponse(
  aiResponse: string
): {
  suggestions: RelationshipSuggestion[];
  warnings: DependencyWarning[];
} {
  try {
    // Remove markdown code blocks if present
    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    // Filter out invalid suggestions (placeholder IDs, duplicates)
    const validSuggestions: RelationshipSuggestion[] = [];
    const seenIds = new Set<string>();

    (parsed.suggestions || []).forEach((suggestion: RelationshipSuggestion) => {
      // Skip placeholder IDs
      if (suggestion.id.includes('template_id') || suggestion.id.includes('placeholder')) {
        console.warn('Skipping invalid AI suggestion with placeholder ID:', suggestion.id);
        return;
      }

      // Skip duplicates
      if (seenIds.has(suggestion.id)) {
        console.warn('Skipping duplicate AI suggestion:', suggestion.id);
        return;
      }

      // Validate confidence range
      if (suggestion.confidence < 0 || suggestion.confidence > 1) {
        suggestion.confidence = 0.5; // Default to 50%
      }

      seenIds.add(suggestion.id);
      validSuggestions.push(suggestion);
    });

    return {
      suggestions: validSuggestions,
      warnings: parsed.warnings || [],
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return { suggestions: [], warnings: [] };
  }
}

/**
 * Main analysis function - combines rule-based and AI suggestions
 */
export function analyzeRelationships(
  context: AnalysisContext,
  method: 'rule-based' | 'ai' = 'rule-based'
): ComponentRelationship[] {
  const relationships: ComponentRelationship[] = [];

  if (method === 'rule-based') {
    // For each recently added component, generate suggestions
    if (context.recentlyAdded) {
      const { type, id } = context.recentlyAdded;

      if (type === 'tool') {
        const tool = context.existingTools.find((t) => t.id === id);
        if (tool) {
          const suggestions = suggestResourcesForTool(tool, context.existingResources);
          if (suggestions.length > 0) {
            relationships.push({
              type: 'tool-resource',
              sourceId: tool.id,
              sourceName: tool.name,
              suggestions,
              analysisMethod: 'rule-based',
              timestamp: new Date(),
            });
          }
        }
      } else if (type === 'resource') {
        const resource = context.existingResources.find((r) => r.id === id);
        if (resource) {
          const suggestions = suggestToolsForResource(resource, context.existingTools);
          if (suggestions.length > 0) {
            relationships.push({
              type: 'resource-tool',
              sourceId: resource.id,
              sourceName: resource.name,
              suggestions,
              analysisMethod: 'rule-based',
              timestamp: new Date(),
            });
          }
        }
      }
    }

    // Suggest resources for ALL existing tools (not just recently added)
    if (context.existingTools.length > 0 && !context.recentlyAdded) {
      // Aggregate suggestions from all tools
      const allResourceSuggestions = new Map<string, RelationshipSuggestion>();

      context.existingTools.forEach((tool) => {
        const suggestions = suggestResourcesForTool(tool, context.existingResources);
        suggestions.forEach((suggestion) => {
          // Keep the highest confidence for each resource
          const existing = allResourceSuggestions.get(suggestion.id);
          if (!existing || suggestion.confidence > existing.confidence) {
            allResourceSuggestions.set(suggestion.id, {
              ...suggestion,
              reason: `Complements ${tool.name}: ${suggestion.reason}`,
            });
          }
        });
      });

      if (allResourceSuggestions.size > 0) {
        // Sort by confidence and take top 5
        const topSuggestions = Array.from(allResourceSuggestions.values())
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5);

        relationships.push({
          type: 'tool-resource',
          sourceId: 'all-tools',
          sourceName: `${context.existingTools.length} Tool${context.existingTools.length !== 1 ? 's' : ''}`,
          suggestions: topSuggestions,
          analysisMethod: 'rule-based',
          timestamp: new Date(),
        });
      }
    }

    // Suggest tools for ALL existing resources (not just recently added)
    if (context.existingResources.length > 0 && !context.recentlyAdded) {
      const allToolSuggestions = new Map<string, RelationshipSuggestion>();

      context.existingResources.forEach((resource) => {
        const suggestions = suggestToolsForResource(resource, context.existingTools);
        suggestions.forEach((suggestion) => {
          const existing = allToolSuggestions.get(suggestion.id);
          if (!existing || suggestion.confidence > existing.confidence) {
            allToolSuggestions.set(suggestion.id, {
              ...suggestion,
              reason: `Works with ${resource.name}: ${suggestion.reason}`,
            });
          }
        });
      });

      if (allToolSuggestions.size > 0) {
        const topSuggestions = Array.from(allToolSuggestions.values())
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5);

        relationships.push({
          type: 'resource-tool',
          sourceId: 'all-resources',
          sourceName: `${context.existingResources.length} Resource${context.existingResources.length !== 1 ? 's' : ''}`,
          suggestions: topSuggestions,
          analysisMethod: 'rule-based',
          timestamp: new Date(),
        });
      }
    }

    // Add complementary tools suggestion
    if (context.existingTools.length > 0) {
      const suggestions = suggestComplementaryTools(context.existingTools);
      if (suggestions.length > 0) {
        relationships.push({
          type: 'complementary-tool',
          sourceId: 'server',
          sourceName: 'Server Configuration',
          suggestions,
          analysisMethod: 'rule-based',
          timestamp: new Date(),
        });
      }
    }
  }

  return relationships;
}
