'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Info, Code2, Monitor, Workflow } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { InsertPanel } from '../tabs/composition/InsertPanel';
import { ConfigPanel } from '../tabs/composition/ConfigPanel';
import { Button } from '@/components/ui/button';
import { PreviewPanel } from '../PreviewPanel';
import { extractTemplatePlaceholders } from '@/lib/html-parser';
import { HTMLEditor } from '../editors/HTMLEditor';
import { URLInput } from '../editors/URLInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Editor } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';

export function DesignTab() {
  const {
    setActiveTab,
    activeDesignTab,
    setActiveDesignTab,
    currentResource,
    updateResource,
  } = useUIBuilderStore();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  // Auto-detect template placeholders when HTML content changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      const placeholders = extractTemplatePlaceholders(currentResource.content);
      if (JSON.stringify(placeholders) !== JSON.stringify(currentResource.templatePlaceholders)) {
        updateResource({ templatePlaceholders: placeholders });
      }
    }
  }, [currentResource, updateResource]);

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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Full-Width Tab Interface */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <Tabs value={activeDesignTab} onValueChange={(value) => setActiveDesignTab(value as 'composition' | 'code' | 'preview')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-muted/5 h-auto p-0">
              <TabsTrigger value="composition" className="gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Workflow className="h-4 w-4" />
                Composition
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Code2 className="h-4 w-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Monitor className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Composition Tab */}
            <TabsContent value="composition" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
              <div className="h-full flex">
                {/* 2-column layout: InsertPanel | ConfigPanel */}
                <div className="flex-1 overflow-y-auto border-r">
                  <InsertPanel />
                </div>
                <div className="w-[400px] overflow-y-auto">
                  <ConfigPanel />
                </div>
              </div>
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-hidden flex flex-col">
                {currentResource.contentType === 'rawHtml' && (
                  <>
                    <HTMLEditor
                      value={currentResource.content}
                      onChange={(value) => updateResource({ content: value })}
                      onMount={(editor) => {
                        editorRef.current = editor;
                      }}
                    />

                    {/* Detected Template Placeholders - Fixed position at bottom */}
                    {currentResource.templatePlaceholders && currentResource.templatePlaceholders.length > 0 && (
                      <div className="border-t p-4 bg-blue-50/50 dark:bg-blue-950/20">
                        <div className="flex items-start gap-2 mb-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Detected Template Placeholders
                            </h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              These placeholders will be filled by the AI with contextual data
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {currentResource.templatePlaceholders.map((placeholder) => (
                            <Badge key={placeholder} variant="secondary" className="font-mono text-xs">
                              {`{{${placeholder}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {currentResource.contentType === 'externalUrl' && (
                  <div className="h-full p-6 overflow-y-auto">
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
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    value={currentResource.content}
                    onChange={(value) => value !== undefined && updateResource({ content: value })}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                  />
                )}
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-hidden">
                <PreviewPanel />
              </div>
            </TabsContent>
          </Tabs>
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
