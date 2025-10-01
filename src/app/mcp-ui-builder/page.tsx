"use client";

import { BuilderLayout } from "@/components/mcp-ui-builder/BuilderLayout";
import { ChatLayout } from "@/components/chat/ChatLayout";

export default function MCPUIBuilderPage() {
  return (
    <ChatLayout>
      <BuilderLayout />
    </ChatLayout>
  );
}
