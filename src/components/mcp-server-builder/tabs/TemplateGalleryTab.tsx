"use client";

import { useState } from "react";
import { useServerBuilderStore } from "@/lib/stores/server-builder-store";
import { toolTemplates, getCategorizedTemplates, getCategoryInfo } from "@/lib/tool-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronRight,
  FileText,
  Search as SearchIcon,
  Save,
  BarChart3,
  RefreshCw,
  Bell,
  Shield,
  CreditCard,
  Folder,
  Globe,
  Check,
  Plus,
  X,
} from "lucide-react";
import type { ToolCategory } from "@/types/server-builder";

// Icon mapping for categories
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Search: SearchIcon,
  Save,
  BarChart3,
  RefreshCw,
  Bell,
  Shield,
  CreditCard,
  Folder,
  Globe,
};

export function TemplateGalleryTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);
  const {
    selectedTools,
    serverConfig,
    toggleToolSelection,
    addSelectedToolsToServer,
    setActiveTab,
  } = useServerBuilderStore();

  const categorizedTemplates = getCategorizedTemplates();
  const categories = Object.keys(categorizedTemplates) as ToolCategory[];

  // Filter templates by search query and selected category
  const filteredTemplates = selectedCategory
    ? categorizedTemplates[selectedCategory].filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.userEnters.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.userSees.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleToggleTool = (templateId: string) => {
    const template = toolTemplates.find((t) => t.id === templateId);
    if (!template) return;
    toggleToolSelection(template.tool);
  };

  const handleContinueToManage = () => {
    // Add selected tools to server config
    addSelectedToolsToServer();
    // Navigate to manage tools tab
    setActiveTab('customize');
  };

  const isToolSelected = (toolId: string) => {
    return selectedTools.some((t) => t.id === toolId);
  };

  const isToolInServer = (toolId: string) => {
    return serverConfig?.tools.some((t) => t.id === toolId) || false;
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Column - Categories */}
      <div className="w-80 border-r bg-card overflow-y-auto">
        <div className="sticky top-0 bg-card border-b p-4 z-10">
          <h3 className="font-semibold text-lg mb-2">Categories</h3>
          <p className="text-xs text-muted-foreground">
            Choose what you want your tool to do
          </p>
        </div>
        <div className="p-3 space-y-2">
          {categories.map((category) => {
            const info = getCategoryInfo(category);
            const count = categorizedTemplates[category].length;
            const IconComponent = categoryIcons[info.icon] || Folder;
            const isActive = selectedCategory === category;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-orange-500/10 border-orange-500'
                    : 'hover:bg-muted/50 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${isActive ? 'text-orange-500' : 'text-muted-foreground'}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold mb-1 ${isActive ? 'text-orange-500' : ''}`}>
                      {info.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-1">
                      {info.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {count} tools
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle Column - Templates */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-4 z-10">
          <div className="mb-3">
            <h3 className="font-semibold text-lg">
              {selectedCategory
                ? getCategoryInfo(selectedCategory).title
                : 'Select a Category'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {selectedCategory
                ? 'Click "Add Tool" to add templates to your server'
                : 'Choose a category from the left to browse tools'}
            </p>
          </div>
          {selectedCategory && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>

        <div className="p-4">
          {!selectedCategory ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Folder className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a category from the left to browse tools</p>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tools found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTemplates.map((template) => {
                const selected = isToolSelected(template.tool.id);
                const inServer = isToolInServer(template.tool.id);

                return (
                  <div
                    key={template.id}
                    className={`bg-card rounded-lg border p-5 transition-all relative ${
                      selected
                        ? 'border-orange-500 shadow-md'
                        : inServer
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'hover:border-orange-500/50 hover:shadow-md'
                    }`}
                  >
                    {inServer && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> In Server
                      </div>
                    )}

                    <h4 className="font-semibold text-base mb-2">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>

                    <div className="space-y-2 mb-3">
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <div className="text-xs font-medium text-muted-foreground mb-0.5">
                          They enter:
                        </div>
                        <div className="text-sm">{template.userEnters}</div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <div className="text-xs font-medium text-muted-foreground mb-0.5">
                          They see:
                        </div>
                        <div className="text-sm">{template.userSees}</div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleToggleTool(template.id)}
                      className="w-full"
                      variant={selected ? "default" : inServer ? "secondary" : "outline"}
                      disabled={inServer}
                      size="sm"
                    >
                      {inServer ? (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Already Added
                        </>
                      ) : selected ? (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Selected
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" /> Add Tool
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Selected Tools */}
      <div className="w-80 border-l bg-card overflow-y-auto">
        <div className="sticky top-0 bg-card border-b p-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Selected Tools</h3>
            {selectedTools.length > 0 && (
              <div className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                {selectedTools.length}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Tools you&apos;ve added for your server
          </p>
        </div>

        <div className="p-3">
          {selectedTools.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Plus className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No tools selected yet</p>
                <p className="text-xs mt-1">Browse templates and click &quot;Add Tool&quot;</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-muted/30 rounded-lg p-3 border border-transparent hover:border-orange-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tool.parameters.length} param{tool.parameters.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleToolSelection(tool)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTools.length > 0 && (
          <div className="sticky bottom-0 bg-card border-t p-4">
            <Button
              onClick={handleContinueToManage}
              className="w-full"
              size="lg"
            >
              Continue to Manage Tools
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
