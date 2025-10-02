"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";

interface SaveDialogProps {
  onClose: () => void;
  onSaved?: () => void;
}

const CATEGORIES = [
  "Custom",
  "Forms",
  "Dashboards",
  "Data Display",
  "Interactive",
  "Media",
];

export function SaveDialog({ onClose, onSaved }: SaveDialogProps) {
  const { currentResource, mcpContext, actionMappings, testConfig } = useUIBuilderStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Custom");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    // Validate inputs
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (name.length > 100) {
      setError("Name must be 100 characters or less");
      return;
    }

    if (!currentResource) {
      setError("No resource to save");
      return;
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to save templates");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Prepare complete state for saving
      const resourceData = {
        currentResource,
        mcpContext,
        actionMappings,
        testConfig: {
          mockResponses: testConfig.mockResponses,
          useMockData: testConfig.useMockData,
          testHistory: [], // Don't save test history
        },
        savedAt: new Date().toISOString(),
      };

      // Save to API
      const response = await fetch("/api/ui-builder/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          category,
          resource_data: resourceData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save template");
      }

      // Success - close dialog and notify parent
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Save UI Builder State</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My UI Component"
              maxLength={100}
              className="w-full px-3 py-2 border rounded-md bg-background"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {name.length}/100 characters
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              disabled={isSaving}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description (optional) */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this component..."
              rows={3}
              className="w-full px-3 py-2 border rounded-md bg-background resize-none"
              disabled={isSaving}
            />
          </div>

          {/* Preview Summary */}
          <div className="p-3 bg-muted/50 rounded-md space-y-1 text-sm">
            <p className="font-medium">What will be saved:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              <li>UI Resource ({currentResource?.contentType})</li>
              <li>MCP Context ({mcpContext.selectedTools.length} tools)</li>
              <li>Action Mappings ({actionMappings.length} mappings)</li>
              <li>Test Configuration</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
