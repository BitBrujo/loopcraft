"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { parseHTMLForInteractiveElements } from "@/lib/html-parser";
import type { ActionMapping } from "@/types/ui-builder";

interface ParameterBindingEditorProps {
  mappingId: string;
}

export function ParameterBindingEditor({ mappingId }: ParameterBindingEditorProps) {
  const { currentResource, mcpContext, actionMappings, updateActionMapping } = useUIBuilderStore();

  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());
  const [availableFields, setAvailableFields] = useState<{ id: string; name: string; type: string }[]>([]);

  const mapping = actionMappings.find(m => m.id === mappingId);
  const tool = mcpContext.selectedTools.find(
    t => mapping && t.name === mapping.toolName && t.serverName === mapping.serverName
  );

  // Extract available fields from HTML
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      const elements = parseHTMLForInteractiveElements(currentResource.content);
      const fields: { id: string; name: string; type: string }[] = [];

      // Add fields from forms
      elements.forEach(element => {
        if (element.type === 'form' && element.formFields) {
          element.formFields.forEach(field => {
            if (field.id || field.name) {
              fields.push({
                id: field.id || field.name,
                name: field.name || field.id,
                type: field.type,
              });
            }
          });
        }

        // Add individual input elements
        if (['input', 'select', 'textarea'].includes(element.type)) {
          fields.push({
            id: element.id,
            name: element.attributes.name || element.id,
            type: element.attributes.type || element.type,
          });
        }
      });

      setAvailableFields(fields);
    }
  }, [currentResource]);

  if (!mapping || !tool) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p>No mapping selected</p>
        </div>
      </div>
    );
  }

  const toolSchema = tool.inputSchema as {
    type?: string;
    properties?: Record<string, {
      type?: string;
      description?: string;
      required?: boolean;
      enum?: string[];
    }>;
    required?: string[];
  } | undefined;

  const properties = toolSchema?.properties || {};
  const requiredParams = toolSchema?.required || [];

  const toggleParam = (paramName: string) => {
    const newExpanded = new Set(expandedParams);
    if (newExpanded.has(paramName)) {
      newExpanded.delete(paramName);
    } else {
      newExpanded.add(paramName);
    }
    setExpandedParams(newExpanded);
  };

  const handleBindingChange = (paramName: string, fieldId: string) => {
    const newBindings = { ...mapping.parameterBindings };
    if (fieldId === '') {
      delete newBindings[paramName];
    } else {
      newBindings[paramName] = fieldId;
    }
    updateActionMapping(mapping.id, { parameterBindings: newBindings });
  };

  const handleResponseHandlerChange = (handler: ActionMapping['responseHandler']) => {
    updateActionMapping(mapping.id, { responseHandler: handler });
  };

  return (
    <div className="h-full grid grid-cols-3 gap-4 p-4 overflow-hidden">
      {/* Left: Schema Reference */}
      <div className="border rounded-lg overflow-auto">
        <div className="sticky top-0 bg-card border-b p-3">
          <h4 className="font-semibold text-sm">Tool Schema</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {tool.name} ({tool.serverName})
          </p>
        </div>
        <div className="p-3 space-y-2">
          {Object.entries(properties).map(([paramName, paramSchema]) => {
            const isRequired = requiredParams.includes(paramName);
            const isExpanded = expandedParams.has(paramName);

            return (
              <div key={paramName} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleParam(paramName)}
                  className="w-full flex items-center justify-between p-2 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <code className="text-sm font-mono">{paramName}</code>
                    {isRequired && (
                      <span className="text-xs text-red-600">*</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {paramSchema.type || 'any'}
                  </span>
                </button>
                {isExpanded && (
                  <div className="p-2 bg-muted/30 text-xs space-y-1">
                    <div><strong>Type:</strong> {paramSchema.type || 'any'}</div>
                    {paramSchema.description && (
                      <div><strong>Description:</strong> {paramSchema.description}</div>
                    )}
                    {paramSchema.enum && (
                      <div><strong>Enum:</strong> {paramSchema.enum.join(', ')}</div>
                    )}
                    <div><strong>Required:</strong> {isRequired ? 'Yes' : 'No'}</div>
                  </div>
                )}
              </div>
            );
          })}
          {Object.keys(properties).length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No parameters defined
            </div>
          )}
        </div>
      </div>

      {/* Center: Binding Interface */}
      <div className="border rounded-lg overflow-auto">
        <div className="sticky top-0 bg-card border-b p-3">
          <h4 className="font-semibold text-sm">Parameter Bindings</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Map HTML fields to tool parameters
          </p>
        </div>
        <div className="p-3 space-y-3">
          {Object.entries(properties).map(([paramName, paramSchema]) => {
            const isRequired = requiredParams.includes(paramName);
            const currentBinding = mapping.parameterBindings[paramName] || '';

            return (
              <div key={paramName} className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  {paramName}
                  {isRequired && <span className="text-red-600">*</span>}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({paramSchema.type || 'any'})
                  </span>
                </label>
                <select
                  value={currentBinding}
                  onChange={(e) => handleBindingChange(paramName, e.target.value)}
                  className="w-full text-sm border rounded px-2 py-1 bg-background"
                >
                  <option value="">- Select HTML field -</option>
                  {availableFields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.type})
                    </option>
                  ))}
                </select>
                {isRequired && !currentBinding && (
                  <p className="text-xs text-red-600">Required parameter</p>
                )}
              </div>
            );
          })}
          {Object.keys(properties).length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No parameters to bind
            </div>
          )}

          {/* Response Handler */}
          <div className="pt-4 border-t space-y-1">
            <label className="text-sm font-medium">Response Handler</label>
            <select
              value={mapping.responseHandler}
              onChange={(e) => handleResponseHandlerChange(e.target.value as ActionMapping['responseHandler'])}
              className="w-full text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="show-notification">Show Notification</option>
              <option value="update-ui">Update UI</option>
              <option value="custom">Custom Handler</option>
            </select>
            <p className="text-xs text-muted-foreground">
              How to handle the tool response
            </p>
          </div>
        </div>
      </div>

      {/* Right: JSON Preview */}
      <div className="border rounded-lg overflow-auto">
        <div className="sticky top-0 bg-card border-b p-3">
          <h4 className="font-semibold text-sm">JSON Preview</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Parameter bindings as JSON
          </p>
        </div>
        <div className="p-3">
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
            {JSON.stringify(
              {
                uiElementId: mapping.uiElementId,
                toolName: mapping.toolName,
                serverName: mapping.serverName,
                parameterBindings: mapping.parameterBindings,
                responseHandler: mapping.responseHandler,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
