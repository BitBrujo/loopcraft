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
  Plus
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

  // Filter templates by search query
  const filteredTemplates = selectedCategory
    ? categorizedTemplates[selectedCategory].filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.userEnters.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.userSees.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : toolTemplates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.userEnters.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.userSees.toLowerCase().includes(searchQuery.toLowerCase())
      );

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

  if (!selectedCategory) {
    // Show category selection
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Browse Categories</h2>
              <p className="text-muted-foreground">
                Choose what you want your tool to do. Each category includes real examples in plain language.
              </p>
            </div>
            {selectedTools.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium">
                  {selectedTools.length} tool{selectedTools.length > 1 ? 's' : ''} selected
                </div>
                <Button onClick={handleContinueToManage} size="lg">
                  Continue to Manage <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
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
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const info = getCategoryInfo(category);
              const count = categorizedTemplates[category].length;
              const IconComponent = categoryIcons[info.icon] || Folder;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-start gap-4 p-6 bg-card rounded-lg border hover:border-orange-500 hover:shadow-md transition-all text-left group"
                >
                  <div className="text-orange-500">
                    <IconComponent className="h-10 w-10" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-orange-500">
                      {info.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {info.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{count} tools</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show templates for selected category
  const categoryInfo = getCategoryInfo(selectedCategory);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery("");
            }}
          >
            ← Back to Categories
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">{categoryInfo.icon}</span>
              {categoryInfo.title}
            </h2>
            <p className="text-muted-foreground">{categoryInfo.description}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
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
        </div>

        {/* Template Cards */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tools found matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTemplates.map((template) => {
              const selected = isToolSelected(template.tool.id);
              const inServer = isToolInServer(template.tool.id);

              return (
                <div
                  key={template.id}
                  className={`bg-card rounded-lg border p-6 transition-all relative ${
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

                  <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        They enter:
                      </div>
                      <div className="text-sm">{template.userEnters}</div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
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
  );
}
