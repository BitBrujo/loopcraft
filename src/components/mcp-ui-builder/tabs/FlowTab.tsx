"use client";

import { useMemo } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { FlowVisualizer } from '../flow/FlowVisualizer';
import { ExecutionTracer } from '../flow/ExecutionTracer';
import { generateFlow, getFlowStatistics } from '@/lib/flow-generator';

export function FlowTab() {
  const { mcpContext, actionMappings, currentResource, setActiveTab } = useUIBuilderStore();

  // Generate flow diagram
  const flowData = useMemo(() => {
    return generateFlow({
      mcpContext,
      actionMappings,
      currentResource,
    });
  }, [mcpContext, actionMappings, currentResource]);

  const stats = useMemo(() => {
    return getFlowStatistics({
      mcpContext,
      actionMappings,
      currentResource,
    });
  }, [mcpContext, actionMappings, currentResource]);

  if (actionMappings.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p>No action mappings configured</p>
            <p className="text-sm">Go to Actions tab to configure UI → tool mappings</p>
          </div>
        </div>
        <div className="border-t bg-card p-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setActiveTab('test')} className="gap-2">
              Skip to Testing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Flow Visualizer (70% width) */}
        <div className="flex-1 border-r">
          <FlowVisualizer
            initialNodes={flowData.nodes}
            initialEdges={flowData.edges}
          />
        </div>

        {/* Execution Tracer (30% width) */}
        <div className="w-80">
          <ExecutionTracer />
        </div>
      </div>

      {/* Footer with stats and navigation */}
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Flow: {stats.serverCount} servers, {stats.toolCount} tools, {stats.actionCount} actions
          </div>
          <Button onClick={() => setActiveTab('test')} className="gap-2">
            Next: Test Integration
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
