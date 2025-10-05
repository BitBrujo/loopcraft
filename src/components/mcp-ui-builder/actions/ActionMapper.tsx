"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { parseHTMLForInteractiveElements } from "@/lib/html-parser";
import { generateId } from "@/lib/utils";
import type { InteractiveElement } from "@/lib/html-parser";
import type { ActionMapping } from "@/types/ui-builder";
import { Button } from "@/components/ui/button";

export function ActionMapper() {
  const {
    currentResource,
    customTools,
    actionMappings,
    addActionMapping,
    updateActionMapping,
    removeActionMapping,
    validationStatus,
  } = useUIBuilderStore();

  const [interactiveElements, setInteractiveElements] = useState<InteractiveElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Parse HTML for interactive elements
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      const elements = parseHTMLForInteractiveElements(currentResource.content);
      setInteractiveElements(elements);
    } else {
      setInteractiveElements([]);
    }
  }, [currentResource]);

  const handleAddMapping = (elementId: string) => {
    const element = interactiveElements.find(e => e.id === elementId);
    if (!element) return;

    // Create new mapping with first available custom tool
    const firstTool = customTools[0];
    if (!firstTool) return;

    const newMapping: ActionMapping = {
      id: generateId(),
      uiElementId: elementId,
      uiElementType: element.type,
      toolName: firstTool.name,
      serverName: 'custom', // Custom tools don't have a server
      parameterBindings: {}, // Legacy
      parameterSources: {}, // New: typed parameter sources
      responseHandler: 'show-notification',
    };

    addActionMapping(newMapping);
  };

  const handleToolChange = (mappingId: string, toolName: string, serverName: string) => {
    updateActionMapping(mappingId, {
      toolName,
      serverName,
      // Reset parameter bindings when tool changes
      parameterBindings: {},
      parameterSources: {},
    });
  };

  const handleRemoveMapping = (mappingId: string) => {
    if (confirm('Remove this action mapping?')) {
      removeActionMapping(mappingId);
    }
  };

  const getMappingForElement = (elementId: string): ActionMapping | undefined => {
    return actionMappings.find(m => m.uiElementId === elementId);
  };

  const getValidationStatus = (elementId: string): 'valid' | 'error' | 'warning' | 'none' => {
    const mapping = getMappingForElement(elementId);
    if (!mapping) return 'none';

    // Check for errors
    const hasError = validationStatus.missingMappings.some(msg =>
      msg.includes(elementId)
    ) || validationStatus.typeMismatches.some(mismatch =>
      mismatch.field.startsWith(elementId)
    );

    if (hasError) return 'error';

    // Check for warnings
    const hasWarning = validationStatus.warnings.some(msg =>
      msg.includes(elementId)
    );

    if (hasWarning) return 'warning';

    return 'valid';
  };

  if (!currentResource || currentResource.contentType !== 'rawHtml') {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p>Action mapping is only available for Raw HTML content</p>
        </div>
      </div>
    );
  }

  if (customTools.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p>No custom tools defined</p>
          <p className="text-sm">Go to the Define Tools tab to create tools for your server</p>
        </div>
      </div>
    );
  }

  if (interactiveElements.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p>No interactive elements found in HTML</p>
          <p className="text-sm">Add buttons, forms, or links to your HTML</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Action Mappings</h3>
            <p className="text-sm text-muted-foreground">
              Map UI elements to MCP tool calls
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {interactiveElements.length} interactive element{interactiveElements.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Element ID</th>
                <th className="text-left p-3 text-sm font-medium">Type</th>
                <th className="text-left p-3 text-sm font-medium">Mapped Tool</th>
                <th className="text-left p-3 text-sm font-medium">Server</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-right p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interactiveElements.map((element) => {
                const mapping = getMappingForElement(element.id);
                const status = getValidationStatus(element.id);

                return (
                  <tr
                    key={element.id}
                    className={`border-t hover:bg-muted/30 ${
                      selectedElement === element.id ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <td className="p-3">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {element.id}
                      </code>
                      {element.text && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {element.text.substring(0, 30)}
                          {element.text.length > 30 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-sm capitalize">
                      {element.type}
                    </td>
                    <td className="p-3">
                      {mapping ? (
                        <select
                          value={mapping.toolName}
                          onChange={(e) => {
                            handleToolChange(mapping.id, e.target.value, 'custom');
                          }}
                          className="text-sm border rounded px-2 py-1 bg-background w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {customTools.map((tool) => (
                            <option
                              key={tool.id}
                              value={tool.name}
                            >
                              {tool.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {mapping ? (
                        <span className="text-sm text-muted-foreground">
                          Custom
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {status === 'valid' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs">Valid</span>
                        </div>
                      )}
                      {status === 'error' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">Error</span>
                        </div>
                      )}
                      {status === 'warning' && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">Warning</span>
                        </div>
                      )}
                      {status === 'none' && (
                        <span className="text-xs text-muted-foreground">Not mapped</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {mapping ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMapping(mapping.id);
                          }}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMapping(element.id);
                          }}
                          className="h-7 gap-1 text-xs"
                        >
                          <Plus className="h-3 w-3" />
                          Map
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            {actionMappings.length} of {interactiveElements.length} elements mapped
          </div>
          {actionMappings.length < interactiveElements.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                interactiveElements.forEach(element => {
                  if (!getMappingForElement(element.id)) {
                    handleAddMapping(element.id);
                  }
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Map All Elements
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
