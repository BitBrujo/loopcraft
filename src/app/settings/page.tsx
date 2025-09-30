"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Plus, Trash2, Power, PowerOff, MessageSquare, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useMCPStore } from '@/lib/stores/mcp-store';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { AddServerDialog, MCPServerFormData } from '@/components/settings/AddServerDialog';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { settings, updateSettings, isSaving, setIsSaving } = useSettingsStore();
  const { servers, setServers, toggleServer, editingServer, setEditingServer } = useMCPStore();
  const { addLog } = useDashboardStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Load MCP servers
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const response = await fetch('/api/mcp/servers');
      const data = await response.json();
      if (data.success) {
        setServers(data.servers);
      }
    } catch (error) {
      addLog({
        level: 'error',
        message: `Error loading servers: ${error}`,
        source: 'Settings',
      });
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    updateSettings(localSettings);

    addLog({
      level: 'info',
      message: 'Settings saved successfully',
      source: 'Settings',
    });

    setTimeout(() => setIsSaving(false), 500);
  };

  const handleConnectServer = async (serverName: string) => {
    try {
      const response = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName }),
      });

      const data = await response.json();
      if (data.success) {
        addLog({
          level: 'info',
          message: `Connected to ${serverName}`,
          source: 'Settings',
        });
        loadServers();
      }
    } catch (error) {
      addLog({
        level: 'error',
        message: `Error connecting to ${serverName}: ${error}`,
        source: 'Settings',
      });
    }
  };

  const handleDisconnectServer = async (serverName: string) => {
    try {
      const response = await fetch(`/api/mcp/servers?name=${serverName}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        addLog({
          level: 'info',
          message: `Disconnected from ${serverName}`,
          source: 'Settings',
        });
        loadServers();
      }
    } catch (error) {
      addLog({
        level: 'error',
        message: `Error disconnecting from ${serverName}: ${error}`,
        source: 'Settings',
      });
    }
  };

  const handleAddServer = () => {
    setEditingServer(null);
    setDialogOpen(true);
  };

  const handleEditServer = (server: any) => {
    setEditingServer(server);
    setDialogOpen(true);
  };

  const handleSaveServer = async (formData: MCPServerFormData) => {
    try {
      const response = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverData: formData }),
      });

      const data = await response.json();
      if (data.success) {
        addLog({
          level: 'info',
          message: `Server ${formData.name} saved successfully`,
          source: 'Settings',
        });
        loadServers();
      } else {
        throw new Error(data.error || 'Failed to save server');
      }
    } catch (error) {
      addLog({
        level: 'error',
        message: `Error saving server: ${error}`,
        source: 'Settings',
      });
      throw error;
    }
  };

  const handleDeleteServer = async (serverId: string, serverName: string) => {
    if (!confirm(`Are you sure you want to delete server "${serverName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/mcp/servers?id=${serverId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        addLog({
          level: 'info',
          message: `Server ${serverName} deleted successfully`,
          source: 'Settings',
        });
        loadServers();
      }
    } catch (error) {
      addLog({
        level: 'error',
        message: `Error deleting server: ${error}`,
        source: 'Settings',
      });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card/30 px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">LoopCraft</h1>
          </Link>
          <Badge variant="secondary" className="text-xs">
            Settings
          </Badge>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
          <Save className="size-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* User Preferences */}
          <section>
            <h2 className="text-xl font-semibold mb-4">User Preferences</h2>
            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <select
                    value={localSettings.theme}
                    onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as 'light' | 'dark' | 'system' })}
                    className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <select
                    value={localSettings.language}
                    onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={localSettings.notificationsEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, notificationsEnabled: e.target.checked })}
                  className="size-4"
                />
                <label htmlFor="notifications" className="text-sm">Enable notifications</label>
              </div>
            </Card>
          </section>

          <Separator />

          {/* AI Model Configuration */}
          <section>
            <h2 className="text-xl font-semibold mb-4">AI Model Configuration</h2>
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ollama Base URL</label>
                <Input
                  value={localSettings.ollamaBaseUrl}
                  onChange={(e) => setLocalSettings({ ...localSettings, ollamaBaseUrl: e.target.value })}
                  placeholder="http://localhost:11434/api"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ollama Model</label>
                <Input
                  value={localSettings.ollamaModel}
                  onChange={(e) => setLocalSettings({ ...localSettings, ollamaModel: e.target.value })}
                  placeholder="gpt-oss:20b"
                />
              </div>
            </Card>
          </section>

          <Separator />

          {/* MCP Server Management */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">MCP Servers</h2>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleAddServer}>
                <Plus className="size-4" />
                Add Server
              </Button>
            </div>

            <div className="space-y-3">
              {servers.length === 0 && (
                <Card className="p-6 text-center text-muted-foreground">
                  No MCP servers configured. Add one using the button above.
                </Card>
              )}

              {servers.map((server) => (
                <Card key={server.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{server.name}</h3>
                        <Badge variant={server.connected ? 'default' : 'secondary'}>
                          {server.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                        <Badge variant="outline">{server.type}</Badge>
                        {server.source && (
                          <Badge variant={server.source === 'database' ? 'default' : 'secondary'} className="text-xs">
                            {server.source === 'database' ? 'Saved' : 'Env'}
                          </Badge>
                        )}
                      </div>
                      {server.description && (
                        <p className="text-sm text-muted-foreground mt-1">{server.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Command: <code className="bg-muted px-1 rounded">{server.command.join(' ')}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {server.source === 'database' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditServer(server)}
                            className="gap-2"
                          >
                            <Edit2 className="size-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteServer(server.id, server.name)}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </>
                      )}
                      {server.connected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisconnectServer(server.name)}
                          className="gap-2"
                        >
                          <PowerOff className="size-4" />
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnectServer(server.name)}
                          className="gap-2"
                        >
                          <Power className="size-4" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          {/* Dashboard Preferences */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Dashboard Preferences</h2>
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoConnect"
                  checked={localSettings.mcpAutoConnect}
                  onChange={(e) => setLocalSettings({ ...localSettings, mcpAutoConnect: e.target.checked })}
                  className="size-4"
                />
                <label htmlFor="autoConnect" className="text-sm">Auto-connect to MCP servers on startup</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="debugMode"
                  checked={localSettings.mcpDebugMode}
                  onChange={(e) => setLocalSettings({ ...localSettings, mcpDebugMode: e.target.checked })}
                  className="size-4"
                />
                <label htmlFor="debugMode" className="text-sm">Enable debug mode</label>
              </div>
            </Card>
          </section>
        </div>
      </ScrollArea>

      {/* Add/Edit Server Dialog */}
      <AddServerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveServer}
        editingServer={editingServer}
      />
    </div>
  );
}