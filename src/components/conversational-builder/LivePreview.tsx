'use client';

import { UIResource } from '@/types/ui-builder';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

interface LivePreviewProps {
  uiResource: UIResource;
}

export function LivePreview({ uiResource }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Handle both string and object content types for backward compatibility
  const content = uiResource.content;
  const htmlContent = typeof content === 'string'
    ? content
    : (content as { type?: string; htmlString?: string }).type === 'rawHtml'
      ? (content as { type?: string; htmlString?: string }).htmlString || ''
      : '';
  const hasHTML = htmlContent.length > 50;
  const hasPlaceholders = (uiResource.templatePlaceholders?.length || 0) > 0;

  // Update iframe content when HTML changes
  useEffect(() => {
    if (iframeRef.current && hasHTML) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        // Wrap content with Tailwind CDN for styling
        const wrappedHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
        iframeDoc.open();
        iframeDoc.write(wrappedHTML);
        iframeDoc.close();
      }
    }
  }, [htmlContent, hasHTML]);

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Live Preview</h2>
        <p className="text-sm text-muted-foreground">
          {(typeof uiResource.metadata?.title === 'string' ? uiResource.metadata.title : null) || 'UI Component'}
        </p>
      </div>

      {/* Preview Content */}
      <ScrollArea className="flex-1 h-0">
        <div>
          {!hasHTML ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Your UI component will appear here as we build it together.</p>
            </div>
          ) : (
            <Tabs defaultValue="preview">
              <TabsList className="w-full justify-start border-b rounded-none px-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
                {hasPlaceholders && <TabsTrigger value="placeholders">Placeholders ({uiResource.templatePlaceholders?.length})</TabsTrigger>}
              </TabsList>

              <TabsContent value="preview" className="p-0 m-0">
                <div className="bg-gray-50 dark:bg-gray-900 min-h-[400px]">
                  <iframe
                    ref={iframeRef}
                    className="w-full min-h-[400px] border-0"
                    title="UI Preview"
                    sandbox="allow-scripts"
                  />
                </div>
              </TabsContent>

              <TabsContent value="html" className="p-4">
                <Card className="p-4 bg-muted">
                  <pre className="text-xs overflow-x-auto">
                    <code>{htmlContent}</code>
                  </pre>
                </Card>
              </TabsContent>

              {hasPlaceholders && (
                <TabsContent value="placeholders" className="p-4 space-y-3">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-sm">Template Placeholders</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      These placeholders will be filled by the AI agent when rendering the UI.
                    </p>
                    <div className="space-y-2">
                      {uiResource.templatePlaceholders?.map((placeholder, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <Badge variant="outline" className="font-mono text-xs">
                            {`{{${placeholder}}}`}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Agent-provided value
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                      How it works
                    </h4>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      When the AI agent calls the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">get_ui</code> tool,
                      it can provide values for these placeholders. The server will replace{' '}
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{`{{placeholder}}`}</code> with
                      the actual data before returning the HTML.
                    </p>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
