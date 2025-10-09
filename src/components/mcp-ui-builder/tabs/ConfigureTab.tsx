'use client';

import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Check, AlertCircle } from 'lucide-react';
import type { ContentType } from '@/types/ui-builder';
import { Badge } from '@/components/ui/badge';
import { Editor } from '@monaco-editor/react';

export function ConfigureTab() {
  const { currentResource, updateResource } = useUIBuilderStore();

  if (!currentResource) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No resource loaded</AlertDescription>
      </Alert>
    );
  }

  const handleContentTypeChange = (value: ContentType) => {
    updateResource({ contentType: value });
  };

  const handlePreferredSizeChange = (dimension: 'width' | 'height', value: string) => {
    const currentSize = currentResource.uiMetadata?.['preferred-frame-size'] || ['800px', '600px'];
    const newSize: [string, string] = dimension === 'width'
      ? [value, currentSize[1]]
      : [currentSize[0], value];

    updateResource({
      uiMetadata: {
        ...currentResource.uiMetadata,
        'preferred-frame-size': newSize
      }
    });
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

  const preferredSize = currentResource.uiMetadata?.['preferred-frame-size'] || ['800px', '600px'];
  const initialData = currentResource.uiMetadata?.['initial-render-data'];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Resource Identification */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Identification</CardTitle>
          <CardDescription>
            Define the unique identifier for this UI resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uri">
              Resource URI <span className="text-destructive">*</span>
            </Label>
            <Input
              id="uri"
              value={currentResource.uri}
              onChange={(e) => updateResource({ uri: e.target.value })}
              placeholder="ui://myapp/dashboard"
            />
            <p className="text-sm text-muted-foreground">
              Must start with <code className="bg-muted px-1 rounded">ui://</code>
            </p>
            {!currentResource.uri.startsWith('ui://') && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  URI must start with &quot;ui://&quot;
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label>Content Type <span className="text-destructive">*</span></Label>
            <RadioGroup value={currentResource.contentType} onValueChange={handleContentTypeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rawHtml" id="rawHtml" />
                <Label htmlFor="rawHtml" className="font-normal cursor-pointer">
                  Raw HTML
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6 mb-2">
                Static HTML content rendered in an iframe
              </p>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="externalUrl" id="externalUrl" />
                <Label htmlFor="externalUrl" className="font-normal cursor-pointer">
                  External URL
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6 mb-2">
                Embed an external website or web application
              </p>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remoteDom" id="remoteDom" />
                <Label htmlFor="remoteDom" className="font-normal cursor-pointer">
                  Remote DOM
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Server-generated UI using Shopify&apos;s Remote DOM framework
              </p>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Standard Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Metadata</CardTitle>
          <CardDescription>
            Basic information about this resource (maps to _meta property)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={currentResource.metadata?.title || ''}
              onChange={(e) => updateResource({
                metadata: {
                  ...currentResource.metadata,
                  title: e.target.value
                }
              })}
              placeholder="Dashboard UI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={currentResource.metadata?.description || ''}
              onChange={(e) => updateResource({
                metadata: {
                  ...currentResource.metadata,
                  description: e.target.value
                }
              })}
              placeholder="Interactive dashboard for monitoring key metrics"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* UI Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>UI Metadata</CardTitle>
          <CardDescription>
            MCP-UI specific configuration (prefixed with mcpui.dev/ui-)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Frame Size</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="width" className="text-sm text-muted-foreground">
                  Width
                </Label>
                <Input
                  id="width"
                  value={preferredSize[0]}
                  onChange={(e) => handlePreferredSizeChange('width', e.target.value)}
                  placeholder="800px"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="height" className="text-sm text-muted-foreground">
                  Height
                </Label>
                <Input
                  id="height"
                  value={preferredSize[1]}
                  onChange={(e) => handlePreferredSizeChange('height', e.target.value)}
                  placeholder="600px"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Initial size for the iframe. Use CSS units (px, %, vh, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialData">Initial Render Data (JSON)</Label>
            <div className="border rounded-md overflow-hidden">
              <Editor
                height="200px"
                defaultLanguage="json"
                value={initialData ? JSON.stringify(initialData, null, 2) : '{}'}
                onChange={(value) => value && handleInitialDataChange(value)}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'off',
                  scrollBeyondLastLine: false,
                  folding: false,
                  fontSize: 13,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Data passed to the iframe on render. Can include template placeholders like <code className="bg-muted px-1 rounded">{'{{user.id}}'}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Detected Placeholders */}
      {currentResource.templatePlaceholders && currentResource.templatePlaceholders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Detected Template Placeholders
            </CardTitle>
            <CardDescription>
              These placeholders will be filled by the AI with contextual data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentResource.templatePlaceholders.map((placeholder) => (
                <Badge key={placeholder} variant="secondary" className="font-mono">
                  <Check className="h-3 w-3 mr-1" />
                  {placeholder}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Next step:</strong> Go to the <strong>Design</strong> tab to create your UI content.
        </AlertDescription>
      </Alert>
    </div>
  );
}
