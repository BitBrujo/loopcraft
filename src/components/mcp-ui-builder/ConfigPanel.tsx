"use client";

import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { builtInTemplates } from "@/lib/ui-builder-templates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ConfigPanel() {
  const { loadTemplate } = useUIBuilderStore();

  const handleTemplateSelect = (templateId: string) => {
    const template = builtInTemplates.find((t) => t.id === templateId);
    if (template) {
      loadTemplate(template);
    }
  };

  return (
    <div className="p-4">
      {/* Template Selector */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Templates</h4>
        <div className="space-y-3">
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger className="h-9 text-sm">
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
    </div>
  );
}
