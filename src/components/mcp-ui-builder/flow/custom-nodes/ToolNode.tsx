import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Wrench } from 'lucide-react';

interface ToolNodeData {
  label: string;
  toolName: string;
  serverName: string;
  description?: string;
  paramCount: number;
}

export const ToolNode = memo(({ data }: { data: ToolNodeData }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-400 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-600" />
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-purple-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-purple-900">{data.label}</div>
          <div className="text-xs text-purple-600">
            {data.paramCount} param{data.paramCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-600" />
    </div>
  );
});

ToolNode.displayName = 'ToolNode';
