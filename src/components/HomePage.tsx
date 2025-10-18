"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { PencilRuler, Server, MessageCircle } from "lucide-react";
import Artwork33 from "@/components/Artwork33";

export function HomePage() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticating(false);
    }
  }, [router]);

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const features = [
    {
      title: "MCP-UI Builder",
      description: "Create interactive UIs for your MCP servers with visual drag-and-drop builder",
      icon: PencilRuler,
      href: "/mcp-ui-builder",
    },
    {
      title: "MCP Servers",
      description: "Manage your Model Context Protocol server connections and configurations",
      icon: Server,
      href: "/mcp-servers",
    },
    {
      title: "Chat",
      description: "Test your MCP tools with AI-powered chat interface and real-time interactions",
      icon: MessageCircle,
      href: "/chat",
    },
  ];

  return (
    <ChatLayout>
      <div className="flex flex-col h-full w-full">
        {/* Artwork - FULL WIDTH - stretches to fill entire viewport width */}
        <div className="w-full flex-shrink-0 mb-4">
          <Artwork33 />
        </div>

        {/* Content area with constrained width */}
        <div className="flex-1 overflow-y-auto">
          <div className="container max-w-4xl mx-auto py-4 px-4">
            {/* Title */}
            <div className="text-center mb-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
                LoopCraft
              </h1>
              <p className="text-base text-muted-foreground">
                Build, test, and deploy MCP servers with ease
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.href}
                    className="p-3 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                    onClick={() => router.push(feature.href)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-base font-bold">{feature.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full mt-1 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors"
                        size="sm"
                      >
                        Get Started
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Artwork - FULL WIDTH - stretches to fill entire viewport width */}
        <div className="w-full flex-shrink-0 mt-4">
          <Artwork33 />
        </div>
      </div>
    </ChatLayout>
  );
}
