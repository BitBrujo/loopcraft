'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Sparkles, Info, Copy, Check, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Editor } from '@monaco-editor/react';
import { uiTemplates } from '@/lib/ui-templates';
import { actionSnippets, categoryMetadata, getSnippetsByCategory } from '@/lib/action-snippets';
import type { ActionSnippet } from '@/lib/action-snippets';
import type { editor as MonacoEditor } from 'monaco-editor';

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<ActionSnippet | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

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

  // Template selection handler
  const handleTemplateSelect = (templateId: string) => {
    const template = HTML_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      updateResource({ content: template.html });
      setSelectedTemplateId(''); // Clear selection after loading
    }
  };

  // Action selection handlers
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedActionId('');
    setSelectedAction(null);
  };

  const handleActionSelect = (actionId: string) => {
    setSelectedActionId(actionId);
    const action = actionSnippets.find(s => s.id === actionId);
    setSelectedAction(action || null);
  };

  const handleCopySnippet = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const clearActionSelection = () => {
    setSelectedActionId('');
    setSelectedAction(null);
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

  // Handle code insertion at cursor position in Monaco editor
  const handleInsertCode = (code: string) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const selection = editor.getSelection();
    const position = selection ? selection.getStartPosition() : editor.getPosition();

    if (position) {
      editor.executeEdits('insert-snippet', [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: '\n' + code + '\n',
        },
      ]);

      // Update the resource with the new content
      const newContent = editor.getValue();
      updateResource({ content: newContent });

      // Focus editor after insertion
      editor.focus();
    }
  };

  // Group templates by category for dropdown
  const templatesByCategory = HTML_TEMPLATES.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof HTML_TEMPLATES>);

  // Get action categories
  const actionCategories = Object.keys(categoryMetadata) as Array<keyof typeof categoryMetadata>;

  // Get snippets for selected category
  const categorySnippets = selectedCategory ? getSnippetsByCategory(selectedCategory as ActionSnippet['category']) : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Templates & Actions Column - Only for rawHtml */}
        {currentResource.contentType === 'rawHtml' && (
          <div className="w-72 border-r p-4 flex flex-col gap-4 bg-muted/10 overflow-y-auto">
            {/* Dropdowns Section */}
            <div className="space-y-3 flex-shrink-0">
              {/* Templates Dropdown */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Templates</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templatesByCategory).map(([category, templates]) => (
                      <SelectGroup key={category}>
                        <SelectLabel>{category}</SelectLabel>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <span>{template.name}</span>
                              {template.placeholders && template.placeholders.length > 0 && (
                                <Badge variant="secondary" className="text-xs h-4">
                                  <Sparkles className="h-2 w-2 mr-1" />
                                  {template.placeholders.length}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Category Dropdown */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Actions</Label>
                <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {actionCategories.map((category) => {
                      const meta = categoryMetadata[category];
                      return (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <span>{meta.icon}</span>
                            <span>{meta.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Snippet Dropdown - Only show when category selected */}
              {selectedCategory && (
                <div>
                  <Select value={selectedActionId} onValueChange={handleActionSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action snippet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categorySnippets.map((snippet) => (
                        <SelectItem key={snippet.id} value={snippet.id}>
                          {snippet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Expandable Action Card - Only show when action selected */}
            {selectedAction && (
              <Card className="flex-shrink-0">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-sm">{selectedAction.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {selectedAction.category}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {selectedAction.description}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearActionSelection}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {/* Code Preview - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                        <span>View Code</span>
                        <Info className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32 mt-2">
                        <code>{selectedAction.code}</code>
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopySnippet(selectedAction.code, selectedAction.id)}
                      className="flex-1 text-xs h-7"
                    >
                      {copiedSnippet === selectedAction.id ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInsertCode(selectedAction.code)}
                      className="flex-1 text-xs h-7"
                    >
                      Insert at Cursor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Initial Render Data - Only for rawHtml */}
            <div className="flex-shrink-0">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Initial Render Data
                    </span>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 p-2">
                    <Label className="text-xs text-muted-foreground">
                      Data passed to iframe on first render
                    </Label>
                    <div className="border rounded-md overflow-hidden">
                      <Editor
                        height="120px"
                        defaultLanguage="json"
                        value={initialData ? JSON.stringify(initialData, null, 2) : '{}'}
                        onChange={(value) => value && handleInitialDataChange(value)}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          lineNumbers: 'off',
                          scrollBeyondLastLine: false,
                          folding: false,
                          fontSize: 11,
                        }}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Placeholder Test Data - Only show if placeholders exist */}
            {currentResource.templatePlaceholders && currentResource.templatePlaceholders.length > 0 && (
              <div className="flex-shrink-0">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between mb-2">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Placeholder Test Data
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {currentResource.templatePlaceholders.length}
                      </Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 p-2">
                      <Label className="text-xs text-muted-foreground">
                        Test values for preview (not exported)
                      </Label>
                      {currentResource.templatePlaceholders.map((placeholder) => (
                        <div key={placeholder} className="space-y-1">
                          <Label className="text-xs font-mono text-blue-600">
                            {`{{${placeholder}}}`}
                          </Label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm border rounded-md bg-background"
                            placeholder={`Test value for ${placeholder}`}
                            value={currentResource.placeholderTestData?.[placeholder] || ''}
                            onChange={(e) => {
                              updateResource({
                                placeholderTestData: {
                                  ...currentResource.placeholderTestData,
                                  [placeholder]: e.target.value
                                }
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        )}

        {/* Middle: Editor */}
        <div className="flex-1 border-r overflow-hidden flex flex-col min-w-0">
          {currentResource.contentType === 'rawHtml' && (
            <>
              <div className="flex-1 overflow-hidden">
                <HTMLEditor
                  value={currentResource.content}
                  onChange={(value) => updateResource({ content: value })}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                />
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
        <div className="flex-1 overflow-hidden min-w-0">
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
