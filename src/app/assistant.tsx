"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useChat } from "@ai-sdk/react";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";

export const Assistant = () => {
  const chat = useChat();

  const runtime = useAISDKRuntime(chat);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full w-full">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden w-64 flex-shrink-0 border-r border-border bg-card/30 md:block">
          <div className="h-full overflow-hidden p-4">
            <ThreadList />
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
