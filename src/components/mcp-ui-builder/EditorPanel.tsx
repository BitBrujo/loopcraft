"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Wrench, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { HTMLEditor } from "./editors/HTMLEditor";
import { URLInput } from "./editors/URLInput";
import { RemoteDomEditor } from "./editors/RemoteDomEditor";
import { Button } from "@/components/ui/button";
import type { ContentType } from "@/types/ui-builder";

export function EditorPanel() {
  const { currentResource, updateResource, mcpContext } = useUIBuilderStore();
  const [showToolPalette, setShowToolPalette] = useState(true);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const handleGenerateHTML = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/ai/generate-html", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: aiPrompt,
          currentHtml: currentResource?.content || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate HTML");
      }

      const data = await response.json();
      if (data.success && data.html) {
        updateResource({ content: data.html });
        setAiPrompt("");
        setShowAIPrompt(false);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error generating HTML:", error);
      setAiError(error instanceof Error ? error.message : "Failed to generate HTML");
    } finally {
      setIsGenerating(false);
    }
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

        {/* AI Prompt Section (only for Raw HTML) */}
        {currentResource.contentType === "rawHtml" && (
          <div className="border-b bg-muted/20">
            {/* Toggle Button */}
            <button
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors"
              onClick={() => setShowAIPrompt(!showAIPrompt)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI HTML Generator</span>
              </div>
              {showAIPrompt ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Prompt Input (collapsible) */}
            {showAIPrompt && (
              <div className="px-4 pb-3 space-y-2">
                <div className="text-xs text-muted-foreground">
                  Describe what HTML you want to generate. Current code will be used as context.
                </div>
                <textarea
                  className="w-full h-20 px-3 py-2 text-sm border rounded-md resize-none bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 'Create a contact form with name, email, and message fields with modern styling'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isGenerating}
                />
                {aiError && (
                  <div className="text-xs text-destructive">{aiError}</div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleGenerateHTML}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Generate HTML
                      </>
                    )}
                  </Button>
                  {isGenerating && (
                    <span className="text-xs text-muted-foreground">
                      This may take a few seconds...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
