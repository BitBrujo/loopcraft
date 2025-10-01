"use client";

import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/chat/AppHeader';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useMCPStore } from '@/lib/stores/mcp-store';
import { useDashboardStore } from '@/lib/stores/dashboard-store';

export default function SettingsPage() {
  const { settings, updateSettings, isSaving, setIsSaving } = useSettingsStore();
  const { servers, setServers } = useMCPStore();
  const { addLog } = useDashboardStore();
  const [localSettings, setLocalSettings] = useState(settings);

  const loadServers = useCallback(async () => {
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
  }, [addLog, setServers]);

  useEffect(() => {
    // Load MCP servers
    loadServers();
  }, [loadServers]);

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

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      {/* Toolbar */}
      <div className="flex h-12 items-center justify-end gap-2 border-b border-border bg-card/20 px-4">
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
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="size-4" />
                Add Server
              </Button>
            </div>

            <div className="space-y-3">
              {servers.length === 0 && (
                <Card className="p-6 text-center text-muted-foreground">
                  No MCP servers configured. Add one from the MCP_CONFIG environment variable.
                </Card>
              )}

              {servers.map((server) => (
                <Card key={server.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{server.name}</h3>
                        <Badge variant={server.connected ? 'default' : 'secondary'}>
                          {server.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                        <Badge variant="outline">{server.type}</Badge>
                      </div>
                      {server.description && (
                        <p className="text-sm text-muted-foreground mt-1">{server.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Command: <code className="bg-muted px-1 rounded">{server.command.join(' ')}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
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
    </div>
  );
}