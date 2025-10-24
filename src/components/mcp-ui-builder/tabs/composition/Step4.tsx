'use client';

import { useEffect, useState } from 'react';
import { Package, Check, Link2, ArrowRight, Plus, CheckCircle2, Code2, Upload } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { getPattern } from '@/lib/composition-patterns';
import { validateStep4 } from '@/lib/composition-validation';
import { generatePatternCode } from '@/lib/composition-code-generation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { HandlerConfig, HandlerType, NotificationVariant } from './types';

export function Step4() {
  const {
    composition,
    setHandlerConfig,
    setCompositionStep,
    updateCompositionValidity,
    setGeneratedCode,
    setActiveTab,
    setActiveDesignTab,
    addNewPattern,
  } = useUIBuilderStore();

  // Get current pattern instance
  const currentPattern = composition.patterns[composition.currentPatternIndex];
  const pattern = currentPattern?.selectedPattern ? getPattern(currentPattern.selectedPattern) : null;

  const [config, setConfig] = useState<HandlerConfig>(
    currentPattern?.handlerConfig || {
      handlerType: 'response',
      responseDestination: 'ui', // Default: send to UI only
      showLoadingIndicator: true,
      handleErrors: true,
      supportAllContentTypes: true,
    }
  );

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Sync with store - Only when switching between patterns, not on every store update
  useEffect(() => {
    const freshConfig = currentPattern?.handlerConfig || {
      handlerType: 'response',
      responseDestination: 'ui', // Default: send to UI only
      showLoadingIndicator: true,
      handleErrors: true,
      supportAllContentTypes: true,
    };
    setConfig(freshConfig);
  }, [composition.currentPatternIndex]); // Only sync when pattern index changes

  // Validate and update store
  useEffect(() => {
    const validation = validateStep4(currentPattern?.selectedPattern || null, config);
    updateCompositionValidity(4, validation.valid);
    setHandlerConfig(config);
  }, [config, currentPattern?.selectedPattern]); // Removed setters - they're stable Zustand actions

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
    setShowSuccessDialog(true);
  };

  const handleAddPattern = () => {
    addNewPattern();
  };

  // Check if code has been generated
  const hasGeneratedCode = composition.generatedCode !== null;

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

      {/* Response Routing - Only for tool actions with non-none handlers */}
      {currentPattern?.actionConfig?.actionType === 'tool' && config.handlerType !== 'none' && (
        <div className="border border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-medium text-foreground">Response Routing</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Control where the tool response is sent
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setConfig({ ...config, responseDestination: 'ui' })}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                config.responseDestination === 'ui'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border hover:border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">UI Only</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Display result in interface only (don&apos;t send to agent)
                  </div>
                </div>
                {config.responseDestination === 'ui' && (
                  <Check className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </button>

            <button
              onClick={() => setConfig({ ...config, responseDestination: 'agent' })}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                config.responseDestination === 'agent'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border hover:border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">Agent Only</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Send to AI assistant for processing (don&apos;t show in UI)
                  </div>
                </div>
                {config.responseDestination === 'agent' && (
                  <Check className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </button>

            <button
              onClick={() => setConfig({ ...config, responseDestination: 'both' })}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                config.responseDestination === 'both'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border hover:border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">Both</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Show in UI and send to agent
                  </div>
                </div>
                {config.responseDestination === 'both' && (
                  <Check className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </button>

            <button
              onClick={() => setConfig({ ...config, responseDestination: 'none' })}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                config.responseDestination === 'none'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border hover:border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">None</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Fire and forget (no routing)
                  </div>
                </div>
                {config.responseDestination === 'none' && (
                  <Check className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Tool Chaining (Available for all tool actions with response handlers) */}
      {currentPattern?.actionConfig?.actionType === 'tool' &&
       (config.handlerType === 'response' || config.handlerType === 'both') && (
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
                Tool chaining allows you to create multi-step workflows where the output of one tool feeds into the next.
              </p>
              <p className="text-xs text-orange-700">
                After generating this pattern, use the &quot;Chain Another Tool&quot; button to add the next step in your workflow.
              </p>
            </div>
          )}
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
            {hasGeneratedCode ? 'Regenerate Code' : 'Generate Pattern Code'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-xl">Code Generated Successfully!</DialogTitle>
            </div>
            <DialogDescription>
              Your pattern code has been generated. What would you like to do next?
            </DialogDescription>
          </DialogHeader>

          {/* Chain Enabled Indicator */}
          {config.enableChaining && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <Link2 className="h-4 w-4" />
                <span className="text-sm font-medium">Tool Chaining Enabled</span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                The next tool you create will receive the result from this tool.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => {
                setShowSuccessDialog(false);
                addNewPattern({ isChained: false });
              }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 has-[>svg]:px-3 gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Another Element
            </button>

            <button
              onClick={() => {
                setShowSuccessDialog(false);
                addNewPattern({ isChained: true });
              }}
              disabled={!config.enableChaining}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-primary text-primary hover:bg-primary/10 h-10 px-4 py-2 has-[>svg]:px-3 gap-2"
            >
              <Link2 className="h-4 w-4" />
              Chain Another Tool
            </button>

            <button
              onClick={() => {
                setShowSuccessDialog(false);
                setActiveDesignTab('code');
              }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 has-[>svg]:px-3 gap-2"
            >
              <Code2 className="h-4 w-4" />
              View Code
            </button>

            <button
              onClick={() => {
                setShowSuccessDialog(false);
                setActiveTab('export');
              }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 has-[>svg]:px-3 gap-2"
            >
              <Upload className="h-4 w-4" />
              Go to Export Tab
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
