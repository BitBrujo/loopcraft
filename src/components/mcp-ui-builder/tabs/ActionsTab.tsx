"use client";

import { useEffect, useState } from "react";
import { ArrowRight, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { ActionMapper } from "../actions/ActionMapper";
import { ParameterBindingEditor } from "../actions/ParameterBindingEditor";
import { validateActionMappingsDebounced, isValidationValid, getValidationSummary } from "@/lib/validation-engine";

export function ActionsTab() {
  const {
    currentResource,
    customTools,
    actionMappings,
    validationStatus,
    setValidationStatus,
    setActiveTab,
    uiMode,
  } = useUIBuilderStore();

  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);

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
        currentResource.templatePlaceholders,
        uiMode
      );
    }
  }, [actionMappings, currentResource, customTools, setValidationStatus, uiMode]);

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

  // In readonly mode, action mappings are optional; in interactive mode, validation must pass
  const canProceed = uiMode === 'readonly'
    ? true // Always allow proceeding in readonly mode
    : isValidationValid(validationStatus) && actionMappings.length > 0;
  const validationSummary = getValidationSummary(validationStatus);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Read-Only Mode Info Banner */}
      {uiMode === 'readonly' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                Read-only mode: No user interactions configured
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Your UI is display-only. Switch to Interactive mode to map UI elements like buttons and forms to MCP tools.
              </p>
            </div>
          </div>
        </div>
      )}

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
            {uiMode === 'readonly' ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {actionMappings.length > 0
                  ? `${actionMappings.length} mapping${actionMappings.length !== 1 ? 's' : ''} defined (optional)`
                  : 'Mappings optional in read-only mode'}
              </span>
            ) : canProceed ? (
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
