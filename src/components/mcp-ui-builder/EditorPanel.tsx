"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Wrench } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { HTMLEditor } from "./editors/HTMLEditor";
import { URLInput } from "./editors/URLInput";
import { RemoteDomEditor } from "./editors/RemoteDomEditor";
import { Button } from "@/components/ui/button";
import type { ContentType } from "@/types/ui-builder";

export function EditorPanel() {
  const { currentResource, updateResource, mcpContext } = useUIBuilderStore();
  const [showToolPalette, setShowToolPalette] = useState(true);

  if (!currentResource) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a template to get started
      </div>
    );
  }

  const handleContentTypeChange = (contentType: ContentType) => {
    updateResource({ contentType });
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
              className={`px-3 py-1.5 text-sm rounded ${
                currentResource.contentType === "remoteDom"
                  ? "bg-background shadow-sm font-medium"
                  : "hover:bg-background/50"
              }`}
              onClick={() => handleContentTypeChange("remoteDom")}
            >
              Remote DOM
            </button>
          </div>

          {mcpContext.selectedTools.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowToolPalette(!showToolPalette)}
              className="h-7 gap-1"
            >
              <Wrench className="h-3 w-3" />
              <span className="text-xs">
                {showToolPalette ? 'Hide' : 'Show'} Tools
              </span>
              {showToolPalette ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </Button>
          )}
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

      {/* Tool Palette Sidebar */}
      {showToolPalette && mcpContext.selectedTools.length > 0 && (
        <div className="w-64 border-l bg-card overflow-y-auto">
          <div className="sticky top-0 bg-card border-b p-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <h4 className="font-semibold text-sm">Tool Reference</h4>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tools selected in Context tab
            </p>
          </div>

          <div className="p-3 space-y-3">
            {mcpContext.selectedTools.map((tool) => (
              <div
                key={`${tool.serverName}-${tool.name}`}
                className="border rounded-lg p-3 bg-muted/30"
              >
                <div className="font-medium text-sm font-mono mb-1">
                  {tool.name}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Server: {tool.serverName}
                </div>
                {tool.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {tool.description}
                  </p>
                )}
                {tool.inputSchema && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium mb-1">
                      Schema
                    </summary>
                    <pre className="bg-background p-2 rounded mt-1 overflow-x-auto text-[10px]">
                      {JSON.stringify(tool.inputSchema, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
