/**
 * Flow Generator for MCP-UI Builder
 *
 * Generates React Flow diagram nodes and edges from builder state.
 * Uses Dagre for automatic hierarchical layout.
 */

import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { MCPContext, ActionMapping, UIResource } from '@/types/ui-builder';

export interface FlowGeneratorInput {
  mcpContext: MCPContext;
  actionMappings: ActionMapping[];
  currentResource: UIResource | null;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

/**
 * Generate flow diagram from builder state
 */
export function generateFlow(input: FlowGeneratorInput): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const { mcpContext, actionMappings, currentResource } = input;

  // Generate Server Nodes
  const serverNodes = mcpContext.selectedServers.map((serverName, index) => {
    const id = `server-${serverName}`;
    nodes.push({
      id,
      type: 'serverNode',
      position: { x: 0, y: 0 }, // Will be positioned by Dagre
      data: {
        label: serverName,
        serverName,
        status: 'connected',
      },
    });
    return id;
  });

  // Generate Tool Nodes
  const toolNodes = mcpContext.selectedTools.map((tool, index) => {
    const id = `tool-${tool.serverName}-${tool.name}`;
    nodes.push({
      id,
      type: 'toolNode',
      position: { x: 0, y: 0 },
      data: {
        label: tool.name,
        toolName: tool.name,
        serverName: tool.serverName,
        description: tool.description,
        paramCount: tool.inputSchema
          ? Object.keys((tool.inputSchema as { properties?: object }).properties || {}).length
          : 0,
      },
    });

    // Connect tool to server
    const serverId = `server-${tool.serverName}`;
    if (serverNodes.includes(serverId)) {
      edges.push({
        id: `${serverId}-${id}`,
        source: serverId,
        target: id,
        type: 'smoothstep',
        animated: false,
      });
    }

    return id;
  });

  // Generate UI Node
  if (currentResource) {
    const uiId = 'ui-resource';
    nodes.push({
      id: uiId,
      type: 'uiNode',
      position: { x: 0, y: 0 },
      data: {
        label: 'UI Resource',
        uri: currentResource.uri,
        contentType: currentResource.contentType,
      },
    });

    // Connect UI to all tools (tools provide data to UI)
    toolNodes.forEach(toolId => {
      edges.push({
        id: `${toolId}-${uiId}`,
        source: toolId,
        target: uiId,
        type: 'smoothstep',
        animated: false,
      });
    });
  }

  // Generate Action Nodes
  const actionNodes = actionMappings.map((mapping, index) => {
    const id = `action-${mapping.id}`;
    nodes.push({
      id,
      type: 'actionNode',
      position: { x: 0, y: 0 },
      data: {
        label: mapping.uiElementId,
        elementId: mapping.uiElementId,
        elementType: mapping.uiElementType,
        toolName: mapping.toolName,
      },
    });

    // Connect UI to action
    if (currentResource) {
      edges.push({
        id: `ui-resource-${id}`,
        source: 'ui-resource',
        target: id,
        type: 'smoothstep',
        animated: true,
        label: 'user interaction',
      });
    }

    // Connect action to corresponding tool
    const toolId = `tool-${mapping.serverName}-${mapping.toolName}`;
    if (toolNodes.includes(toolId)) {
      edges.push({
        id: `${id}-${toolId}`,
        source: id,
        target: toolId,
        type: 'smoothstep',
        animated: true,
        label: 'tool call',
      });
    }

    return id;
  });

  // Generate Handler Nodes
  const handlerNodes = actionMappings.map((mapping, index) => {
    const id = `handler-${mapping.id}`;
    nodes.push({
      id,
      type: 'handlerNode',
      position: { x: 0, y: 0 },
      data: {
        label: mapping.responseHandler,
        handlerType: mapping.responseHandler,
        elementId: mapping.uiElementId,
      },
    });

    // Connect action to handler
    const actionId = `action-${mapping.id}`;
    edges.push({
      id: `${actionId}-${id}`,
      source: actionId,
      target: id,
      type: 'smoothstep',
      animated: true,
      label: 'response',
    });

    return id;
  });

  // Apply Dagre layout
  const layoutedGraph = getLayoutedElements(nodes, edges);

  return {
    nodes: layoutedGraph.nodes,
    edges: layoutedGraph.edges,
  };
}

/**
 * Apply Dagre layout algorithm
 */
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Get flow statistics
 */
export function getFlowStatistics(input: FlowGeneratorInput) {
  const { mcpContext, actionMappings } = input;

  return {
    serverCount: mcpContext.selectedServers.length,
    toolCount: mcpContext.selectedTools.length,
    actionCount: actionMappings.length,
    handlerCount: actionMappings.length,
    totalNodes: mcpContext.selectedServers.length + mcpContext.selectedTools.length + 1 + actionMappings.length * 2,
  };
}
