"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Wrench, PencilRuler, Server, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "MCP Server Builder",
    href: "/mcp-server-builder",
    icon: Wrench,
  },
  {
    title: "MCP-UI Builder",
    href: "/mcp-ui-builder",
    icon: PencilRuler,
  },
  {
    title: "MCP Server List",
    href: "/mcp-servers",
    icon: Server,
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageCircle,
  },
];

export function RightSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col items-center py-6 gap-4">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            className={cn(
              "w-12 h-12 rounded-lg transition-all flex items-center justify-center",
              "hover:bg-orange-500 hover:text-white",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}
    </aside>
  );
}
