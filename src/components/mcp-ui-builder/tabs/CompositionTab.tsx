'use client';

import { useState } from 'react';
import { InsertPanel } from './composition/InsertPanel';
import { ConfigPanel } from './composition/ConfigPanel';
import { CodePreview } from './composition/CodePreview';
import { LivePreview } from './composition/LivePreview';

type SubTab = 'composition' | 'code' | 'preview';

export function CompositionTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('composition');

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Sub-Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSubTab('composition')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeSubTab === 'composition'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Composition
          </button>
          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeSubTab === 'code'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeSubTab === 'preview'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Sub-Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'composition' && (
          <div className="h-full grid grid-cols-[40%_60%]">
            {/* Left: Insert Panel (Step-by-step wizard) */}
            <div className="border-r border-gray-200 overflow-hidden">
              <InsertPanel />
            </div>

            {/* Right: Config Panel (Context-aware options) */}
            <div className="overflow-hidden">
              <ConfigPanel />
            </div>
          </div>
        )}

        {activeSubTab === 'code' && <CodePreview />}
        {activeSubTab === 'preview' && <LivePreview />}
      </div>
    </div>
  );
}
