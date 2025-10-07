'use client';

import {
  BuilderSuggestion,
  Capability,
  DetectedEntity,
  ConversationPhase,
} from '@/types/conversational-builder';
import { UIResource } from '@/types/ui-builder';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle } from 'lucide-react';

interface BuildStatusPanelProps {
  phase: ConversationPhase;
  entities: DetectedEntity[];
  capabilities: Capability[];
  suggestions: BuilderSuggestion[];
  uiResource: UIResource;
  onAcceptSuggestion: (suggestionId: string) => void;
  onDeploy?: () => void;
  canDeploy?: boolean;
}

export function BuildStatusPanel({
  phase,
  entities,
  capabilities,
  suggestions,
  uiResource,
  onAcceptSuggestion,
  onDeploy,
  canDeploy = false,
}: BuildStatusPanelProps) {
  const phaseConfig = {
    discovery: {
      title: '🔍 Discovery',
      description: 'Understanding your UI needs',
      color: 'bg-blue-500/10 text-blue-500',
    },
    design: {
      title: '🎨 Design',
      description: 'Generating HTML',
      color: 'bg-purple-500/10 text-purple-500',
    },
    actions: {
      title: '⚡ Actions',
      description: 'Mapping interactions',
      color: 'bg-orange-500/10 text-orange-500',
    },
    refinement: {
      title: '✨ Refinement',
      description: 'Improving UI',
      color: 'bg-yellow-500/10 text-yellow-500',
    },
    deployment: {
      title: '🚀 Deployment',
      description: 'Ready to deploy',
      color: 'bg-green-500/10 text-green-500',
    },
  };

  const currentPhase = phaseConfig[phase];

  // Calculate UI readiness
  // Handle both string and object content types for backward compatibility
  const content = uiResource.content;
  const htmlContent = typeof content === 'string'
    ? content
    : (content as { type?: string; htmlString?: string }).type === 'rawHtml'
      ? (content as { type?: string; htmlString?: string }).htmlString || ''
      : '';
  const hasHTML = htmlContent.length > 50;
  const hasTitle = (typeof uiResource.metadata?.title === 'string' ? uiResource.metadata.title.length : 0) > 0;
  const requirementsMet = [hasHTML, hasTitle].filter(Boolean).length;
  const totalRequirements = 2;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Build Status</h2>
          <Badge className={currentPhase.color}>{currentPhase.title}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{currentPhase.description}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Deployment Button - Top Priority */}
          {canDeploy && (
            <Card className="p-4 bg-green-500/10 border-green-500/20 animate-in fade-in duration-300">
              <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400 flex items-center gap-2">
                <Check className="h-5 w-5" />
                Ready to Deploy! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your UI component is ready to test.
              </p>
              <Button
                onClick={onDeploy}
                className="w-full animate-pulse"
                variant="default"
                size="lg"
              >
                Deploy & Test UI
              </Button>
            </Card>
          )}

          {/* Readiness Checklist */}
          {!canDeploy && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">UI Readiness</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {hasTitle ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={hasTitle ? 'text-foreground' : 'text-muted-foreground'}>
                    Title: {hasTitle ? `"${uiResource.metadata?.title}"` : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {hasHTML ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className={hasHTML ? 'text-foreground' : 'text-muted-foreground'}>
                    HTML: {hasHTML ? 'Generated' : 'Not yet generated'}
                    {!hasHTML && ' (need HTML content)'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {requirementsMet}/{totalRequirements} requirements met
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(requirementsMet / totalRequirements) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* UI Features */}
          {hasHTML && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 text-sm">UI Features</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">Content Type</span>
                  <Badge variant="outline" className="text-xs">
                    {uiResource.contentType}
                  </Badge>
                </div>
                {uiResource.templatePlaceholders && uiResource.templatePlaceholders.length > 0 && (
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">Placeholders</span>
                    <Badge variant="default" className="text-xs">
                      {uiResource.templatePlaceholders.length} dynamic
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Suggestions Section */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Suggestions</h3>
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(suggestion.confidence * 100)}% match
                        </span>
                      </div>
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full mt-2"
                    onClick={() => onAcceptSuggestion(suggestion.id)}
                  >
                    {suggestion.actionLabel}
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Detected Elements */}
          {entities.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Detected</h3>
              <div className="flex flex-wrap gap-2">
                {entities.map((entity, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {entity.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Capabilities */}
          {capabilities.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Capabilities</h3>
              <div className="space-y-1">
                {capabilities.map((capability) => (
                  <div
                    key={capability.id}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                  >
                    <span>{capability.name}</span>
                    <Badge variant={capability.implemented ? 'default' : 'outline'} className="text-xs">
                      {capability.implemented ? 'Added' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
