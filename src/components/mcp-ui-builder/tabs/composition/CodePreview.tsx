'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';

// Dynamically import Monaco editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export function CodePreview() {
  const { composition } = useUIBuilderStore();
  const [copied, setCopied] = useState(false);

  const code = composition.generatedCode || '// No code generated yet. Complete all steps in the Composition tab.';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interactive-pattern.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">💻</span>
              Generated Code Preview
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete HTML + JavaScript ready to use
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={handleDownload}
              disabled={!composition.generatedCode}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                composition.generatedCode
                  ? 'text-white bg-orange-500 hover:bg-orange-600'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`}
            >
              Download File
            </button>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 bg-gray-900">
        {composition.generatedCode ? (
          <MonacoEditor
            height="100%"
            language="html"
            theme="vs-dark"
            value={code}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-lg font-medium">No code generated yet</div>
              <div className="text-sm mt-2">Complete all steps in the Composition tab to generate code</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with includes info */}
      {composition.generatedCode && (
        <div className="border-t border-gray-200 bg-white px-6 py-3">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Includes:</span>
            {' '}☑ HTML Element • ☑ Tool Call Script • ☑ Response Handler • ☑ Notification Logic
          </div>
        </div>
      )}
    </div>
  );
}
