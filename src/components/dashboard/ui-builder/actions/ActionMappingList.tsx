"use client";

import { EditIcon, TrashIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { cn } from '@/lib/utils';

interface ActionMappingListProps {
  onEditMapping: (elementId: string) => void;
}

export function ActionMappingList({ onEditMapping }: ActionMappingListProps) {
  const { actionMappings, removeActionMapping, validationIssues } = useUIBuilderStore();

  const getMappingValidation = (mappingId: string) => {
    const issues = validationIssues.filter(issue => issue.location === mappingId);
    const hasErrors = issues.some(i => i.severity === 'error');
    const hasWarnings = issues.some(i => i.severity === 'warning');
    return { hasErrors, hasWarnings, issues };
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this action mapping?')) {
      removeActionMapping(id);
    }
  };

  if (actionMappings.length === 0) {
    return (
      <div className="h-full flex flex-col border-l border-border bg-card/30">
        <div className="border-b border-border bg-card/50 p-4">
          <h3 className="text-sm font-medium">Action Mappings</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Configured: 0
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircleIcon className="size-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No action mappings yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Select an element and configure its action
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l border-border bg-card/30">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4">
        <h3 className="text-sm font-medium">Action Mappings</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Configured: {actionMappings.length}
        </p>
      </div>

      {/* Mappings List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {actionMappings.map((mapping) => {
            const validation = getMappingValidation(mapping.id);
            const paramCount = Object.keys(mapping.parameterBindings).length;

            return (
              <div
                key={mapping.id}
                className={cn(
                  "border rounded-lg p-3 bg-card transition-all",
                  validation.hasErrors && "border-red-500",
                  validation.hasWarnings && !validation.hasErrors && "border-yellow-500"
                )}
              >
                {/* Element Info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {mapping.uiElementLabel || mapping.uiElementId}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {mapping.uiElementType}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {mapping.uiElementId}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditMapping(mapping.uiElementId)}
                      className="size-7 p-0"
                    >
                      <EditIcon className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mapping.id)}
                      className="size-7 p-0 text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Tool Info */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Tool:</span>
                    <Badge variant="outline" className="text-xs">
                      {mapping.toolName}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {mapping.serverName}
                    </Badge>
                  </div>

                  {/* Parameters */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Parameters:</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {paramCount}
                    </Badge>
                  </div>

                  {/* Response Handler */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Handler:</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {mapping.responseHandler}
                    </Badge>
                  </div>

                  {/* Validation Status */}
                  <div className="flex items-center gap-2 pt-1">
                    {validation.hasErrors ? (
                      <>
                        <AlertCircleIcon className="size-3 text-red-600" />
                        <span className="text-xs text-red-600">
                          {validation.issues.filter(i => i.severity === 'error').length} error(s)
                        </span>
                      </>
                    ) : validation.hasWarnings ? (
                      <>
                        <AlertCircleIcon className="size-3 text-yellow-600" />
                        <span className="text-xs text-yellow-600">
                          {validation.issues.filter(i => i.severity === 'warning').length} warning(s)
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="size-3 text-green-600" />
                        <span className="text-xs text-green-600">Valid</span>
                      </>
                    )}
                  </div>

                  {/* Validation Issues */}
                  {validation.issues.length > 0 && (
                    <div className="mt-2 space-y-1 pt-2 border-t border-border">
                      {validation.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className={cn(
                            "text-xs p-2 rounded-md",
                            issue.severity === 'error' && "bg-red-500/10 text-red-600",
                            issue.severity === 'warning' && "bg-yellow-500/10 text-yellow-600",
                            issue.severity === 'info' && "bg-blue-500/10 text-blue-600"
                          )}
                        >
                          {issue.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
