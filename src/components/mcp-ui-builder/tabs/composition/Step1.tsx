'use client';

import { useEffect } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { getAllPatterns } from '@/lib/composition-patterns';
import { validateStep1 } from '@/lib/composition-validation';
import type { PatternType } from './types';

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
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Step 1: Choose Interactive Pattern
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Select a pattern type to build your interactive UI component
        </p>
      </div>

      {/* Pattern Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Pattern Type
        </label>
        <div className="space-y-2">
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => handlePatternSelect(pattern.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                composition.selectedPattern === pattern.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{pattern.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{pattern.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{pattern.description}</div>
                </div>
                {composition.selectedPattern === pattern.id && (
                  <span className="text-orange-500">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Pattern Details */}
      {selectedPattern && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">📝 Description</h3>
          <p className="text-sm text-blue-800">{selectedPattern.description}</p>

          <h3 className="font-medium text-blue-900 mt-4 mb-2">📋 Required Components</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <span>☑</span>
              <span>HTML Element ({selectedPattern.elementType})</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <span>☑</span>
              <span>{selectedPattern.actionType === 'tool' ? 'Tool Action' :
                     selectedPattern.actionType === 'prompt' ? 'Prompt Action' :
                     selectedPattern.actionType === 'link' ? 'Link Action' :
                     selectedPattern.actionType === 'intent' ? 'Intent Action' : 'Notification'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <span>☑</span>
              <span>Response Handler (recommended)</span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {!composition.isValid.step1 && composition.selectedPattern === null && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          ⚠️ Please select a pattern type to continue
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={handleNext}
          disabled={!composition.isValid.step1}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            composition.isValid.step1
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next: Configure Element →
        </button>
      </div>
    </div>
  );
}
