"use client";

import { ReactNode } from "react";
import { ChatHeader } from "./ChatHeader";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ChatLayout({ children, className }: ChatLayoutProps) {
  return (
    <div className={cn("flex h-screen flex-col bg-background", className)}>
      <ChatHeader />
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}