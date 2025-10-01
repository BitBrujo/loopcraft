"use client";

import { useState, useCallback } from 'react';
import { RefreshCwIcon, CodeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { createHtmlUIResource, createExternalUrlUIResource, createRemoteDomUIResource } from '@/lib/mcp-ui-helpers';
import { UIResourceRenderer } from '@mcp-ui/client';

export function PreviewPanel() {
  const { currentResource, previewKey, refreshPreview } = useUIBuilderStore();
  const [actionLog, setActionLog] = useState<Array<{ time: string; type: string; payload: unknown }>>([]);
  const [showLog, setShowLog] = useState(false);

  // Create UI resource based on current draft
  const uiResource = useCallback(() => {
    try {
      if (currentResource.contentType === 'rawHtml') {
        return createHtmlUIResource({
          uri: currentResource.uri as `ui://${string}`,
          htmlString: currentResource.content,
          title: currentResource.title,
          description: currentResource.description,
          preferredSize: currentResource.preferredSize,
          initialData: currentResource.initialData,
        });
      } else if (currentResource.contentType === 'externalUrl') {
        return createExternalUrlUIResource({
          uri: currentResource.uri as `ui://${string}`,
          iframeUrl: currentResource.content,
          title: currentResource.title,
          description: currentResource.description,
          preferredSize: currentResource.preferredSize,
          initialData: currentResource.initialData,
        });
      } else if (currentResource.contentType === 'remoteDom') {
        return createRemoteDomUIResource({
          uri: currentResource.uri as `ui://${string}`,
          script: currentResource.content,
          framework: currentResource.framework || 'react',
          title: currentResource.title,
          description: currentResource.description,
          preferredSize: currentResource.preferredSize,
        });
      }
    } catch (error) {
      console.error('Error creating UI resource:', error);
      return null;
    }
  }, [currentResource]);

  const handleUIAction = useCallback(async (action: {
    type: 'tool' | 'prompt' | 'link' | 'intent' | 'notify';
    payload: unknown;
    messageId?: string;
  }) => {
    const logEntry = {
      time: new Date().toLocaleTimeString(),
      type: action.type,
      payload: action.payload,
    };
    setActionLog(prev => [...prev.slice(-19), logEntry]); // Keep last 20 entries

    console.log('[UI Builder] Action received:', action);

    // Handle different action types
    if (action.type === 'tool') {
      console.log('[UI Builder] Tool call:', action.payload);
    } else if (action.type === 'prompt') {
      console.log('[UI Builder] Prompt injection:', action.payload);
    } else if (action.type === 'link') {
      console.log('[UI Builder] Link click:', action.payload);
    } else if (action.type === 'notify') {
      console.log('[UI Builder] Notification:', action.payload);
    }
  }, []);

  const resource = uiResource();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Live Preview</h3>
          <span className="text-xs text-muted-foreground">
            ({currentResource.preferredSize.width}×{currentResource.preferredSize.height})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLog(!showLog)}
            className="gap-2"
          >
            <CodeIcon className="size-4" />
            {showLog ? 'Hide' : 'Show'} Log
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPreview}
            className="gap-2"
          >
            <RefreshCwIcon className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex overflow-hidden">
        <div className={cn(
          "flex-1 flex items-center justify-center bg-muted/30 p-4 overflow-auto transition-all",
          showLog ? "w-2/3" : "w-full"
        )}>
          {resource ? (
            <div
              className="bg-background border border-border rounded-lg overflow-hidden shadow-lg"
              style={{
                width: `${currentResource.preferredSize.width}px`,
                height: `${currentResource.preferredSize.height}px`,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              <UIResourceRenderer
                key={previewKey}
                resource={resource.resource}
                onUIAction={handleUIAction}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <p>Unable to render preview</p>
              <p className="text-xs mt-2">Check the console for errors</p>
            </div>
          )}
        </div>

        {/* Action log sidebar */}
        {showLog && (
          <div className="w-1/3 border-l border-border bg-card/30 flex flex-col">
            <div className="border-b border-border p-3 flex items-center justify-between">
              <h4 className="text-sm font-medium">Action Log</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActionLog([])}
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {actionLog.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No actions logged yet. Interact with the preview to see actions.
                  </p>
                )}
                {actionLog.map((entry, idx) => (
                  <div
                    key={idx}
                    className="text-xs p-2 bg-background border border-border rounded"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-medium">{entry.type}</span>
                      <span className="text-muted-foreground">{entry.time}</span>
                    </div>
                    <pre className="text-xs overflow-auto max-h-24">
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
