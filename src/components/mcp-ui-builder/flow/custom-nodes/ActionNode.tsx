import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { MousePointerClick } from 'lucide-react';

interface ActionNodeData {
  label: string;
  elementId: string;
  elementType: string;
  toolName: string;
}

export const ActionNode = memo(({ data }: { data: ActionNodeData }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-orange-50 border-2 border-orange-400 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-600" />
      <div className="flex items-center gap-2">
        <MousePointerClick className="h-4 w-4 text-orange-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-orange-900">{data.label}</div>
          <div className="text-xs text-orange-600 capitalize">
            {data.elementType} → {data.toolName}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-600" />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
