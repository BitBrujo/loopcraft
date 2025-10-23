'use client';

import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Target, Box, Zap, Package, Check } from 'lucide-react';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';

export function InsertPanel() {
  const { composition, setCompositionStep } = useUIBuilderStore();

  const steps = [
    { number: 1, label: 'Pattern', Icon: Target },
    { number: 2, label: 'Element', Icon: Box },
    { number: 3, label: 'Action', Icon: Zap },
    { number: 4, label: 'Handler', Icon: Package },
  ];

  const getStepStatus = (stepNumber: number): 'done' | 'current' | 'locked' => {
    if (stepNumber < composition.currentStep) {
      // Check if previous step is valid
      const isValid = composition.isValid[`step${stepNumber}` as keyof typeof composition.isValid];
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
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                      ${
                        status === 'done'
                          ? 'bg-green-500 text-white'
                          : status === 'current'
                          ? 'bg-orange-500 text-white ring-4 ring-orange-200'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {status === 'done' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div
                    className={`
                      text-sm font-medium transition-colors
                      ${
                        status === 'current'
                          ? 'text-orange-600'
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
                  <div className="flex-1 h-1 mx-2">
                    <div
                      className={`
                        h-full transition-all
                        ${getStepStatus(step.number + 1) !== 'locked' ? 'bg-green-500' : 'bg-muted'}
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
