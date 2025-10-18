"use client";

import { ReactNode } from "react";
import { ChatHeader } from "./ChatHeader";
import { RightSidebar } from "./RightSidebar";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ChatLayout({ children, className }: ChatLayoutProps) {
  return (
    <div className={cn("flex h-screen w-full flex-col bg-background", className)}>
      <ChatHeader />
      <div className="flex flex-1 w-full overflow-hidden">
        <div className="flex-1 w-full">
          {children}
        </div>
        <RightSidebar />
      </div>
    </div>
  );
}