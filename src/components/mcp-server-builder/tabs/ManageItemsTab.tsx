"use client";

import { useState } from "react";
import { useServerBuilderStore } from "@/lib/stores/server-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, CheckCircle, Edit, ArrowLeft, Database, RefreshCw } from "lucide-react";
import type { ToolParameter, ToolParameterType, ToolDefinition, ResourceDefinition, ResourceVariable, ResourceVariableType } from "@/types/server-builder";

type ItemType = 'tools' | 'resources';

export function ManageItemsTab() {
  const {
    serverConfig,
    activeTool,
    activeResource,
    setActiveTool,
    setActiveResource,
    updateTool,
    updateResource,
    removeTool,
    removeResource,
    setActiveTab,
  } = useServerBuilderStore();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ItemType>('tools');

  const tools = serverConfig?.tools || [];
  const resources = serverConfig?.resources || [];

  const handleSelectTool = (toolId: string) => {
    const tool = tools.find((t) => t.id === toolId);
    if (tool) {
      setActiveTool(tool);
      setActiveResource(null);
    }
  };

  const handleSelectResource = (resourceId: string) => {
    const resource = resources.find((r) => r.id === resourceId);
    if (resource) {
      setActiveResource(resource);
      setActiveTool(null);
    }
  };

  const handleRemoveTool = (toolId: string) => {
    removeTool(toolId);
    if (activeTool?.id === toolId) {
      setActiveTool(null);
    }
  };

  const handleRemoveResource = (resourceId: string) => {
    removeResource(resourceId);
    if (activeResource?.id === resourceId) {
      setActiveResource(null);
    }
  };

  const handleUpdateActiveTool = (updates: Partial<ToolDefinition>) => {
    if (!activeTool) return;
    const updatedTool = { ...activeTool, ...updates } as ToolDefinition;
    setActiveTool(updatedTool);
    updateTool(activeTool.id, updates);
  };

  const handleAddParameter = () => {
    if (!activeTool) return;
    const newParam: ToolParameter = {
      name: 'new_param',
      type: 'string',
      description: 'New parameter',
      required: false,
    };
    handleUpdateActiveTool({
      parameters: [...activeTool.parameters, newParam],
    });
  };

  const handleUpdateParameter = (index: number, updates: Partial<ToolParameter>) => {
    if (!activeTool) return;
    const updatedParams = [...activeTool.parameters];
    updatedParams[index] = { ...updatedParams[index], ...updates };
    handleUpdateActiveTool({ parameters: updatedParams });
  };

  const handleRemoveParameter = (index: number) => {
    if (!activeTool) return;
    const updatedParams = activeTool.parameters.filter((_, i) => i !== index);
    handleUpdateActiveTool({ parameters: updatedParams });
  };

  const handleContinueToTest = () => {
    setActiveTab('test');
  };

  const handleAddMoreTools = () => {
    setActiveTab('templates');
  };

  if (tools.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            No tools added yet. Browse categories to add tools to your server.
          </p>
          <Button onClick={() => setActiveTab('templates')}>
            Browse Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <Button
            variant="outline"
            onClick={handleAddMoreTools}
            size="default"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Add More Tools
          </Button>
          <Button
            onClick={handleContinueToTest}
            size="default"
            className="gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            Continue to Test
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tool List */}
        <div className="w-80 border-r bg-card overflow-y-auto">
        <div className="sticky top-0 bg-card border-b p-4 z-10">
          <h3 className="font-semibold text-lg mb-2">Server Tools ({tools.length})</h3>
          <p className="text-xs text-muted-foreground">
            Click a tool to edit its configuration
          </p>
        </div>

        <div className="p-3 space-y-2">
          {tools.map((tool) => (
            <div
              key={tool.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectTool(tool.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectTool(tool.id);
                }
              }}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                activeTool?.id === tool.id
                  ? 'bg-orange-500/10 border-orange-500'
                  : 'hover:bg-muted/50 border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{tool.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tool.parameters.length} param{tool.parameters.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTool(tool.id);
                  }}
                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Tool Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {!activeTool ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Edit className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a tool from the list to edit</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Customize Tool</h2>
                <p className="text-muted-foreground">
                  Click on any field to edit. Changes are saved automatically.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Tool Name */}
              <div className="bg-card rounded-lg border p-6">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Tool Name
                </label>
                {editingField === 'name' ? (
                  <Input
                    value={activeTool.name}
                    onChange={(e) => handleUpdateActiveTool({ name: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="text-lg font-semibold"
                  />
                ) : (
                  <div
                    onClick={() => setEditingField('name')}
                    className="text-lg font-semibold cursor-pointer hover:bg-muted/50 p-2 rounded"
                  >
                    {activeTool.name}
                  </div>
                )}
              </div>

              {/* Tool Description */}
              <div className="bg-card rounded-lg border p-6">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Description
                </label>
                {editingField === 'description' ? (
                  <Textarea
                    value={activeTool.description}
                    onChange={(e) => handleUpdateActiveTool({ description: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    rows={3}
                  />
                ) : (
                  <div
                    onClick={() => setEditingField('description')}
                    className="cursor-pointer hover:bg-muted/50 p-2 rounded"
                  >
                    {activeTool.description}
                  </div>
                )}
              </div>

              {/* Parameters */}
              <div className="bg-card rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-muted-foreground">
                    What it Receives (Parameters)
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddParameter}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Parameter
                  </Button>
                </div>

                {activeTool.parameters.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No parameters yet. Click &quot;Add Parameter&quot; to add one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeTool.parameters.map((param, index) => (
                      <div
                        key={index}
                        className="bg-muted/30 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Name
                              </label>
                              <Input
                                value={param.name}
                                onChange={(e) =>
                                  handleUpdateParameter(index, { name: e.target.value })
                                }
                                placeholder="parameter_name"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Type
                              </label>
                              <Select
                                value={param.type}
                                onValueChange={(value: ToolParameterType) =>
                                  handleUpdateParameter(index, { type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">Text (string)</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">True/False (boolean)</SelectItem>
                                  <SelectItem value="array">List (array)</SelectItem>
                                  <SelectItem value="object">Object</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveParameter(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Description
                          </label>
                          <Input
                            value={param.description}
                            onChange={(e) =>
                              handleUpdateParameter(index, { description: e.target.value })
                            }
                            placeholder="What is this parameter for?"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            checked={param.required}
                            onChange={(e) =>
                              handleUpdateParameter(index, { required: e.target.checked })
                            }
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={`required-${index}`}
                            className="text-sm cursor-pointer"
                          >
                            Required parameter
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Return Type */}
              <div className="bg-card rounded-lg border p-6">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  What it Returns
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Return Type
                    </label>
                    {editingField === 'returnType' ? (
                      <Input
                        value={activeTool.returnType}
                        onChange={(e) => handleUpdateActiveTool({ returnType: e.target.value })}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        placeholder="e.g., object, array, string"
                      />
                    ) : (
                      <div
                        onClick={() => setEditingField('returnType')}
                        className="cursor-pointer hover:bg-muted/50 p-2 rounded border"
                      >
                        {activeTool.returnType}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Return Description
                    </label>
                    {editingField === 'returnDescription' ? (
                      <Textarea
                        value={activeTool.returnDescription}
                        onChange={(e) =>
                          handleUpdateActiveTool({ returnDescription: e.target.value })
                        }
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        rows={2}
                      />
                    ) : (
                      <div
                        onClick={() => setEditingField('returnDescription')}
                        className="cursor-pointer hover:bg-muted/50 p-2 rounded border"
                      >
                        {activeTool.returnDescription}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
