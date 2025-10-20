"use client";

import { useState } from "react";
import { FileText, Layout, MousePointer, Table, Image as ImageIcon, BarChart } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { builtInTemplates, getAllCategories } from "@/lib/ui-builder-templates";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const categoryIcons: Record<string, React.ReactNode> = {
  custom: <FileText className="h-4 w-4" />,
  forms: <Layout className="h-4 w-4" />,
  dashboards: <BarChart className="h-4 w-4" />,
  interactive: <MousePointer className="h-4 w-4" />,
  "data-display": <Table className="h-4 w-4" />,
  media: <ImageIcon className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  custom: "Custom",
  forms: "Forms",
  dashboards: "Dashboards",
  interactive: "Interactive",
  "data-display": "Data Display",
  media: "Media",
};

export function TemplateGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { loadTemplate } = useUIBuilderStore();

  const categories = getAllCategories();
  const filteredTemplates = selectedCategory
    ? builtInTemplates.filter((t) => t.category === selectedCategory)
    : builtInTemplates;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold mb-3">Templates</h2>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedCategory(category)}
            >
              {categoryLabels[category] || category}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors border border-transparent hover:border-border"
              onClick={() => loadTemplate(template)}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 text-muted-foreground">
                  {categoryIcons[template.category] || <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{template.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.description}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted">
                      {template.resource.contentType}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
