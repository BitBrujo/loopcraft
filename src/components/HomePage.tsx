"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { Wrench, PencilRuler, Server, MessageCircle } from "lucide-react";

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
      title: "MCP Server Builder",
      description: "Create functional MCP servers from 60+ templates with inline editing and one-click testing",
      icon: Wrench,
      href: "/mcp-server-builder",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "MCP-UI Builder",
      description: "Add interactive UI presentation to existing MCP servers or create standalone UIs",
      icon: PencilRuler,
      href: "/mcp-ui-builder",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "MCP Server List",
      description: "Configure and manage your Model Context Protocol server connections",
      icon: Server,
      href: "/mcp-servers",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Chat",
      description: "Test your MCP servers with AI-powered chat interface and tool calling",
      icon: MessageCircle,
      href: "/chat",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-5xl mx-auto py-12 px-4">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              LoopCraft
            </h1>
            <p className="text-lg text-muted-foreground">
              Build, test, and deploy MCP servers with ease
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.href}
                  className="p-8 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => router.push(feature.href)}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">{feature.title}</h2>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                    <Button className="w-full mt-4">
                      Get Started
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Choose a feature above to get started with LoopCraft
            </p>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
