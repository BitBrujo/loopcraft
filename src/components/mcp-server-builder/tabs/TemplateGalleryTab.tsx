"use client";

import { useState } from "react";
import { useServerBuilderStore } from "@/lib/stores/server-builder-store";
import { toolTemplates, getCategorizedTemplates, getCategoryInfo } from "@/lib/tool-templates";
import { resourceTemplates, getCategorizedResources } from "@/lib/resource-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuggestionsPanel } from "@/components/mcp-server-builder/SuggestionsPanel";
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
  Database,
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
    selectedResources,
    serverConfig,
    toggleToolSelection,
    toggleResourceSelection,
    addSelectedToolsToServer,
    addSelectedResourcesToServer,
    removeTool,
    removeResource,
    setActiveTab,
  } = useServerBuilderStore();

  const categorizedTemplates = getCategorizedTemplates();
  const categorizedResources = getCategorizedResources();
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

  // Filter resources by search query and selected category
  const filteredResources = selectedCategory
    ? (categorizedResources[selectedCategory] || []).filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.userProvides.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.aiSees.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleToggleTool = (templateId: string) => {
    const template = toolTemplates.find((t) => t.id === templateId);
    if (!template) return;
    toggleToolSelection(template.tool);
  };

  const handleToggleResource = (templateId: string) => {
    const template = resourceTemplates.find((r) => r.id === templateId);
    if (!template) return;
    toggleResourceSelection(template.resource);
  };

  const handleRemoveToolFromServer = (toolId: string) => {
    removeTool(toolId);
  };

  const handleRemoveResourceFromServer = (resourceId: string) => {
    removeResource(resourceId);
  };

  const handleContinueToManage = () => {
    // Add selected items to server config
    addSelectedToolsToServer();
    addSelectedResourcesToServer();
    // Navigate to manage tools tab
    setActiveTab('customize');
  };

  const isToolSelected = (toolId: string) => {
    // Check both temporary selections AND tools already in server config
    return selectedTools.some((t) => t.id === toolId) ||
           (serverConfig?.tools.some((t) => t.id === toolId) || false);
  };

  const isToolInServer = (toolId: string) => {
    return serverConfig?.tools.some((t) => t.id === toolId) || false;
  };

  const isResourceSelected = (resourceId: string) => {
    // Check both temporary selections AND resources already in server config
    return selectedResources.some((r) => r.id === resourceId) ||
           ((serverConfig?.resources || []).some((r) => r.id === resourceId));
  };

  const isResourceInServer = (resourceId: string) => {
    return (serverConfig?.resources || []).some((r) => r.id === resourceId);
  };

  // Combine selected tools and tools already in server (avoid duplicates)
  const allSelectedTools = [
    ...selectedTools,
    ...(serverConfig?.tools || []).filter(
      (serverTool) => !selectedTools.some((t) => t.id === serverTool.id)
    ),
  ];

  // Combine selected resources and resources already in server (avoid duplicates)
  const allSelectedResources = [
    ...selectedResources,
    ...(serverConfig?.resources || []).filter(
      (serverResource) => !selectedResources.some((r) => r.id === serverResource.id)
    ),
  ];

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Column 1: Categories */}
      <div className="w-64 border-r bg-card flex flex-col h-full">
        <div className="bg-card border-b p-4 flex-shrink-0">
          <h3 className="font-semibold text-lg mb-2">Categories</h3>
          <p className="text-xs text-muted-foreground">
            Choose a category
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
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

      {/* Column 2: Resources */}
      <div className="flex-1 border-r flex flex-col">
        <div className="bg-background border-b p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-lg">Resources</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedCategory ? 'Data sources AI can read' : 'Select a category'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {!selectedCategory ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a category</p>
              </div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No resources for this category
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResources.map((template) => {
                const selected = isResourceSelected(template.resource.id);
                const inServer = isResourceInServer(template.resource.id);

                return (
                  <div
                    key={template.id}
                    className={`bg-card rounded-lg border p-4 transition-all relative ${
                      selected
                        ? 'border-blue-500 shadow-md'
                        : inServer
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'hover:border-blue-500/50 hover:shadow-sm'
                    }`}
                  >
                    {inServer && (
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Added
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveResourceFromServer(template.resource.id);
                          }}
                          className="bg-destructive text-white p-1 rounded hover:bg-destructive/90 transition-colors"
                          title="Remove from server"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <h4 className="font-semibold text-sm mb-1.5">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {template.description}
                    </p>

                    <div className="space-y-1.5 mb-3">
                      <div className="bg-blue-500/10 rounded p-2">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">
                          User provides:
                        </div>
                        <div className="text-xs">{template.userProvides}</div>
                      </div>

                      <div className="bg-blue-500/10 rounded p-2">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">
                          AI sees:
                        </div>
                        <div className="text-xs">{template.aiSees}</div>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        inServer
                          ? handleRemoveResourceFromServer(template.resource.id)
                          : handleToggleResource(template.id)
                      }
                      className="w-full"
                      variant={selected ? "default" : inServer ? "destructive" : "outline"}
                      size="sm"
                    >
                      {inServer ? (
                        <>
                          <X className="mr-1.5 h-3.5 w-3.5" /> Remove
                        </>
                      ) : selected ? (
                        <>
                          <X className="mr-1.5 h-3.5 w-3.5" /> Remove
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Resource
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

      {/* Column 3: Tools */}
      <div className="flex-1 border-r flex flex-col">
        <div className="bg-background border-b p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-lg">Tools</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedCategory ? 'Actions AI can perform' : 'Select a category'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {!selectedCategory ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a category</p>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No tools found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => {
                const selected = isToolSelected(template.tool.id);
                const inServer = isToolInServer(template.tool.id);

                return (
                  <div
                    key={template.id}
                    className={`bg-card rounded-lg border p-4 transition-all relative ${
                      selected
                        ? 'border-orange-500 shadow-md'
                        : inServer
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'hover:border-orange-500/50 hover:shadow-sm'
                    }`}
                  >
                    {inServer && (
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Added
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveToolFromServer(template.tool.id);
                          }}
                          className="bg-destructive text-white p-1 rounded hover:bg-destructive/90 transition-colors"
                          title="Remove from server"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <h4 className="font-semibold text-sm mb-1.5">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {template.description}
                    </p>

                    <div className="space-y-1.5 mb-3">
                      <div className="bg-orange-500/10 rounded p-2">
                        <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-0.5">
                          They enter:
                        </div>
                        <div className="text-xs">{template.userEnters}</div>
                      </div>

                      <div className="bg-orange-500/10 rounded p-2">
                        <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-0.5">
                          They see:
                        </div>
                        <div className="text-xs">{template.userSees}</div>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        inServer
                          ? handleRemoveToolFromServer(template.tool.id)
                          : handleToggleTool(template.id)
                      }
                      className="w-full"
                      variant={selected ? "default" : inServer ? "destructive" : "outline"}
                      size="sm"
                    >
                      {inServer ? (
                        <>
                          <X className="mr-1.5 h-3.5 w-3.5" /> Remove
                        </>
                      ) : selected ? (
                        <>
                          <X className="mr-1.5 h-3.5 w-3.5" /> Remove
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Tool
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

      {/* Column 4: Selected Items */}
      <div className="w-80 border-l bg-card flex flex-col">
        <div className="bg-card border-b p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Selected Items</h3>
            {(allSelectedTools.length + allSelectedResources.length > 0) && (
              <div className="bg-purple-500 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                {allSelectedTools.length + allSelectedResources.length}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Resources and tools for your server
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {(allSelectedTools.length === 0 && allSelectedResources.length === 0) ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Plus className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No items selected yet</p>
                <p className="text-xs mt-1">Add resources and tools</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Resources Section */}
              {allSelectedResources.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <h4 className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                      RESOURCES ({allSelectedResources.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {allSelectedResources.map((resource) => {
                      const inServer = isResourceInServer(resource.id);
                      return (
                        <div
                          key={resource.id}
                          className={`bg-blue-500/5 rounded-lg p-2.5 border transition-all ${
                            inServer ? 'border-green-500/50' : 'border-blue-500/20 hover:border-blue-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{resource.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {resource.uri}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {inServer && (
                                <div className="text-green-500 text-xs">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <button
                                onClick={() => inServer ? handleRemoveResourceFromServer(resource.id) : toggleResourceSelection(resource)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                title={inServer ? 'Remove from server' : 'Remove from selection'}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tools Section */}
              {allSelectedTools.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <RefreshCw className="h-4 w-4 text-orange-500" />
                    <h4 className="font-semibold text-xs text-orange-600 dark:text-orange-400">
                      TOOLS ({allSelectedTools.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {allSelectedTools.map((tool) => {
                      const inServer = isToolInServer(tool.id);
                      return (
                        <div
                          key={tool.id}
                          className={`bg-orange-500/5 rounded-lg p-2.5 border transition-all ${
                            inServer ? 'border-green-500/50' : 'border-orange-500/20 hover:border-orange-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{tool.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {tool.parameters.length} param{tool.parameters.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {inServer && (
                                <div className="text-green-500 text-xs">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <button
                                onClick={() => inServer ? handleRemoveToolFromServer(tool.id) : toggleToolSelection(tool)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                title={inServer ? 'Remove from server' : 'Remove from selection'}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {(allSelectedTools.length > 0 || allSelectedResources.length > 0) && (
          <div className="bg-card border-t p-4">
            <Button
              onClick={handleContinueToManage}
              className="w-full"
              size="lg"
            >
              Continue to Manage
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Column 5: Smart Suggestions */}
      <div className="w-80 flex-shrink-0">
        <SuggestionsPanel />
      </div>
    </div>
  );
}
