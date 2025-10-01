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

    try {
      if (result.type === 'tool') {
        console.log(`Tool call from UI: ${result.payload.toolName}`, result.payload.params);

        // Execute the tool call via API
        const response = await fetch('/api/mcp/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName: result.payload.toolName,
            params: result.payload.params,
          }),
        });

        const data = await response.json();

        if (data.success) {
          console.log('Tool execution result:', data.result);
          return {
            status: 'success',
            data: data.result,
            messageId: result.messageId
          };
        } else {
          console.error('Tool execution failed:', data.error);
          return {
            status: 'error',
            error: data.error,
            messageId: result.messageId
          };
        }
      } else if (result.type === 'prompt') {
        console.log(`Prompt from UI:`, result.payload.prompt);
        // Inject the prompt into the conversation
        // This would need integration with the chat runtime
        return {
          status: 'success',
          message: 'Prompt received - integrate with runtime to add to conversation',
          messageId: result.messageId
        };
      } else if (result.type === 'link') {
        console.log(`Link from UI:`, result.payload.url);
        window.open(result.payload.url, '_blank');
        return {
          status: 'success',
          messageId: result.messageId
        };
      } else if (result.type === 'intent') {
        console.log(`Intent from UI:`, result.payload.intent);
        return {
          status: 'success',
          message: 'Intent received',
          messageId: result.messageId
        };
      } else if (result.type === 'notify') {
        console.log(`Notification from UI:`, result.payload.message);
        // Could integrate with a toast/notification system
        return {
          status: 'success',
          messageId: result.messageId
        };
      }
    } catch (error) {
      console.error('Error handling UI action:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: result.messageId
      };
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
            supportedContentTypes={['rawHtml', 'externalUrl', 'remoteDom']}
            htmlProps={{
              autoResizeIframe: true,
            }}
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