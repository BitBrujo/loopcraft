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
import { MessageSquare, Settings, User, LogOut } from "lucide-react";

export function ChatHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modelName, setModelName] = useState<string>("Ollama");

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

    // Fetch AI config to get model name
    fetch("/api/ai-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.modelName) {
          setModelName(data.modelName);
        }
      })
      .catch(() => {
        // Fallback to default
        setModelName("Ollama");
      });
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
          <Link href="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-orange-500">LoopCraft</h1>
          </Link>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <Badge variant="secondary" className="text-xs hidden sm:block">
            {modelName}
          </Badge>
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
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
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

      {/* Test Server Banner */}
      {/* Test server banner removed with MCP-UI Builder simplification */}
    </header>
  );
}