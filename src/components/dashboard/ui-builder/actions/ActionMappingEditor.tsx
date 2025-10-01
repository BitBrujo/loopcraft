"use client";

import { useState, useEffect } from 'react';
import { WrenchIcon, XIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUIBuilderStore, type ActionMapping, type MCPTool } from '@/lib/stores/ui-builder-store';
import type { DetectedElement } from './InteractiveElementDetector';
import dynamic from 'next/dynamic';

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface ActionMappingEditorProps {
  selectedElement: DetectedElement | null;
  onClose: () => void;
}

interface ParameterBinding {
  toolParam: string;
  type: 'static' | 'field';
  value: string;
}

export function ActionMappingEditor({ selectedElement, onClose }: ActionMappingEditorProps) {
  const {
    mcpContext,
    actionMappings,
    addActionMapping,
    updateActionMapping,
  } = useUIBuilderStore();

  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [parameterBindings, setParameterBindings] = useState<ParameterBinding[]>([]);
  const [responseHandler, setResponseHandler] = useState<ActionMapping['responseHandler']>('update-ui');
  const [customHandler, setCustomHandler] = useState('');

  // Check if this element already has a mapping
  const existingMapping = selectedElement
    ? actionMappings.find(m => m.uiElementId === selectedElement.id)
    : null;

  useEffect(() => {
    if (existingMapping) {
      // Load existing mapping
      const tool = mcpContext.selectedTools.find(
        t => t.name === existingMapping.toolName && t.serverName === existingMapping.serverName
      );
      setSelectedTool(tool || null);
      setResponseHandler(existingMapping.responseHandler);
      setCustomHandler(existingMapping.customHandler || '');

      // Convert parameter bindings object to array
      const bindings = Object.entries(existingMapping.parameterBindings).map(([toolParam, value]) => ({
        toolParam,
        type: value.startsWith('field:') ? 'field' as const : 'static' as const,
        value: value.startsWith('field:') ? value.slice(6) : value,
      }));
      setParameterBindings(bindings);
    } else {
      // Reset for new mapping
      setSelectedTool(null);
      setParameterBindings([]);
      setResponseHandler('update-ui');
      setCustomHandler('');
    }
  }, [existingMapping, mcpContext.selectedTools]);

  useEffect(() => {
    // Auto-generate parameter bindings when tool is selected
    if (selectedTool && selectedTool.inputSchema?.properties) {
      const newBindings: ParameterBinding[] = [];

      for (const [paramName] of Object.entries(selectedTool.inputSchema.properties)) {
        const existing = parameterBindings.find(b => b.toolParam === paramName);
        if (existing) {
          newBindings.push(existing);
        } else {
          newBindings.push({
            toolParam: paramName,
            type: 'static',
            value: '',
          });
        }
      }

      setParameterBindings(newBindings);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool]);

  const handleSave = () => {
    if (!selectedElement || !selectedTool) return;

    const bindingsObject = parameterBindings.reduce((acc, binding) => {
      if (binding.value) {
        acc[binding.toolParam] = binding.type === 'field' ? `field:${binding.value}` : binding.value;
      }
      return acc;
    }, {} as Record<string, string>);

    const mapping: Omit<ActionMapping, 'id'> = {
      uiElementId: selectedElement.id,
      uiElementType: selectedElement.type,
      uiElementLabel: selectedElement.label,
      toolName: selectedTool.name,
      serverName: selectedTool.serverName,
      parameterBindings: bindingsObject,
      responseHandler,
      customHandler: responseHandler === 'custom' ? customHandler : undefined,
    };

    if (existingMapping) {
      updateActionMapping(existingMapping.id, mapping);
    } else {
      addActionMapping(mapping);
    }

    onClose();
  };

  const updateBinding = (index: number, updates: Partial<ParameterBinding>) => {
    setParameterBindings(prev => prev.map((b, i) => i === index ? { ...b, ...updates } : b));
  };

  const addBinding = () => {
    setParameterBindings(prev => [...prev, { toolParam: '', type: 'static', value: '' }]);
  };

  const removeBinding = (index: number) => {
    setParameterBindings(prev => prev.filter((_, i) => i !== index));
  };

  const getParamType = (paramName: string): string => {
    if (!selectedTool?.inputSchema?.properties) return 'any';
    const prop = selectedTool.inputSchema.properties[paramName];
    if (prop && typeof prop === 'object' && 'type' in prop) {
      return prop.type as string;
    }
    return 'any';
  };

  const isRequired = (paramName: string): boolean => {
    return selectedTool?.inputSchema?.required?.includes(paramName) || false;
  };

  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center p-8 border-r border-border bg-card/30">
        <div className="text-center">
          <WrenchIcon className="size-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Select an element to configure its action
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-r border-border bg-card/30">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-medium">Configure Action</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedElement.label} ({selectedElement.type})
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="size-8 p-0">
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Tool Selection */}
          <div className="space-y-2">
            <Label htmlFor="tool-select">MCP Tool</Label>
            <Select
              value={selectedTool ? `${selectedTool.serverName}::${selectedTool.name}` : ''}
              onValueChange={(value) => {
                const [serverName, toolName] = value.split('::');
                const tool = mcpContext.selectedTools.find(
                  t => t.serverName === serverName && t.name === toolName
                );
                setSelectedTool(tool || null);
              }}
            >
              <SelectTrigger id="tool-select">
                <SelectValue placeholder="Select a tool..." />
              </SelectTrigger>
              <SelectContent>
                {mcpContext.selectedTools.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">
                    No tools selected in Context tab
                  </div>
                ) : (
                  mcpContext.selectedTools.map(tool => (
                    <SelectItem key={`${tool.serverName}::${tool.name}`} value={`${tool.serverName}::${tool.name}`}>
                      <div className="flex items-center gap-2">
                        <span>{tool.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{tool.serverName}</Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedTool?.description && (
              <p className="text-xs text-muted-foreground">{selectedTool.description}</p>
            )}
          </div>

          {/* Parameter Bindings */}
          {selectedTool && parameterBindings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Parameter Bindings</Label>
                <Button variant="ghost" size="sm" onClick={addBinding} className="h-6 text-xs gap-1">
                  <PlusIcon className="size-3" />
                  Add
                </Button>
              </div>

              <div className="space-y-3 border border-border rounded-lg p-3 bg-card/50">
                {parameterBindings.map((binding, index) => (
                  <div key={index} className="space-y-2 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="Parameter name"
                        value={binding.toolParam}
                        onChange={(e) => updateBinding(index, { toolParam: e.target.value })}
                        className="h-8 text-sm flex-1 mr-2"
                        list={`params-${index}`}
                      />
                      {selectedTool.inputSchema?.properties && (
                        <datalist id={`params-${index}`}>
                          {Object.keys(selectedTool.inputSchema.properties).map(param => (
                            <option key={param} value={param} />
                          ))}
                        </datalist>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBinding(index)}
                        className="size-8 p-0"
                      >
                        <XIcon className="size-3" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={binding.type}
                        onValueChange={(value: 'static' | 'field') => updateBinding(index, { type: value })}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="static">Static</SelectItem>
                          <SelectItem value="field">Field</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder={binding.type === 'field' ? 'Field ID or name' : 'Static value'}
                        value={binding.value}
                        onChange={(e) => updateBinding(index, { value: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                    </div>

                    {binding.toolParam && (
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {getParamType(binding.toolParam)}
                        </Badge>
                        {isRequired(binding.toolParam) && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-red-500/30 text-red-600">
                            required
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Handler */}
          <div className="space-y-2">
            <Label htmlFor="response-handler">Response Handler</Label>
            <Select value={responseHandler} onValueChange={(value) => setResponseHandler(value as ActionMapping['responseHandler'])}>
              <SelectTrigger id="response-handler">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update-ui">Update UI</SelectItem>
                <SelectItem value="show-notification">Show Notification</SelectItem>
                <SelectItem value="refresh-page">Refresh Page</SelectItem>
                <SelectItem value="custom">Custom Handler</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Handler Editor */}
          {responseHandler === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Handler Code</Label>
              <div className="border border-border rounded-lg overflow-hidden h-48">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  value={customHandler}
                  onChange={(value) => setCustomHandler(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Function receives <code className="px-1 bg-muted rounded">response</code> parameter
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-4 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!selectedTool}
          className="flex-1"
        >
          {existingMapping ? 'Update' : 'Create'} Mapping
        </Button>
      </div>
    </div>
  );
}
