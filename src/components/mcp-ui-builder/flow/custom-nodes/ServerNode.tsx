import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Server } from 'lucide-react';

interface ServerNodeData {
  label: string;
  serverName: string;
  status: 'connected' | 'disconnected';
}

export const ServerNode = memo(({ data }: { data: ServerNodeData }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-50 border-2 border-blue-400 min-w-[180px]">
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-blue-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-blue-900">{data.label}</div>
          <div className="text-xs text-blue-600">MCP Server</div>
        </div>
        <div
          className={`h-2 w-2 rounded-full ${
            data.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-600" />
    </div>
  );
});

ServerNode.displayName = 'ServerNode';
