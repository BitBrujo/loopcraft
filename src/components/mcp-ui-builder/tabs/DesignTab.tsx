'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Info, Copy } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { PreviewPanel } from '../PreviewPanel';
import { extractTemplatePlaceholders } from '@/lib/html-parser';
import { HTMLEditor } from '../editors/HTMLEditor';
import { URLInput } from '../editors/URLInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Editor } from '@monaco-editor/react';
import { uiTemplates } from '@/lib/ui-templates';

// HTML template library - mapped from ui-templates.ts with enhanced Tailwind CSS
const HTML_TEMPLATES = [
  // Forms
  ...uiTemplates
    .filter(t => t.category === 'forms')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      html: wrapWithTailwind(t.htmlContent),
      placeholders: t.templatePlaceholders || [],
    })),
  // Dashboards
  ...uiTemplates
    .filter(t => t.category === 'dashboards')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      html: wrapWithTailwind(t.htmlContent),
      placeholders: t.templatePlaceholders || [],
    })),
  // Tables
  ...uiTemplates
    .filter(t => t.category === 'tables')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      html: wrapWithTailwind(t.htmlContent),
      placeholders: t.templatePlaceholders || [],
    })),
  // Galleries
  ...uiTemplates
    .filter(t => t.category === 'galleries')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      html: wrapWithTailwind(t.htmlContent),
      placeholders: t.templatePlaceholders || [],
    })),
  // Custom
  ...uiTemplates
    .filter(t => t.category === 'custom')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      html: wrapWithTailwind(t.htmlContent),
      placeholders: t.templatePlaceholders || [],
    })),
  // Blank template
  {
    id: 'blank',
    name: 'Blank Template',
    category: 'Custom',
    description: 'Start from scratch with basic HTML structure',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My UI</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body class="p-8 max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Hello World!</h1>
  <p class="text-gray-600 dark:text-gray-400">Start building your custom UI here.</p>
</body>
</html>`,
    placeholders: [],
  },
];

// Helper function to wrap HTML content with Tailwind CDN
function wrapWithTailwind(htmlContent: string): string {
  if (htmlContent.includes('<!DOCTYPE html>')) {
    // Already has full HTML structure, just add Tailwind CDN if not present
    if (!htmlContent.includes('tailwindcss.com')) {
      return htmlContent.replace(
        '</head>',
        '  <script src="https://cdn.tailwindcss.com"></script>\n</head>'
      );
    }
    return htmlContent;
  }

  // Wrap content in full HTML structure with Tailwind
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Template</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

export function DesignTab() {
  const {
    setActiveTab,
    currentResource,
    updateResource,
  } = useUIBuilderStore();
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

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

  const handleTemplateSelect = (template: typeof HTML_TEMPLATES[0]) => {
    updateResource({ content: template.html });
    setExpandedTemplateId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedTemplateId(expandedTemplateId === id ? null : id);
  };

  const handleInitialDataChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      updateResource({
        uiMetadata: {
          ...currentResource.uiMetadata,
          'initial-render-data': parsed
        }
      });
    } catch (e) {
      // Invalid JSON, don't update
      console.error('Invalid JSON:', e);
    }
  };

  const initialData = currentResource.uiMetadata?.['initial-render-data'];

  // Group templates by category
  const templatesByCategory = HTML_TEMPLATES.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof HTML_TEMPLATES>);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Templates Column - Only for rawHtml */}
        {currentResource.contentType === 'rawHtml' && (
          <div className="w-64 border-r overflow-y-auto p-3 bg-muted/10">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Templates</h3>

            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-medium uppercase text-muted-foreground mb-2 px-1">
                  {category}
                </h4>
                <div className="space-y-1">
                  {templates.map((template) => {
                    const isExpanded = expandedTemplateId === template.id;
                    return (
                      <Card
                        key={template.id}
                        className={`transition-all ${
                          isExpanded ? 'border-primary' : 'cursor-pointer hover:border-primary/50'
                        }`}
                      >
                        <div
                          onClick={() => toggleExpand(template.id)}
                          className="p-3 cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h5 className="text-sm font-medium leading-tight">{template.name}</h5>
                            {template.placeholders && template.placeholders.length > 0 && (
                              <Badge variant="secondary" className="text-xs ml-1 h-5">
                                <Sparkles className="h-3 w-3" />
                                {template.placeholders.length}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>

                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-2 border-t pt-2">
                            {template.placeholders && template.placeholders.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {template.placeholders.slice(0, 3).map((p) => (
                                  <Badge key={p} variant="outline" className="text-xs">
                                    {`{{${p}}}`}
                                  </Badge>
                                ))}
                                {template.placeholders.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{template.placeholders.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <Button
                              size="sm"
                              className="w-full mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateSelect(template);
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Use Template
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Middle: Editor */}
        <div className="flex-1 border-r overflow-hidden flex flex-col">
          {currentResource.contentType === 'rawHtml' && (
            <>
              <div className="flex-1 overflow-hidden">
                <HTMLEditor
                  value={currentResource.content}
                  onChange={(value) => updateResource({ content: value })}
                />
              </div>
              {/* Initial Render Data - Only for rawHtml */}
              <div className="border-t p-4 bg-muted/10">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between mb-2">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Initial Render Data (JSON)
                      </span>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Data passed to the iframe on first render. Example: <code className="bg-muted px-1 rounded">{'{"userName": "Alice", "theme": "dark"}'}</code>
                      </Label>
                      <div className="border rounded-md overflow-hidden">
                        <Editor
                          height="150px"
                          defaultLanguage="json"
                          value={initialData ? JSON.stringify(initialData, null, 2) : '{}'}
                          onChange={(value) => value && handleInitialDataChange(value)}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            lineNumbers: 'off',
                            scrollBeyondLastLine: false,
                            folding: false,
                            fontSize: 12,
                          }}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Detected Template Placeholders */}
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
        <div className="flex-1 overflow-hidden">
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
