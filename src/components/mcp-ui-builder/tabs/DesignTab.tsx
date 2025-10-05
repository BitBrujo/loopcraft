"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, BookOpen, Zap } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { EditorPanel } from "../EditorPanel";
import { PreviewPanel } from "../PreviewPanel";
import { extractTemplatePlaceholders } from "@/lib/html-parser";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DesignTab() {
  const {
    setActiveTab,
    currentResource,
    updateResource,
    uiMode,
    setUIMode,
    customTools,
    actionMappings,
    clearCustomTools,
    clearActionMappings,
  } = useUIBuilderStore();

  const [showModeChangeDialog, setShowModeChangeDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<'readonly' | 'interactive' | null>(null);

  // Auto-detect template placeholders when content changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      const placeholders = extractTemplatePlaceholders(currentResource.content);
      if (JSON.stringify(placeholders) !== JSON.stringify(currentResource.templatePlaceholders)) {
        updateResource({ templatePlaceholders: placeholders });
      }
    }
  }, [currentResource?.content, currentResource?.contentType, updateResource]);

  const handleModeChange = (newMode: 'readonly' | 'interactive') => {
    // If switching to readonly and there are custom tools/mappings, show confirmation
    if (newMode === 'readonly' && (customTools.length > 0 || actionMappings.length > 0)) {
      setPendingMode(newMode);
      setShowModeChangeDialog(true);
    } else {
      setUIMode(newMode);
    }
  };

  const confirmModeChange = () => {
    if (pendingMode) {
      setUIMode(pendingMode);
      clearCustomTools();
      clearActionMappings();
      setShowModeChangeDialog(false);
      setPendingMode(null);
    }
  };

  const cancelModeChange = () => {
    setShowModeChangeDialog(false);
    setPendingMode(null);
  };

  const canProceed = currentResource && currentResource.content.trim().length > 0;
  const agentSlots = currentResource?.templatePlaceholders?.length || 0;
  const nextTab = uiMode === 'readonly' ? 'generate' : 'tools';
  const nextLabel = uiMode === 'readonly' ? 'Generate Code' : 'Define Tools';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mode Selector */}
      <div className="border-b bg-muted/30 p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold mb-1">UI Mode</h3>
            <p className="text-xs text-muted-foreground">
              Choose the type of UI you want to create
            </p>
          </div>
          <RadioGroup value={uiMode} onValueChange={handleModeChange}>
            <div className="grid grid-cols-2 gap-3">
              {/* Read-Only Option */}
              <div className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                uiMode === 'readonly'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}>
                <RadioGroupItem value="readonly" id="readonly" className="mt-1" />
                <Label htmlFor="readonly" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">Read-Only UI</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Display-only content like dashboards, charts, or reports. No user interactions needed.
                  </p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Workflow: Design → Generate → Test
                  </p>
                </Label>
              </div>

              {/* Interactive Option */}
              <div className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                uiMode === 'interactive'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}>
                <RadioGroupItem value="interactive" id="interactive" className="mt-1" />
                <Label htmlFor="interactive" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold">Interactive UI</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Forms, buttons, and user interactions that trigger MCP tool calls.
                  </p>
                  <p className="text-xs text-orange-600 mt-2 font-medium">
                    Workflow: Design → Tools → Actions → Generate → Test
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>

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
            onClick={() => setActiveTab(nextTab)}
            disabled={!canProceed}
            className="gap-2"
          >
            Next: {nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mode Change Confirmation Dialog */}
      <Dialog open={showModeChangeDialog} onOpenChange={setShowModeChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to Read-Only Mode?</DialogTitle>
            <DialogDescription>
              Switching to read-only mode will clear your custom tools and action mappings.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>What will be cleared:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              {customTools.length > 0 && (
                <li>{customTools.length} custom tool{customTools.length !== 1 ? 's' : ''}</li>
              )}
              {actionMappings.length > 0 && (
                <li>{actionMappings.length} action mapping{actionMappings.length !== 1 ? 's' : ''}</li>
              )}
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Your UI design and content will be preserved.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={cancelModeChange}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmModeChange}>
              Switch to Read-Only
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
