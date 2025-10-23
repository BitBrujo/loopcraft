'use client';

import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Target, Box, Zap, Package, Check, Trash2, Edit2, Plus } from 'lucide-react';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import { getPattern } from '@/lib/composition-patterns';

export function InsertPanel() {
  const { composition, setCompositionStep, setCurrentPatternIndex, removePattern } = useUIBuilderStore();

  const steps = [
    { number: 1, label: 'Pattern', Icon: Target },
    { number: 2, label: 'Element', Icon: Box },
    { number: 3, label: 'Action', Icon: Zap },
    { number: 4, label: 'Handler', Icon: Package },
  ];

  const getStepStatus = (stepNumber: number): 'done' | 'current' | 'locked' => {
    if (stepNumber < composition.currentStep) {
      // Check if previous step is valid
      const currentPattern = composition.patterns[composition.currentPatternIndex];
      const isValid = currentPattern?.isValid[`step${stepNumber}` as keyof typeof currentPattern.isValid];
      return isValid ? 'done' : 'current';
    }
    if (stepNumber === composition.currentStep) return 'current';
    return 'locked';
  };

  const handleStepClick = (stepNumber: number) => {
    // Only allow going back to completed steps
    if (stepNumber < composition.currentStep) {
      setCompositionStep(stepNumber as 1 | 2 | 3 | 4);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Pattern List Section */}
      {composition.patterns.length > 1 && (
        <div className="border-b bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Configured Patterns ({composition.patterns.length})</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {composition.patterns.map((pattern, index) => {
              const isActive = index === composition.currentPatternIndex;
              const patternDef = pattern.selectedPattern ? getPattern(pattern.selectedPattern) : null;
              const isComplete = pattern.isValid.step1 && pattern.isValid.step2 && pattern.isValid.step3 && pattern.isValid.step4;

              return (
                <button
                  key={pattern.id}
                  onClick={() => setCurrentPatternIndex(index)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all shrink-0
                    ${isActive
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                      : 'border hover:border-orange-300 bg-card hover:bg-orange-50/50'
                    }
                  `}
                >
                  <span className="text-lg">{patternDef?.icon || '📝'}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">
                      {patternDef?.name || `Pattern ${index + 1}`}
                    </div>
                    {isComplete && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-3 w-3" />
                        Complete
                      </div>
                    )}
                  </div>
                  {composition.patterns.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${patternDef?.name || `Pattern ${index + 1}`}?`)) {
                          removePattern(index);
                        }
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors ml-auto"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pattern Counter (always visible) */}
      <div className="border-b bg-muted/10 px-6 py-2">
        <div className="text-sm text-muted-foreground">
          Pattern <span className="font-semibold text-foreground">{composition.currentPatternIndex + 1}</span> of <span className="font-semibold text-foreground">{composition.patterns.length}</span>
        </div>
      </div>

      {/* Horizontal Progress Indicator */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.number);
            const isLast = index === steps.length - 1;

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <button
                  onClick={() => handleStepClick(step.number)}
                  disabled={status === 'locked'}
                  className={`
                    flex flex-col items-center gap-1 transition-all
                    ${status === 'locked' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                >
                  <span
                    className={`
                      flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 border-2 transition-all
                      ${
                        status === 'done'
                          ? 'border-green-500 text-green-500 bg-transparent'
                          : status === 'current'
                          ? 'border-primary text-primary bg-transparent ring-4 ring-primary/20'
                          : 'border-muted-foreground/30 text-muted-foreground bg-transparent'
                      }
                    `}
                  >
                    {status === 'done' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      step.number
                    )}
                  </span>
                  <div
                    className={`
                      text-sm font-medium transition-colors
                      ${
                        status === 'current'
                          ? 'text-foreground'
                          : status === 'done'
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                      }
                    `}
                  >
                    {step.label}
                  </div>
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-px mx-2">
                    <div
                      className={`
                        h-full transition-all
                        ${getStepStatus(step.number + 1) !== 'locked' ? 'bg-green-300' : 'bg-muted/30'}
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
        {composition.currentStep === 1 && <Step1 />}
        {composition.currentStep === 2 && <Step2 />}
        {composition.currentStep === 3 && <Step3 />}
        {composition.currentStep === 4 && <Step4 />}
      </div>
    </div>
  );
}
