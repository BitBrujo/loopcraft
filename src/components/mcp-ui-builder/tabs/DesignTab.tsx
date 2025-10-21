'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Sparkles, Info, Copy, Check, X, Wrench, MessageSquare, Link as LinkIcon, Target, Bell, ChevronDown, Code2, Monitor, AlertTriangle } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { PreviewPanel } from '../PreviewPanel';
import { extractTemplatePlaceholders, parseHTMLForInteractiveElements } from '@/lib/html-parser';
import { smartInsertHTML } from '@/lib/smart-html-insert';
import { copyToClipboard } from '@/lib/utils';
import { ToolActionMapper } from '../ToolActionMapper';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Editor } from '@monaco-editor/react';
import { actionSnippets, categoryMetadata, getSnippetsByCategory } from '@/lib/action-snippets';
import type { ActionSnippet } from '@/lib/action-snippets';
import { htmlElements, elementsByCategory, categoryInfo } from '@/lib/html-elements';
import type { HTMLElement } from '@/lib/html-elements';
import type { editor as MonacoEditor } from 'monaco-editor';
import type { ContentType, InteractiveElement } from '@/types/ui-builder';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'wrench': Wrench,
  'message-square': MessageSquare,
  'link': LinkIcon,
  'target': Target,
  'bell': Bell,
};

