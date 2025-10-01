"use client";

import { useState } from 'react';
import { CopyIcon, CheckIcon, DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { cn } from '@/lib/utils';

type ExportFormat = 'typescript' | 'json' | 'curl';

const EXPORT_FORMATS: { id: ExportFormat; name: string; language: string }[] = [
  { id: 'typescript', name: 'TypeScript', language: 'typescript' },
  { id: 'json', name: 'JSON', language: 'json' },
  { id: 'curl', name: 'cURL', language: 'bash' },
];

export function ExportDialog() {
  const {
    showExportDialog,
    setShowExportDialog,
    currentResource,
    saveTemplate,
  } = useUIBuilderStore();

  const [activeFormat, setActiveFormat] = useState<ExportFormat>('typescript');
  const [copied, setCopied] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('custom');
  const [showSaveSection, setShowSaveSection] = useState(false);

  const generateCode = (format: ExportFormat): string => {
    if (format === 'typescript') {
      const content = JSON.stringify(currentResource.content);
      const framework = currentResource.framework ? `, framework: '${currentResource.framework}'` : '';

      if (currentResource.contentType === 'rawHtml') {
        return `import { createHtmlUIResource } from '@mcp-ui/server';

const resource = createHtmlUIResource({
  uri: '${currentResource.uri}',
  htmlString: ${content},
  title: '${currentResource.title || ''}',
  description: '${currentResource.description || ''}',
  preferredSize: { width: ${currentResource.preferredSize.width}, height: ${currentResource.preferredSize.height} },
  ${currentResource.initialData ? `initialData: ${JSON.stringify(currentResource.initialData, null, 2)},` : ''}
});

export default resource;`;
      } else if (currentResource.contentType === 'externalUrl') {
        return `import { createExternalUrlUIResource } from '@mcp-ui/server';

const resource = createExternalUrlUIResource({
  uri: '${currentResource.uri}',
  iframeUrl: ${content},
  title: '${currentResource.title || ''}',
  description: '${currentResource.description || ''}',
  preferredSize: { width: ${currentResource.preferredSize.width}, height: ${currentResource.preferredSize.height} },
});

export default resource;`;
      } else {
        return `import { createRemoteDomUIResource } from '@mcp-ui/server';

const resource = createRemoteDomUIResource({
  uri: '${currentResource.uri}',
  script: ${content}${framework},
  title: '${currentResource.title || ''}',
  description: '${currentResource.description || ''}',
  preferredSize: { width: ${currentResource.preferredSize.width}, height: ${currentResource.preferredSize.height} },
});

export default resource;`;
      }
    } else if (format === 'json') {
      return JSON.stringify({
        type: 'resource',
        resource: currentResource,
      }, null, 2);
    } else {
      // cURL example showing MCP tool response
      return `curl -X POST https://your-mcp-server.com/tool \\
  -H "Content-Type: application/json" \\
  -d '{
  "toolName": "example_tool",
  "result": {
    "content": [{
      "type": "resource",
      "resource": {
        "uri": "${currentResource.uri}",
        "mimeType": "${currentResource.contentType === 'rawHtml' ? 'text/html' : currentResource.contentType === 'externalUrl' ? 'text/uri-list' : 'application/vnd.mcp-ui.remote-dom'}",
        "text": ${JSON.stringify(currentResource.content)}
      }
    }]
  }
}'`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateCode(activeFormat));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = generateCode(activeFormat);
    const ext = activeFormat === 'typescript' ? 'ts' : activeFormat === 'json' ? 'json' : 'sh';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-ui-resource.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      saveTemplate(templateName, templateCategory);
      setTemplateName('');
      setShowSaveSection(false);
      alert('Template saved successfully!');
    }
  };

  return (
    <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export UI Resource</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 gap-4">
          {/* Format tabs */}
          <div className="flex gap-1">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => setActiveFormat(format.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activeFormat === format.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {format.name}
              </button>
            ))}
          </div>

          {/* Code display */}
          <ScrollArea className="flex-1 border border-border rounded-md">
            <pre className="p-4 text-xs font-mono">
              <code>{generateCode(activeFormat)}</code>
            </pre>
          </ScrollArea>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="gap-2">
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={handleDownload} variant="outline" className="gap-2">
                <DownloadIcon className="size-4" />
                Download
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowSaveSection(!showSaveSection)}
                variant="outline"
              >
                Save as Template
              </Button>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Close
              </Button>
            </div>
          </div>

          {/* Save template section */}
          {showSaveSection && (
            <div className="border border-border rounded-md p-4 space-y-3">
              <h4 className="text-sm font-medium">Save as Template</h4>
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="My Custom Dashboard"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Input
                  id="template-category"
                  placeholder="custom"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="w-full">
                Save Template
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
