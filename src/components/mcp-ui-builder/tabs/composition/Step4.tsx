'use client';

import { useEffect, useState } from 'react';
import { Package, Check, Link2, ArrowRight, Plus } from 'lucide-react';
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
    addNewPattern,
  } = useUIBuilderStore();

  // Get current pattern instance
  const currentPattern = composition.patterns[composition.currentPatternIndex];
  const pattern = currentPattern?.selectedPattern ? getPattern(currentPattern.selectedPattern) : null;

  const [config, setConfig] = useState<HandlerConfig>(
    currentPattern?.handlerConfig || {
      handlerType: 'response',
      showLoadingIndicator: true,
      handleErrors: true,
      supportAllContentTypes: true,
    }
  );

  // Sync with store
  useEffect(() => {
    if (currentPattern?.handlerConfig) {
      setConfig(currentPattern.handlerConfig);
    }
  }, [currentPattern?.handlerConfig]);

  // Validate
  useEffect(() => {
    const validation = validateStep4(currentPattern?.selectedPattern || null, config);
    updateCompositionValidity(4, validation.valid);
    setHandlerConfig(config);
  }, [config, currentPattern?.selectedPattern, setHandlerConfig, updateCompositionValidity]);

  const handleBack = () => {
    setCompositionStep(3);
  };

  const handleGenerateCode = () => {
    if (!currentPattern?.selectedPattern || !currentPattern?.elementConfig || !currentPattern?.actionConfig) {
      return;
    }

    const code = generatePatternCode(
      currentPattern.selectedPattern,
      currentPattern.elementConfig,
      currentPattern.actionConfig,
      config
    );

    setGeneratedCode(code);
    // Switch to Code tab in CompositionTab
    // This will be handled by parent component
  };

  const handleAddPattern = () => {
    addNewPattern();
  };

  if (!pattern) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pattern selected. Please go back to Step 1.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6" />
          Step 4: Configure Response Handler
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pattern: <span className="font-medium">{pattern.name}</span>
          {currentPattern?.actionConfig && (
            <> • Tool: <span className="font-medium">{currentPattern.actionConfig.toolName || currentPattern.actionConfig.actionType}</span></>
          )}
        </p>
      </div>

      {/* Handler Type Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Handler Type *
        </label>
        <div className="space-y-2">
          {pattern.handlerTypes.map((type) => (
            <button
              key={type}
              onClick={() => setConfig({ ...config, handlerType: type })}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                config.handlerType === type
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border hover:border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">
                    {type === 'response' && 'Tool Response Handler'}
                    {type === 'notification' && 'Notification Only'}
                    {type === 'both' && 'Both (Response + Notification)'}
                    {type === 'none' && 'None (Fire and Forget)'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
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

      {/* Response Handling Info */}
      {(config.handlerType === 'response' || config.handlerType === 'both') && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            ℹ️ Tool responses will be logged to the console and shown via notifications. No container needed.
          </p>
        </div>
      )}

      {/* Notification Configuration */}
      {(config.handlerType === 'notification' || config.handlerType === 'both') && (
        <div className="border border rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-foreground">Success Notification</h3>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Message *
            </label>
            <input
              type="text"
              value={config.successMessage || ''}
              onChange={(e) => setConfig({ ...config, successMessage: e.target.value })}
              placeholder="e.g., Operation completed successfully!"
              className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Variant
            </label>
            <select
              value={config.successVariant || 'success'}
              onChange={(e) => setConfig({ ...config, successVariant: e.target.value as NotificationVariant })}
              className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="success">Success (Green)</option>
              <option value="info">Info (Blue)</option>
            </select>
          </div>
        </div>
      )}

      {/* Multi-Step Workflow (Tool Chaining) */}
      {pattern.id === 'multi-step' && (
        <div className="border border-orange-200 rounded-lg p-4 space-y-4 bg-orange-50 dark:bg-orange-950/20">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-orange-900 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Tool Chaining
            </h3>
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
            <div className="bg-card border border-orange-300 rounded p-3">
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
      {currentPattern?.isValid.step4 && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span>Handler configuration complete</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={handleBack}
          className="px-6 py-2 rounded-lg font-medium border hover:bg-muted/50 transition-colors"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          {/* Add Pattern Button */}
          <button
            data-slot="button"
            onClick={handleAddPattern}
            disabled={!currentPattern?.isValid.step4}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-primary text-primary hover:bg-primary/10 h-9 px-4 py-2 has-[>svg]:px-3 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another Pattern
          </button>
          {/* Generate Code Button */}
          <button
            data-slot="button"
            onClick={handleGenerateCode}
            disabled={!currentPattern?.isValid.step4}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 gap-2"
          >
            Generate Pattern Code
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
