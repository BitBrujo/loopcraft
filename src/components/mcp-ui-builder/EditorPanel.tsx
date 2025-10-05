"use client";

import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { HTMLEditor } from "./editors/HTMLEditor";
import { URLInput } from "./editors/URLInput";
import { RemoteDomEditor } from "./editors/RemoteDomEditor";
import type { ContentType } from "@/types/ui-builder";

export function EditorPanel() {
  const { currentResource, updateResource } = useUIBuilderStore();

  if (!currentResource) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a template to get started
      </div>
    );
  }

  const handleContentTypeChange = (contentType: ContentType) => {
    // Reset content to appropriate default when switching types
    let newContent = '';
    if (contentType === 'rawHtml') {
      newContent = '<!DOCTYPE html>\n<html>\n<head>\n  <title>New UI Resource</title>\n</head>\n<body>\n  <h1>Hello from MCP-UI!</h1>\n  <p>Edit this HTML to create your custom UI.</p>\n</body>\n</html>';
    } else if (contentType === 'externalUrl') {
      newContent = '';
    } else if (contentType === 'remoteDom') {
      newContent = '';
    }
    updateResource({ contentType, content: newContent });
  };

  const handleContentChange = (content: string) => {
    updateResource({ content });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs for content type */}
        <div className="flex items-center justify-between gap-1 px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            <button
              className={`px-3 py-1.5 text-sm rounded ${
                currentResource.contentType === "rawHtml"
                  ? "bg-background shadow-sm font-medium"
                  : "hover:bg-background/50"
              }`}
              onClick={() => handleContentTypeChange("rawHtml")}
            >
              Raw HTML
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded ${
                currentResource.contentType === "externalUrl"
                  ? "bg-background shadow-sm font-medium"
                  : "hover:bg-background/50"
              }`}
              onClick={() => handleContentTypeChange("externalUrl")}
            >
              External URL
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded opacity-50 cursor-not-allowed`}
              disabled
            >
              Remote DOM
            </button>
          </div>
        </div>

        {/* Editor content based on selected type */}
        <div className="flex-1 overflow-hidden">
          {currentResource.contentType === "rawHtml" && (
            <HTMLEditor
              value={currentResource.content}
              onChange={handleContentChange}
            />
          )}
          {currentResource.contentType === "externalUrl" && (
            <URLInput
              value={currentResource.content}
              onChange={handleContentChange}
            />
          )}
          {currentResource.contentType === "remoteDom" && (
            <RemoteDomEditor
              value={currentResource.content}
              onChange={handleContentChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
