/**
 * AI-Powered HTML Analysis Types
 * Provides types for tool inference and analysis
 */

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

/**
 * Inferred tool from HTML analysis
 */
export interface ToolInference {
  toolName: string;
  description: string;
  purpose: string;
  implementationType: 'database' | 'email' | 'api-call' | 'file-operation' | 'calculation' | 'custom';
  parameters: ToolParameter[];
  suggestedImplementation: string;
  confidence: number;
  relatedElements?: string[];
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  inferredTools: ToolInference[];
  suggestedMappings: unknown[];
  warnings: string[];
  insights: string[];
}

/**
 * Placeholder for analyzeHTMLForTools function
 * This was removed as part of simplification but types are kept for compatibility
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function analyzeHTMLForTools(_htmlContent: string): AnalysisResult {
  return {
    inferredTools: [],
    suggestedMappings: [],
    warnings: [],
    insights: []
  };
}
