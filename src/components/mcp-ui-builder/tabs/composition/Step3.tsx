'use client';

import { useEffect, useState } from 'react';
import { Zap, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { getPattern } from '@/lib/composition-patterns';
import { validateStep3 } from '@/lib/composition-validation';
import type { ActionConfig, ToolParameter, NotificationVariant, ElementConfig } from './types';
import type { ToolSchema } from '@/types/ui-builder';

export function Step3() {
  const {
    composition,
    targetServerName,
    availableTools,
    setActionConfig,
    setCompositionStep,
    updateCompositionValidity,
  } = useUIBuilderStore();

  const pattern = composition.selectedPattern ? getPattern(composition.selectedPattern) : null;
  const [config, setConfig] = useState<ActionConfig>(
    composition.actionConfig || {
      actionType: pattern?.actionType || 'tool',
    }
  );

  // Sync with store
  useEffect(() => {
    if (composition.actionConfig) {
      setConfig(composition.actionConfig);
    }
  }, [composition.actionConfig]);

  // Validate
  useEffect(() => {
    const validation = validateStep3(composition.selectedPattern, config);
    updateCompositionValidity(3, validation.valid);
    setActionConfig(config);
  }, [config, composition.selectedPattern, setActionConfig, updateCompositionValidity]);

  const handleNext = () => {
    const validation = validateStep3(composition.selectedPattern, config);
    if (validation.valid) {
      setCompositionStep(4);
    }
  };

  const handleBack = () => {
    setCompositionStep(2);
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
          <Zap className="h-6 w-6" />
          Step 3: Configure Action
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pattern: <span className="font-medium">{pattern.name}</span>
          {composition.elementConfig && (
            <> • Trigger: <span className="font-medium">{composition.elementConfig.elementType} #{composition.elementConfig.id}</span></>
          )}
        </p>
      </div>

      {/* Action Type (auto-selected) */}
      <div className="bg-muted/50 border rounded-lg p-3">
        <div className="text-sm text-foreground">
          <span className="font-medium">Action Type:</span> {pattern.actionType} (auto-selected)
        </div>
      </div>

      {/* Configuration based on action type */}
      {pattern.actionType === 'tool' && (
        <ToolActionConfig
          config={config}
          setConfig={setConfig}
          targetServerName={targetServerName}
          availableTools={availableTools}
          elementConfig={composition.elementConfig}
        />
      )}
      {pattern.actionType === 'prompt' && (
        <PromptActionConfig config={config} setConfig={setConfig} />
      )}
      {pattern.actionType === 'link' && (
        <LinkActionConfig config={config} setConfig={setConfig} />
      )}
      {pattern.actionType === 'intent' && (
        <IntentActionConfig config={config} setConfig={setConfig} />
      )}
      {pattern.actionType === 'notify' && (
        <NotifyActionConfig config={config} setConfig={setConfig} />
      )}

      {/* Validation Status */}
      {composition.isValid.step3 && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span>Required parameters configured</span>
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
        <button
          data-slot="button"
          onClick={handleNext}
          disabled={!composition.isValid.step3}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 gap-2"
        >
          Next: Configure Handler
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Tool Action Configuration
function ToolActionConfig({ config, setConfig, targetServerName, availableTools, elementConfig }: {
  config: ActionConfig;
  setConfig: (config: ActionConfig) => void;
  targetServerName: string | null;
  availableTools: ToolSchema[];
  elementConfig: ElementConfig | null;
}) {
  const [selectedTool, setSelectedTool] = useState<ToolSchema | null>(null);

  useEffect(() => {
    if (config.toolName) {
      const tool = availableTools.find((t: ToolSchema) => t.name === config.toolName);
      setSelectedTool(tool || null);

      // Initialize parameters from tool schema
      if (tool && tool.inputSchema?.properties) {
        const params: ToolParameter[] = Object.entries(tool.inputSchema.properties).map(([name, schema]: [string, { type?: string; description?: string }]) => {
          const existingParam = config.toolParameters?.find(p => p.name === name);
          return existingParam || {
            name,
            type: schema.type || 'string',
            required: tool.inputSchema?.required?.includes(name) || false,
            description: schema.description,
            valueSource: 'static',
            staticValue: '',
          };
        });
        setConfig({ ...config, toolParameters: params });
      }
    }
  }, [config.toolName, availableTools]);

  const handleToolSelect = (toolName: string) => {
    setConfig({ ...config, toolName });
  };

  const updateParameter = (index: number, updates: Partial<ToolParameter>) => {
    const params = config.toolParameters || [];
    const updated = params.map((p, i) => i === index ? { ...p, ...updates } : p);
    setConfig({ ...config, toolParameters: updated });
  };

  if (!targetServerName || availableTools.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>No MCP server selected or no tools available. Please select a target server in the Configure tab first.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Select Tool *
        </label>
        <select
          value={config.toolName || ''}
          onChange={(e) => handleToolSelect(e.target.value)}
          className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Select a tool...</option>
          {availableTools.map(tool => (
            <option key={tool.name} value={tool.name}>
              {tool.name}
            </option>
          ))}
        </select>
        {selectedTool && (
          <p className="text-xs text-muted-foreground mt-1">{selectedTool.description}</p>
        )}
      </div>

      {selectedTool && config.toolParameters && config.toolParameters.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tool Parameters
          </label>
          <div className="space-y-3">
            {config.toolParameters.map((param, index) => (
              <div key={param.name} className="border border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {param.name}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{param.type}</span>
                </div>

                {param.description && (
                  <p className="text-xs text-muted-foreground">{param.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={param.valueSource === 'static'}
                        onChange={() => updateParameter(index, { valueSource: 'static', formFieldName: undefined })}
                        className="text-orange-500"
                      />
                      <span className="text-sm">Static Value</span>
                    </label>

                    {elementConfig?.elementType === 'form' && (
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={param.valueSource === 'formField'}
                          onChange={() => updateParameter(index, { valueSource: 'formField', staticValue: undefined })}
                          className="text-orange-500"
                        />
                        <span className="text-sm">Form Field</span>
                      </label>
                    )}
                  </div>

                  {param.valueSource === 'static' && (
                    <input
                      type={param.type === 'number' ? 'number' : 'text'}
                      value={param.staticValue?.toString() || ''}
                      onChange={(e) => updateParameter(index, {
                        staticValue: param.type === 'number' ? parseFloat(e.target.value) : e.target.value
                      })}
                      placeholder={`Enter ${param.name}`}
                      className="w-full px-3 py-2 text-sm border border rounded focus:ring-1 focus:ring-orange-500"
                    />
                  )}

                  {param.valueSource === 'formField' && elementConfig?.formFields && (
                    <select
                      value={param.formFieldName || ''}
                      onChange={(e) => updateParameter(index, { formFieldName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border rounded focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="">Select form field...</option>
                      {elementConfig.formFields.map((field: { name: string; label: string }) => (
                        <option key={field.name} value={field.name}>
                          {field.label} ({field.name})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Prompt Action Configuration
function PromptActionConfig({ config, setConfig }: {
  config: ActionConfig;
  setConfig: (config: ActionConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Prompt Text *
        </label>
        <textarea
          value={config.promptText || ''}
          onChange={(e) => setConfig({ ...config, promptText: e.target.value })}
          placeholder="e.g., Can you explain what this data means?"
          rows={4}
          className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <p className="text-xs text-muted-foreground mt-1">This text will be sent to the AI assistant</p>
      </div>
    </div>
  );
}

// Link Action Configuration
function LinkActionConfig({ config, setConfig }: {
  config: ActionConfig;
  setConfig: (config: ActionConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Link URL *
        </label>
        <input
          type="url"
          value={config.linkUrl || ''}
          onChange={(e) => setConfig({ ...config, linkUrl: e.target.value })}
          placeholder="https://example.com"
          className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Link Target
        </label>
        <select
          value={config.linkTarget || '_blank'}
          onChange={(e) => setConfig({ ...config, linkTarget: e.target.value as '_blank' | '_self' })}
          className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="_blank">New Tab (_blank)</option>
          <option value="_self">Same Tab (_self)</option>
        </select>
      </div>
    </div>
  );
}

// Intent Action Configuration
function IntentActionConfig({ config, setConfig }: {
  config: ActionConfig;
  setConfig: (config: ActionConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Intent Name *
        </label>
        <input
          type="text"
          value={config.intentName || ''}
          onChange={(e) => setConfig({ ...config, intentName: e.target.value })}
          placeholder="e.g., navigate:settings"
          className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <p className="text-xs text-muted-foreground mt-1">Common intents: navigate:*, open:*, close:*</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Intent Data (JSON)
        </label>
        <textarea
          value={JSON.stringify(config.intentData || {}, null, 2)}
          onChange={(e) => {
            try {
              const data = JSON.parse(e.target.value) as Record<string, unknown>;
              setConfig({ ...config, intentData: data });
            } catch {
              // Invalid JSON, ignore
            }
          }}
          placeholder='{"page": "settings"}'
          rows={4}
          className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
        />
      </div>
    </div>
  );
}

// Notify Action Configuration
function NotifyActionConfig({ config, setConfig }: {
  config: ActionConfig;
  setConfig: (config: ActionConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Notification Message *
        </label>
        <input
          type="text"
          value={config.notificationMessage || ''}
          onChange={(e) => setConfig({ ...config, notificationMessage: e.target.value })}
          placeholder="e.g., Operation completed successfully!"
          className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Notification Variant
        </label>
        <select
          value={config.notificationVariant || 'success'}
          onChange={(e) => setConfig({ ...config, notificationVariant: e.target.value as NotificationVariant })}
          className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="success">Success (Green)</option>
          <option value="error">Error (Red)</option>
          <option value="warning">Warning (Yellow)</option>
          <option value="info">Info (Blue)</option>
        </select>
      </div>
    </div>
  );
}
