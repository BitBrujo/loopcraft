"use client";

import { useState } from 'react';
import { PlayIcon, LoaderIcon, AlertCircleIcon, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUIBuilderStore, type ActionMapping } from '@/lib/stores/ui-builder-store';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface TestRunnerProps {
  onTestComplete: (mappingId: string, result: { success: boolean; result?: unknown; error?: string; duration?: number }) => void;
}

export function TestRunner({ onTestComplete }: TestRunnerProps) {
  const { actionMappings, addTestResult } = useUIBuilderStore();
  const [selectedMapping, setSelectedMapping] = useState<ActionMapping | null>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; result?: unknown; error?: string; duration?: number } | null>(null);

  const handleSelectMapping = (mapping: ActionMapping) => {
    setSelectedMapping(mapping);
    setLastResult(null);

    // Initialize test parameters with empty values
    const params: Record<string, string> = {};
    Object.keys(mapping.parameterBindings).forEach(key => {
      params[key] = '';
    });
    setTestParams(params);
  };

  const handleRunTest = async () => {
    if (!selectedMapping) return;

    setIsRunning(true);
    const startTime = Date.now();

    try {
      // Resolve parameter bindings
      const resolvedParams: Record<string, string> = {};
      for (const [key, binding] of Object.entries(selectedMapping.parameterBindings)) {
        if (binding.startsWith('field:')) {
          // For field bindings, use the test parameter value
          resolvedParams[key] = testParams[key] || '';
        } else {
          // Static value
          resolvedParams[key] = binding;
        }
      }

      // Call the real MCP tool
      const response = await fetch('/api/mcp/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverName: selectedMapping.serverName,
          toolName: selectedMapping.toolName,
          args: resolvedParams,
        }),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      setLastResult(data);

      // Add to test history
      addTestResult({
        timestamp: new Date(),
        actionMappingId: selectedMapping.id,
        status: data.success ? 'success' : 'error',
        request: resolvedParams,
        response: data.result,
        error: data.error,
        duration,
      });

      onTestComplete(selectedMapping.id, data);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setLastResult({ success: false, error: errorMessage });

      addTestResult({
        timestamp: new Date(),
        actionMappingId: selectedMapping.id,
        status: 'error',
        request: testParams,
        error: errorMessage,
        duration,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const updateTestParam = (key: string, value: string) => {
    setTestParams(prev => ({ ...prev, [key]: value }));
  };

  if (actionMappings.length === 0) {
    return (
      <div className="h-full flex flex-col border-r border-border bg-card/30">
        <div className="border-b border-border bg-card/50 p-4">
          <h3 className="text-sm font-medium">Test Runner</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Execute real MCP tool calls
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircleIcon className="size-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No action mappings to test
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure actions in the Actions tab first
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-r border-border bg-card/30">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4">
        <h3 className="text-sm font-medium">Test Runner</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select an action mapping to test
        </p>
      </div>

      {/* Mapping Selector */}
      <div className="border-b border-border p-4 space-y-2">
        <Label>Action to Test</Label>
        <ScrollArea className="h-32 border border-border rounded-lg">
          <div className="p-2 space-y-2">
            {actionMappings.map(mapping => (
              <button
                key={mapping.id}
                onClick={() => handleSelectMapping(mapping)}
                className={cn(
                  "w-full text-left p-2 rounded-md border transition-all text-sm",
                  selectedMapping?.id === mapping.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">
                    {mapping.uiElementLabel || mapping.uiElementId}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {mapping.uiElementType}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {mapping.toolName}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Test Parameters */}
      {selectedMapping && (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <InfoIcon className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-600">
                This will call the real MCP server. Ensure test data won&apos;t cause unwanted side effects.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Tool Information</h4>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="text-muted-foreground">Server:</span>
                  <Badge variant="outline">{selectedMapping.serverName}</Badge>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">Tool:</span>
                  <Badge variant="outline">{selectedMapping.toolName}</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Test Parameters</h4>
              <div className="space-y-3">
                {Object.entries(selectedMapping.parameterBindings).map(([key, binding]) => {
                  const isStatic = !binding.startsWith('field:');
                  return (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={`param-${key}`} className="text-xs">
                        {key}
                        {isStatic && (
                          <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0">
                            static: {binding}
                          </Badge>
                        )}
                      </Label>
                      {!isStatic && (
                        <Input
                          id={`param-${key}`}
                          placeholder={`Enter value for ${binding.slice(6)}`}
                          value={testParams[key] || ''}
                          onChange={(e) => updateTestParam(key, e.target.value)}
                          className="h-8 text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleRunTest}
              disabled={isRunning}
              className="w-full gap-2"
            >
              {isRunning ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <PlayIcon className="size-4" />
                  Run Test
                </>
              )}
            </Button>

            {/* Last Result */}
            {lastResult && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Last Result</h4>
                <div className={cn(
                  "p-3 rounded-lg border text-xs",
                  lastResult.success
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={lastResult.success ? "default" : "destructive"}>
                      {lastResult.success ? 'SUCCESS' : 'ERROR'}
                    </Badge>
                    {lastResult.duration && (
                      <span className="text-muted-foreground">{lastResult.duration}ms</span>
                    )}
                  </div>
                  <div className="h-48 border border-border rounded-md overflow-hidden">
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      value={JSON.stringify(lastResult, null, 2)}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 11,
                        lineNumbers: 'off',
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
