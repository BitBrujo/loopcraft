"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatLayout } from "@/components/chat/ChatLayout";
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
import { Server, Plus, Pencil, Trash2, Power, PowerOff, X } from "lucide-react";
import type { MCPServer } from "@/types/database";

export default function MCPServersPage() {
  const router = useRouter();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [showServerDialog, setShowServerDialog] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [serverName, setServerName] = useState("");
  const [serverType, setServerType] = useState<"stdio" | "sse" | "http">("stdio");
  const [serverCommand, setServerCommand] = useState("");
  const [serverArgs, setServerArgs] = useState<string[]>([]);
  const [serverUrl, setServerUrl] = useState("");
  const [serverEnv, setServerEnv] = useState<Array<{ key: string; value: string }>>([]);
  const [serverEnabled, setServerEnabled] = useState(true);
  const [configError, setConfigError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const fetchMCPServers = async () => {
    try {
      const response = await fetch("/api/mcp-servers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 401) {
        // Token expired or invalid - clear and redirect to login
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (response.ok) {
        const servers = await response.json();
        setMcpServers(servers);
      }
    } catch (error) {
      console.error("Failed to fetch MCP servers:", error);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticating(false);
      fetchMCPServers();
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

  const openAddServerDialog = () => {
    setEditingServer(null);
    setServerName("");
    setServerType("stdio");
    setServerCommand("npx");
    setServerArgs(["-y", "@modelcontextprotocol/server-filesystem"]);
    setServerUrl("");
    setServerEnv([]);
    setServerEnabled(true);
    setConfigError("");
    setShowServerDialog(true);
  };

  const openEditServerDialog = (server: MCPServer) => {
    setEditingServer(server);
    setServerName(server.name);
    setServerType(server.type);

    // Parse config into individual fields
    const commandArray = server.config.command || [];
    setServerCommand(commandArray[0] || "");
    setServerArgs(commandArray.slice(1));
    setServerUrl(server.config.url || "");

    // Convert env object to array
    const envArray = Object.entries(server.config.env || {}).map(([key, value]) => ({
      key,
      value,
    }));
    setServerEnv(envArray);

    setServerEnabled(server.enabled);
    setConfigError("");
    setShowServerDialog(true);
  };

  const handleSaveServer = async () => {
    // Validation
    if (!serverName.trim()) {
      setConfigError("Server name is required");
      return;
    }

    if (serverType === "stdio" && !serverCommand.trim()) {
      setConfigError("Command is required for stdio servers");
      return;
    }

    if ((serverType === "sse" || serverType === "http") && !serverUrl.trim()) {
      setConfigError("URL is required for sse/http servers");
      return;
    }

    setConfigError("");
    setIsLoading(true);

    try {
      // Build config object from form fields
      const config: MCPServer["config"] = {};

      if (serverType === "stdio") {
        // Combine command and args into command array
        config.command = [serverCommand, ...serverArgs.filter((arg) => arg.trim())];
      } else {
        config.url = serverUrl;
      }

      // Add env vars if any
      if (serverEnv.length > 0) {
        config.env = serverEnv.reduce(
          (acc, { key, value }) => {
            if (key.trim()) {
              acc[key.trim()] = value;
            }
            return acc;
          },
          {} as Record<string, string>
        );
      }

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
        setConfigError(error.error || "Failed to save server");
      }
    } catch (error) {
      console.error("Failed to save server:", error);
      setConfigError("Failed to save server");
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

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">MCP Server Management</h1>
              <p className="text-sm text-muted-foreground">
                Configure and manage your Model Context Protocol servers
              </p>
            </div>

            {mcpServers.length === 0 ? (
              <Card className="p-8 text-center">
                <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No MCP Servers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by adding your first MCP server
                </p>
                <Button
                  onClick={openAddServerDialog}
                  variant="outline"
                  className="hover:!bg-orange-500 hover:!text-white hover:!border-orange-500 transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Server
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
                onValueChange={(value: "stdio" | "sse" | "http") => setServerType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stdio">
                    <div className="flex flex-col">
                      <span>STDIO</span>
                      <span className="text-xs text-muted-foreground">Local process-based server</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sse">
                    <div className="flex flex-col">
                      <span>SSE</span>
                      <span className="text-xs text-muted-foreground">Server-Sent Events over HTTP</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="http">
                    <div className="flex flex-col">
                      <span>Streamable HTTP</span>
                      <span className="text-xs text-muted-foreground">HTTP streaming transport</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {serverType === "stdio" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="serverCommand">Command</Label>
                  <Input
                    id="serverCommand"
                    value={serverCommand}
                    onChange={(e) => setServerCommand(e.target.value)}
                    placeholder="npx"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Arguments</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setServerArgs([...serverArgs, ""])}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Examples: -y, arg1, arg2
                  </p>
                  <div className="space-y-2">
                    {serverArgs.map((arg, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={arg}
                          onChange={(e) => {
                            const newArgs = [...serverArgs];
                            newArgs[index] = e.target.value;
                            setServerArgs(newArgs);
                          }}
                          placeholder={`Argument ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newArgs = serverArgs.filter((_, i) => i !== index);
                            setServerArgs(newArgs);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="serverUrl">URL</Label>
                <Input
                  id="serverUrl"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://localhost:8080/sse"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Environment Variables</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setServerEnv([...serverEnv, { key: "", value: "" }])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {serverEnv.length > 0 && (
                <div className="space-y-2">
                  {serverEnv.map((env, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={env.key}
                        onChange={(e) => {
                          const newEnv = [...serverEnv];
                          newEnv[index].key = e.target.value;
                          setServerEnv(newEnv);
                        }}
                        placeholder="KEY"
                        className="flex-1"
                      />
                      <Input
                        value={env.value}
                        onChange={(e) => {
                          const newEnv = [...serverEnv];
                          newEnv[index].value = e.target.value;
                          setServerEnv(newEnv);
                        }}
                        placeholder="value"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newEnv = serverEnv.filter((_, i) => i !== index);
                          setServerEnv(newEnv);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {configError && (
              <p className="text-sm text-red-500">{configError}</p>
            )}

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
