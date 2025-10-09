'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Info, Copy, Code } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Button } from '@/components/ui/button';
import { PreviewPanel } from '../PreviewPanel';
import { extractTemplatePlaceholders } from '@/lib/html-parser';
import { HTMLEditor } from '../editors/HTMLEditor';
import { URLInput } from '../editors/URLInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Editor } from '@monaco-editor/react';

// HTML template library
const HTML_TEMPLATES = [
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'Forms',
    description: 'Simple contact form with name, email, and message fields',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    input, textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
    button { background: #2563eb; color: white; padding: 0.75rem 2rem; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <h1>Contact Us</h1>
  <form>
    <div class="form-group">
      <label for="name">Name</label>
      <input type="text" id="name" required>
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" required>
    </div>
    <div class="form-group">
      <label for="message">Message</label>
      <textarea id="message" rows="5" required></textarea>
    </div>
    <button type="submit">Send Message</button>
  </form>
</body>
</html>`
  },
  {
    id: 'dashboard-card',
    name: 'Dashboard Card',
    category: 'Dashboards',
    description: 'Metric dashboard card with icon and stats',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #f9fafb; }
    .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .metric { font-size: 2.5rem; font-weight: bold; color: #2563eb; margin: 1rem 0; }
    .label { color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .change { color: #10b981; font-size: 0.875rem; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="label">Total Revenue</div>
    <div class="metric">$45,231</div>
    <div class="change">↑ 12% from last month</div>
  </div>
</body>
</html>`
  },
  {
    id: 'data-table',
    name: 'Data Table',
    category: 'Tables',
    description: 'Simple data table with sortable columns',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Table</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; cursor: pointer; }
    th:hover { background: #f3f4f6; }
    tr:hover { background: #fafafa; }
  </style>
</head>
<body>
  <h2>User List</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>Active</td>
        <td>Admin</td>
      </tr>
      <tr>
        <td>Jane Smith</td>
        <td>jane@example.com</td>
        <td>Active</td>
        <td>User</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`
  },
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    category: 'Galleries',
    description: 'Responsive grid image gallery',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gallery</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .gallery-item { aspect-ratio: 1; background: #e5e7eb; border-radius: 8px; overflow: hidden; cursor: pointer; }
    .gallery-item:hover { transform: scale(1.05); transition: transform 0.2s; }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
  </style>
</head>
<body>
  <h2>Photo Gallery</h2>
  <div class="gallery">
    <div class="gallery-item"></div>
    <div class="gallery-item"></div>
    <div class="gallery-item"></div>
    <div class="gallery-item"></div>
  </div>
</body>
</html>`
  },
  {
    id: 'chart-container',
    name: 'Chart Container',
    category: 'Charts',
    description: 'Container for embedding charts',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chart</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    .chart-container { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
    .chart { min-height: 300px; border: 2px dashed #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="chart-container">
    <div class="chart-title">Monthly Sales</div>
    <div class="chart">Chart will render here</div>
  </div>
</body>
</html>`
  },
  {
    id: 'blank',
    name: 'Blank Template',
    category: 'Custom',
    description: 'Start from scratch with basic HTML structure',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My UI</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <h1>Hello World!</h1>
  <p>Start building your custom UI here.</p>
</body>
</html>`
  },
];

export function DesignTab() {
  const {
    setActiveTab,
    currentResource,
    updateResource,
  } = useUIBuilderStore();
  const [showTemplates, setShowTemplates] = useState(false);

  // Auto-detect template placeholders when HTML content changes
  useEffect(() => {
    if (currentResource && currentResource.contentType === 'rawHtml') {
      const placeholders = extractTemplatePlaceholders(currentResource.content);
      if (JSON.stringify(placeholders) !== JSON.stringify(currentResource.templatePlaceholders)) {
        updateResource({ templatePlaceholders: placeholders });
      }
    }
  }, [currentResource?.content, currentResource?.contentType, updateResource, currentResource?.templatePlaceholders]);

  if (!currentResource) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No resource loaded</AlertDescription>
      </Alert>
    );
  }

  const canProceed = currentResource.content.trim().length > 0;
  const agentSlots = currentResource.templatePlaceholders?.length || 0;

  const handleTemplateSelect = (template: typeof HTML_TEMPLATES[0]) => {
    updateResource({ content: template.html });
    setShowTemplates(false);
  };

  const handleInitialDataChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      updateResource({
        uiMetadata: {
          ...currentResource.uiMetadata,
          'initial-render-data': parsed
        }
      });
    } catch (e) {
      // Invalid JSON, don't update
      console.error('Invalid JSON:', e);
    }
  };

  const initialData = currentResource.uiMetadata?.['initial-render-data'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Template Library - Only for rawHtml */}
      {currentResource.contentType === 'rawHtml' && (
        <div className="border-b p-4 bg-muted/30">
          <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  HTML Templates
                </span>
                <span className="text-sm text-muted-foreground">
                  {showTemplates ? 'Hide' : 'Show'} {HTML_TEMPLATES.length} templates
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {HTML_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs">{template.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      <div className="flex items-center gap-1 text-xs text-primary mt-2">
                        <Copy className="h-3 w-3" />
                        Click to use
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Content Editor - Dynamic based on content type */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-1/2 border-r overflow-hidden flex flex-col">
          {currentResource.contentType === 'rawHtml' && (
            <>
              <div className="flex-1 overflow-hidden">
                <HTMLEditor
                  value={currentResource.content}
                  onChange={(value) => updateResource({ content: value })}
                />
              </div>
              {/* Initial Render Data - Only for rawHtml */}
              <div className="border-t p-4 bg-muted/10">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between mb-2">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Initial Render Data (JSON)
                      </span>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Data passed to the iframe on first render. Example: <code className="bg-muted px-1 rounded">{'{"userName": "Alice", "theme": "dark"}'}</code>
                      </Label>
                      <div className="border rounded-md overflow-hidden">
                        <Editor
                          height="150px"
                          defaultLanguage="json"
                          value={initialData ? JSON.stringify(initialData, null, 2) : '{}'}
                          onChange={(value) => value && handleInitialDataChange(value)}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            lineNumbers: 'off',
                            scrollBeyondLastLine: false,
                            folding: false,
                            fontSize: 12,
                          }}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </>
          )}

          {currentResource.contentType === 'externalUrl' && (
            <div className="h-full p-6 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>External URL Configuration</CardTitle>
                  <CardDescription>
                    Embed an external website or web application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <URLInput
                    value={currentResource.content}
                    onChange={(value) => updateResource({ content: value })}
                  />
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      The external site will be rendered in an iframe. Ensure the site allows iframe embedding.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {currentResource.contentType === 'remoteDom' && (
            <div className="h-full p-6 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Remote DOM Configuration</CardTitle>
                  <CardDescription>
                    Server-generated UI using Shopify&apos;s Remote DOM framework
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Remote DOM support coming soon. Use Raw HTML or External URL for now.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 overflow-hidden">
          {(currentResource.contentType === 'rawHtml' || currentResource.contentType === 'externalUrl') && (
            <PreviewPanel />
          )}

          {currentResource.contentType === 'remoteDom' && (
            <div className="h-full flex items-center justify-center p-6 bg-muted/30">
              <Alert className="max-w-md">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Preview not available for Remote DOM</strong>
                  <br />
                  Test your Remote DOM resource in the chat after exporting.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Continue button */}
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm flex items-center gap-2">
            {canProceed ? (
              <>
                <span className="text-green-600">✓ UI design ready</span>
                {agentSlots > 0 && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {agentSlots} agent slot{agentSlots !== 1 ? 's' : ''} detected
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Add UI content to continue</span>
            )}
          </div>
          <Button
            onClick={() => setActiveTab('export')}
            disabled={!canProceed}
            className="gap-2"
          >
            Next: Export Code
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
