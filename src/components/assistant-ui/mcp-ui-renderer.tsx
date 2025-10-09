import { UIResourceRenderer, UIActionResult, isUIResource } from "@mcp-ui/client";
import { useCallback, useRef, useEffect } from "react";

interface MCPUIRendererProps {
  content: {
    type?: string;
    resource?: {
      uri?: string;
      mimeType?: string;
      text?: string;
      blob?: string;
      _meta?: Record<string, unknown>;
    };
  };
  serverName?: string; // Server name for tool calls
}

export const MCPUIRenderer: React.FC<MCPUIRendererProps> = ({ content, serverName }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Find iframe element after render
  useEffect(() => {
    const iframe = document.querySelector('iframe[data-mcp-ui-resource]') as HTMLIFrameElement;
    if (iframe) {
      iframeRef.current = iframe;
    }
  }, [content]);

  const handleUIAction = useCallback(async (result: UIActionResult) => {
    console.log("🔔 MCP UI Action received:", result);
    console.log("🔔 Action type:", result.type);
    console.log("🔔 Payload:", result.payload);

    if (result.type === 'tool') {
      console.log(`🔧 Tool call from UI: ${result.payload.toolName}`, result.payload.params);

      // Execute tool call via API
      if (!serverName) {
        console.error('No server name provided for tool call');
        return { status: 'error', error: 'Server name not available' };
      }

      try {
        // Get JWT token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Call the tool via API
        const response = await fetch('/api/mcp/call-tool', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            serverName,
            toolName: result.payload.toolName,
            arguments: result.payload.params || {}
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Tool call failed:', errorData);

          // Post error back to iframe
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
              type: 'mcp-ui-tool-response',
              error: errorData.error || 'Tool call failed'
            }, '*');
          }

          return { status: 'error', error: errorData.error };
        }

        const toolResult = await response.json();
        console.log('Tool call result:', toolResult);

        // Post result back to iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'mcp-ui-tool-response',
            result: toolResult
          }, '*');
        }

        // Return the result so @mcp-ui/client can also handle it
        return toolResult;
      } catch (error) {
        console.error('Error calling tool:', error);

        // Post error back to iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'mcp-ui-tool-response',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, '*');
        }

        return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
      }
    } else if (result.type === 'prompt') {
      console.log(`Prompt from UI:`, result.payload.prompt);
      // TODO: Handle prompts from UI components
    } else if (result.type === 'link') {
      console.log(`Link from UI:`, result.payload.url);
      // Handle link clicks from UI components
      window.open(result.payload.url, '_blank');
    } else if (result.type === 'intent') {
      console.log(`Intent from UI:`, result.payload.intent);
      // TODO: Handle intents from UI components
    } else if (result.type === 'notify') {
      console.log(`Notification from UI:`, result.payload.message);
      // TODO: Handle notifications from UI components
    }

    return { status: 'handled' };
  }, [serverName]);

  // Type guard to ensure content has required properties
  if (!content || !content.type || !content.resource) {
    return null;
  }

  // Check if this content is a UI resource using the official utility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!isUIResource(content as any)) {
    return null;
  }

  const resource = content.resource;
  if (!resource) {
    return null;
  }

  // Extract metadata from resource
  const preferredSize = resource._meta?.['mcpui.dev/ui-preferred-frame-size'] as [string, string] | undefined;
  const initialData = resource._meta?.['mcpui.dev/ui-initial-render-data'] as Record<string, unknown> | undefined;

  return (
    <div className="mcp-ui-container border rounded-lg p-4 my-4 bg-card">
      <div className="mcp-ui-header text-sm text-muted-foreground mb-2">
        Interactive MCP Component
      </div>
      <div className="mcp-ui-content">
        <UIResourceRenderer
          resource={resource}
          onUIAction={handleUIAction}
          htmlProps={{
            autoResizeIframe: true,
            sandboxPermissions: 'allow-forms allow-scripts allow-same-origin',
            // Pass initial render data from metadata
            iframeRenderData: initialData,
            // Use preferred size if specified in metadata
            style: preferredSize ? {
              width: preferredSize[0],
              height: preferredSize[1],
            } : undefined,
          }}
        />
      </div>
    </div>
  );
};

// Tool component that specifically handles MCP UI resources
export const MCPUITool = ({ result }: { result: unknown }) => {
  // Use the official isUIResource utility to check if this is a UI resource
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!isUIResource(result as any)) {
    return null;
  }

  return <MCPUIRenderer content={result as MCPUIRendererProps['content']} />;
};