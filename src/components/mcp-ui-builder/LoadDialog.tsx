"use client";

import { useState, useEffect } from "react";
import { FolderOpen, X, Trash2, Search, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import type { UIResource } from "@/types/ui-builder";

interface SavedTemplate {
  id: number;
  user_id: number;
  name: string;
  category: string;
  description?: string;
  resource_data: {
    resource: UIResource;
    savedAt: string;
  };
  created_at: string;
  updated_at: string;
}

interface LoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoadDialog({ open, onOpenChange }: LoadDialogProps) {
  const { setCurrentResource } = useUIBuilderStore();
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SavedTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  // Filter templates when search/category changes
  useEffect(() => {
    let filtered = templates;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to load templates");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/ui-builder/templates", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data);
      setFilteredTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = (template: SavedTemplate) => {
    const { resource } = template.resource_data;
    setCurrentResource(resource);
    onOpenChange(false);
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/ui-builder/templates/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      // Remove from local state
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Load Saved Templates</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-3 py-2 border rounded-md bg-background"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
              {error}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">
                {templates.length === 0
                  ? "No saved templates yet"
                  : "No templates match your search"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Template Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-base truncate flex-1">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() =>
                            deleteConfirm === template.id
                              ? handleDelete(template.id)
                              : setDeleteConfirm(template.id)
                          }
                          className="p-1.5 hover:bg-red-500/10 rounded text-red-500"
                          title={
                            deleteConfirm === template.id
                              ? "Click again to confirm"
                              : "Delete"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      <span>{template.category}</span>
                    </div>

                    {/* Description */}
                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Resource Info */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{template.resource_data.resource.contentType}</span>
                      {template.resource_data.resource.templatePlaceholders && template.resource_data.resource.templatePlaceholders.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{template.resource_data.resource.templatePlaceholders.length} placeholders</span>
                        </>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(template.updated_at)}</span>
                    </div>

                    {/* Load Button */}
                    <Button
                      onClick={() => handleLoad(template)}
                      className="w-full mt-2"
                      size="sm"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Load
                    </Button>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === template.id && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-500">
                      Click delete again to confirm
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            {filteredTemplates.length} template(s) found
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
