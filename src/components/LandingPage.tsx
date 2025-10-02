"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function LandingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for auth token
    const token = localStorage.getItem("token");

    if (token) {
      setIsAuthenticated(true);
      setIsChecking(false);
      // Redirect to builder after showing welcome message
      setTimeout(() => {
        router.push("/mcp-ui-builder");
      }, 1500);
    } else {
      setIsChecking(false);
      // Redirect to login if not authenticated
      setTimeout(() => {
        router.push("/login");
      }, 500);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LoopCraft
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            MCP-UI Lab
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          LoopCraft
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          MCP-UI Lab
        </div>
        {isAuthenticated && (
          <div className="text-lg text-muted-foreground mt-4">
            Welcome Back
          </div>
        )}
      </div>
    </div>
  );
}
