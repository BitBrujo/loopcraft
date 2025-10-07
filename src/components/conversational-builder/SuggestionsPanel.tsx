'use client';

import {
  BuilderSuggestion,
  ClarificationQuestion,
  Capability,
  DetectedEntity,
  ConversationPhase,
} from '@/types/conversational-builder';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface SuggestionsPanelProps {
  phase: ConversationPhase;
  entities: DetectedEntity[];
  capabilities: Capability[];
  questions: ClarificationQuestion[];
  suggestions: BuilderSuggestion[];
  onAnswerQuestion: (questionId: string, answer: string) => void;
  onAcceptSuggestion: (suggestionId: string) => void;
  onDeploy?: () => void;
  canDeploy?: boolean;
}

export function SuggestionsPanel({
  phase,
  entities,
  capabilities,
  questions,
  suggestions,
  onAnswerQuestion,
  onAcceptSuggestion,
  onDeploy,
  canDeploy = false,
}: SuggestionsPanelProps) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Insights</h2>
          <Badge className={currentPhase.color}>{currentPhase.title}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{currentPhase.description}</p>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="p-4 space-y-4">
          {/* Deployment Section */}
        {canDeploy && (
          <Card className="p-4 bg-green-500/10 border-green-500/20">
            <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">
              Ready to Deploy! 🎉
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Your MCP server is configured and ready to test.
            </p>
            <Button onClick={onDeploy} className="w-full" variant="default">
              Deploy & Test Server
            </Button>
          </Card>
        )}

        {/* Questions Section */}
        {questions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Questions</h3>
            {questions.map((question) => (
              <Card key={question.id} className="p-3">
                <p className="text-sm font-medium mb-2">{question.question}</p>
                {question.suggestedAnswers && question.suggestedAnswers.length > 0 ? (
                  <div className="space-y-1">
                    {question.suggestedAnswers.map((answer) => (
                      <Button
                        key={answer}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onAnswerQuestion(question.id, answer)}
                      >
                        {answer}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Input
                    placeholder="Type your answer..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onAnswerQuestion(question.id, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                )}
              </Card>
            ))}
          </div>
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
      </ScrollArea>
    </div>
  );
}
