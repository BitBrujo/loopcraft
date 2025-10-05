"use client";

import { useState } from "react";
import { ArrowRight, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
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

  const toggleExpand = (toolId: string) => {
    const newExpanded = new Set(expandedTools);
    if (newExpanded.has(toolId)) {
      newExpanded.delete(toolId);
    } else {
      newExpanded.add(toolId);
    }
    setExpandedTools(newExpanded);
  };

  const canProceed = customTools.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Add Tool Button */}
        {!isAddingTool && !editingToolId && (
          <Button
            onClick={() => setIsAddingTool(true)}
            className="w-full gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Add Custom Tool
          </Button>
        )}

        {/* Tool Form (Add or Edit) */}
        {(isAddingTool || editingToolId) && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingToolId ? "Edit Tool" : "New Tool"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tool Name */}
              <div>
                <Label htmlFor="tool-name">Tool Name *</Label>
                <Input
                  id="tool-name"
                  placeholder="e.g., create_contact"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Tool Description */}
              <div>
                <Label htmlFor="tool-description">Description</Label>
                <Textarea
                  id="tool-description"
                  placeholder="Describe what this tool does..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Parameters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Parameters</Label>
                  <Button
                    onClick={addParameter}
                    size="sm"
                    variant="ghost"
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add Parameter
                  </Button>
                </div>

                {formData.parameters.map((param, index) => (
                  <Card key={index} className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Parameter name"
                          value={param.name}
                          onChange={(e) => updateParameter(index, { name: e.target.value })}
                        />
                        <Select
                          value={param.type}
                          onValueChange={(value) => updateParameter(index, { type: value as ToolParameter['type'] })}
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
                        <Input
                          placeholder="Description (optional)"
                          value={param.description}
                          onChange={(e) => updateParameter(index, { description: e.target.value })}
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            checked={param.required}
                            onChange={(e) => updateParameter(index, { required: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label
                            htmlFor={`required-${index}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            Required
                          </label>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeParameter(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={editingToolId ? handleUpdateTool : handleAddTool}
                  disabled={!formData.name.trim()}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  {editingToolId ? "Update" : "Add"} Tool
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Tools List */}
        {customTools.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Defined Tools ({customTools.length})
            </h3>
            {customTools.map((tool) => (
              <Card key={tool.id}>
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{tool.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {tool.parameters.length} parameter{tool.parameters.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {tool.description && (
                        <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                      )}

                      {/* Expandable Parameters */}
                      {tool.parameters.length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleExpand(tool.id)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {expandedTools.has(tool.id) ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Hide Parameters
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                Show Parameters
                              </>
                            )}
                          </button>
                          {expandedTools.has(tool.id) && (
                            <div className="mt-2 space-y-1 text-xs">
                              {tool.parameters.map((param, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                  <span className="font-mono">{param.name}</span>
                                  <span className="text-muted-foreground">({param.type})</span>
                                  {param.required && (
                                    <span className="text-destructive">*</span>
                                  )}
                                  {param.description && (
                                    <span className="text-muted-foreground">- {param.description}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleEditTool(tool)}
                        size="sm"
                        variant="ghost"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => removeCustomTool(tool.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {customTools.length === 0 && !isAddingTool && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No tools defined yet</p>
            <p className="text-sm mb-4">
              Add custom tools that will be included in your MCP server
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {canProceed ? (
              <span className="text-green-600">
                {customTools.length} tool{customTools.length !== 1 ? 's' : ''} ready
              </span>
            ) : (
              <span className="text-muted-foreground">Add at least one tool to continue</span>
            )}
          </div>
          <Button
            onClick={() => setActiveTab('actions')}
            disabled={!canProceed}
            className="gap-2"
          >
            Next: Configure Actions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
