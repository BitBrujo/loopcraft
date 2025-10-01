import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Code } from 'lucide-react';

interface HandlerNodeData {
  label: string;
  handlerType: string;
  elementId: string;
}

export const HandlerNode = memo(({ data }: { data: HandlerNodeData }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-pink-50 border-2 border-pink-400 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-pink-600" />
      <div className="flex items-center gap-2">
        <Code className="h-4 w-4 text-pink-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-pink-900 capitalize">
            {data.label.replace('-', ' ')}
          </div>
          <div className="text-xs text-pink-600">Response Handler</div>
        </div>
      </div>
    </div>
  );
});

HandlerNode.displayName = 'HandlerNode';
