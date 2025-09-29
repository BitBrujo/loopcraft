"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./ThemeToggle";
import { MobileSidebar } from "./MobileSidebar";
import { MessageSquare, Settings } from "lucide-react";

export function ChatHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <MobileSidebar />
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">HyperFace</h1>
          </div>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <Badge variant="secondary" className="text-xs hidden sm:block">
            Local AI • Ollama
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}