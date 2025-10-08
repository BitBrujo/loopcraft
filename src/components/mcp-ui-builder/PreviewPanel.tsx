"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { MCPUIRenderer } from "@/components/assistant-ui/mcp-ui-renderer";
import { Button } from "@/components/ui/button";

export function PreviewPanel() {
  const { currentResource, previewKey, showPreview, setShowPreview, refreshPreview } =
    useUIBuilderStore();
  const [mcpResource, setMcpResource] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Convert current resource to MCP format whenever it changes
  const generatePreview = useCallback(async () => {
    if (!currentResource) {
      setMcpResource(null);
      return;
    }

    // Validate external URL content is not empty
    if (currentResource.contentType === 'externalUrl' && !currentResource.content.trim()) {
      setMcpResource(null);
      setError('Enter a URL to see preview');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate MCP resource using the preview API
      const response = await fetch("/api/ui-builder/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource: currentResource }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      const data = await response.json();
      setMcpResource(data.mcpResource);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate preview");
      setMcpResource(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentResource]);

  // Generate preview on mount and when previewKey changes
  useEffect(() => {
    generatePreview();
  }, [previewKey, generatePreview]);

  if (!currentResource) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No resource to preview
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Preview header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Live Preview</h3>
          {isLoading && (
            <div className="text-xs text-muted-foreground animate-pulse">
              Loading...
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? "Hide preview" : "Show preview"}
          >
            {showPreview ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPreview}
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview content */}
      {showPreview && (
        <div className="flex-1 overflow-auto bg-muted/10 p-4">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-red-500 mb-2">Preview Error</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={generatePreview}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : mcpResource ? (
            <div className="max-w-full mx-auto">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <MCPUIRenderer content={mcpResource as any} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {isLoading ? "Generating preview..." : "No preview available"}
            </div>
          )}
        </div>
      )}

      {!showPreview && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Preview hidden. Click the eye icon to show.
        </div>
      )}
    </div>
  );
}
