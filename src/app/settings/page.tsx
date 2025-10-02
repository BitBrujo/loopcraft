"use client";

import { useState, useEffect } from "react";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { User, Cpu, Server, Plus, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import type { MCPServer } from "@/types/database";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apiUrl, setApiUrl] = useState("http://localhost:11434/api");
  const [modelName, setModelName] = useState("llama3.2:latest");

  // MCP Server state
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [showServerDialog, setShowServerDialog] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [serverName, setServerName] = useState("");
  const [serverType, setServerType] = useState<"stdio" | "sse">("stdio");
  const [serverConfig, setServerConfig] = useState("");
  const [serverEnabled, setServerEnabled] = useState(true);
  const [configError, setConfigError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch MCP servers on mount
  useEffect(() => {
    fetchMCPServers();
  }, []);

  const fetchMCPServers = async () => {
    try {
      const response = await fetch("/api/mcp-servers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const servers = await response.json();
        setMcpServers(servers);
      }
    } catch (error) {
      console.error("Failed to fetch MCP servers:", error);
    }
  };

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
    // TODO: Implement AI settings update
    alert("AI settings update will be implemented with authentication");
  };

  const openAddServerDialog = () => {
    setEditingServer(null);
    setServerName("");
    setServerType("stdio");
    setServerConfig('{\n  "command": ["npx", "-y", "@package/name"]\n}');
    setServerEnabled(true);
    setConfigError("");
    setShowServerDialog(true);
  };

  const openEditServerDialog = (server: MCPServer) => {
    setEditingServer(server);
    setServerName(server.name);
    setServerType(server.type);
    setServerConfig(JSON.stringify(server.config, null, 2));
    setServerEnabled(server.enabled);
    setConfigError("");
    setShowServerDialog(true);
  };

  const validateConfig = (configStr: string): boolean => {
    try {
      const config = JSON.parse(configStr);

      if (serverType === "stdio") {
        if (!config.command || !Array.isArray(config.command)) {
          setConfigError("stdio type requires 'command' array in config");
          return false;
        }
      } else if (serverType === "sse") {
        if (!config.url || typeof config.url !== "string") {
          setConfigError("sse type requires 'url' string in config");
          return false;
        }
      }

      setConfigError("");
      return true;
    } catch {
      setConfigError("Invalid JSON format");
      return false;
    }
  };

  const handleSaveServer = async () => {
    if (!serverName.trim()) {
      alert("Server name is required");
      return;
    }

    if (!validateConfig(serverConfig)) {
      return;
    }

    setIsLoading(true);
    try {
      const config = JSON.parse(serverConfig);
      const method = editingServer ? "PUT" : "POST";
      const url = editingServer
        ? `/api/mcp-servers/${editingServer.id}`
        : "/api/mcp-servers";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: serverName,
          type: serverType,
          config,
          enabled: serverEnabled,
        }),
      });

      if (response.ok) {
        await fetchMCPServers();
        setShowServerDialog(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save server");
      }
    } catch (error) {
      console.error("Failed to save server:", error);
      alert("Failed to save server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteServer = async (serverId: number) => {
    if (!confirm("Are you sure you want to delete this MCP server?")) {
      return;
    }

    try {
      const response = await fetch(`/api/mcp-servers/${serverId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        await fetchMCPServers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete server");
      }
    } catch (error) {
      console.error("Failed to delete server:", error);
      alert("Failed to delete server");
    }
  };

  const handleToggleServer = async (server: MCPServer) => {
    try {
      const response = await fetch(`/api/mcp-servers/${server.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          enabled: !server.enabled,
        }),
      });

      if (response.ok) {
        await fetchMCPServers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to toggle server");
      }
    } catch (error) {
      console.error("Failed to toggle server:", error);
      alert("Failed to toggle server");
    }
  };

  const getConfigExample = () => {
    if (serverType === "stdio") {
      return '{\n  "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/path"],\n  "env": {}\n}';
    } else {
      return '{\n  "url": "http://localhost:8080/sse"\n}';
    }
  };

  useEffect(() => {
    if (showServerDialog && !editingServer) {
      setServerConfig(getConfigExample());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverType]);

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                AI/Model
              </TabsTrigger>
              <TabsTrigger value="mcp" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                MCP Servers
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
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl">Model Provider API URL</Label>
                    <Input
                      id="apiUrl"
                      type="url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="http://localhost:11434/api"
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
                    />
                    <p className="text-sm text-muted-foreground">
                      The model identifier to use (e.g., llama3.2:latest, gpt-4, claude-3-5-sonnet-20241022)
                    </p>
                  </div>

                  <Button onClick={handleAISettingsUpdate}>Save AI Settings</Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="mcp" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">MCP Server Management</h2>
                    <p className="text-sm text-muted-foreground">
                      Configure and manage your Model Context Protocol servers
                    </p>
                  </div>
                  <Button onClick={openAddServerDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Server
                  </Button>
                </div>

                {mcpServers.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No MCP Servers</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get started by adding your first MCP server
                    </p>
                    <Button onClick={openAddServerDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Server
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {mcpServers.map((server) => (
                      <Card key={server.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{server.name}</h3>
                              <span className="text-xs px-2 py-1 rounded bg-muted">
                                {server.type}
                              </span>
                              {server.enabled ? (
                                <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
                                  Enabled
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-500">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {server.type === "stdio"
                                ? `Command: ${server.config.command?.join(" ")}`
                                : `URL: ${server.config.url}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleServer(server)}
                              title={server.enabled ? "Disable" : "Enable"}
                            >
                              {server.enabled ? (
                                <Power className="h-4 w-4" />
                              ) : (
                                <PowerOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditServerDialog(server)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteServer(server.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add/Edit Server Dialog */}
      <Dialog open={showServerDialog} onOpenChange={setShowServerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingServer ? "Edit MCP Server" : "Add MCP Server"}
            </DialogTitle>
            <DialogDescription>
              Configure your Model Context Protocol server connection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverName">Server Name</Label>
              <Input
                id="serverName"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="filesystem"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serverType">Server Type</Label>
              <Select
                value={serverType}
                onValueChange={(value: "stdio" | "sse") => setServerType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stdio">stdio (Local process)</SelectItem>
                  <SelectItem value="sse">sse (Remote HTTP/SSE)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {serverType === "stdio"
                  ? "Local process-based server (e.g., npx command)"
                  : "Remote server using Server-Sent Events"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serverConfig">Configuration (JSON)</Label>
              <Textarea
                id="serverConfig"
                value={serverConfig}
                onChange={(e) => {
                  setServerConfig(e.target.value);
                  setConfigError("");
                }}
                placeholder={getConfigExample()}
                className="font-mono text-sm min-h-[120px]"
              />
              {configError && (
                <p className="text-xs text-red-500">{configError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Example {serverType} config: {getConfigExample()}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="serverEnabled"
                checked={serverEnabled}
                onChange={(e) => setServerEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="serverEnabled" className="cursor-pointer">
                Enable server
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowServerDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveServer} disabled={isLoading}>
              {isLoading ? "Saving..." : editingServer ? "Update Server" : "Add Server"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChatLayout>
  );
}
