'use client';

import { useState } from 'react';
import { Check, Settings2, ChevronDown, Code2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ToolSchema,
  ToolBinding,
  InteractiveElement,
  ParameterMapping,
} from '@/types/ui-builder';
import { generateBindingCode } from '@/lib/code-generation';

interface ToolActionMapperProps {
  selectedTools: string[];
  availableTools: ToolSchema[];
  parsedElements: InteractiveElement[];
  toolBindings: ToolBinding[];
  onBindingsChange: (bindings: ToolBinding[]) => void;
  onGenerateCode: (code: string) => void;
  targetServerName: string | null;
}

export function ToolActionMapper({
  selectedTools,
  availableTools,
  parsedElements,
  toolBindings,
  onBindingsChange,
  onGenerateCode,
  targetServerName,
}: ToolActionMapperProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  // Toggle tool expansion
  const toggleTool = (toolName: string) => {
    const newExpanded = new Set(expandedTools);
    if (newExpanded.has(toolName)) {
      newExpanded.delete(toolName);
    } else {
      newExpanded.add(toolName);
    }
    setExpandedTools(newExpanded);
  };

  // Get tool schema
  const getToolSchema = (toolName: string): ToolSchema | undefined => {
    return availableTools.find(t => t.name === toolName);
  };

  // Get binding for tool
  const getBinding = (toolName: string): ToolBinding | undefined => {
    return toolBindings.find(b => b.toolName === toolName);
  };

  // Check if tool is configured
  const isConfigured = (toolName: string): boolean => {
    const binding = getBinding(toolName);
    if (!binding || !binding.triggerId) return false;

    const schema = getToolSchema(toolName);
    if (!schema?.inputSchema?.properties) return true;

    const required = schema.inputSchema.required || [];
    return required.every(param => binding.parameterMappings[param]);
  };

  // Update trigger for tool
  const updateTrigger = (toolName: string, triggerId: string | null) => {
    const binding = getBinding(toolName);
    const newBinding: ToolBinding = {
      toolName,
      triggerId,
      parameterMappings: binding?.parameterMappings || {},
    };

    const newBindings = toolBindings.filter(b => b.toolName !== toolName);
    newBindings.push(newBinding);
    onBindingsChange(newBindings);
  };

  // Update parameter mapping
  const updateParameterMapping = (
    toolName: string,
    paramName: string,
    mapping: ParameterMapping
  ) => {
    const binding = getBinding(toolName) || {
      toolName,
      triggerId: null,
      parameterMappings: {},
    };

    const newBinding: ToolBinding = {
      ...binding,
      parameterMappings: {
        ...binding.parameterMappings,
        [paramName]: mapping,
      },
    };

    const newBindings = toolBindings.filter(b => b.toolName !== toolName);
    newBindings.push(newBinding);
    onBindingsChange(newBindings);
  };

  // Generate code for all configured tools
  const handleGenerateAll = () => {
    if (!targetServerName) return;

    const codes: string[] = [];
    toolBindings.forEach(binding => {
      if (!binding.triggerId) return;

      const element = parsedElements.find(e => e.id === binding.triggerId);
      if (!element) return;

      const code = generateBindingCode(binding, targetServerName, element);
      codes.push(code);
    });

    if (codes.length > 0) {
      onGenerateCode(codes.join('\n\n'));
    }
  };

  // Generate code for single tool
  const handleGenerateSingle = (toolName: string) => {
    if (!targetServerName) return;

    const binding = getBinding(toolName);
    if (!binding || !binding.triggerId) return;

    const element = parsedElements.find(e => e.id === binding.triggerId);
    if (!element) return;

    const code = generateBindingCode(binding, targetServerName, element);
    onGenerateCode(code);
  };

  // Get available form fields for parameter mapping
  const getAvailableFormFields = (triggerId: string | null): InteractiveElement[] => {
    if (!triggerId) return [];

    const trigger = parsedElements.find(e => e.id === triggerId);
    if (!trigger) return [];

    // If trigger is a form, return its fields
    if (trigger.type === 'form' && trigger.formFields) {
      return trigger.formFields.map(field => ({
        id: field.id,
        type: 'input',
        tagName: 'input',
        text: `${field.name} (${field.type})`,
      }));
    }

    // Otherwise return all input elements
    return parsedElements.filter(e =>
      e.type === 'input' || e.type === 'select' || e.type === 'textarea'
    );
  };

  const configuredCount = selectedTools.filter(isConfigured).length;
  const totalCount = selectedTools.length;

  return (
    <Card className="border-orange-500/30 bg-orange-50/30 dark:bg-orange-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-orange-600" />
            Tool Action Mapping
            <Badge variant="secondary" className="text-xs">
              {configuredCount}/{totalCount} configured
            </Badge>
          </CardTitle>
          {parsedElements.length === 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Add HTML first
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure which HTML elements trigger your selected tools
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {parsedElements.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add HTML content in the editor to automatically detect interactive elements
              (buttons, forms, inputs).
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {selectedTools.map(toolName => {
              const schema = getToolSchema(toolName);
              const binding = getBinding(toolName);
              const configured = isConfigured(toolName);
              const expanded = expandedTools.has(toolName);
              const params = schema?.inputSchema?.properties || {};
              const required = schema?.inputSchema?.required || [];
              const formFields = getAvailableFormFields(binding?.triggerId || null);

              return (
                <Collapsible
                  key={toolName}
                  open={expanded}
                  onOpenChange={() => toggleTool(toolName)}
                >
                  <Card className={configured ? 'border-green-500/50' : ''}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="p-3 cursor-pointer hover:bg-accent/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {configured && <Check className="h-4 w-4 text-green-600" />}
                              <span className="font-medium text-sm">{toolName}</span>
                            </div>
                            {schema?.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {schema.description}
                              </p>
                            )}
                            {!binding?.triggerId && (
                              <Badge variant="outline" className="text-xs mt-2">
                                Not configured
                              </Badge>
                            )}
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expanded ? '' : '-rotate-90'
                            }`}
                          />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="p-3 pt-0 space-y-3">
                        {/* Trigger Element Selection */}
                        <div className="space-y-2">
                          <Label className="text-xs">Trigger Element</Label>
                          <Select
                            value={binding?.triggerId || ''}
                            onValueChange={(value) => updateTrigger(toolName, value || null)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select element..." />
                            </SelectTrigger>
                            <SelectContent>
                              {parsedElements.map(element => (
                                <SelectItem key={element.id} value={element.id}>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {element.type}
                                    </Badge>
                                    <span className="text-xs">#{element.id}</span>
                                    {element.text && (
                                      <span className="text-xs text-muted-foreground">
                                        - {element.text}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Parameter Mappings */}
                        {Object.keys(params).length > 0 && (
                          <div className="space-y-3 pt-2 border-t">
                            <Label className="text-xs font-semibold">Parameters</Label>
                            {Object.entries(params).map(([paramName, paramSchema]) => {
                              const isRequired = required.includes(paramName);
                              const mapping = binding?.parameterMappings[paramName] || {
                                source: 'static',
                                value: '',
                              };

                              return (
                                <div key={paramName} className="space-y-2 p-2 bg-muted/30 rounded">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs font-mono">
                                      {paramName}
                                    </Label>
                                    {isRequired && (
                                      <Badge variant="destructive" className="text-xs px-1 py-0">
                                        required
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      {paramSchema.type}
                                    </Badge>
                                  </div>
                                  {paramSchema.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {paramSchema.description}
                                    </p>
                                  )}

                                  {/* Source Selection */}
                                  <RadioGroup
                                    value={mapping.source}
                                    onValueChange={(source: 'static' | 'form') =>
                                      updateParameterMapping(toolName, paramName, {
                                        ...mapping,
                                        source,
                                        value: '',
                                      })
                                    }
                                    className="flex gap-4"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="static" id={`${toolName}-${paramName}-static`} />
                                      <Label
                                        htmlFor={`${toolName}-${paramName}-static`}
                                        className="text-xs font-normal cursor-pointer"
                                      >
                                        Static value
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="form" id={`${toolName}-${paramName}-form`} />
                                      <Label
                                        htmlFor={`${toolName}-${paramName}-form`}
                                        className="text-xs font-normal cursor-pointer"
                                      >
                                        Form field
                                      </Label>
                                    </div>
                                  </RadioGroup>

                                  {/* Value Input */}
                                  {mapping.source === 'static' ? (
                                    <Input
                                      value={mapping.value}
                                      onChange={(e) =>
                                        updateParameterMapping(toolName, paramName, {
                                          ...mapping,
                                          value: e.target.value,
                                        })
                                      }
                                      placeholder="Enter static value..."
                                      className="text-xs"
                                    />
                                  ) : (
                                    <Select
                                      value={mapping.value}
                                      onValueChange={(value) =>
                                        updateParameterMapping(toolName, paramName, {
                                          ...mapping,
                                          value,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Select form field..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {formFields.map(field => (
                                          <SelectItem key={field.id} value={field.id}>
                                            <span className="text-xs">
                                              #{field.id} {field.text && `- ${field.text}`}
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Generate Button */}
                        {configured && (
                          <Button
                            size="sm"
                            onClick={() => handleGenerateSingle(toolName)}
                            className="w-full text-xs gap-2"
                          >
                            <Code2 className="h-3 w-3" />
                            Generate Code
                          </Button>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}

            {/* Generate All Button */}
            {configuredCount > 0 && (
              <Button
                onClick={handleGenerateAll}
                className="w-full gap-2"
                size="sm"
              >
                <Code2 className="h-4 w-4" />
                Generate All Code ({configuredCount} tools)
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
