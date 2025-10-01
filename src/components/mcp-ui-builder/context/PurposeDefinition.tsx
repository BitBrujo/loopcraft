"use client";

import { FileText } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";

const MAX_LENGTH = 500;

export function PurposeDefinition() {
  const { mcpContext, setPurpose } = useUIBuilderStore();

  const handleChange = (value: string) => {
    if (value.length <= MAX_LENGTH) {
      setPurpose(value);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <h3 className="font-semibold text-sm">Purpose & Description</h3>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Describe what this UI component will do and how it will integrate with the selected MCP tools.
        </p>

        <textarea
          value={mcpContext.purpose}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Example: This UI will allow users to search files using the filesystem MCP server and display results in a table format. Users can click on a file to view its contents..."
          className="w-full px-3 py-2 text-sm border rounded-md resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Help define the scope and functionality of your UI</span>
          <span>
            {mcpContext.purpose.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}
