'use client';

import { useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { getPattern } from '@/lib/composition-patterns';

export function ConfigPanel() {
  const { composition, currentResource, updateResource } = useUIBuilderStore();
  const pattern = composition.selectedPattern ? getPattern(composition.selectedPattern) : null;

  const [metadataExpanded, setMetadataExpanded] = useState(true);
  const [uiMetadataExpanded, setUiMetadataExpanded] = useState(true);
  const [rendererExpanded, setRendererExpanded] = useState(false);

  // If no pattern selected, show placeholder
  if (!pattern) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">⚙️</div>
          <div className="font-medium">Configuration Options</div>
          <div className="text-sm mt-1">
            Select a pattern in the left panel to configure additional options.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">⚙️</span>
        <h2 className="text-xl font-semibold text-gray-900">Configuration Options</h2>
      </div>

      {/* Resource Metadata */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <button
          onClick={() => setMetadataExpanded(!metadataExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-gray-900 flex items-center gap-2">
            <span>📋</span>
            Resource Metadata
          </span>
          <span className="text-gray-400">{metadataExpanded ? '−' : '+'}</span>
        </button>

        {metadataExpanded && (
          <div className="p-4 pt-0 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource URI
              </label>
              <input
                type="text"
                value={currentResource?.uri || 'ui://server/interactive-pattern'}
                onChange={(e) => updateResource({ uri: e.target.value })}
                placeholder="ui://server/resource-name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-filled based on pattern name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={currentResource?.metadata?.title || pattern.name}
                onChange={(e) => updateResource({
                  metadata: { ...currentResource?.metadata, title: e.target.value }
                })}
                placeholder="Resource title"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={currentResource?.metadata?.description || pattern.description}
                onChange={(e) => updateResource({
                  metadata: { ...currentResource?.metadata, description: e.target.value }
                })}
                placeholder="Resource description"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* UI Metadata */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <button
          onClick={() => setUiMetadataExpanded(!uiMetadataExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-gray-900 flex items-center gap-2">
            <span>🎨</span>
            UI Metadata
          </span>
          <span className="text-gray-400">{uiMetadataExpanded ? '−' : '+'}</span>
        </button>

        {uiMetadataExpanded && (
          <div className="p-4 pt-0 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Frame Size
              </label>
              <select
                value={getFrameSizePreset()}
                onChange={(e) => handleFrameSizeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="small">Small (600×400)</option>
                <option value="medium">Medium (800×600)</option>
                <option value="large">Large (1000×800)</option>
                <option value="full">Full Width (100%×600)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto-Resize
              </label>
              <select
                value={getAutoResizeValue()}
                onChange={(e) => handleAutoResizeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="disabled">Disabled</option>
                <option value="both">Both Dimensions</option>
                <option value="width">Width Only</option>
                <option value="height">Height Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Renderer Options */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <button
          onClick={() => setRendererExpanded(!rendererExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-gray-900 flex items-center gap-2">
            <span>🔧</span>
            Renderer Options
          </span>
          <span className="text-gray-400">{rendererExpanded ? '−' : '+'}</span>
        </button>

        {rendererExpanded && (
          <div className="p-4 pt-0 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sandbox Permissions
              </label>
              <select
                value={getSandboxPermissions()}
                onChange={(e) => handleSandboxChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="standard">Standard (Recommended)</option>
                <option value="strict">Strict (No Scripts)</option>
                <option value="permissive">Permissive (All Features)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Iframe Title (Accessibility)
              </label>
              <input
                type="text"
                value={getIframeTitle()}
                onChange={(e) => handleIframeTitleChange(e.target.value)}
                placeholder="Interactive UI"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Height
              </label>
              <input
                type="text"
                value={getMinHeight()}
                onChange={(e) => handleMinHeightChange(e.target.value)}
                placeholder="400px"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Pattern Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-xl">{pattern.icon}</span>
          <div>
            <div className="font-medium text-blue-900">{pattern.name}</div>
            <div className="text-sm text-blue-800 mt-1">{pattern.description}</div>
          </div>
        </div>
      </div>
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
