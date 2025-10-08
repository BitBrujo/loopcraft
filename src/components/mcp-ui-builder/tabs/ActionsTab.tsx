"use client";

import { useEffect, useState } from "react";
import { ArrowRight, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { ActionMapper } from "../actions/ActionMapper";
import { ParameterBindingEditor } from "../actions/ParameterBindingEditor";
import { CustomToolsEditor } from "../actions/CustomToolsEditor";
import { AIAssistantPanel } from "../AIAssistantPanel";
import { validateActionMappingsDebounced, isValidationValid, getValidationSummary } from "@/lib/validation-engine";

export function ActionsTab() {
  const {
    currentResource,
    customTools,
    serverTools,
    isLoadingServerTools,
    serverToolsError,
    connectedServerName,
    fetchServerTools,
    clearServerTools,
    actionMappings,
    validationStatus,
    setValidationStatus,
    setActiveTab,
  } = useUIBuilderStore();

  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [isAIAssistantExpanded, setIsAIAssistantExpanded] = useState(true);
  const [isServerToolsExpanded, setIsServerToolsExpanded] = useState(true);

  // Auto-validate on changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      // Convert customTools to MCPTool format for validation
      const toolsForValidation = customTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object',
          properties: Object.fromEntries(
            tool.parameters.map(p => [
              p.name,
              {
                type: p.type,
                description: p.description,
              }
            ])
          ),
          required: tool.parameters.filter(p => p.required).map(p => p.name),
        },
        serverName: 'custom',
      }));

      validateActionMappingsDebounced(
        actionMappings,
        currentResource.content,
        toolsForValidation,
        (status) => {
          setValidationStatus(status);
        },
        300,
        currentResource.templatePlaceholders
      );
    }
  }, [actionMappings, currentResource, customTools, setValidationStatus]);

  // Fetch server tools when connected server changes
  useEffect(() => {
    if (connectedServerName) {
      fetchServerTools(connectedServerName);
    } else {
      clearServerTools();
    }
  }, [connectedServerName, fetchServerTools, clearServerTools]);

  // Auto-select first mapping when mappings change
  useEffect(() => {
    if (actionMappings.length > 0 && !selectedMappingId) {
      setSelectedMappingId(actionMappings[0].id);
    } else if (actionMappings.length === 0) {
      setSelectedMappingId(null);
    } else if (selectedMappingId && !actionMappings.find(m => m.id === selectedMappingId)) {
      // Selected mapping was deleted, select first available
      setSelectedMappingId(actionMappings[0]?.id || null);
    }
  }, [actionMappings, selectedMappingId]);

  // Validation must pass and at least one mapping must exist
  const canProceed = isValidationValid(validationStatus) && actionMappings.length > 0;
  const validationSummary = getValidationSummary(validationStatus);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* AI Assistant Section - Collapsible */}
      <div className="border-b bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
        <button
          onClick={() => setIsAIAssistantExpanded(!isAIAssistantExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <span className="text-xs text-muted-foreground">
              (Auto-detect tools & generate implementations)
            </span>
          </div>
          {isAIAssistantExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {isAIAssistantExpanded && (
          <div className="max-h-[600px] overflow-auto border-t">
            <AIAssistantPanel />
          </div>
        )}
      </div>

      {/* Server Tools Section - Collapsible (only shown when server connected) */}
      {connectedServerName && (
        <div className="border-b bg-blue-50/30 dark:bg-blue-950/10">
          <button
            onClick={() => setIsServerToolsExpanded(!isServerToolsExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Server Tools</h3>
              <span className="text-xs text-muted-foreground">
                (from &quot;{connectedServerName}&quot;)
              </span>
              {isLoadingServerTools && (
                <span className="text-xs text-blue-600">Loading...</span>
              )}
              {!isLoadingServerTools && serverTools.length > 0 && (
                <span className="text-xs text-green-600">
                  {serverTools.length} available
                </span>
              )}
            </div>
            {isServerToolsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {isServerToolsExpanded && (
            <div className="max-h-[400px] overflow-auto border-t">
              <div className="p-4 space-y-3">
                {isLoadingServerTools && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">Loading tools from {connectedServerName}...</div>
                  </div>
                )}
                {serverToolsError && (
                  <div className="text-center py-8">
                    <div className="text-sm text-red-600">
                      Error: {serverToolsError}
                    </div>
                  </div>
                )}
                {!isLoadingServerTools && !serverToolsError && serverTools.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">No tools found in {connectedServerName}</div>
                  </div>
                )}
                {!isLoadingServerTools && !serverToolsError && serverTools.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      These tools are from your connected MCP server. Use them in action mappings below.
                    </p>
                    {serverTools.map((tool, index) => (
                      <div
                        key={`${tool.serverName}-${tool.name}-${index}`}
                        className="p-3 border rounded-lg bg-white dark:bg-gray-900"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{tool.name}</h4>
                              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                Read-only
                              </span>
                            </div>
                            {tool.description && (
                              <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                            )}
                            {tool.inputSchema && typeof tool.inputSchema === 'object' && 'properties' in tool.inputSchema && (
                              <div className="mt-2 text-xs">
                                <span className="text-muted-foreground">
                                  Parameters: {Object.keys((tool.inputSchema as { properties?: Record<string, unknown> }).properties || {}).join(', ') || 'none'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Tools Section - Collapsible */}
      <div className="border-b">
        <button
          onClick={() => setIsToolsExpanded(!isToolsExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Custom Tools</h3>
            <span className="text-xs text-muted-foreground">
              ({customTools.length} defined)
            </span>
          </div>
          {isToolsExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {isToolsExpanded && (
          <div className="max-h-[400px] overflow-auto border-t">
            <CustomToolsEditor />
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Action Mapper (70% height) */}
        <div className="h-[70%] border-b overflow-hidden">
          <ActionMapper />
        </div>

        {/* Bottom area split: Parameter binding + Validation */}
        <div className="h-[30%] flex overflow-hidden">
          {/* Parameter Binding Editor (70% width if mapping selected) */}
          {selectedMappingId && (
            <div className="flex-1 border-r overflow-hidden">
              <ParameterBindingEditor mappingId={selectedMappingId} />
            </div>
          )}

          {/* Validation Panel */}
          <div className={`${selectedMappingId ? 'w-80' : 'flex-1'} overflow-auto bg-muted/30`}>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Validation Status</h4>
                <div className="flex items-center gap-2">
                  {isValidationValid(validationStatus) ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        {validationSummary}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">
                        {validationSummary}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Errors */}
              {validationStatus.missingMappings.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-red-600 mb-1">Errors</h5>
                  <div className="space-y-1">
                    {validationStatus.missingMappings.map((msg, i) => (
                      <div key={i} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {msg}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type Mismatches */}
              {validationStatus.typeMismatches.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-red-600 mb-1">Type Mismatches</h5>
                  <div className="space-y-1">
                    {validationStatus.typeMismatches.map((mismatch, i) => (
                      <div key={i} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        <strong>{mismatch.field}:</strong> Expected {mismatch.expected}, got {mismatch.actual}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationStatus.warnings.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-yellow-600 mb-1">Warnings</h5>
                  <div className="space-y-1">
                    {validationStatus.warnings.map((warning, i) => (
                      <div key={i} className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with navigation */}
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {canProceed ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                All validations passed
              </span>
            ) : actionMappings.length === 0 ? (
              <span className="text-muted-foreground">
                Add action mappings to continue
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Fix validation errors to continue
              </span>
            )}
          </div>
          <Button
            onClick={() => setActiveTab('generate')}
            disabled={!canProceed}
            className="gap-2"
          >
            Next: Generate Code
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
