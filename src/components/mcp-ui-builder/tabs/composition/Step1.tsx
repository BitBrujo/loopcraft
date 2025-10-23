'use client';

import { useEffect } from 'react';
import { Target, Check, CheckSquare, FileEdit, AlertTriangle, MousePointer, Search, Workflow, Bot, Link2, ArrowRight } from 'lucide-react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { getAllPatterns } from '@/lib/composition-patterns';
import { validateStep1 } from '@/lib/composition-validation';
import type { PatternType } from './types';

// Map pattern IDs to Lucide icons
const PATTERN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'button-tool-call': MousePointer,
  'form-tool-call': FileEdit,
  'search-filter': Search,
  'multi-step': Workflow,
  'ai-helper': Bot,
  'link-tool-call': Link2,
};

export function Step1() {
  const { composition, setSelectedPattern, setCompositionStep, updateCompositionValidity } = useUIBuilderStore();
  const patterns = getAllPatterns();

  // Validate on mount and when pattern changes
  useEffect(() => {
    const validation = validateStep1(composition.selectedPattern);
    updateCompositionValidity(1, validation.valid);
  }, [composition.selectedPattern, updateCompositionValidity]);

  const handlePatternSelect = (patternId: string) => {
    setSelectedPattern(patternId as PatternType);
  };

  const handleNext = () => {
    const validation = validateStep1(composition.selectedPattern);
    if (validation.valid) {
      setCompositionStep(2);
    }
  };

  const selectedPattern = composition.selectedPattern
    ? patterns.find(p => p.id === composition.selectedPattern)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Target className="h-6 w-6" />
          Step 1: Choose Interactive Pattern
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a pattern type to build your interactive UI component
        </p>
      </div>

      {/* Pattern Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Pattern Type
        </label>
        <div className="space-y-2">
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => handlePatternSelect(pattern.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                composition.selectedPattern === pattern.id
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border hover:border-input bg-card'
              }`}
            >
              <div className="flex items-start gap-3">
                {(() => {
                  const Icon = PATTERN_ICONS[pattern.id] || Target;
                  return <Icon className="h-5 w-5 text-foreground shrink-0" />;
                })()}
                <div className="flex-1">
                  <div className="font-medium text-foreground">{pattern.name}</div>
                </div>
                {composition.selectedPattern === pattern.id && (
                  <Check className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Validation Error */}
      {!composition.isValid.step1 && composition.selectedPattern === null && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Please select a pattern type to continue</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t">
        <button
          data-slot="button"
          onClick={handleNext}
          disabled={!composition.isValid.step1}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 gap-2"
        >
          Next: Configure Element
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
