"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UIResource } from "@/types/ui-builder";

interface ExportDialogProps {
  onClose: () => void;
  resource: UIResource | null;
}

type ExportFormat = "typescript" | "json" | "curl";

function generateTypeScriptCode(resource: UIResource): string {
  const contentParam =
    resource.contentType === "rawHtml"
      ? `content: { type: 'rawHtml', htmlString: \`${resource.content}\` }`
      : resource.contentType === "externalUrl"
      ? `content: { type: 'externalUrl', iframeUrl: "${resource.content}" }`
      : `content: {
    type: 'remoteDom',
    script: \`${resource.content}\`,
    framework: 'react'
  }`;

  const hasMetadata = resource.title || resource.description;
  const metadataParam = hasMetadata
    ? `metadata: {
    ${resource.title ? `title: "${resource.title}",` : ""}
    ${resource.description ? `description: "${resource.description}"` : ""}
  },`
    : "";

  const hasUiMetadata = resource.preferredSize || resource.initialData;
  const uiMetadataParam = hasUiMetadata
    ? `uiMetadata: {
    ${resource.preferredSize ? `'preferred-frame-size': ['${resource.preferredSize.width}px', '${resource.preferredSize.height}px'],` : ""}
    ${resource.initialData ? `'initial-render-data': ${JSON.stringify(resource.initialData)}` : ""}
  }`
    : "";

  return `import { createUIResource } from '@mcp-ui/server';

const uiResource = createUIResource({
  uri: "${resource.uri}",
  ${contentParam},
  encoding: 'text',${hasMetadata ? `\n  ${metadataParam}` : ""}${hasUiMetadata ? `\n  ${uiMetadataParam}` : ""}
});

export default uiResource;`;
}

function generateJSON(resource: UIResource): string {
  return JSON.stringify(resource, null, 2);
}

function generateCurl(resource: UIResource): string {
  return `# Example curl command to return this UI resource from an MCP tool

curl -X POST http://localhost:3000/api/your-tool \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(resource, null, 2)}'`;
}

export function ExportDialog({ onClose, resource }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("typescript");
  const [copied, setCopied] = useState(false);

  if (!resource) {
    return null;
  }

  const code =
    format === "typescript"
      ? generateTypeScriptCode(resource)
      : format === "json"
      ? generateJSON(resource)
      : generateCurl(resource);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Export Code</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Format tabs */}
        <div className="flex gap-1 p-2 border-b bg-muted/30">
          <button
            className={`px-4 py-2 text-sm rounded ${
              format === "typescript"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("typescript")}
          >
            TypeScript
          </button>
          <button
            className={`px-4 py-2 text-sm rounded ${
              format === "json"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("json")}
          >
            JSON
          </button>
          <button
            className={`px-4 py-2 text-sm rounded ${
              format === "curl"
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-background/50"
            }`}
            onClick={() => setFormat("curl")}
          >
            cURL Example
          </button>
        </div>

        {/* Code display */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
