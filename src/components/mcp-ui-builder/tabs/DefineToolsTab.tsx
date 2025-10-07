"use client";

import { useState } from "react";
import { ArrowRight, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateId } from "@/lib/utils";
import type { CustomTool, ToolParameter } from "@/types/ui-builder";

export function DefineToolsTab() {
  const { customTools, addCustomTool, updateCustomTool, removeCustomTool, setActiveTab } = useUIBuilderStore();
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  // Form state for new/editing tool
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    parameters: ToolParameter[];
  }>({
    name: "",
    description: "",
    parameters: [],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parameters: [],
    });
    setIsAddingTool(false);
    setEditingToolId(null);
  };

  const handleAddTool = () => {
    if (!formData.name.trim()) return;

    const newTool: CustomTool = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      parameters: formData.parameters,
    };

    addCustomTool(newTool);
    resetForm();
  };

  const handleUpdateTool = () => {
    if (!editingToolId || !formData.name.trim()) return;

    updateCustomTool(editingToolId, {
      name: formData.name,
      description: formData.description,
      parameters: formData.parameters,
    });

    resetForm();
  };

  const handleEditTool = (tool: CustomTool) => {
    setFormData({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    });
    setEditingToolId(tool.id);
    setIsAddingTool(false);
  };

  const addParameter = () => {
    setFormData({
      ...formData,
      parameters: [
        ...formData.parameters,
        {
          name: "",
          type: "string",
          description: "",
          required: false,
        },
      ],
    });
  };

  const updateParameter = (index: number, updates: Partial<ToolParameter>) => {
    const newParams = [...formData.parameters];
    newParams[index] = { ...newParams[index], ...updates };
    setFormData({ ...formData, parameters: newParams });
  };

  const removeParameter = (index: number) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index),
    });
  };

  const toggleToolExpansion = (toolId: string) => {
    setExpandedTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main content area with scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-12 space-y-8">
          {/* Header */}
          <div>
            <h3 className="text-2xl font-semibold mb-2">Define Custom Tools</h3>
            <p className="text-base text-muted-foreground">
              Create custom MCP tools that will be included in your generated server
            </p>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Custom tools are exported with your server code</p>
              <p className="text-blue-700 dark:text-blue-300">
                These tools will be available to map to UI interactions in the Actions tab. You can also connect to existing MCP servers in the Config tab.
              </p>
            </div>
          </div>

          {/* Tool List */}
          {customTools.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Your Custom Tools ({customTools.length})</h4>
              <div className="space-y-3">
                {customTools.map((tool) => (
                  <Card key={tool.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold">{tool.name}</CardTitle>
                          {tool.description && (
                            <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleToolExpansion(tool.id)}
                          >
                            {expandedTools.has(tool.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTool(tool)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomTool(tool.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {expandedTools.has(tool.id) && (
                      <CardContent className="pt-0 border-t">
                        <div className="space-y-2 mt-3">
                          <p className="text-sm font-medium">Parameters:</p>
                          {tool.parameters.length > 0 ? (
                            <div className="space-y-2">
                              {tool.parameters.map((param, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                  <code className="px-2 py-1 bg-muted rounded">{param.name}</code>
                                  <span className="text-muted-foreground">{param.type}</span>
                                  {param.required && (
                                    <span className="text-xs text-red-600">required</span>
                                  )}
                                  {param.description && (
                                    <span className="text-muted-foreground">- {param.description}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No parameters</p>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Add/Edit Tool Form */}
          {(isAddingTool || editingToolId) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingToolId ? "Edit Tool" : "Add New Tool"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tool Name */}
                <div className="space-y-2">
                  <Label htmlFor="tool-name">Tool Name</Label>
                  <Input
                    id="tool-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., send_email, create_task"
                  />
                </div>

                {/* Tool Description */}
                <div className="space-y-2">
                  <Label htmlFor="tool-description">Description</Label>
                  <Textarea
                    id="tool-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this tool do?"
                    rows={3}
                  />
                </div>

                {/* Parameters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Parameters</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addParameter}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Parameter
                    </Button>
                  </div>

                  {formData.parameters.map((param, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Name</Label>
                          <Input
                            value={param.name}
                            onChange={(e) =>
                              updateParameter(index, { name: e.target.value })
                            }
                            placeholder="param_name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Type</Label>
                          <Select
                            value={param.type}
                            onValueChange={(value: ToolParameter['type']) =>
                              updateParameter(index, { type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="array">Array</SelectItem>
                              <SelectItem value="object">Object</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label className="text-sm">Description</Label>
                          <Input
                            value={param.description}
                            onChange={(e) =>
                              updateParameter(index, { description: e.target.value })
                            }
                            placeholder="What is this parameter for?"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`param-required-${index}`}
                            checked={param.required}
                            onChange={(e) =>
                              updateParameter(index, { required: e.target.checked })
                            }
                            className="rounded"
                          />
                          <Label htmlFor={`param-required-${index}`} className="text-sm font-normal">
                            Required parameter
                          </Label>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParameter(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={editingToolId ? handleUpdateTool : handleAddTool}
                    disabled={!formData.name.trim()}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {editingToolId ? "Update Tool" : "Add Tool"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Tool Button (when not in add/edit mode) */}
          {!isAddingTool && !editingToolId && (
            <Button
              onClick={() => setIsAddingTool(true)}
              variant="outline"
              className="w-full h-12"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Custom Tool
            </Button>
          )}
        </div>
      </div>

      {/* Footer with Continue button */}
      <div className="border-t bg-card p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {customTools.length} custom tool{customTools.length !== 1 ? 's' : ''} defined
          </div>
          <Button
            onClick={() => setActiveTab('actions')}
            className="gap-2 h-11 px-6 text-base"
            size="lg"
          >
            Next: Map Actions
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