// Helper function to get display MIME type based on content type
function getDisplayMimeType(contentType: ContentType): string {
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
type SizePreset = 'small' | 'medium' | 'large' | 'full' | 'custom';

const SIZE_PRESETS = {
  small: { width: '400px', height: '300px', label: 'Small (400×300)' },
  medium: { width: '800px', height: '600px', label: 'Medium (800×600)' },
  large: { width: '1200px', height: '800px', label: 'Large (1200×800)' },
  full: { width: '100%', height: '600px', label: 'Full Width (100%×600)' },
  custom: { width: '800px', height: '600px', label: 'Custom Size' },
} as const;

export function DesignTab() {
  const {
    setActiveTab,
    currentResource,
    updateResource,
    targetServerName,
    selectedTools,
    availableTools,
  } = useUIBuilderStore();
  const [selectedElementCategory, setSelectedElementCategory] = useState<string>('');
  const [selectedElementId, setSelectedElementId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<ActionSnippet | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showUIMetadata, setShowUIMetadata] = useState(false);
  const [showRendererOptions, setShowRendererOptions] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'code' | 'preview'>('code');
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const [parsedElements, setParsedElements] = useState<InteractiveElement[]>([]);

  // Size preset state
  const [sizePreset, setSizePreset] = useState<SizePreset>('medium');

  // Auto-detect template placeholders when HTML content changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      const placeholders = extractTemplatePlaceholders(currentResource.content);
      if (JSON.stringify(placeholders) !== JSON.stringify(currentResource.templatePlaceholders)) {
        updateResource({ templatePlaceholders: placeholders });
      }
    }
  }, [currentResource, updateResource]);

  // Parse HTML for interactive elements when content changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml' && currentResource.content) {
      const elements = parseHTMLForInteractiveElements(currentResource.content);
      setParsedElements(elements);
    } else {
      setParsedElements([]);
    }
  }, [currentResource]);

  // Detect current size preset from currentResource
  useEffect(() => {
    if (!currentResource) return;

    const currentSize = currentResource.uiMetadata?.['preferred-frame-size'] || ['800px', '600px'];
    const [width, height] = currentSize;

    // Check which preset matches
    for (const [preset, config] of Object.entries(SIZE_PRESETS)) {
      if (config.width === width && config.height === height) {
        setSizePreset(preset as SizePreset);
        return;
      }
    }

    // If no match, it's custom
    setSizePreset('custom');
  }, [currentResource]);

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
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } else {
      console.error('Failed to copy snippet to clipboard');
    }
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

  const handleSizePresetChange = (preset: SizePreset) => {
    setSizePreset(preset);
    if (preset !== 'custom') {
      const { width, height } = SIZE_PRESETS[preset];
      updateResource({
        uiMetadata: {
          ...currentResource.uiMetadata,
          'preferred-frame-size': [width, height]
        }
      });
    }
  };

  const handleCustomSizeChange = (dimension: 'width' | 'height', value: string) => {
    const currentSize = currentResource.uiMetadata?.['preferred-frame-size'] || ['800px', '600px'];
    const newSize: [string, string] = dimension === 'width'
      ? [value, currentSize[1]]
      : [currentSize[0], value];

    updateResource({
      uiMetadata: {
        ...currentResource.uiMetadata,
        'preferred-frame-size': newSize
      }
    });
  };

  const initialData = currentResource.uiMetadata?.['initial-render-data'];
  const preferredSize = currentResource.uiMetadata?.['preferred-frame-size'] || ['800px', '600px'];

  // Handle smart HTML-aware code insertion
  const handleInsertCode = (code: string) => {
    if (!editorRef.current || !currentResource) return;

    const editor = editorRef.current;
    const currentContent = editor.getValue();

    // Use smart insertion to place code in the correct location
    const newContent = smartInsertHTML(currentContent, code);

    // Update the editor with the new content
    editor.setValue(newContent);

    // Update the resource
    updateResource({ content: newContent });

    // Focus editor after insertion
    editor.focus();
  };

  // Get action categories
  const actionCategories = Object.keys(categoryMetadata) as Array<keyof typeof categoryMetadata>;

  // Get snippets for selected category
  const categorySnippets = selectedCategory ? getSnippetsByCategory(selectedCategory as ActionSnippet['category']) : [];

  // Generate companion tool snippets for selected tools
  const companionSnippets: ActionSnippet[] = [];
  if (targetServerName && selectedTools && selectedTools.length > 0) {
    selectedTools.forEach(toolName => {
      const snippet: ActionSnippet = {
        id: `companion-${toolName}`,
        name: `Call ${toolName}`,
        category: 'notify', // Dummy category for type compatibility
        description: `Execute ${toolName} from ${targetServerName} server`,
        code: `<!-- Call ${toolName} from ${targetServerName} -->
<button
  onclick="call_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}()"
  class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
>
  Execute ${toolName}
</button>

<script>
  function call_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}() {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_${targetServerName}_${toolName}',
        params: {
          // Add tool parameters here based on the tool's schema
        }
      }
    }, '*');
  }
</script>`
      };
      companionSnippets.push(snippet);
    });
  }

  // Merge companion snippets into categorySnippets for the 'tool' category
  const enhancedCategorySnippets = selectedCategory === 'tool'
    ? [...companionSnippets, ...categorySnippets]
    : categorySnippets;

  // Get display MIME type
  const displayMimeType = getDisplayMimeType(currentResource.contentType);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 2-Column Layout */}
      <div className="flex-1 flex min-h-0">

        {/* Left Column: All Options (400px fixed) */}
        <div className="w-[400px] border-r p-4 flex flex-col gap-4 bg-muted/10 overflow-y-auto">
          {/* HTML Elements - Only for rawHtml */}
          {currentResource.contentType === 'rawHtml' && (
            <div>
              <div className="mb-2">
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
                  HTML Elements
                </Badge>
              </div>

              {/* Element Category Dropdown */}
              <Select value={selectedElementCategory} onValueChange={(value) => {
                setSelectedElementCategory(value);
                setSelectedElementId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select element type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(elementsByCategory).map((category) => {
                    const info = categoryInfo[category as keyof typeof categoryInfo];
                    return (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Element Selection Dropdown */}
              {selectedElementCategory && (
                <div className="mt-2">
                  <Select value={selectedElementId} onValueChange={(elementId) => {
                    setSelectedElementId(elementId);
                    const element = htmlElements.find(e => e.id === elementId);
                    if (element && editorRef.current) {
                      handleInsertCode(element.html);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select element..." />
                    </SelectTrigger>
                    <SelectContent>
                      {elementsByCategory[selectedElementCategory as keyof typeof elementsByCategory]?.map((element: HTMLElement) => (
                        <SelectItem key={element.id} value={element.id}>
                          <div>
                            <div className="font-medium">{element.name}</div>
                            <div className="text-xs text-muted-foreground">{element.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Tool Action Mapper - Show when tools are selected */}
          {selectedTools.length > 0 && currentResource.contentType === 'rawHtml' && (
            <div className="mb-4">
              <ToolActionMapper
                selectedTools={selectedTools}
                availableTools={availableTools}
                parsedElements={parsedElements}
                toolBindings={currentResource?.toolBindings || []}
                onBindingsChange={(bindings) => updateResource({ toolBindings: bindings })}
                onGenerateCode={handleInsertCode}
                targetServerName={targetServerName}
              />
            </div>
          )}

          {/* Action Category Dropdown - Only for rawHtml */}
          {currentResource.contentType === 'rawHtml' && (
            <div>
              <div className="mb-2">
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
                  Actions
                </Badge>
              </div>
              <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action type..." />
                </SelectTrigger>
                <SelectContent>
                  {actionCategories.map((category) => {
                    const meta = categoryMetadata[category];
                    const IconComponent = iconMap[meta.icon];
                    return (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                          <span>{meta.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Validation Alert - Show when Tool category selected but no companion snippets */}
          {selectedCategory === 'tool' && companionSnippets.length === 0 && (
            <Alert className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No companion tools selected. Go to Configure tab and select tools to see auto-generated snippets here.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Snippet Dropdown - Only show when category selected and snippets available */}
          {selectedCategory && currentResource.contentType === 'rawHtml' && enhancedCategorySnippets.length > 0 && (
            <div>
              <Select value={selectedActionId} onValueChange={handleActionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action snippet..." />
                </SelectTrigger>
                <SelectContent>
                  {companionSnippets.length > 0 && selectedCategory === 'tool' && (
                    <>
                      <div className="px-2 py-2 border-b bg-orange-50 dark:bg-orange-950/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🧩</span>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            Companion Tools from {targetServerName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          These snippets call tools from {targetServerName}. When both servers connect to an MCP client, tools are automatically prefixed: <code className="text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1 rounded">mcp_{targetServerName}_toolname</code>
                        </p>
                      </div>
                      {companionSnippets.map((snippet) => (
                        <SelectItem key={snippet.id} value={snippet.id} className="bg-orange-50/30 dark:bg-orange-950/10">
                          <div className="flex items-center gap-2">
                            <span>🧩</span>
                            {snippet.name}
                          </div>
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t">
                        Standard Actions
                      </div>
                    </>
                  )}
                  {categorySnippets.map((snippet) => (
                    <SelectItem key={snippet.id} value={snippet.id}>
                      {snippet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Expanded Action Card - Only show when action selected */}
          {selectedAction && currentResource.contentType === 'rawHtml' && (
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

          {/* Placeholder Test Data - Only show if placeholders exist */}
          {currentResource.templatePlaceholders && currentResource.templatePlaceholders.length > 0 && (
            <div className="flex-shrink-0">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-accent mb-2 py-6">
                    <span className="flex items-center gap-2 font-semibold">
                      <Sparkles className="h-4 w-4" />
                      Placeholder Test Data
                      <Badge variant="secondary" className="text-xs">
                        {currentResource.templatePlaceholders.length}
                      </Badge>
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
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

          {/* Resource Metadata - Collapsible */}
          <div className="flex-shrink-0">
            <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-accent mb-2 py-6">
                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
                    Resource Metadata
                  </Badge>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedOptions ? '' : '-rotate-90'}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-2 space-y-4">
                  {/* Description - Helps LLM understand the UI purpose */}
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
                      placeholder="Interactive UI for calling tools from the everything server"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Helps the AI assistant understand what this companion UI does
                    </p>
                  </div>

                  <Separator className="my-4" />

                  {/* MIME Type - Read-only Badge */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <Label>MIME Type</Label>
                      <Badge variant="secondary" className="font-mono">
                        {displayMimeType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-determined from content type (read-only)
                    </p>
                  </div>

                  <Separator className="my-4" />

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
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* UI Metadata - Collapsible */}
          <div className="flex-shrink-0">
            <Collapsible open={showUIMetadata} onOpenChange={setShowUIMetadata}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-accent mb-2 py-6">
                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
                    UI Metadata
                  </Badge>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showUIMetadata ? '' : '-rotate-90'}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-2 space-y-4">
                  {/* Size Preset */}
                  <div className="space-y-2">
                    <Label htmlFor="sizePreset">Preferred Frame Size</Label>
                    <Select value={sizePreset} onValueChange={handleSizePresetChange}>
                      <SelectTrigger id="sizePreset">
                        <SelectValue placeholder="Choose a size preset" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SIZE_PRESETS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Initial size for the iframe when rendered
                    </p>
                  </div>

                  {/* Custom Size Inputs */}
                  {sizePreset === 'custom' && (
                    <div className="space-y-2">
                      <Label>Custom Size</Label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor="width" className="text-sm text-muted-foreground">
                            Width
                          </Label>
                          <Input
                            id="width"
                            value={preferredSize[0]}
                            onChange={(e) => handleCustomSizeChange('width', e.target.value)}
                            placeholder="800px"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="height" className="text-sm text-muted-foreground">
                            Height
                          </Label>
                          <Input
                            id="height"
                            value={preferredSize[1]}
                            onChange={(e) => handleCustomSizeChange('height', e.target.value)}
                            placeholder="600px"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use CSS units (px, %, vh, vw, etc.)
                      </p>
                    </div>
                  )}

                  {/* Auto-Resize Iframe - Now in UI Metadata section */}
                  {currentResource.contentType !== 'remoteDom' && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <Label htmlFor="autoResize">Auto-Resize After Load</Label>
                        <Select
                          value={
                            typeof currentResource.uiMetadata?.['auto-resize-iframe'] === 'boolean'
                              ? currentResource.uiMetadata['auto-resize-iframe']
                                ? 'both'
                                : 'disabled'
                              : typeof currentResource.uiMetadata?.['auto-resize-iframe'] === 'object'
                                ? currentResource.uiMetadata['auto-resize-iframe'].width && currentResource.uiMetadata['auto-resize-iframe'].height
                                  ? 'both'
                                  : currentResource.uiMetadata['auto-resize-iframe'].width
                                    ? 'width'
                                    : 'height'
                                : 'disabled'
                          }
                          onValueChange={(value) => {
                            const autoResize =
                              value === 'disabled' ? false :
                              value === 'both' ? true :
                              value === 'width' ? { width: true } :
                              { height: true };
                            updateResource({
                              uiMetadata: {
                                ...currentResource.uiMetadata,
                                'auto-resize-iframe': autoResize
                              }
                            });
                          }}
                        >
                          <SelectTrigger id="autoResize">
                            <SelectValue placeholder="Choose resize behavior" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disabled">Disabled</SelectItem>
                            <SelectItem value="both">Both dimensions</SelectItem>
                            <SelectItem value="width">Width only</SelectItem>
                            <SelectItem value="height">Height only</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Two-phase rendering: Shows at <span className="font-medium">preferred size</span> initially → Auto-resizes to <span className="font-medium">content size</span> after load
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Renderer Options - Collapsible */}
          <div className="flex-shrink-0">
            <Collapsible open={showRendererOptions} onOpenChange={setShowRendererOptions}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-accent mb-2 py-6">
                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
                    Renderer Options
                  </Badge>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showRendererOptions ? '' : '-rotate-90'}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 p-2">
                  <p className="text-xs text-muted-foreground">Configure iframe rendering behavior and security</p>

                  {/* Sandbox Permissions */}
                  {currentResource.contentType !== 'remoteDom' && (
                    <div className="space-y-2">
                      <Label htmlFor="sandboxPermissions">Sandbox Permissions</Label>
                      <Select
                        value={
                          currentResource.uiMetadata?.['sandbox-permissions'] === 'allow-scripts' ? 'strict' :
                          currentResource.uiMetadata?.['sandbox-permissions'] === 'allow-forms allow-scripts allow-same-origin allow-popups' ? 'permissive' :
                          currentResource.uiMetadata?.['sandbox-permissions'] &&
                          currentResource.uiMetadata['sandbox-permissions'] !== 'allow-forms allow-scripts allow-same-origin' ? 'custom' :
                          'standard'
                        }
                        onValueChange={(value) => {
                          const permissions =
                            value === 'strict' ? 'allow-scripts' :
                            value === 'permissive' ? 'allow-forms allow-scripts allow-same-origin allow-popups' :
                            value === 'custom' ? currentResource.uiMetadata?.['sandbox-permissions'] || '' :
                            'allow-forms allow-scripts allow-same-origin';
                          updateResource({
                            uiMetadata: {
                              ...currentResource.uiMetadata,
                              'sandbox-permissions': permissions
                            }
                          });
                        }}
                      >
                        <SelectTrigger id="sandboxPermissions">
                          <SelectValue placeholder="Choose security level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard (forms, scripts, same-origin)</SelectItem>
                          <SelectItem value="strict">Strict (scripts only)</SelectItem>
                          <SelectItem value="permissive">Permissive (includes popups)</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      {(currentResource.uiMetadata?.['sandbox-permissions'] &&
                        currentResource.uiMetadata['sandbox-permissions'] !== 'allow-scripts' &&
                        currentResource.uiMetadata['sandbox-permissions'] !== 'allow-forms allow-scripts allow-same-origin' &&
                        currentResource.uiMetadata['sandbox-permissions'] !== 'allow-forms allow-scripts allow-same-origin allow-popups') && (
                        <Input
                          value={currentResource.uiMetadata['sandbox-permissions']}
                          onChange={(e) => updateResource({
                            uiMetadata: {
                              ...currentResource.uiMetadata,
                              'sandbox-permissions': e.target.value
                            }
                          })}
                          placeholder="allow-scripts allow-forms"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        Controls iframe security restrictions
                      </p>
                    </div>
                  )}

                  {/* Iframe Title */}
                  <div className="space-y-2">
                    <Label htmlFor="iframeTitle">Iframe Title (Accessibility)</Label>
                    <Input
                      id="iframeTitle"
                      value={currentResource.uiMetadata?.['iframe-title'] || ''}
                      onChange={(e) => updateResource({
                        uiMetadata: {
                          ...currentResource.uiMetadata,
                          'iframe-title': e.target.value
                        }
                      })}
                      placeholder="Contact Form Interface"
                    />
                    <p className="text-xs text-muted-foreground">
                      Helps screen readers identify the iframe content
                    </p>
                  </div>

                  {/* Container Style */}
                  <div className="space-y-2">
                    <Label>Container Style</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="border" className="text-xs text-muted-foreground">
                          Border
                        </Label>
                        <Input
                          id="border"
                          value={currentResource.uiMetadata?.['container-style']?.border || ''}
                          onChange={(e) => updateResource({
                            uiMetadata: {
                              ...currentResource.uiMetadata,
                              'container-style': {
                                ...currentResource.uiMetadata?.['container-style'],
                                border: e.target.value
                              }
                            }
                          })}
                          placeholder="1px solid #ccc"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="borderColor" className="text-xs text-muted-foreground">
                          Border Color
                        </Label>
                        <Input
                          id="borderColor"
                          type="color"
                          value={currentResource.uiMetadata?.['container-style']?.borderColor || '#cccccc'}
                          onChange={(e) => updateResource({
                            uiMetadata: {
                              ...currentResource.uiMetadata,
                              'container-style': {
                                ...currentResource.uiMetadata?.['container-style'],
                                borderColor: e.target.value
                              }
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="borderRadius" className="text-xs text-muted-foreground">
                          Border Radius
                        </Label>
                        <Input
                          id="borderRadius"
                          value={currentResource.uiMetadata?.['container-style']?.borderRadius || ''}
                          onChange={(e) => updateResource({
                            uiMetadata: {
                              ...currentResource.uiMetadata,
                              'container-style': {
                                ...currentResource.uiMetadata?.['container-style'],
                                borderRadius: e.target.value
                              }
                            }
                          })}
                          placeholder="8px"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="minHeight" className="text-xs text-muted-foreground">
                          Min Height
                        </Label>
                        <Input
                          id="minHeight"
                          value={currentResource.uiMetadata?.['container-style']?.minHeight || ''}
                          onChange={(e) => updateResource({
                            uiMetadata: {
                              ...currentResource.uiMetadata,
                              'container-style': {
                                ...currentResource.uiMetadata?.['container-style'],
                                minHeight: e.target.value
                              }
                            }
                          })}
                          placeholder="400px"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Visual customization for the iframe container
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Initial Render Data - Collapsible */}
          {currentResource.contentType === 'rawHtml' && (
            <div className="flex-shrink-0 space-y-2">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-accent mb-2 py-6">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 text-sm font-medium px-4 py-1.5">
                        Initial Render Data
                      </Badge>
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
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
          )}
        </div>

        {/* Right Column: Code + Preview Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <Tabs value={activeEditorTab} onValueChange={(value) => setActiveEditorTab(value as 'code' | 'preview')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-muted/5 h-auto p-0">
              <TabsTrigger value="code" className="gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Code2 className="h-4 w-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Monitor className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

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
