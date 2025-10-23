'use client';

import { useEffect, useState } from 'react';
import { Package, Check } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { getPattern } from '@/lib/composition-patterns';
import { validateStep4 } from '@/lib/composition-validation';
import { generatePatternCode } from '@/lib/composition-code-generation';
import type { HandlerConfig, HandlerType, NotificationVariant } from './types';

export function Step4() {
  const {
    composition,
    setHandlerConfig,
    setCompositionStep,
    updateCompositionValidity,
    setGeneratedCode,
    setActiveTab,
  } = useUIBuilderStore();

  const pattern = composition.selectedPattern ? getPattern(composition.selectedPattern) : null;
  const [config, setConfig] = useState<HandlerConfig>(
    composition.handlerConfig || {
      handlerType: 'response',
      showLoadingIndicator: true,
      handleErrors: true,
      supportAllContentTypes: true,
    }
  );

  // Sync with store
  useEffect(() => {
    if (composition.handlerConfig) {
      setConfig(composition.handlerConfig);
    }
  }, [composition.handlerConfig]);

  // Validate
  useEffect(() => {
    const validation = validateStep4(composition.selectedPattern, config);
    updateCompositionValidity(4, validation.valid);
    setHandlerConfig(config);
  }, [config, composition.selectedPattern, setHandlerConfig, updateCompositionValidity]);

  const handleBack = () => {
    setCompositionStep(3);
  };

  const handleGenerateCode = () => {
    if (!composition.selectedPattern || !composition.elementConfig || !composition.actionConfig) {
      return;
    }

    const code = generatePatternCode(
      composition.selectedPattern,
      composition.elementConfig,
      composition.actionConfig,
      config
    );

    setGeneratedCode(code);
    // Switch to Code tab in CompositionTab
    // This will be handled by parent component
  };

  if (!pattern) {
    return (
      <div className="text-center py-8 text-gray-500">
        No pattern selected. Please go back to Step 1.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Step 4: Configure Response Handler
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Pattern: <span className="font-medium">{pattern.name}</span>
          {composition.actionConfig && (
            <> • Tool: <span className="font-medium">{composition.actionConfig.toolName || composition.actionConfig.actionType}</span></>
          )}
        </p>
      </div>

      {/* Handler Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Handler Type *
        </label>
        <div className="space-y-2">
          {pattern.handlerTypes.map((type) => (
            <button
              key={type}
              onClick={() => setConfig({ ...config, handlerType: type })}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                config.handlerType === type
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {type === 'response' && 'Tool Response Handler'}
                    {type === 'notification' && 'Notification Only'}
                    {type === 'both' && 'Both (Response + Notification)'}
                    {type === 'none' && 'None (Fire and Forget)'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {type === 'response' && 'Display result in a container'}
                    {type === 'notification' && 'Show toast message only'}
                    {type === 'both' && 'Display result and show notification'}
                    {type === 'none' && 'No response handling'}
                  </div>
                </div>
                {config.handlerType === type && (
                  <Check className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Response Display Configuration */}
      {(config.handlerType === 'response' || config.handlerType === 'both') && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Response Display</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Container ID *
            </label>
            <input
              type="text"
              value={config.responseContainerId || ''}
              onChange={(e) => setConfig({ ...config, responseContainerId: e.target.value })}
              placeholder="e.g., result-container"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">ID of the container where results will be displayed</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showLoadingIndicator ?? true}
                onChange={(e) => setConfig({ ...config, showLoadingIndicator: e.target.checked })}
                className="rounded text-orange-500"
              />
              <span className="text-sm text-gray-700">Show loading indicator</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.handleErrors ?? true}
                onChange={(e) => setConfig({ ...config, handleErrors: e.target.checked })}
                className="rounded text-orange-500"
              />
              <span className="text-sm text-gray-700">Handle errors gracefully</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.supportAllContentTypes ?? true}
                onChange={(e) => setConfig({ ...config, supportAllContentTypes: e.target.checked })}
                className="rounded text-orange-500"
              />
              <span className="text-sm text-gray-700">Support all MCP content types</span>
            </label>
          </div>
        </div>
      )}

      {/* Notification Configuration */}
      {(config.handlerType === 'notification' || config.handlerType === 'both') && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Success Notification</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <input
              type="text"
              value={config.successMessage || ''}
              onChange={(e) => setConfig({ ...config, successMessage: e.target.value })}
              placeholder="e.g., Operation completed successfully!"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant
            </label>
            <select
              value={config.successVariant || 'success'}
              onChange={(e) => setConfig({ ...config, successVariant: e.target.value as NotificationVariant })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="success">Success (Green)</option>
              <option value="info">Info (Blue)</option>
            </select>
          </div>
        </div>
      )}

      {/* Multi-Step Workflow (Tool Chaining) */}
      {pattern.id === 'multi-step' && (
        <div className="border border-orange-200 rounded-lg p-4 space-y-4 bg-orange-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-orange-900">🔗 Tool Chaining</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.enableChaining ?? false}
                onChange={(e) => setConfig({ ...config, enableChaining: e.target.checked })}
                className="rounded text-orange-500"
              />
              <span className="text-sm text-orange-900 font-medium">Enable Chaining</span>
            </label>
          </div>

          {config.enableChaining && (
            <div className="bg-white border border-orange-300 rounded p-3">
              <p className="text-sm text-orange-800 mb-2">
                Tool chaining allows the output of this tool to feed into the next tool automatically.
              </p>
              <p className="text-xs text-orange-700">
                Configure the next tool in the chain after generating the code.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Validation Status */}
      {composition.isValid.step4 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span>Handler configuration complete</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={handleBack}
          className="px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleGenerateCode}
          disabled={!composition.isValid.step4}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            composition.isValid.step4
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Generate Pattern Code →
        </button>
      </div>
    </div>
  );
}
