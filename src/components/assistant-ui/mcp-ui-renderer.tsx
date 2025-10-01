import { UIResourceRenderer, UIActionResult } from "@mcp-ui/client";
import { useCallback } from "react";

interface MCPUIRendererProps {
  content: {
    type?: string;
    resource?: {
      uri?: string;
      mimeType?: string;
      text?: string;
      htmlString?: string;
    };
    content?: Array<{
      type: string;
      resource?: {
        uri?: string;
        mimeType?: string;
        text?: string;
      };
    }>;
  };
}

export const MCPUIRenderer: React.FC<MCPUIRendererProps> = ({ content }) => {
  const handleResourceAction = useCallback(async (result: UIActionResult) => {
    console.log("MCP UI Action:", result);

    if (result.type === 'tool') {
      console.log(`Tool call from UI: ${result.payload.toolName}`, result.payload.params);
      // Handle tool calls from UI components
      // This could trigger new API calls or update the conversation
    } else if (result.type === 'prompt') {
      console.log(`Prompt from UI:`, result.payload.prompt);
      // Handle prompts from UI components
    } else if (result.type === 'link') {
      console.log(`Link from UI:`, result.payload.url);
      // Handle link clicks from UI components
      window.open(result.payload.url, '_blank');
    } else if (result.type === 'intent') {
      console.log(`Intent from UI:`, result.payload.intent);
      // Handle intents from UI components
    } else if (result.type === 'notify') {
      console.log(`Notification from UI:`, result.payload.message);
      // Handle notifications from UI components
    }

    return { status: 'Action received by client' };
  }, []);

  // Check if this content is a UI resource
  if (content?.type === 'ui-resource' && content.resource) {
    const resource = content.resource;

    // Create a mock MCP response structure for UIResourceRenderer
    const mcpResponse = {
      content: [
        {
          type: 'resource',
          resource: {
            uri: resource.uri || 'ui://dynamic-content',
            mimeType: resource.mimeType || 'text/html',
            text: resource.text || resource.htmlString || JSON.stringify(resource),
          },
        },
      ],
    };

    return (
      <div className="mcp-ui-container border rounded-lg p-4 my-4 bg-card">
        <div className="mcp-ui-header text-sm text-muted-foreground mb-2">
          Interactive MCP Component
        </div>
        <div className="mcp-ui-content">
          <UIResourceRenderer
            resource={mcpResponse.content[0].resource}
            onUIAction={handleResourceAction}
          />
        </div>
      </div>
    );
  }

  // If it's not a UI resource, don't render anything
  return null;
};

// Tool component that specifically handles MCP UI resources
export const MCPUITool = ({ result }: { result: unknown }) => {
  // Check if this tool result contains UI resources
  const resultObj = result as { type?: string; content?: Array<{ type: string; resource?: { uri?: string } }> };
  const hasUIResource = resultObj?.type === 'ui-resource' ||
                        (resultObj?.content && Array.isArray(resultObj.content) &&
                         resultObj.content.some((item) =>
                           item.type === 'resource' && item.resource?.uri?.startsWith('ui://')));

  if (!hasUIResource) {
    return null;
  }

  return <MCPUIRenderer content={result as MCPUIRendererProps['content']} />;
};