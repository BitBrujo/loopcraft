'use client';

import { useState, useEffect } from 'react';
import { useServerBuilderStore } from '@/lib/stores/server-builder-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Lightbulb,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Info,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export function SuggestionsPanel() {
  const {
    relationships,
    warnings,
    isAnalyzing,
    serverConfig,
    analyzeDependencies,
    acceptSuggestion,
    dismissRelationship,
  } = useServerBuilderStore();

  const [useAI, setUseAI] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  // Auto-analyze when config changes
  useEffect(() => {
    if (
      autoAnalyze &&
      serverConfig &&
      (serverConfig.tools.length > 0 || (serverConfig.resources?.length || 0) > 0)
    ) {
      const timer = setTimeout(() => {
        analyzeDependencies(useAI);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    }
  }, [serverConfig, autoAnalyze, useAI, analyzeDependencies]);

  const handleAccept = (relationshipId: string, suggestionId: string) => {
    acceptSuggestion(relationshipId, suggestionId);
    // Re-analyze after accepting
    if (autoAnalyze) {
      setTimeout(() => analyzeDependencies(useAI), 500);
    }
  };

  const handleDismiss = (relationshipId: string) => {
    dismissRelationship(relationshipId);
  };

  const handleRefresh = () => {
    analyzeDependencies(useAI);
  };

  if (!serverConfig) {
    return null;
  }

  const hasSuggestions = relationships.length > 0 || warnings.length > 0;

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Smart Suggestions</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* AI Toggle */}
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            id="use-ai"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="use-ai" className="flex items-center gap-1 cursor-pointer">
            <Sparkles className="h-3 w-3" />
            Use AI Analysis
          </label>
        </div>

        {/* Auto-analyze Toggle */}
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            id="auto-analyze"
            checked={autoAnalyze}
            onChange={(e) => setAutoAnalyze(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="auto-analyze" className="cursor-pointer">
            Auto-analyze changes
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Warnings</h4>
            {warnings.map((warning, idx) => (
              <Card key={idx} className="p-3">
                <div className="flex items-start gap-2">
                  {warning.severity === 'warning' ? (
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  )}
                  <p className="text-sm flex-1">{warning.message}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Relationships/Suggestions */}
        {relationships.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Suggested Components
            </h4>
            {relationships.map((relationship) => {
              const relationshipId = `${relationship.type}-${relationship.sourceId}`;

              return (
                <Card key={relationshipId} className="p-3 space-y-3">
                  {/* Relationship Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        {relationship.analysisMethod === 'ai' ? '🤖 AI ' : '📊 '}
                        Based on: <span className="font-medium">{relationship.sourceName}</span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(relationshipId)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    {relationship.suggestions.map((suggestion, idx) => (
                      <div
                        key={`${relationshipId}-${suggestion.id}-${idx}`}
                        className="flex items-start gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {suggestion.name}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                suggestion.type === 'tool'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {suggestion.type === 'tool' ? '🔧' : '📦'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.reason}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${suggestion.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(relationshipId, suggestion.id)}
                          className="h-7 px-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isAnalyzing && !hasSuggestions && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No suggestions available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add tools or resources to get started
            </p>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {useAI ? 'AI is analyzing...' : 'Analyzing...'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          {relationships.length} suggestions • {warnings.length} warnings
        </p>
      </div>
    </div>
  );
}
