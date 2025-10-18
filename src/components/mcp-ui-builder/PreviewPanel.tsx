"use client";

import { useState } from "react";
import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { ClientPreview } from "./ClientPreview";
import { Button } from "@/components/ui/button";

export function PreviewPanel() {
  const { currentResource, previewKey, showPreview, setShowPreview, refreshPreview } =
    useUIBuilderStore();
  const [error, setError] = useState<string | null>(null);

  // Validate resource before preview
  const getValidationError = (): string | null => {
    if (!currentResource) return null;

    // Validate URI format
    if (!currentResource.uri.startsWith('ui://')) {
      return 'Invalid URI format. Must start with "ui://" (e.g., ui://myserver/resource)';
    }

    // Validate external URL content is not empty
    if (currentResource.contentType === 'externalUrl' && !currentResource.content.trim()) {
      return '💡 Enter a URL in the Design tab to see preview (e.g., https://example.com)';
    }

    // Validate rawHtml content is not empty
    if (currentResource.contentType === 'rawHtml' && !currentResource.content.trim()) {
      return '💡 Select a template or write HTML in the Design tab to see preview';
    }

    // Remote DOM requires framework selection
    if (currentResource.contentType === 'remoteDom' && !currentResource.remoteDomConfig?.framework) {
      return '⚙️ Select a framework (React or WebComponents) in Configure tab';
    }

    // Remote DOM requires script content
    if (currentResource.contentType === 'remoteDom' && !currentResource.content.trim()) {
      return '💡 Write a Remote DOM script in the Design tab to see preview';
    }

    return null;
  };

  const validationError = getValidationError();

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
          {validationError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Preview Validation</p>
                <p className="text-xs text-muted-foreground">{validationError}</p>
              </div>
            </div>
          ) : (
            <div className="max-w-full mx-auto" key={previewKey}>
              <ClientPreview resource={currentResource} />
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
