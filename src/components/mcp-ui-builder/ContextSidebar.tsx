"use client";

import { useState } from "react";
import { Wrench, AlertCircle, CheckCircle, ChevronDown, ChevronRight, TestTube, Sparkles } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";

export function ContextSidebar() {
  const {
    currentResource,
    customTools,
    actionMappings,
    validationStatus,
    isTestServerActive,
    testServerName,
    stopTestServer,
    setActiveTab,
  } = useUIBuilderStore();

  const [showTools, setShowTools] = useState(true);
  const [showAgentSlots, setShowAgentSlots] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [showTestServer, setShowTestServer] = useState(true);
  const [isStopping, setIsStopping] = useState(false);

  const agentSlots = currentResource?.templatePlaceholders || [];
  const actionMappingsCount = actionMappings.length;
  const warningsCount = validationStatus.warnings.length;
  const errorsCount = validationStatus.missingMappings.length + validationStatus.typeMismatches.length;

  const handleStopTestServer = async () => {
    setIsStopping(true);
    try {
      // Call API to delete test server
      const testServerId = useUIBuilderStore.getState().testServerId;
      if (testServerId) {
        await fetch(`/api/mcp-servers/${testServerId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }
      stopTestServer();
    } catch (error) {
      console.error('Failed to stop test server:', error);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="w-64 border-r bg-card overflow-y-auto flex flex-col h-full">
      <div className="sticky top-0 bg-card border-b p-3 z-10">
        <h3 className="font-semibold text-sm">Context</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Build status and resources
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Custom Tools Section */}
        <div className="border-b">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-left"
            onClick={() => setShowTools(!showTools)}
          >
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="text-sm font-medium">Custom Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {customTools.length}
              </span>
              {showTools ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </button>
          {showTools && (
            <div className="p-3 pt-0 space-y-2">
              {customTools.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No tools defined. Go to Define Tools tab to create tools.
                </p>
              ) : (
                customTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="text-xs p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800"
                  >
                    <div className="font-medium text-purple-700 dark:text-purple-300">
                      {tool.name}
                    </div>
                    <div className="text-purple-600 dark:text-purple-400 text-[10px] mt-1">
                      {tool.parameters.length} parameter{tool.parameters.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Agent-Fillable Slots Section */}
        <div className="border-b">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-left"
            onClick={() => setShowAgentSlots(!showAgentSlots)}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Agent Slots</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {agentSlots.length}
              </span>
              {showAgentSlots ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </button>
          {showAgentSlots && (
            <div className="p-3 pt-0 space-y-2">
              {agentSlots.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No agent placeholders detected. Use {`{{placeholder}}`} syntax in your HTML.
                </p>
              ) : (
                agentSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800"
                  >
                    <div className="font-mono text-blue-700 dark:text-blue-300">
                      {`{{${slot}}}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Mappings Section */}
        <div className="border-b">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-left"
            onClick={() => setShowActions(!showActions)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Action Mappings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {actionMappingsCount}
              </span>
              {showActions ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </button>
          {showActions && (
            <div className="p-3 pt-0 space-y-2">
              {actionMappingsCount === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No actions configured
                </p>
              ) : (
                actionMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="text-xs p-2 bg-muted/30 rounded"
                  >
                    <div className="font-medium">{mapping.uiElementId}</div>
                    <div className="text-muted-foreground text-[10px]">
                      → {mapping.toolName}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Validation Status Section */}
        <div className="border-b">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-left"
            onClick={() => setShowStatus(!showStatus)}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <div className="flex items-center gap-2">
              {errorsCount > 0 && (
                <span className="text-xs text-red-500">{errorsCount}</span>
              )}
              {warningsCount > 0 && (
                <span className="text-xs text-yellow-500">{warningsCount}</span>
              )}
              {showStatus ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </button>
          {showStatus && (
            <div className="p-3 pt-0 space-y-2">
              {errorsCount === 0 && warningsCount === 0 ? (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>All checks passed</span>
                </div>
              ) : (
                <>
                  {validationStatus.missingMappings.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-red-600">
                        Missing Mappings:
                      </div>
                      {validationStatus.missingMappings.map((msg, i) => (
                        <div
                          key={i}
                          className="text-xs text-red-500 pl-2 cursor-pointer hover:underline"
                          onClick={() => setActiveTab('actions')}
                        >
                          • {msg}
                        </div>
                      ))}
                    </div>
                  )}
                  {validationStatus.typeMismatches.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-red-600">
                        Type Mismatches:
                      </div>
                      {validationStatus.typeMismatches.map((mismatch, i) => (
                        <div
                          key={i}
                          className="text-xs text-red-500 pl-2 cursor-pointer hover:underline"
                          onClick={() => setActiveTab('actions')}
                        >
                          • {mismatch.field}: expected {mismatch.expected}, got {mismatch.actual}
                        </div>
                      ))}
                    </div>
                  )}
                  {validationStatus.warnings.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-yellow-600">
                        Warnings:
                      </div>
                      {validationStatus.warnings.map((warning, i) => (
                        <div key={i} className="text-xs text-yellow-600 pl-2">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Test Server Section */}
        {isTestServerActive && (
          <div className="border-b">
            <button
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-left"
              onClick={() => setShowTestServer(!showTestServer)}
            >
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Test Server</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-300 rounded-full">
                  Active
                </span>
                {showTestServer ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
            </button>
            {showTestServer && (
              <div className="p-3 pt-0 space-y-3">
                <div className="text-xs p-2 bg-green-500/10 rounded border border-green-500/20">
                  <div className="font-medium text-green-700 dark:text-green-300">
                    {testServerName}
                  </div>
                  <div className="text-green-600 dark:text-green-400 text-[10px] mt-1">
                    Test server is running
                  </div>
                </div>
                <Button
                  onClick={handleStopTestServer}
                  disabled={isStopping}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isStopping ? 'Stopping...' : 'Stop Test Server'}
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
