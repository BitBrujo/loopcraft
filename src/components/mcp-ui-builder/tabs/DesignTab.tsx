"use client";

import { useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { EditorPanel } from "../EditorPanel";
import { PreviewPanel } from "../PreviewPanel";
import { extractTemplatePlaceholders } from "@/lib/html-parser";

export function DesignTab() {
  const { setActiveTab, currentResource, updateResource } = useUIBuilderStore();

  // Auto-detect template placeholders when content changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      const placeholders = extractTemplatePlaceholders(currentResource.content);
      if (JSON.stringify(placeholders) !== JSON.stringify(currentResource.templatePlaceholders)) {
        updateResource({ templatePlaceholders: placeholders });
      }
    }
  }, [currentResource?.content, currentResource?.contentType, updateResource]);

  const canProceed = currentResource && currentResource.content.trim().length > 0;
  const agentSlots = currentResource?.templatePlaceholders?.length || 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-1/2 border-b overflow-hidden">
          <EditorPanel />
        </div>
        <div className="h-1/2 overflow-hidden">
          <PreviewPanel />
        </div>
      </div>

      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm flex items-center gap-2">
            {canProceed ? (
              <>
                <span className="text-green-600">UI design ready</span>
                {agentSlots > 0 && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {agentSlots} agent slot{agentSlots !== 1 ? 's' : ''} detected
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Add UI content to continue</span>
            )}
          </div>
          <Button
            onClick={() => setActiveTab('tools')}
            disabled={!canProceed}
            className="gap-2"
          >
            Next: Define Tools
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
