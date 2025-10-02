"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { MobileSidebar } from "./MobileSidebar";
import { MessageSquare, Settings, PencilRuler, User, LogOut, MessageCircle } from "lucide-react";

export function ChatHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsLoggedIn(true);
      } catch {
        // Invalid user data, clear it
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3 flex-1">
          <MobileSidebar />
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">LoopCraft</h1>
          </div>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <Badge variant="secondary" className="text-xs hidden sm:block">
            Local AI • Ollama
          </Badge>
        </div>

        {/* Center: Navigation */}
        <div className="flex items-center space-x-2">
          <Link href="/mcp-ui-builder">
            <Button variant="ghost" size="sm" className="h-8">
              <PencilRuler className="h-4 w-4 mr-2" />
              <span>Builder</span>
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="h-8">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span>Chat</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="h-8">
              <Settings className="h-4 w-4 mr-2" />
              <span>Settings</span>
            </Button>
          </Link>
        </div>

        {/* Right: Theme & Account */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
          <ThemeToggle />

          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <User className="h-4 w-4 mr-2" />
                  <span>Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-8">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}