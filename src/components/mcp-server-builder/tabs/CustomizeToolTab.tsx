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
import { Plus, Trash2, CheckCircle } from "lucide-react";
import type { ToolParameter, ToolParameterType } from "@/types/server-builder";

export function CustomizeToolTab() {
  const { activeTool, updateActiveTool, setActiveTab } = useServerBuilderStore();
  const [editingField, setEditingField] = useState<string | null>(null);

  if (!activeTool) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            No tool selected. Please select a template first.
          </p>
          <Button onClick={() => setActiveTab('templates')}>
            Browse Templates
          </Button>
        </div>
      </div>
    );
  }

  const handleAddParameter = () => {
    const newParam: ToolParameter = {
      name: 'new_param',
      type: 'string',
      description: 'New parameter',
      required: false,
    };
    updateActiveTool({
      parameters: [...activeTool.parameters, newParam],
    });
  };

  const handleUpdateParameter = (index: number, updates: Partial<ToolParameter>) => {
    const updatedParams = [...activeTool.parameters];
    updatedParams[index] = { ...updatedParams[index], ...updates };
    updateActiveTool({ parameters: updatedParams });
  };

  const handleRemoveParameter = (index: number) => {
    const updatedParams = activeTool.parameters.filter((_, i) => i !== index);
    updateActiveTool({ parameters: updatedParams });
  };

  const handleContinueToTest = () => {
    setActiveTab('test');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Customize Tool</h2>
          <p className="text-muted-foreground">
            Click on any field to edit. Changes are saved automatically.
          </p>
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
                onChange={(e) => updateActiveTool({ name: e.target.value })}
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
                onChange={(e) => updateActiveTool({ description: e.target.value })}
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

          {/* What it Receives (Parameters) */}
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
                        {/* Parameter Name */}
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

                        {/* Parameter Type */}
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

                    {/* Parameter Description */}
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

                    {/* Required Checkbox */}
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

          {/* What it Returns */}
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
                    onChange={(e) => updateActiveTool({ returnType: e.target.value })}
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
                      updateActiveTool({ returnDescription: e.target.value })
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

          {/* Continue Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleContinueToTest}
              size="lg"
              className="gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Continue to Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
