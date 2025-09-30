// components/CustomMessageInput.tsx
import { Badge } from "@/components/ui/badge";
import { ComposerPrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { ArrowUpIcon, Square } from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { ComposerAddAttachment, ComposerAttachments } from "@/components/assistant-ui/attachment";

export function CustomMessageInput() {
  return (
    <div className="sticky bottom-0 mx-auto flex w-full max-w-2xl flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 px-4">
      <ComposerPrimitive.Root className="relative flex w-full flex-col rounded-2xl border border-border bg-muted/50 px-1 pt-2 shadow-lg backdrop-blur-sm">
        <ComposerAttachments />

        <div className="flex items-end space-x-2 p-3">
          <div className="flex-1 relative">
            <ComposerPrimitive.Input
              placeholder="Message LoopCraft..."
              className="max-h-32 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground focus:outline-none"
              rows={1}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                MCP
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <ComposerAddAttachment />

            <ThreadPrimitive.If running={false}>
              <ComposerPrimitive.Send asChild>
                <TooltipIconButton
                  tooltip="Send message"
                  side="top"
                  type="submit"
                  variant="default"
                  size="icon"
                  className="size-8 rounded-lg"
                >
                  <ArrowUpIcon className="size-4" />
                </TooltipIconButton>
              </ComposerPrimitive.Send>
            </ThreadPrimitive.If>

            <ThreadPrimitive.If running>
              <ComposerPrimitive.Cancel asChild>
                <TooltipIconButton
                  tooltip="Stop generating"
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                >
                  <Square className="size-3 fill-current" />
                </TooltipIconButton>
              </ComposerPrimitive.Cancel>
            </ThreadPrimitive.If>
          </div>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
}