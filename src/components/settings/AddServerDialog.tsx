"use client";

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export interface MCPServerFormData {
  name: string;
  command: string[];
  type: 'stdio' | 'sse' | 'http';
  env: Record<string, string>;
  enabled: boolean;
  description: string;
}

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MCPServerFormData) => Promise<void>;
  editingServer?: MCPServerFormData | null;
}

export function AddServerDialog({
  open,
  onOpenChange,
  onSave,
  editingServer,
}: AddServerDialogProps) {
  const [formData, setFormData] = useState<MCPServerFormData>({
    name: '',
    command: [''],
    type: 'stdio',
    env: {},
    enabled: true,
    description: '',
  });
  const [commandInput, setCommandInput] = useState('');
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingServer) {
      setFormData(editingServer);
      setCommandInput(editingServer.command.join(' '));
    } else {
      setFormData({
        name: '',
        command: [''],
        type: 'stdio',
        env: {},
        enabled: true,
        description: '',
      });
      setCommandInput('');
    }
  }, [editingServer, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Server name is required');
      return;
    }

    if (commandInput.trim()) {
      formData.command = commandInput.trim().split(/\s+/);
    }

    if (formData.command.length === 0 || formData.command[0] === '') {
      alert('Command is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving server:', error);
      alert(`Error saving server: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const addEnvVariable = () => {
    if (envKey.trim() && envValue.trim()) {
      setFormData({
        ...formData,
        env: {
          ...formData.env,
          [envKey.trim()]: envValue.trim(),
        },
      });
      setEnvKey('');
      setEnvValue('');
    }
  };

  const removeEnvVariable = (key: string) => {
    const newEnv = { ...formData.env };
    delete newEnv[key];
    setFormData({ ...formData, env: newEnv });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingServer ? 'Edit MCP Server' : 'Add MCP Server'}
          </DialogTitle>
          <DialogDescription>
            Configure an MCP server connection. The server will be saved to your database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Server Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Server Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="filesystem"
              disabled={!!editingServer}
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for this server
            </p>
          </div>

          {/* Server Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Server Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as 'stdio' | 'sse' | 'http' })
              }
              className="w-full border border-border rounded-md px-3 py-2 bg-background"
            >
              <option value="stdio">stdio (Local Process)</option>
              <option value="sse">SSE (Server-Sent Events)</option>
              <option value="http">HTTP (REST API)</option>
            </select>
          </div>

          {/* Command */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Command <span className="text-red-500">*</span>
            </label>
            <Input
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="npx -y @modelcontextprotocol/server-filesystem ."
            />
            <p className="text-xs text-muted-foreground">
              Space-separated command and arguments
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="File system access for current directory"
            />
          </div>

          {/* Environment Variables */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Environment Variables</label>
            <div className="space-y-2">
              {Object.entries(formData.env).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                    <span className="font-mono text-xs">
                      {key}={value}
                    </span>
                    <button
                      onClick={() => removeEnvVariable(key)}
                      className="hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                placeholder="KEY"
                className="flex-1"
              />
              <Input
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
                placeholder="value"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEnvVariable}
                disabled={!envKey.trim() || !envValue.trim()}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="size-4"
            />
            <label htmlFor="enabled" className="text-sm">
              Enable this server
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : editingServer ? 'Update Server' : 'Add Server'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
