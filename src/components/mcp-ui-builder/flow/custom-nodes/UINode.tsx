import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Layout } from 'lucide-react';

interface UINodeData {
  label: string;
  uri: string;
  contentType: string;
}

export const UINode = memo(({ data }: { data: UINodeData }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-400 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-600" />
      <div className="flex items-center gap-2">
        <Layout className="h-4 w-4 text-green-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-green-900">{data.label}</div>
          <div className="text-xs text-green-600 capitalize">{data.contentType}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-600" />
    </div>
  );
});

UINode.displayName = 'UINode';
