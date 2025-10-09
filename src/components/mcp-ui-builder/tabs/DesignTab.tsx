'use client';

import { useEffect } from 'react';
import { ArrowRight, Sparkles, Info } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { PreviewPanel } from '../PreviewPanel';
import { extractTemplatePlaceholders } from '@/lib/html-parser';
import { HTMLEditor } from '../editors/HTMLEditor';
import { URLInput } from '../editors/URLInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DesignTab() {
  const {
    setActiveTab,
    currentResource,
    updateResource,
  } = useUIBuilderStore();

  // Auto-detect template placeholders when HTML content changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      const placeholders = extractTemplatePlaceholders(currentResource.content);
      if (JSON.stringify(placeholders) !== JSON.stringify(currentResource.templatePlaceholders)) {
        updateResource({ templatePlaceholders: placeholders });
      }
    }
  }, [currentResource?.content, currentResource?.contentType, updateResource, currentResource?.templatePlaceholders]);

  if (!currentResource) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No resource loaded</AlertDescription>
      </Alert>
    );
  }

  const canProceed = currentResource.content.trim().length > 0;
  const agentSlots = currentResource.templatePlaceholders?.length || 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Content Editor - Dynamic based on content type */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-1/2 border-r overflow-hidden">
          {currentResource.contentType === 'rawHtml' && (
            <HTMLEditor
              value={currentResource.content}
              onChange={(value) => updateResource({ content: value })}
            />
          )}

          {currentResource.contentType === 'externalUrl' && (
            <div className="h-full p-6">
              <Card>
                <CardHeader>
                  <CardTitle>External URL Configuration</CardTitle>
                  <CardDescription>
                    Embed an external website or web application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <URLInput
                    value={currentResource.content}
                    onChange={(value) => updateResource({ content: value })}
                  />
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      The external site will be rendered in an iframe. Ensure the site allows iframe embedding.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {currentResource.contentType === 'remoteDom' && (
            <div className="h-full p-6 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Remote DOM Configuration</CardTitle>
                  <CardDescription>
                    Server-generated UI using Shopify&apos;s Remote DOM framework
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Remote DOM support coming soon. Use Raw HTML or External URL for now.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 overflow-hidden">
          {(currentResource.contentType === 'rawHtml' || currentResource.contentType === 'externalUrl') && (
            <PreviewPanel />
          )}

          {currentResource.contentType === 'remoteDom' && (
            <div className="h-full flex items-center justify-center p-6 bg-muted/30">
              <Alert className="max-w-md">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Preview not available for Remote DOM</strong>
                  <br />
                  Test your Remote DOM resource in the chat after exporting.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Continue button */}
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm flex items-center gap-2">
            {canProceed ? (
              <>
                <span className="text-green-600">✓ UI design ready</span>
                {agentSlots > 0 && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {agentSlots} agent slot{agentSlots !== 1 ? 's' : ''} detected
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Add UI content to continue</span>
            )}
          </div>
          <Button
            onClick={() => setActiveTab('export')}
            disabled={!canProceed}
            className="gap-2"
          >
            Next: Export Code
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
