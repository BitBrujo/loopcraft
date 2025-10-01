"use client";

import { ArrowRight } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { EditorPanel } from "../EditorPanel";
import { PreviewPanel } from "../PreviewPanel";

export function DesignTab() {
  const { setActiveTab, currentResource } = useUIBuilderStore();

  const canProceed = currentResource && currentResource.content.trim().length > 0;

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
          <div className="text-sm text-muted-foreground">
            {canProceed ? (
              <span className="text-green-600">UI design ready</span>
            ) : (
              <span>Add UI content to continue</span>
            )}
          </div>
          <Button
            onClick={() => setActiveTab('actions')}
            disabled={!canProceed}
            className="gap-2"
          >
            Next: Configure Actions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
