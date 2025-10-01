"use client";

import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { FileCodeIcon, LinkIcon, ComponentIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUIBuilderStore, type ContentType, type RemoteDomFramework } from '@/lib/stores/ui-builder-store';
import { cn } from '@/lib/utils';

const CONTENT_TYPES = [
  {
    id: 'rawHtml' as ContentType,
    name: 'Raw HTML',
    icon: FileCodeIcon,
    description: 'Self-contained HTML rendered in sandboxed iframe',
  },
  {
    id: 'externalUrl' as ContentType,
    name: 'External URL',
    icon: LinkIcon,
    description: 'Embed external web applications via iframe',
  },
  {
    id: 'remoteDom' as ContentType,
    name: 'Remote DOM',
    icon: ComponentIcon,
    description: 'Shopify Remote DOM for host-styled components',
  },
];

const REMOTE_DOM_EXAMPLE = `// Remote DOM Script Example
const button = document.createElement('ui-button');
button.setAttribute('label', 'Click me!');
button.setAttribute('variant', 'primary');

button.addEventListener('press', () => {
  window.parent.postMessage({
    type: 'tool',
    payload: {
      toolName: 'handle-button-click',
      params: {
        action: 'button-pressed',
        timestamp: new Date().toISOString()
      }
    }
  }, '*');
});

root.appendChild(button);
`;

export function ContentTypeSelector() {
  const { theme } = useTheme();
  const { currentResource, updateResource, refreshPreview } = useUIBuilderStore();
  const [localContent, setLocalContent] = useState(currentResource.content);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalContent(currentResource.content);
  }, [currentResource.content]);

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      setLocalContent(value);

      // Debounce update to store
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      const timer = setTimeout(() => {
        updateResource({ content: value });
        refreshPreview();
      }, 500);
      setDebounceTimer(timer);
    }
  };

  const handleContentTypeChange = (newType: ContentType) => {
    let newContent = '';

    if (newType === 'rawHtml') {
      newContent = '<div style="padding: 20px; font-family: sans-serif;">\n  <h2>Hello, MCP-UI!</h2>\n  <p>Start building your interactive component here.</p>\n</div>';
    } else if (newType === 'externalUrl') {
      newContent = 'https://example.com';
    } else if (newType === 'remoteDom') {
      newContent = REMOTE_DOM_EXAMPLE;
    }

    updateResource({
      contentType: newType,
      content: newContent,
      framework: newType === 'remoteDom' ? 'react' : undefined,
    });
    setLocalContent(newContent);
    refreshPreview();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Content type tabs */}
      <div className="flex items-center gap-1 border-b border-border bg-card/50 p-2">
        {CONTENT_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => handleContentTypeChange(type.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                currentResource.contentType === type.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={type.description}
            >
              <Icon className="size-4" />
              {type.name}
            </button>
          );
        })}
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentResource.contentType === 'rawHtml' && (
          <div className="flex-1 flex flex-col">
            <div className="border-b border-border bg-card/30 px-4 py-2 text-xs text-muted-foreground">
              HTML will be rendered in a sandboxed iframe. Use window.parent.postMessage() to communicate with the host.
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                defaultLanguage="html"
                value={localContent}
                onChange={handleContentChange}
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
          </div>
        )}

        {currentResource.contentType === 'externalUrl' && (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">External URL Configuration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Embed an external web application in an iframe. The URL must be a valid http/https URL.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="iframe-url">Iframe URL</Label>
                <Input
                  id="iframe-url"
                  type="url"
                  placeholder="https://example.com"
                  value={localContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the full URL to embed. Some sites may block embedding due to X-Frame-Options headers.
                </p>
              </div>

              <div className="border border-border rounded-lg p-4 bg-card/50">
                <h4 className="text-sm font-medium mb-2">Example URLs:</h4>
                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => handleContentChange('https://www.youtube.com/embed/dQw4w9WgXcQ')}
                    className="block w-full text-left px-2 py-1 hover:bg-accent rounded"
                  >
                    YouTube embed
                  </button>
                  <button
                    onClick={() => handleContentChange('https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309083%2C51.47612752641776%2C0.00030577182769775396%2C51.478569861898606&layer=mapnik')}
                    className="block w-full text-left px-2 py-1 hover:bg-accent rounded"
                  >
                    OpenStreetMap embed
                  </button>
                  <button
                    onClick={() => handleContentChange('https://observablehq.com/embed/@d3/bar-chart')}
                    className="block w-full text-left px-2 py-1 hover:bg-accent rounded"
                  >
                    Observable chart embed
                  </button>
                </div>
              </div>

              <Button
                onClick={() => {
                  updateResource({ content: localContent });
                  refreshPreview();
                }}
                className="w-full"
              >
                Update Preview
              </Button>
            </div>
          </div>
        )}

        {currentResource.contentType === 'remoteDom' && (
          <div className="flex-1 flex flex-col">
            <div className="border-b border-border bg-card/30 px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Remote DOM script using Shopify&apos;s remote-dom library
              </span>
              <div className="flex items-center gap-2">
                <Label htmlFor="framework" className="text-xs">Framework:</Label>
                <Select
                  value={currentResource.framework || 'react'}
                  onValueChange={(value: RemoteDomFramework) => {
                    updateResource({ framework: value });
                    refreshPreview();
                  }}
                >
                  <SelectTrigger id="framework" className="h-7 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="webcomponents">Web Components</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={localContent}
                onChange={handleContentChange}
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
          </div>
        )}
      </div>
    </div>
  );
}
