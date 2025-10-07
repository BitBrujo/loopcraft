'use client';

import {
  BuilderSuggestion,
  Capability,
  DetectedEntity,
  ConversationPhase,
} from '@/types/conversational-builder';
import { ServerConfig } from '@/types/server-builder';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle } from 'lucide-react';

interface BuildStatusPanelProps {
  phase: ConversationPhase;
  entities: DetectedEntity[];
  capabilities: Capability[];
  suggestions: BuilderSuggestion[];
  serverConfig: ServerConfig;
  onAcceptSuggestion: (suggestionId: string) => void;
  onDeploy?: () => void;
  canDeploy?: boolean;
}

export function BuildStatusPanel({
  phase,
  entities,
  capabilities,
  suggestions,
  serverConfig,
  onAcceptSuggestion,
  onDeploy,
  canDeploy = false,
}: BuildStatusPanelProps) {
  const phaseConfig = {
    discovery: {
      title: '🔍 Discovery',
      description: 'Understanding your needs',
      color: 'bg-blue-500/10 text-blue-500',
    },
    drafting: {
      title: '✏️ Drafting',
      description: 'Building configuration',
      color: 'bg-yellow-500/10 text-yellow-500',
    },
    ui_design: {
      title: '🎨 UI Design',
      description: 'Creating interface',
      color: 'bg-purple-500/10 text-purple-500',
    },
    refinement: {
      title: '⚡ Refinement',
      description: 'Improving server',
      color: 'bg-orange-500/10 text-orange-500',
    },
    deployment: {
      title: '🚀 Deployment',
      description: 'Ready to deploy',
      color: 'bg-green-500/10 text-green-500',
    },
  };

  const currentPhase = phaseConfig[phase];

  // Calculate readiness
  const hasName = serverConfig.name.length > 0;
  const hasTools = serverConfig.tools.length > 0;
  const hasResources = serverConfig.resources.length > 0;
  const requirementsMet = [hasName, hasTools, hasResources].filter(Boolean).length;
  const totalRequirements = 3;

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
                Your MCP server is configured and ready to test.
              </p>
              <Button
                onClick={onDeploy}
                className="w-full animate-pulse"
                variant="default"
                size="lg"
              >
                Deploy & Test Server
              </Button>
            </Card>
          )}

          {/* Readiness Checklist */}
          {!canDeploy && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Server Readiness</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {hasName ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={hasName ? 'text-foreground' : 'text-muted-foreground'}>
                    Name: {hasName ? `"${serverConfig.name}"` : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {hasTools ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className={hasTools ? 'text-foreground' : 'text-muted-foreground'}>
                    Tools: {serverConfig.tools.length} added
                    {!hasTools && ' (need at least 1)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {hasResources ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className={hasResources ? 'text-foreground' : 'text-muted-foreground'}>
                    Resources: {serverConfig.resources.length} added
                    {!hasResources && ' (need at least 1)'}
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

          {/* Recent Additions */}
          {(serverConfig.tools.length > 0 || serverConfig.resources.length > 0) && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 text-sm">Recent Additions</h3>
              <div className="space-y-2">
                {[
                  ...serverConfig.tools.slice(-3).map((t) => ({
                    type: 'tool' as const,
                    name: t.name,
                    category: t.category,
                  })),
                  ...serverConfig.resources.slice(-3).map((r) => ({
                    type: 'resource' as const,
                    name: r.name,
                    category: r.category,
                  })),
                ]
                  .slice(-5)
                  .reverse()
                  .map((item, idx) => (
                    <div
                      key={`${item.type}-${item.name}-${idx}`}
                      className="flex items-center justify-between p-2 rounded bg-muted/50 animate-in slide-in-from-right duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={item.type === 'tool' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.type}
                        </Badge>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                    </div>
                  ))}
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

          {/* Detected Entities */}
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
