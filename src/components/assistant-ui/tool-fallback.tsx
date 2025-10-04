import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { isUIResource } from "@mcp-ui/client";
import { Button } from "@/components/ui/button";
import { MCPUIRenderer } from "./mcp-ui-renderer";

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Extract UI resource from MCP tool result if present
  // Check for special wrapper format from chat API
  let uiResource: unknown = null;

  // Try to parse as prefixed JSON string (wrapped format from chat API)
  if (typeof result === 'string') {
    // Check for "__MCP_UI_RESOURCE__:" prefix
    if (result.startsWith("__MCP_UI_RESOURCE__:")) {
      try {
        const jsonString = result.substring("__MCP_UI_RESOURCE__:".length);
        const parsed = JSON.parse(jsonString);

        // Direct UIResource format: {type: "resource", resource: {...}}
        if (parsed && typeof parsed === 'object' && parsed.type === 'resource' && parsed.resource) {
          uiResource = parsed; // Keep full structure for MCPUIRenderer
        }
        // MCP response format: {content: [{type: "resource", resource: {...}}]}
        else if (parsed && typeof parsed === 'object' && 'content' in parsed) {
          const content = parsed.content;
          if (Array.isArray(content) && content.length > 0) {
            const firstContent = content[0] as { type?: string; resource?: unknown };
            if (firstContent.type === "resource" && firstContent.resource) {
              uiResource = firstContent; // Keep full structure for MCPUIRenderer
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse MCP UI resource:", e);
      }
    }
    // Legacy format check
    else {
      try {
        const parsed = JSON.parse(result);
        if (parsed && typeof parsed === 'object' && '__mcp_ui_resource__' in parsed) {
          const wrappedData = parsed.data;
          if (wrappedData && typeof wrappedData === 'object' && 'content' in wrappedData) {
            const content = wrappedData.content;
            if (Array.isArray(content) && content.length > 0) {
              const firstContent = content[0] as { type?: string; resource?: unknown };
              if (firstContent.type === "resource" && firstContent.resource) {
                uiResource = firstContent; // Keep full structure
              }
            }
          }
        }
      } catch {
        // Not JSON, continue
      }
    }
  }

  // Check for object format
  if (!uiResource && result && typeof result === 'object') {
    // Check for wrapped MCP UI resource
    if ('__mcp_ui_resource__' in result && (result as { __mcp_ui_resource__: boolean }).__mcp_ui_resource__) {
      const wrappedData = (result as { data: unknown }).data;
      if (wrappedData && typeof wrappedData === 'object' && 'content' in wrappedData) {
        const content = (wrappedData as { content: unknown }).content;
        if (Array.isArray(content) && content.length > 0) {
          const firstContent = content[0] as { type?: string; resource?: unknown };
          if (firstContent.type === "resource" && firstContent.resource) {
            uiResource = firstContent; // Keep full structure
          }
        }
      }
    }
    // Check for direct MCP format
    else if ('content' in result) {
      const content = (result as { content: unknown }).content;
      if (Array.isArray(content) && content.length > 0) {
        const firstContent = content[0] as { type?: string; resource?: unknown };
        if (firstContent.type === "resource" && firstContent.resource) {
          uiResource = firstContent; // Keep full structure
        }
      }
    }
  }

  // Check if extracted resource is a UI resource using the official utility
  if (uiResource && typeof uiResource === 'object' && isUIResource(uiResource as never)) {
    // Extract server name from tool name (format: mcp_{serverName}_{toolName})
    let serverName: string | undefined;
    if (toolName.startsWith('mcp_')) {
      const parts = toolName.split('_');
      if (parts.length >= 2) {
        serverName = parts[1]; // Extract server name
      }
    }

    return (
      <div className="aui-tool-fallback-root mb-4 w-full">
        <MCPUIRenderer content={uiResource} serverName={serverName} />
        {/* Optional: Show tool details in collapsed form */}
        <div className="mt-2 text-xs text-muted-foreground">
          <details>
            <summary className="cursor-pointer">Tool: {toolName}</summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs">{argsText}</pre>
          </details>
        </div>
      </div>
    );
  }

  // Default tool fallback UI for non-UI resources
  return (
    <div className="aui-tool-fallback-root mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
      <div className="aui-tool-fallback-header flex items-center gap-2 px-4">
        <CheckIcon className="aui-tool-fallback-icon size-4" />
        <p className="aui-tool-fallback-title flex-grow">
          Used tool: <b>{toolName}</b>
        </p>
        <Button onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      </div>
      {!isCollapsed && (
        <div className="aui-tool-fallback-content flex flex-col gap-2 border-t pt-2">
          <div className="aui-tool-fallback-args-root px-4">
            <pre className="aui-tool-fallback-args-value whitespace-pre-wrap">
              {argsText}
            </pre>
          </div>
          {result !== undefined && (
            <div className="aui-tool-fallback-result-root border-t border-dashed px-4 pt-2">
              <p className="aui-tool-fallback-result-header font-semibold">
                Result:
              </p>
              <pre className="aui-tool-fallback-result-content whitespace-pre-wrap">
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
