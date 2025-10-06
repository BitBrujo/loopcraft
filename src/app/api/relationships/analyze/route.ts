// API endpoint for AI-powered relationship analysis
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import type {
  AnalysisContext,
  ComponentRelationship,
  DependencyWarning,
} from '@/types/server-builder';
import type {
  ConversationalContext,
  TemplateMatch,
} from '@/types/conversational-builder';
import {
  generateAnalysisPrompt,
  parseAIResponse,
  analyzeRelationships,
  validateDependencies,
} from '@/lib/relationship-mapper';
import { SchemaGenerator } from '@/lib/conversational-builder/schema-generator';

// Simple in-memory cache for analysis results (5 minute TTL)
const analysisCache = new Map<
  string,
  {
    result: {
      relationships: ComponentRelationship[];
      warnings: DependencyWarning[];
    };
    timestamp: number;
  }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(context: AnalysisContext): string {
  // Create a hash-like key from the context
  const toolIds = context.existingTools.map((t) => t.id).sort().join(',');
  const resourceIds = context.existingResources.map((r) => r.id).sort().join(',');
  return `${toolIds}::${resourceIds}::${context.recentlyAdded?.type || ''}::${context.recentlyAdded?.id || ''}`;
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      context,
      conversationalContext,
      useAI = false,
    }: {
      context?: AnalysisContext;
      conversationalContext?: ConversationalContext;
      useAI?: boolean;
    } = body;

    // Support both analysis contexts
    if (!context && !conversationalContext) {
      return NextResponse.json(
        { error: 'Invalid analysis context' },
        { status: 400 }
      );
    }

    // Handle conversational context
    if (conversationalContext) {
      const toolMatches = SchemaGenerator.findMatchingTools(conversationalContext);
      const resourceMatches = SchemaGenerator.findMatchingResources(conversationalContext);

      return NextResponse.json({
        relationships: [],
        warnings: [],
        templateMatches: {
          tools: toolMatches,
          resources: resourceMatches,
        },
        cached: false,
      });
    }

    // Original analysis context validation
    if (!context || !context.existingTools || !context.existingResources) {
      return NextResponse.json(
        { error: 'Invalid analysis context' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = getCacheKey(context);
    const cached = analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.result,
        cached: true,
      });
    }

    let relationships: ComponentRelationship[] = [];
    let warnings: DependencyWarning[] = validateDependencies(
      context.existingTools,
      context.existingResources
    );

    if (useAI) {
      // AI-powered analysis using Ollama
      try {
        // Get user's AI settings or use defaults
        const settings = await query<{ key: string; value: string }[]>(
          'SELECT `key`, `value` FROM settings WHERE user_id = ?',
          [user.userId]
        );

        const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
        const baseUrl =
          settingsMap.get('ollama_base_url') ||
          process.env.OLLAMA_BASE_URL ||
          'http://localhost:11434/api';
        const model =
          settingsMap.get('ollama_model') ||
          process.env.OLLAMA_MODEL ||
          'llama3.2:latest';

        // Generate AI prompt
        const prompt = generateAnalysisPrompt(context);

        // Call Ollama
        const aiResponse = await fetch(`${baseUrl}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
              temperature: 0.3, // Lower temperature for more focused analysis
              top_p: 0.9,
            },
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`Ollama API error: ${aiResponse.statusText}`);
        }

        const aiData = await aiResponse.json();
        const parsedResponse = parseAIResponse(aiData.response);

        // Convert AI suggestions to relationships
        if (parsedResponse.suggestions.length > 0) {
          relationships.push({
            type: 'complementary-tool',
            sourceId: 'ai-analysis',
            sourceName: 'AI Analysis',
            suggestions: parsedResponse.suggestions,
            analysisMethod: 'ai',
            timestamp: new Date(),
          });
        }

        // Merge AI warnings with rule-based warnings
        warnings = [...warnings, ...parsedResponse.warnings];
      } catch (aiError) {
        console.error('AI analysis failed, falling back to rule-based:', aiError);
        // Fall back to rule-based analysis
        relationships = analyzeRelationships(context, 'rule-based');
      }
    } else {
      // Rule-based analysis only
      relationships = analyzeRelationships(context, 'rule-based');
    }

    const result = {
      relationships,
      warnings,
    };

    // Cache the result
    analysisCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    // Clean up old cache entries (simple cleanup on each request)
    const now = Date.now();
    for (const [key, value] of analysisCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        analysisCache.delete(key);
      }
    }

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze relationships',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
