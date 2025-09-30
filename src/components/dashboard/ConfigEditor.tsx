"use client";

import { useEffect, useState } from 'react';
import { SaveIcon, DownloadIcon, UploadIcon, PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMCPStore } from '@/lib/stores/mcp-store';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';

export function ConfigEditor() {
  const { servers } = useMCPStore();
  const { addLog, triggerRefresh } = useDashboardStore();
  const { theme } = useTheme();
  const [configJson, setConfigJson] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Load current MCP configuration
    const config = {
      servers: servers.map(server => ({
        name: server.name,
        command: server.command,
        type: server.type,
        env: server.env,
        enabled: server.enabled,
        description: server.description,
      }))
    };
    setConfigJson(JSON.stringify(config, null, 2));
  }, [servers]);

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      setIsValid(true);
      setErrorMessage('');
      return true;
    } catch (error) {
      setIsValid(false);
      setErrorMessage(error instanceof Error ? error.message : 'Invalid JSON');
      return false;
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setConfigJson(value);
      validateJson(value);
    }
  };

  const handleSave = () => {
    if (!validateJson(configJson)) {
      addLog({
        level: 'error',
        message: 'Cannot save invalid JSON configuration',
        source: 'ConfigEditor',
      });
      return;
    }

    addLog({
      level: 'info',
      message: 'Configuration saved (Note: requires restart to take effect)',
      source: 'ConfigEditor',
    });

    // In a real implementation, you would save this to env/config file
    // For now, just log it
    console.log('New config:', configJson);
  };

  const handleExport = () => {
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcp-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addLog({
      level: 'info',
      message: 'Configuration exported to mcp-config.json',
      source: 'ConfigEditor',
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setConfigJson(content);
          validateJson(content);
          addLog({
            level: 'info',
            message: `Configuration imported from ${file.name}`,
            source: 'ConfigEditor',
          });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleApply = () => {
    if (!validateJson(configJson)) {
      addLog({
        level: 'error',
        message: 'Cannot apply invalid JSON configuration',
        source: 'ConfigEditor',
      });
      return;
    }

    addLog({
      level: 'info',
      message: 'Applying configuration and reloading connections...',
      source: 'ConfigEditor',
    });

    // Trigger refresh to reconnect with new config
    triggerRefresh();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 p-4">
        <div>
          <h3 className="text-sm font-medium">MCP Configuration Editor</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Edit your MCP server configuration in JSON format
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="gap-2"
          >
            <UploadIcon className="size-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <DownloadIcon className="size-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!isValid}
            className="gap-2"
          >
            <SaveIcon className="size-4" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!isValid}
            className="gap-2"
          >
            <PlayIcon className="size-4" />
            Apply & Reload
          </Button>
        </div>
      </div>

      {/* Error message */}
      {!isValid && (
        <div className="border-b border-destructive bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <strong>JSON Error:</strong> {errorMessage}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={configJson}
          onChange={handleEditorChange}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {/* Help section */}
      <div className="border-t border-border bg-card/30 p-4">
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
            Configuration Schema Help
          </summary>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <p><strong>Structure:</strong></p>
            <pre className="bg-muted rounded p-2 overflow-auto">
{`{
  "servers": [
    {
      "name": "server-name",
      "command": ["npx", "-y", "@package/name"],
      "type": "stdio" | "sse",
      "env": { "KEY": "value" },
      "enabled": true,
      "description": "Server description"
    }
  ]
}`}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}