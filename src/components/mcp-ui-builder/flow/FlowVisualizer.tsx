"use client";

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ServerNode } from './custom-nodes/ServerNode';
import { ToolNode } from './custom-nodes/ToolNode';
import { UINode } from './custom-nodes/UINode';
import { ActionNode } from './custom-nodes/ActionNode';
import { HandlerNode } from './custom-nodes/HandlerNode';

interface FlowVisualizerProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

const nodeTypes = {
  serverNode: ServerNode,
  toolNode: ToolNode,
  uiNode: UINode,
  actionNode: ActionNode,
  handlerNode: HandlerNode,
};

export function FlowVisualizer({ initialNodes, initialEdges }: FlowVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when props change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className="h-full w-full bg-muted/10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'serverNode':
                return '#93c5fd';
              case 'toolNode':
                return '#d8b4fe';
              case 'uiNode':
                return '#86efac';
              case 'actionNode':
                return '#fdba74';
              case 'handlerNode':
                return '#f9a8d4';
              default:
                return '#cbd5e1';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
        />
      </ReactFlow>
    </div>
  );
}
