import { UIResourceRenderer, UIActionResult, isUIResource } from "@mcp-ui/client";
import { useCallback } from "react";

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
}

export const MCPUIRenderer: React.FC<MCPUIRendererProps> = ({ content }) => {
  const handleUIAction = useCallback(async (result: UIActionResult) => {
    console.log("MCP UI Action:", result);

    if (result.type === 'tool') {
      console.log(`Tool call from UI: ${result.payload.toolName}`, result.payload.params);
      // TODO: Handle tool calls from UI components
      // This could trigger new API calls or update the conversation
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
  }, []);

  // Check if this content is a UI resource using the official utility
  if (!isUIResource(content)) {
    return null;
  }

  const resource = content.resource;
  if (!resource) {
    return null;
  }

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
          }}
        />
      </div>
    </div>
  );
};

// Tool component that specifically handles MCP UI resources
export const MCPUITool = ({ result }: { result: unknown }) => {
  // Use the official isUIResource utility to check if this is a UI resource
  if (!isUIResource(result)) {
    return null;
  }

  return <MCPUIRenderer content={result as MCPUIRendererProps['content']} />;
};