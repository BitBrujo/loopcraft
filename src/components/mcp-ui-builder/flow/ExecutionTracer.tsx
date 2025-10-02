"use client";

import { useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';

interface ExecutionStep {
  id: string;
  type: 'server' | 'tool' | 'ui' | 'action' | 'handler';
  label: string;
  description: string;
  timestamp: number;
  data?: unknown;
}

export function ExecutionTracer() {
  const { mcpContext, actionMappings } = useUIBuilderStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate execution steps from current state
  const steps: ExecutionStep[] = [];

  // Step 1: Server initialization
  mcpContext.selectedServers.forEach((serverName) => {
    steps.push({
      id: `server-${serverName}`,
      type: 'server',
      label: `Initialize ${serverName}`,
      description: 'MCP server connects and registers capabilities',
      timestamp: Date.now(),
    });
  });

  // Step 2: Tool registration
  mcpContext.selectedTools.forEach((tool) => {
    steps.push({
      id: `tool-${tool.name}`,
      type: 'tool',
      label: `Register ${tool.name}`,
      description: `Tool from ${tool.serverName} becomes available`,
      timestamp: Date.now(),
      data: tool.inputSchema,
    });
  });

  // Step 3: UI render
  steps.push({
    id: 'ui-render',
    type: 'ui',
    label: 'Render UI Resource',
    description: 'UI component is displayed to user',
    timestamp: Date.now(),
  });

  // Step 4-5: User interactions and tool calls
  actionMappings.forEach((mapping) => {
    steps.push({
      id: `action-${mapping.id}`,
      type: 'action',
      label: `User clicks ${mapping.uiElementId}`,
      description: `Triggers action mapped to ${mapping.toolName}`,
      timestamp: Date.now(),
      data: mapping.parameterBindings,
    });

    steps.push({
      id: `handler-${mapping.id}`,
      type: 'handler',
      label: `Handle response`,
      description: `${mapping.responseHandler} processes tool result`,
      timestamp: Date.now(),
    });
  });

  const handlePlay = () => {
    setIsPlaying(true);
    // Simple auto-advance through steps
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  if (steps.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-sm">No execution steps</p>
          <p className="text-xs">Add action mappings to see execution flow</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card">
      {/* Header */}
      <div className="border-b p-3">
        <h4 className="font-semibold text-sm mb-2">Execution Tracer</h4>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={currentStep >= steps.length - 1}
            className="h-7 w-7 p-0"
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 w-7 p-0"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStepBack}
            disabled={currentStep === 0}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStepForward}
            disabled={currentStep >= steps.length - 1}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Current step info */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="text-sm font-semibold">{currentStepData?.label}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {currentStepData?.description}
          </div>
        </div>

        {/* Step data */}
        {currentStepData?.data ? (
          <div>
            <div className="text-xs font-semibold mb-1">Data:</div>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(currentStepData.data, null, 2)}
            </pre>
          </div>
        ) : null}

        {/* Timeline */}
        <div>
          <div className="text-xs font-semibold mb-2">Timeline:</div>
          <div className="space-y-1">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 text-xs p-2 rounded ${
                  index === currentStep
                    ? 'bg-primary/10 border border-primary'
                    : index < currentStep
                    ? 'bg-muted/50 text-muted-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    index === currentStep
                      ? 'bg-primary'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-muted-foreground/30'
                  }`}
                />
                <div className="flex-1">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-2 text-xs text-muted-foreground text-center">
        Simulation mode - click Play to step through execution
      </div>
    </div>
  );
}
