"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { ActiveMCPServers } from "@/components/assistant-ui/active-mcp-servers";

export const Assistant = () => {
  const runtime = useChatRuntime({
    // @ts-expect-error - API property for direct integration
    api: "/api/chat",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full w-full">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden w-64 flex-shrink-0 border-r border-border bg-card/30 md:block">
          <div className="h-full overflow-y-auto p-4">
            <ThreadList />
            <ActiveMCPServers />
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 overflow-hidden">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};
