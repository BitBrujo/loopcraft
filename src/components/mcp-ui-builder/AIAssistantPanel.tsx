"use client";

import { useState, useEffect } from "react";
import { Wand2, Check, X, Info, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { analyzeHTMLForTools, type AnalysisResult, type ToolInference } from "@/lib/intelligent-analyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateId } from "@/lib/utils";
import type { CustomTool } from "@/types/ui-builder";

interface GeneratedImplementation {
  toolName: string;
  code: string;
}

interface FailedTool {
  error: string;
  attempts: number;
}

export function AIAssistantPanel() {
  const {
    currentResource,
    customTools,
    actionMappings,
    addCustomTool,
    addActionMapping,
    setToolImplementations,
  } = useUIBuilderStore();

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImplementations, setGeneratedImplementations] = useState<Map<string, string>>(new Map());
  const [failedTools, setFailedTools] = useState<Map<string, FailedTool>>(new Map());
  const [retryingTool, setRetryingTool] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Auto-analyze when HTML changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      handleAnalyze();
    }
  }, [currentResource?.content]);

  const handleAnalyze = () => {
    if (!currentResource || currentResource.contentType !== 'rawHtml') {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = analyzeHTMLForTools(currentResource.content);
      setAnalysis(result);

      // Auto-select all tools by default
      const toolNames = new Set(result.inferredTools.map(t => t.toolName));
      setSelectedTools(toolNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateImplementations = async () => {
    if (!analysis) return;

    setIsGenerating(true);
    setError(null);

    const implementations = new Map<string, string>(generatedImplementations);
    const failures = new Map<string, FailedTool>(failedTools);

    // Generate implementations for selected tools
    const selectedToolInferences = analysis.inferredTools.filter(t =>
      selectedTools.has(t.toolName)
    );

    for (const toolInference of selectedToolInferences) {
      // Skip if already generated successfully
      if (implementations.has(toolInference.toolName)) {
        continue;
      }

      try {
        const response = await fetch('/api/builder/generate-implementation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ toolInference }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to generate ${toolInference.toolName}`);
        }

        const data = await response.json();
        implementations.set(toolInference.toolName, data.implementation);

        // Clear failure if it existed
        failures.delete(toolInference.toolName);
      } catch (err) {
        // Track individual failure, continue with other tools
        const currentFailure = failures.get(toolInference.toolName);
        failures.set(toolInference.toolName, {
          error: err instanceof Error ? err.message : 'Generation failed',
          attempts: currentFailure ? currentFailure.attempts + 1 : 1,
        });
      }
    }

    setGeneratedImplementations(implementations);
    setFailedTools(failures);
    setIsGenerating(false);
  };

  const handleRetryTool = async (toolName: string) => {
    if (!analysis) return;

    const toolInference = analysis.inferredTools.find(t => t.toolName === toolName);
    if (!toolInference) return;

    setRetryingTool(toolName);

    try {
      const response = await fetch('/api/builder/generate-implementation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ toolInference }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to generate ${toolName}`);
      }

      const data = await response.json();

      // Update implementations
      const newImplementations = new Map(generatedImplementations);
      newImplementations.set(toolName, data.implementation);
      setGeneratedImplementations(newImplementations);

      // Clear failure
      const newFailures = new Map(failedTools);
      newFailures.delete(toolName);
      setFailedTools(newFailures);
    } catch (err) {
      // Update failure with new attempt count
      const currentFailure = failedTools.get(toolName);
      const newFailures = new Map(failedTools);
      newFailures.set(toolName, {
        error: err instanceof Error ? err.message : 'Generation failed',
        attempts: currentFailure ? currentFailure.attempts + 1 : 1,
      });
      setFailedTools(newFailures);
    } finally {
      setRetryingTool(null);
    }
  };

  const handleAcceptSuggestions = () => {
    if (!analysis) return;

    // Add selected tools to customTools
    analysis.inferredTools
      .filter(t => selectedTools.has(t.toolName))
      .forEach(toolInference => {
        const customTool: CustomTool = {
          id: generateId(),
          name: toolInference.toolName,
          description: toolInference.description,
          parameters: toolInference.parameters,
        };
        addCustomTool(customTool);
      });

    // Add suggested mappings
    analysis.suggestedMappings.forEach(mapping => {
      addActionMapping(mapping);
    });

    // Save AI-generated implementations to store
    const implementationsRecord: Record<string, string> = {};
    generatedImplementations.forEach((code, toolName) => {
      if (selectedTools.has(toolName)) {
        implementationsRecord[toolName] = code;
      }
    });
    setToolImplementations(implementationsRecord);

    // Clear selections
    setSelectedTools(new Set());
    setGeneratedImplementations(new Map());
    setFailedTools(new Map());
    setAnalysis(null);
  };

  const toggleToolSelection = (toolName: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolName)) {
      newSelected.delete(toolName);
    } else {
      newSelected.add(toolName);
    }
    setSelectedTools(newSelected);
  };

  const getImplementationTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'database': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'email': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'api-call': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'file-operation': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'calculation': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'custom': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[type] || colors.custom;
  };

  if (!currentResource || currentResource.contentType !== 'rawHtml') {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Info className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">AI Assistant is only available for Raw HTML content</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Automatically detect tools and generate working implementations
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Button */}
        {!analysis && !isAnalyzing && (
          <Button
            onClick={handleAnalyze}
            className="w-full gap-2"
            variant="default"
          >
            <Wand2 className="h-4 w-4" />
            Analyze HTML & Detect Tools
          </Button>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing HTML...</p>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !isAnalyzing && (
          <>
            {/* Insights */}
            {analysis.insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detected Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Inferred Tools */}
            {analysis.inferredTools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Suggested Tools ({analysis.inferredTools.length})</span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedTools.size} selected
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.inferredTools.map((tool) => {
                    const isSelected = selectedTools.has(tool.toolName);
                    const hasImplementation = generatedImplementations.has(tool.toolName);
                    const hasFailed = failedTools.has(tool.toolName);
                    const isRetrying = retryingTool === tool.toolName;
                    const failureInfo = failedTools.get(tool.toolName);

                    return (
                      <div
                        key={tool.toolName}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          hasFailed
                            ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                            : isSelected
                            ? 'border-primary bg-primary/5 cursor-pointer'
                            : 'border-transparent bg-muted/50 hover:bg-muted cursor-pointer'
                        }`}
                        onClick={() => !hasFailed && toggleToolSelection(tool.toolName)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <code className="text-sm font-mono bg-background px-2 py-0.5 rounded">
                                {tool.toolName}
                              </code>
                              <Badge className={getImplementationTypeColor(tool.implementationType)}>
                                {tool.implementationType}
                              </Badge>
                              {hasImplementation && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Check className="h-3 w-3 mr-1" />
                                  Generated
                                </Badge>
                              )}
                              {hasFailed && failureInfo && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <X className="h-3 w-3 mr-1" />
                                  Failed (Attempt {failureInfo.attempts})
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{tool.purpose}</p>

                            {/* Error message */}
                            {hasFailed && failureInfo && (
                              <div className="mt-2 text-xs text-red-600 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                                <strong>Error:</strong> {failureInfo.error}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {hasImplementation ? (
                              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            ) : hasFailed ? (
                              <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                                <X className="h-3 w-3 text-white" />
                              </div>
                            ) : isSelected ? (
                              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Parameters */}
                        {tool.parameters.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <strong>Parameters:</strong> {tool.parameters.map(p => p.name).join(', ')}
                          </div>
                        )}

                        {/* Retry button for failed tools */}
                        {hasFailed && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetryTool(tool.toolName);
                              }}
                              disabled={isRetrying}
                              className="w-full gap-2 border-red-300 hover:bg-red-50"
                            >
                              {isRetrying ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Retrying...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="h-3 w-3" />
                                  Try Again
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Confidence */}
                        {!hasFailed && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${tool.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(tool.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
                <CardContent className="pt-4 space-y-2">
                  {analysis.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {!generatedImplementations.size && selectedTools.size > 0 && (
                <Button
                  onClick={handleGenerateImplementations}
                  disabled={isGenerating || selectedTools.size === 0}
                  className="w-full gap-2"
                  variant="default"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Implementations...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generate Working Code ({selectedTools.size} tools)
                    </>
                  )}
                </Button>
              )}

              {generatedImplementations.size > 0 && (
                <>
                  {failedTools.size > 0 && (
                    <div className="text-xs text-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded border border-yellow-200">
                      <strong>Note:</strong> {failedTools.size} tool{failedTools.size > 1 ? 's' : ''} failed to generate.
                      Only {generatedImplementations.size} successful tool{generatedImplementations.size > 1 ? 's' : ''} will be added.
                    </div>
                  )}
                  <Button
                    onClick={handleAcceptSuggestions}
                    disabled={generatedImplementations.size === 0}
                    className="w-full gap-2"
                    variant="default"
                  >
                    <Check className="h-4 w-4" />
                    Accept & Add to Builder ({generatedImplementations.size} successful)
                  </Button>
                </>
              )}

              <Button
                onClick={() => {
                  setAnalysis(null);
                  setGeneratedImplementations(new Map());
                  setFailedTools(new Map());
                  setSelectedTools(new Set());
                }}
                className="w-full gap-2"
                variant="outline"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
