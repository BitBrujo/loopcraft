'use client';

import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { getPattern } from '@/lib/composition-patterns';
import { Settings, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ConfigPanel() {
  const { composition, currentResource, updateResource } = useUIBuilderStore();
  const pattern = composition.selectedPattern ? getPattern(composition.selectedPattern) : null;

  // If no pattern selected, show placeholder
  if (!pattern) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <Settings className="h-10 w-10 mx-auto mb-2" />
          <div className="font-medium">Configuration Options</div>
          <div className="text-sm mt-1">
            Select a pattern in the left panel to configure additional options.
          </div>
        </div>
      </div>
    );
  }

  // Check which steps are complete
  const isStep1Complete = currentResource?.metadata?.title && currentResource.metadata.title.length > 0;
  const isStep2Complete = true; // UI metadata is optional
  const isStep3Complete = true; // Renderer options are optional

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4 md:space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Configuration Options</h2>
      </div>

      {/* Step 1: Resource Metadata */}
      <Card className={isStep1Complete ? 'border-orange-500/50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 border-2 border-primary text-primary bg-transparent">
                1
              </span>
              <CardTitle className="text-base">Resource Metadata</CardTitle>
            </div>
            {isStep1Complete && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>
          <CardDescription>
            Basic information about your UI resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={currentResource?.metadata?.title || pattern.name}
              onChange={(e) => updateResource({
                metadata: { ...currentResource?.metadata, title: e.target.value }
              })}
              placeholder="Resource title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={currentResource?.metadata?.description || pattern.description}
              onChange={(e) => updateResource({
                metadata: { ...currentResource?.metadata, description: e.target.value }
              })}
              placeholder="Resource description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: UI Metadata */}
      <Card className={isStep2Complete ? 'border-orange-500/50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 border-2 border-primary text-primary bg-transparent">
                2
              </span>
              <CardTitle className="text-base">UI Metadata</CardTitle>
            </div>
            {isStep2Complete && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>
          <CardDescription>
            Display and sizing preferences for the UI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frameSize" className="text-sm font-medium">
              Preferred Frame Size
            </Label>
            <Select value={getFrameSizePreset()} onValueChange={handleFrameSizeChange}>
              <SelectTrigger id="frameSize">
                <SelectValue placeholder="Select frame size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (600×400)</SelectItem>
                <SelectItem value="medium">Medium (800×600)</SelectItem>
                <SelectItem value="large">Large (1000×800)</SelectItem>
                <SelectItem value="full">Full Width (100%×600)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="autoResize" className="text-sm font-medium">
              Auto-Resize
            </Label>
            <Select value={getAutoResizeValue()} onValueChange={handleAutoResizeChange}>
              <SelectTrigger id="autoResize">
                <SelectValue placeholder="Select auto-resize behavior" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="both">Both Dimensions</SelectItem>
                <SelectItem value="width">Width Only</SelectItem>
                <SelectItem value="height">Height Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Renderer Options */}
      <Card className={isStep3Complete ? 'border-orange-500/50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 border-2 border-primary text-primary bg-transparent">
                3
              </span>
              <CardTitle className="text-base">Renderer Options</CardTitle>
            </div>
            {isStep3Complete && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>
          <CardDescription>
            Configure iframe rendering behavior and security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sandboxPermissions" className="text-sm font-medium">
              Sandbox Permissions
            </Label>
            <Select value={getSandboxPermissions()} onValueChange={handleSandboxChange}>
              <SelectTrigger id="sandboxPermissions">
                <SelectValue placeholder="Select security level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (Recommended)</SelectItem>
                <SelectItem value="strict">Strict (No Scripts)</SelectItem>
                <SelectItem value="permissive">Permissive (All Features)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iframeTitle" className="text-sm font-medium">
              Iframe Title (Accessibility)
            </Label>
            <Input
              id="iframeTitle"
              value={getIframeTitle()}
              onChange={(e) => handleIframeTitleChange(e.target.value)}
              placeholder="Interactive UI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minHeight" className="text-sm font-medium">
              Minimum Height
            </Label>
            <Input
              id="minHeight"
              value={getMinHeight()}
              onChange={(e) => handleMinHeightChange(e.target.value)}
              placeholder="400px"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pattern Info */}
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <div className="flex items-start gap-2">
          <span className="text-2xl">{pattern.icon}</span>
          <div className="flex-1">
            <div className="font-medium text-blue-900 dark:text-blue-100">{pattern.name}</div>
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-300 mt-1">
              {pattern.description}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );

  // Helper functions
  function getFrameSizePreset(): string {
    const size = currentResource?.uiMetadata?.['preferred-frame-size'];
    if (!size) return 'medium';
    const [width, height] = size as [string, string];
    if (width === '600px' && height === '400px') return 'small';
    if (width === '800px' && height === '600px') return 'medium';
    if (width === '1000px' && height === '800px') return 'large';
    if (width === '100%' && height === '600px') return 'full';
    return 'custom';
  }

  function handleFrameSizeChange(preset: string) {
    const sizes: Record<string, [string, string]> = {
      small: ['600px', '400px'],
      medium: ['800px', '600px'],
      large: ['1000px', '800px'],
      full: ['100%', '600px'],
    };
    if (sizes[preset]) {
      updateResource({
        uiMetadata: {
          ...currentResource?.uiMetadata,
          'preferred-frame-size': sizes[preset],
        },
      });
    }
  }

  function getAutoResizeValue(): string {
    const autoResize = currentResource?.uiMetadata?.['auto-resize-iframe'];
    if (autoResize === true) return 'both';
    if (typeof autoResize === 'object') {
      if (autoResize.width && autoResize.height) return 'both';
      if (autoResize.width) return 'width';
      if (autoResize.height) return 'height';
    }
    return 'disabled';
  }

  function handleAutoResizeChange(value: string) {
    let autoResize: boolean | { width?: boolean; height?: boolean } = false;
    if (value === 'both') autoResize = true;
    else if (value === 'width') autoResize = { width: true };
    else if (value === 'height') autoResize = { height: true };

    updateResource({
      uiMetadata: {
        ...currentResource?.uiMetadata,
        'auto-resize-iframe': autoResize,
      },
    });
  }

  function getSandboxPermissions(): string {
    const permissions = currentResource?.uiMetadata?.['sandbox-permissions'] as string | undefined;
    if (!permissions) return 'standard';
    if (permissions.includes('allow-same-origin') && permissions.includes('allow-scripts')) return 'standard';
    if (!permissions.includes('allow-scripts')) return 'strict';
    return 'permissive';
  }

  function handleSandboxChange(preset: string) {
    const presets: Record<string, string> = {
      standard: 'allow-forms allow-scripts allow-same-origin',
      strict: 'allow-forms',
      permissive: 'allow-forms allow-scripts allow-same-origin allow-popups allow-downloads',
    };
    updateResource({
      uiMetadata: {
        ...currentResource?.uiMetadata,
        'sandbox-permissions': presets[preset],
      },
    });
  }

  function getIframeTitle(): string {
    return (currentResource?.uiMetadata?.['iframe-title'] as string) || '';
  }

  function handleIframeTitleChange(value: string) {
    updateResource({
      uiMetadata: {
        ...currentResource?.uiMetadata,
        'iframe-title': value,
      },
    });
  }

  function getMinHeight(): string {
    const style = currentResource?.uiMetadata?.['container-style'] as { minHeight?: string } | undefined;
    return style?.minHeight || '';
  }

  function handleMinHeightChange(value: string) {
    const currentStyle = (currentResource?.uiMetadata?.['container-style'] || {}) as Record<string, unknown>;
    updateResource({
      uiMetadata: {
        ...currentResource?.uiMetadata,
        'container-style': {
          ...currentStyle,
          minHeight: value,
        },
      },
    });
  }
}
