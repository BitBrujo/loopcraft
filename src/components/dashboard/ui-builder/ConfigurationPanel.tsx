"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

const PRESET_SIZES = [
  { name: 'Small', width: 400, height: 300 },
  { name: 'Medium', width: 800, height: 600 },
  { name: 'Large', width: 1200, height: 800 },
  { name: 'Wide', width: 1000, height: 500 },
];

export function ConfigurationPanel() {
  const { theme } = useTheme();
  const { currentResource, updateResource, refreshPreview } = useUIBuilderStore();
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleInitialDataChange = (value: string | undefined) => {
    if (value === undefined) return;

    try {
      const parsed = JSON.parse(value);
      setJsonError(null);
      updateResource({ initialData: parsed });
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Basic Settings</h3>

          <div className="space-y-2">
            <Label htmlFor="uri">URI *</Label>
            <Input
              id="uri"
              placeholder="ui://my-app/component"
              value={currentResource.uri}
              onChange={(e) => updateResource({ uri: e.target.value })}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Must start with &quot;ui://&quot;. Example: ui://my-app/dashboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="My Interactive Component"
              value={currentResource.title || ''}
              onChange={(e) => updateResource({ title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A brief description of what this component does..."
              value={currentResource.description || ''}
              onChange={(e) => updateResource({ description: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        {/* Preferred Frame Size */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Preferred Frame Size</h3>

          <div className="grid grid-cols-2 gap-2">
            {PRESET_SIZES.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  updateResource({
                    preferredSize: { width: preset.width, height: preset.height },
                  });
                  refreshPreview();
                }}
              >
                {preset.name} ({preset.width}×{preset.height})
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                min="200"
                max="2000"
                value={currentResource.preferredSize.width}
                onChange={(e) =>
                  updateResource({
                    preferredSize: {
                      ...currentResource.preferredSize,
                      width: parseInt(e.target.value) || 800,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                min="200"
                max="2000"
                value={currentResource.preferredSize.height}
                onChange={(e) =>
                  updateResource({
                    preferredSize: {
                      ...currentResource.preferredSize,
                      height: parseInt(e.target.value) || 600,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Initial Render Data */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Initial Render Data (optional)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              JSON data passed to the component on initial render
            </p>
          </div>

          <div className="border border-border rounded-md overflow-hidden">
            <Editor
              height="150px"
              defaultLanguage="json"
              value={JSON.stringify(currentResource.initialData || {}, null, 2)}
              onChange={handleInitialDataChange}
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'off',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
              }}
            />
          </div>
          {jsonError && (
            <p className="text-xs text-destructive">JSON Error: {jsonError}</p>
          )}

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Example: Passing theme and user data
            </summary>
            <pre className="mt-2 bg-muted p-2 rounded overflow-auto">
{`{
  "theme": "dark",
  "userId": "user123",
  "settings": {
    "refreshInterval": 5000,
    "showNotifications": true
  }
}`}
            </pre>
          </details>
        </div>

        {/* Refresh Button */}
        <Button onClick={refreshPreview} className="w-full">
          Apply Changes & Refresh Preview
        </Button>
      </div>
    </ScrollArea>
  );
}
