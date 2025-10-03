"use client";

import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { builtInTemplates } from "@/lib/ui-builder-templates";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const frameSizePresets = [
  { name: "Small", width: 400, height: 300 },
  { name: "Medium", width: 800, height: 600 },
  { name: "Large", width: 1200, height: 800 },
  { name: "Full", width: 1920, height: 1080 },
];

export function ConfigPanel() {
  const { currentResource, updateResource, loadTemplate } = useUIBuilderStore();

  if (!currentResource) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No resource selected
      </div>
    );
  }

  const handleFieldChange = (field: string, value: string | number) => {
    updateResource({ [field]: value });
  };

  const handleSizeChange = (dimension: "width" | "height", value: number) => {
    updateResource({
      preferredSize: {
        ...currentResource.preferredSize,
        [dimension]: value,
      },
    });
  };

  const applyPreset = (preset: { width: number; height: number }) => {
    updateResource({
      preferredSize: preset,
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = builtInTemplates.find((t) => t.id === templateId);
    if (template) {
      loadTemplate(template);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Template Selector */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Templates</h4>
        <div className="space-y-3">
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select a template..." />
            </SelectTrigger>
            <SelectContent>
              {builtInTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select a template to quickly start building your UI
          </p>
        </div>
      </div>

      <Separator />

      {/* Basic Settings */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Basic Settings</h4>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              URI
            </label>
            <Input
              type="text"
              value={currentResource.uri}
              onChange={(e) => handleFieldChange("uri", e.target.value)}
              placeholder="ui://server/resource"
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: ui://[server]/[resource-name]
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Frame Size */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Preferred Frame Size</h4>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Width (px)
              </label>
              <Input
                type="number"
                value={currentResource.preferredSize.width}
                onChange={(e) =>
                  handleSizeChange("width", parseInt(e.target.value) || 800)
                }
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Height (px)
              </label>
              <Input
                type="number"
                value={currentResource.preferredSize.height}
                onChange={(e) =>
                  handleSizeChange("height", parseInt(e.target.value) || 600)
                }
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Presets
            </label>
            <div className="grid grid-cols-2 gap-1">
              {frameSizePresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Initial Data */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Initial Render Data</h4>
        <p className="text-xs text-muted-foreground mb-2">
          JSON data to pass to the UI component (optional)
        </p>
        <textarea
          value={
            currentResource.initialData
              ? JSON.stringify(currentResource.initialData, null, 2)
              : ""
          }
          onChange={(e) => {
            try {
              const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
              updateResource({ initialData: parsed });
            } catch {
              // Invalid JSON, ignore
            }
          }}
          placeholder={'{\n  "theme": "dark",\n  "userId": "123"\n}'}
          className="w-full px-3 py-2 text-sm border rounded-md resize-none h-32 font-mono"
        />
      </div>
    </div>
  );
}
