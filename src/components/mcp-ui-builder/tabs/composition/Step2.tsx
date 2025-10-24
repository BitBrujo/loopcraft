'use client';

import { useEffect, useState } from 'react';
import { Box, Check, ArrowRight } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { getPattern } from '@/lib/composition-patterns';
import { validateStep2 } from '@/lib/composition-validation';
import type { ElementConfig, FormField, ButtonStyle } from './types';

export function Step2() {
  const {
    composition,
    setElementConfig,
    setCompositionStep,
    updateCompositionValidity,
  } = useUIBuilderStore();

  // Get current pattern instance
  const currentPattern = composition.patterns[composition.currentPatternIndex];
  const pattern = currentPattern?.selectedPattern ? getPattern(currentPattern.selectedPattern) : null;

  const [config, setConfig] = useState<ElementConfig>(
    currentPattern?.elementConfig || {
      elementType: pattern?.elementType || 'button',
      id: '',
    }
  );

  // Sync with store - Only when switching between patterns, not on every store update
  useEffect(() => {
    const freshConfig = currentPattern?.elementConfig || {
      elementType: pattern?.elementType || 'button',
      id: '',
    };
    setConfig(freshConfig);
  }, [composition.currentPatternIndex]); // Only sync when pattern index changes

  // Validate and update store
  useEffect(() => {
    const validation = validateStep2(currentPattern?.selectedPattern || null, config);
    updateCompositionValidity(2, validation.valid);
    setElementConfig(config);
  }, [config, currentPattern?.selectedPattern]); // Removed setters - they're stable Zustand actions

  const handleNext = () => {
    const validation = validateStep2(currentPattern?.selectedPattern || null, config);
    if (validation.valid) {
      setCompositionStep(3);
    }
  };

  const handleBack = () => {
    setCompositionStep(1);
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
          <Box className="h-6 w-6" />
          Step 2: Configure HTML Element
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pattern: <span className="font-medium">{pattern.name}</span>
        </p>
      </div>

      {/* Element Type (auto-selected) */}
      <div className="bg-muted/50 border rounded-lg p-3">
        <div className="text-sm text-foreground">
          <span className="font-medium">Element Type:</span> {pattern.elementType} (auto-selected)
        </div>
      </div>

      {/* Configuration based on element type */}
      {pattern.elementType === 'button' && (
        <ButtonConfig config={config} setConfig={setConfig} />
      )}
      {pattern.elementType === 'form' && (
        <FormConfig config={config} setConfig={setConfig} />
      )}
      {pattern.elementType === 'input' && (
        <InputConfig config={config} setConfig={setConfig} />
      )}
      {pattern.elementType === 'link' && (
        <LinkConfig config={config} setConfig={setConfig} />
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
          disabled={!currentPattern?.isValid.step2}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 gap-2"
        >
          Next: Configure Action
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Button Configuration
function ButtonConfig({ config, setConfig }: {
  config: ElementConfig;
  setConfig: (config: ElementConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Element ID *
        </label>
        <input
          type="text"
          value={config.id}
          onChange={(e) => setConfig({ ...config, id: e.target.value })}
          placeholder="e.g., submit-btn"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        />
        <p className="text-xs text-muted-foreground mt-1">Must be unique and start with a letter</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Button Text *
        </label>
        <input
          type="text"
          value={config.buttonText || ''}
          onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
          placeholder="e.g., Execute Tool"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Button Style
        </label>
        <select
          value={config.buttonStyle || 'primary'}
          onChange={(e) => setConfig({ ...config, buttonStyle: e.target.value as ButtonStyle })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        >
          <option value="primary">Primary (Blue)</option>
          <option value="secondary">Secondary (Gray)</option>
          <option value="success">Success (Green)</option>
          <option value="danger">Danger (Red)</option>
          <option value="warning">Warning (Yellow)</option>
          <option value="info">Info (Cyan)</option>
        </select>
      </div>
    </div>
  );
}

// Form Configuration
function FormConfig({ config, setConfig }: {
  config: ElementConfig;
  setConfig: (config: ElementConfig) => void;
}) {
  const [fields, setFields] = useState<FormField[]>(config.formFields || []);

  useEffect(() => {
    setConfig({ ...config, formFields: fields });
  }, [fields]);

  const addField = () => {
    setFields([...fields, {
      name: '',
      label: '',
      type: 'text',
      required: false,
    }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(fields.map((field, i) => i === index ? { ...field, ...updates } : field));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Form ID *
        </label>
        <input
          type="text"
          value={config.id}
          onChange={(e) => setConfig({ ...config, id: e.target.value })}
          placeholder="e.g., contact-form"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">
            Form Fields *
          </label>
          <button
            onClick={addField}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            + Add Field
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Field {index + 1}</span>
                <button
                  onClick={() => removeField(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  placeholder="Field name"
                  className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-orange-500 bg-background"
                />
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="Field label"
                  className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-orange-500 bg-background"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, { type: e.target.value as FormField['type'] })}
                  className="flex-1 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-orange-500 bg-background"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="password">Password</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="select">Select</option>
                </select>

                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="rounded"
                  />
                  Required
                </label>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              No fields added yet. Click &ldquo;Add Field&rdquo; to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Input Configuration
function InputConfig({ config, setConfig }: {
  config: ElementConfig;
  setConfig: (config: ElementConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Input ID *
        </label>
        <input
          type="text"
          value={config.id}
          onChange={(e) => setConfig({ ...config, id: e.target.value })}
          placeholder="e.g., search-input"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Input Type
        </label>
        <select
          value={config.inputType || 'text'}
          onChange={(e) => setConfig({ ...config, inputType: e.target.value as ElementConfig['inputType'] })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        >
          <option value="text">Text</option>
          <option value="search">Search</option>
          <option value="number">Number</option>
          <option value="email">Email</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Placeholder *
        </label>
        <input
          type="text"
          value={config.inputPlaceholder || ''}
          onChange={(e) => setConfig({ ...config, inputPlaceholder: e.target.value })}
          placeholder="e.g., Search files..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        />
      </div>
    </div>
  );
}

// Link Configuration
function LinkConfig({ config, setConfig }: {
  config: ElementConfig;
  setConfig: (config: ElementConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Link ID *
        </label>
        <input
          type="text"
          value={config.id}
          onChange={(e) => setConfig({ ...config, id: e.target.value })}
          placeholder="e.g., action-link"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Link Text *
        </label>
        <input
          type="text"
          value={config.linkText || ''}
          onChange={(e) => setConfig({ ...config, linkText: e.target.value })}
          placeholder="e.g., Click here to continue"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Link Href *
        </label>
        <input
          type="text"
          value={config.linkHref || ''}
          onChange={(e) => setConfig({ ...config, linkHref: e.target.value })}
          placeholder="e.g., #"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background"
        />
        <p className="text-xs text-muted-foreground mt-1">Use # for action-only links</p>
      </div>
    </div>
  );
}
