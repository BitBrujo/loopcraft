'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Sparkles, Info, Copy, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { PreviewPanel } from '../PreviewPanel';
import { extractTemplatePlaceholders } from '@/lib/html-parser';
import { HTMLEditor } from '../editors/HTMLEditor';
import { URLInput } from '../editors/URLInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
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
import type { UIResource, ContentType, RemoteDomConfig } from '@/types/ui-builder';

// Extended template structure that supports both HTML and Remote DOM
interface ExtendedTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  resource: {
    contentType: ContentType;
    content: string;
    remoteDomConfig?: RemoteDomConfig;
  };
}

// HTML templates - mapped from ui-templates.ts with enhanced Tailwind CSS
const HTML_TEMPLATES: ExtendedTemplate[] = [
  // Forms
  ...uiTemplates
    .filter(t => t.category === 'forms')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      resource: {
        contentType: 'rawHtml' as ContentType,
        content: wrapWithTailwind(t.htmlContent),
      },
    })),
  // Dashboards
  ...uiTemplates
    .filter(t => t.category === 'dashboards')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      resource: {
        contentType: 'rawHtml' as ContentType,
        content: wrapWithTailwind(t.htmlContent),
      },
    })),
  // Tables
  ...uiTemplates
    .filter(t => t.category === 'tables')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      resource: {
        contentType: 'rawHtml' as ContentType,
        content: wrapWithTailwind(t.htmlContent),
      },
    })),
  // Galleries
  ...uiTemplates
    .filter(t => t.category === 'galleries')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      resource: {
        contentType: 'rawHtml' as ContentType,
        content: wrapWithTailwind(t.htmlContent),
      },
    })),
  // Custom
  ...uiTemplates
    .filter(t => t.category === 'custom')
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
      description: t.description,
      resource: {
        contentType: 'rawHtml' as ContentType,
        content: wrapWithTailwind(t.htmlContent),
      },
    })),
  // Blank HTML template
  {
    id: 'blank-html',
    name: 'Blank HTML',
    category: 'Custom',
    description: 'Start from scratch with basic HTML structure',
    resource: {
      contentType: 'rawHtml',
      content: `<!DOCTYPE html>
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
    },
  },
];

// Remote DOM templates
const REMOTE_DOM_TEMPLATES: ExtendedTemplate[] = [
  {
    id: 'react-button',
    name: 'React Button',
    category: 'Interactive',
    description: 'Simple React button component using Remote DOM',
    resource: {
      contentType: 'remoteDom',
      content: `import { h } from '@remote-dom/core/client';

// Create a simple button component
const button = h('button', {
  onClick: () => {
    window.parent.postMessage({
      type: 'notify',
      payload: { message: 'Button clicked!' }
    }, '*');
  },
  style: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
  }
}, 'Click Me');

// Render the button
export default button;`,
      remoteDomConfig: { framework: 'react' },
    },
  },
  {
    id: 'react-counter',
    name: 'React Counter',
    category: 'Interactive',
    description: 'React counter with state using Remote DOM',
    resource: {
      contentType: 'remoteDom',
      content: `import { h, useState } from '@remote-dom/core/client';

function Counter() {
  const [count, setCount] = useState(0);

  return h('div', { style: { padding: '24px', fontFamily: 'system-ui' } }, [
    h('h2', { style: { fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' } }, 'Counter'),
    h('p', { style: { fontSize: '48px', marginBottom: '16px' } }, String(count)),
    h('div', { style: { display: 'flex', gap: '8px' } }, [
      h('button', {
        onClick: () => setCount(count - 1),
        style: {
          padding: '8px 16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }
      }, '−'),
      h('button', {
        onClick: () => setCount(count + 1),
        style: {
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }
      }, '+'),
    ]),
  ]);
}

export default Counter;`,
      remoteDomConfig: { framework: 'react' },
    },
  },
  {
    id: 'webcomponent-card',
    name: 'Web Component Card',
    category: 'Custom',
    description: 'Custom card element using Web Components',
    resource: {
      contentType: 'remoteDom',
      content: `class CardElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const title = this.getAttribute('title') || 'Card Title';
    const description = this.getAttribute('description') || 'Card description';

    this.shadowRoot.innerHTML = \`
      <style>
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          font-family: system-ui, -apple-system, sans-serif;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #111827;
        }
        .description {
          color: #6b7280;
          font-size: 14px;
        }
      </style>
      <div class="card">
        <div class="title">\${title}</div>
        <div class="description">\${description}</div>
      </div>
    \`;
  }
}

customElements.define('custom-card', CardElement);

// Create instance
const card = document.createElement('custom-card');
card.setAttribute('title', 'Welcome');
card.setAttribute('description', 'This is a custom Web Component card');

export default card;`,
      remoteDomConfig: { framework: 'webcomponents' },
    },
  },
  {
    id: 'blank-react-remotedom',
    name: 'Blank React Remote DOM',
    category: 'Custom',
    description: 'Start from scratch with React Remote DOM',
    resource: {
      contentType: 'remoteDom',
      content: `import { h } from '@remote-dom/core/client';

// Your React Remote DOM code here
const component = h('div', {
  style: { padding: '24px', fontFamily: 'system-ui' }
}, [
  h('h1', { style: { fontSize: '24px', fontWeight: 'bold' } }, 'Hello Remote DOM!'),
  h('p', { style: { color: '#6b7280' } }, 'Start building your component here.'),
]);

export default component;`,
      remoteDomConfig: { framework: 'react' },
    },
  },
  {
    id: 'blank-webcomponent-remotedom',
    name: 'Blank Web Component',
    category: 'Custom',
    description: 'Start from scratch with Web Components',
    resource: {
      contentType: 'remoteDom',
      content: `class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = \`
      <style>
        .container {
          padding: 24px;
          font-family: system-ui, -apple-system, sans-serif;
        }
      </style>
      <div class="container">
        <h1>Hello Web Component!</h1>
        <p>Start building your component here.</p>
      </div>
    \`;
  }
}

customElements.define('my-component', MyComponent);

export default document.createElement('my-component');`,
      remoteDomConfig: { framework: 'webcomponents' },
    },
  },
];

// Combine all templates
const ALL_TEMPLATES = [...HTML_TEMPLATES, ...REMOTE_DOM_TEMPLATES];

// Common MIME types for dropdown
const COMMON_MIME_TYPES = [
  { value: 'text/html', label: 'text/html' },
  { value: 'application/json', label: 'application/json' },
  { value: 'text/xml', label: 'text/xml' },
  { value: 'text/plain', label: 'text/plain' },
  { value: 'text/uri-list', label: 'text/uri-list' },
  { value: 'application/vnd.mcp-ui.remote-dom', label: 'application/vnd.mcp-ui.remote-dom' },
  { value: 'custom', label: 'Custom' },
] as const;

// Helper function to get default MIME type based on content type
function getMimeTypeDefault(contentType: ContentType): string {
  switch (contentType) {
    case 'rawHtml':
      return 'text/html';
    case 'externalUrl':
      return 'text/uri-list';
    case 'remoteDom':
      return 'application/vnd.mcp-ui.remote-dom';
    default:
      return 'text/html';
  }
}

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
  const [customMimeType, setCustomMimeType] = useState<string>('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
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

  // Filter templates based on current content type
  const relevantTemplates = ALL_TEMPLATES.filter(template =>
    template.resource.contentType === currentResource.contentType
  );

  // Template selection handler
  const handleTemplateSelect = (templateId: string) => {
    const template = ALL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      // Update content and Remote DOM config if applicable
      const updates: Partial<UIResource> = {
        content: template.resource.content,
      };

      if (template.resource.contentType === 'remoteDom' && template.resource.remoteDomConfig) {
        updates.remoteDomConfig = template.resource.remoteDomConfig;
      }

      updateResource(updates);
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

  // Group templates by category for dropdown (filtered by content type)
  const templatesByCategory = relevantTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof relevantTemplates>);

  // Get action categories
  const actionCategories = Object.keys(categoryMetadata) as Array<keyof typeof categoryMetadata>;

  // Get snippets for selected category
  const categorySnippets = selectedCategory ? getSnippetsByCategory(selectedCategory as ActionSnippet['category']) : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Templates & Actions Column - For rawHtml and remoteDom */}
        {(currentResource.contentType === 'rawHtml' || currentResource.contentType === 'remoteDom') && (
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
                              {/* Framework badge for Remote DOM templates */}
                              {template.resource.contentType === 'remoteDom' && template.resource.remoteDomConfig && (
                                <Badge variant="secondary" className="text-xs h-4">
                                  {template.resource.remoteDomConfig.framework === 'react' ? '⚛️' : '🧩'}
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
            <div className="flex-shrink-0 space-y-2">
              <Label className="text-sm font-semibold block">Initial Render Data</Label>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-center mb-2">
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
          {/* Resource Metadata Card - Positioned at top of middle column */}
          <div className="border-b p-4 bg-muted/5 overflow-y-auto max-h-96">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Resource Metadata</CardTitle>
                <CardDescription>Configure resource identification and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Fields - Title & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="res-title">Title</Label>
                    <Input
                      id="res-title"
                      value={currentResource.metadata?.title || ''}
                      onChange={(e) => updateResource({
                        metadata: {
                          ...currentResource.metadata,
                          title: e.target.value
                        }
                      })}
                      placeholder="Dashboard UI"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="res-description">Description</Label>
                    <Textarea
                      id="res-description"
                      value={currentResource.metadata?.description || ''}
                      onChange={(e) => updateResource({
                        metadata: {
                          ...currentResource.metadata,
                          description: e.target.value
                        }
                      })}
                      placeholder="Interactive dashboard for monitoring key metrics"
                      rows={3}
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                {/* MIME Type Selector */}
                <div className="space-y-2">
                  <Label htmlFor="mime-type">MIME Type</Label>
                  <Select
                    value={currentResource.mimeType || COMMON_MIME_TYPES.find(t => t.value === getMimeTypeDefault(currentResource.contentType))?.value || 'text/html'}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        // Show custom input, keep current value or default
                        setCustomMimeType(currentResource.mimeType || getMimeTypeDefault(currentResource.contentType));
                      } else {
                        updateResource({ mimeType: value });
                      }
                    }}
                  >
                    <SelectTrigger id="mime-type">
                      <SelectValue placeholder="Select MIME type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_MIME_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Custom MIME Type Input */}
                  {currentResource.mimeType && !COMMON_MIME_TYPES.some(t => t.value === currentResource.mimeType) && (
                    <Input
                      value={customMimeType}
                      onChange={(e) => setCustomMimeType(e.target.value)}
                      onBlur={() => {
                        // Validate format: type/subtype
                        if (customMimeType && /^[\w-]+\/[\w-+.]+$/.test(customMimeType)) {
                          updateResource({ mimeType: customMimeType });
                        }
                      }}
                      placeholder="e.g., application/custom-format"
                      className="mt-2"
                    />
                  )}

                  <p className="text-xs text-muted-foreground">
                    MIME type helps clients determine how to parse and render this resource. Auto-detected based on content type.
                  </p>
                </div>

                {/* Audience Targeting */}
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <RadioGroup
                    value={
                      !currentResource.audience ? 'both' :
                      currentResource.audience.includes('user') && !currentResource.audience.includes('assistant') ? 'user' :
                      currentResource.audience.includes('assistant') && !currentResource.audience.includes('user') ? 'assistant' :
                      'both'
                    }
                    onValueChange={(value) => {
                      let audience: ('user' | 'assistant')[] | undefined;
                      if (value === 'user') {
                        audience = ['user'];
                      } else if (value === 'assistant') {
                        audience = ['assistant'];
                      } else {
                        audience = undefined; // both = no restriction
                      }
                      updateResource({ audience });
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="audience-both" />
                      <Label htmlFor="audience-both" className="font-normal cursor-pointer">
                        Both (Default)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user" id="audience-user" />
                      <Label htmlFor="audience-user" className="font-normal cursor-pointer">
                        User Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="assistant" id="audience-assistant" />
                      <Label htmlFor="audience-assistant" className="font-normal cursor-pointer">
                        Assistant Only
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    Control who can see this UI resource. Assistant-only resources are hidden from end-users but available to AI agents.
                  </p>
                </div>

                {/* Advanced Options - Collapsible Priority Field */}
                <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start px-0">
                      {showAdvancedOptions ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      <span className="font-semibold">Advanced Options</span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-3">
                    {/* Priority Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="priority">Priority</Label>
                        <span className="text-xs text-muted-foreground">
                          {currentResource.priority !== undefined ? currentResource.priority.toFixed(1) : '0.5'}
                        </span>
                      </div>

                      {/* Slider */}
                      <Slider
                        id="priority"
                        value={[currentResource.priority !== undefined ? currentResource.priority : 0.5]}
                        onValueChange={(values) => {
                          const value = Math.max(0, Math.min(1, values[0]));
                          updateResource({ priority: value });
                        }}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />

                      {/* Number Input */}
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={currentResource.priority !== undefined ? currentResource.priority : 0.5}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            const clamped = Math.max(0, Math.min(1, value));
                            updateResource({ priority: clamped });
                          }
                        }}
                        placeholder="0.5"
                      />

                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0.0 = Lowest</span>
                        <span>0.5 = Medium</span>
                        <span>1.0 = Highest</span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Priority affects display order when multiple UI resources are available. May not apply if resource is linked to a single server.
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>

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
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden">
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
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-hidden min-w-0">
          {(currentResource.contentType === 'rawHtml' || currentResource.contentType === 'externalUrl' || currentResource.contentType === 'remoteDom') && (
            <PreviewPanel />
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
