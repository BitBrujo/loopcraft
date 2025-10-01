"use client";

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { MousePointerClickIcon, WrenchIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

// Custom node component for UI elements
function UIElementNode({ data }: { data: { label: string; type: string } }) {
  return (
    <div className="px-4 py-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 min-w-[160px]">
      <div className="flex items-center gap-2 mb-1">
        <MousePointerClickIcon className="size-4 text-blue-600" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-muted-foreground">{data.type}</div>
    </div>
  );
}

// Custom node component for tools
function ToolNode({ data }: { data: { label: string; server: string; paramCount: number } }) {
  return (
    <div className="px-4 py-3 rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-950 min-w-[160px]">
      <div className="flex items-center gap-2 mb-1">
        <WrenchIcon className="size-4 text-purple-600" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-muted-foreground">{data.server}</div>
      {data.paramCount > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          {data.paramCount} parameter{data.paramCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// Custom node component for handlers
function HandlerNode({ data }: { data: { label: string; handler: string } }) {
  return (
    <div className="px-4 py-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 min-w-[160px]">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircleIcon className="size-4 text-green-600" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-muted-foreground">{data.handler}</div>
    </div>
  );
}

const nodeTypes = {
  uiElement: UIElementNode,
  tool: ToolNode,
  handler: HandlerNode,
};

interface FlowDiagramProps {
  onNodeClick?: (nodeId: string) => void;
}

export function FlowDiagram({ onNodeClick }: FlowDiagramProps) {
  const { actionMappings, validationIssues } = useUIBuilderStore();

  // Generate nodes and edges from action mappings
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (actionMappings.length === 0) {
      return { nodes, edges };
    }

    // Calculate layout positions
    const nodeSpacingX = 280;
    const nodeSpacingY = 120;
    const startX = 100;
    const startY = 100;

    actionMappings.forEach((mapping, index) => {
      const yOffset = index * nodeSpacingY;
      const hasError = validationIssues.some(
        issue => issue.location === mapping.id && issue.severity === 'error'
      );

      // UI Element node
      const elementNodeId = `element-${mapping.id}`;
      nodes.push({
        id: elementNodeId,
        type: 'uiElement',
        position: { x: startX, y: startY + yOffset },
        data: {
          label: mapping.uiElementLabel || mapping.uiElementId,
          type: mapping.uiElementType,
        },
      });

      // Tool node
      const toolNodeId = `tool-${mapping.id}`;
      nodes.push({
        id: toolNodeId,
        type: 'tool',
        position: { x: startX + nodeSpacingX, y: startY + yOffset },
        data: {
          label: mapping.toolName,
          server: mapping.serverName,
          paramCount: Object.keys(mapping.parameterBindings).length,
        },
      });

      // Handler node
      const handlerNodeId = `handler-${mapping.id}`;
      nodes.push({
        id: handlerNodeId,
        type: 'handler',
        position: { x: startX + nodeSpacingX * 2, y: startY + yOffset },
        data: {
          label: 'Response',
          handler: mapping.responseHandler,
        },
      });

      // Edges
      edges.push({
        id: `edge-${elementNodeId}-${toolNodeId}`,
        source: elementNodeId,
        target: toolNodeId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: hasError ? '#ef4444' : '#a855f7', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: hasError ? '#ef4444' : '#a855f7',
        },
        label: 'triggers',
        labelStyle: { fontSize: 10 },
      });

      edges.push({
        id: `edge-${toolNodeId}-${handlerNodeId}`,
        source: toolNodeId,
        target: handlerNodeId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: hasError ? '#ef4444' : '#22c55e', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: hasError ? '#ef4444' : '#22c55e',
        },
        label: 'responds',
        labelStyle: { fontSize: 10 },
      });
    });

    return { nodes, edges };
  }, [actionMappings, validationIssues]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when action mappings change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      // Extract mapping ID from node ID
      const mappingId = node.id.split('-').slice(1).join('-');
      onNodeClick(mappingId);
    }
  }, [onNodeClick]);

  if (actionMappings.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-card/30">
        <div className="text-center">
          <XCircleIcon className="size-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No action mappings to visualize
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Configure actions in the Actions tab to see the flow
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-card/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'uiElement':
                return '#3b82f6';
              case 'tool':
                return '#a855f7';
              case 'handler':
                return '#22c55e';
              default:
                return '#888';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.3)"
        />
      </ReactFlow>
    </div>
  );
}
