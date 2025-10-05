"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { User, Cpu } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [modelName, setModelName] = useState("");
  const [isLoadingAIConfig, setIsLoadingAIConfig] = useState(false);
  const [isSavingAIConfig, setIsSavingAIConfig] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const fetchAIConfig = async () => {
    setIsLoadingAIConfig(true);
    try {
      const response = await fetch("/api/ai-config", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const config = await response.json();
        setApiUrl(config.apiUrl || "");
        setModelName(config.modelName || "");
      }
    } catch (error) {
      console.error("Failed to fetch AI config:", error);
    } finally {
      setIsLoadingAIConfig(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticating(false);
      fetchAIConfig();
    }
  }, [router]);

  // Don't render anything while checking auth
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const handleProfileUpdate = async () => {
    // TODO: Implement profile update
    alert("Profile update will be implemented with authentication");
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // TODO: Implement password change
    alert("Password change will be implemented with authentication");
  };

  const handleAISettingsUpdate = async () => {
    if (!apiUrl.trim() && !modelName.trim()) {
      alert("Please provide at least one setting (API URL or Model Name)");
      return;
    }

    setIsSavingAIConfig(true);
    try {
      const response = await fetch("/api/ai-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          apiUrl: apiUrl.trim() || undefined,
          modelName: modelName.trim() || undefined,
        }),
      });

      if (response.ok) {
        alert("AI settings updated successfully!");
        // Refresh the config to get the latest values
        await fetchAIConfig();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update AI settings");
      }
    } catch (error) {
      console.error("Failed to update AI settings:", error);
      alert("Failed to update AI settings");
    } finally {
      setIsSavingAIConfig(false);
    }
  };


  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                AI/Model
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <Button onClick={handleProfileUpdate}>Update Profile</Button>
                </div>

                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <Button onClick={handlePasswordChange}>Change Password</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">AI/Model Preferences</h2>

                <div className="space-y-4">
                  {isLoadingAIConfig ? (
                    <p className="text-sm text-muted-foreground">Loading AI configuration...</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="apiUrl">Model Provider API URL</Label>
                        <Input
                          id="apiUrl"
                          type="url"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          placeholder="http://localhost:11434/api"
                          disabled={isSavingAIConfig}
                        />
                        <p className="text-sm text-muted-foreground">
                          API endpoint for your model provider (Ollama, OpenAI-compatible, etc.)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="modelName">Model Name</Label>
                        <Input
                          id="modelName"
                          type="text"
                          value={modelName}
                          onChange={(e) => setModelName(e.target.value)}
                          placeholder="llama3.2:latest"
                          disabled={isSavingAIConfig}
                        />
                        <p className="text-sm text-muted-foreground">
                          The model identifier to use (e.g., llama3.2:latest, gpt-4, claude-3-5-sonnet-20241022)
                        </p>
                      </div>
                    </>
                  )}

                  <Button onClick={handleAISettingsUpdate} disabled={isSavingAIConfig || isLoadingAIConfig}>
                    {isSavingAIConfig ? "Saving..." : "Save AI Settings"}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ChatLayout>
  );
}
