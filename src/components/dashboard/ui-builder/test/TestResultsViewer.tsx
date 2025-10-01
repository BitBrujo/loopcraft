"use client";

import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, DownloadIcon, SearchIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export function TestResultsViewer() {
  const { testConfig, actionMappings, clearTestHistory } = useUIBuilderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const filteredResults = testConfig.testHistory.filter(result => {
    const mapping = actionMappings.find(m => m.id === result.actionMappingId);
    const searchLower = searchQuery.toLowerCase();
    return (
      mapping?.uiElementLabel?.toLowerCase().includes(searchLower) ||
      mapping?.toolName.toLowerCase().includes(searchLower) ||
      result.status.toLowerCase().includes(searchLower)
    );
  });

  const selectedResultData = selectedResult
    ? testConfig.testHistory.find(r => r.id === selectedResult)
    : null;

  const selectedMapping = selectedResultData
    ? actionMappings.find(m => m.id === selectedResultData.actionMappingId)
    : null;

  const handleExportResults = () => {
    const data = JSON.stringify(testConfig.testHistory, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all test history?')) {
      clearTestHistory();
      setSelectedResult(null);
    }
  };

  const successCount = testConfig.testHistory.filter(r => r.status === 'success').length;
  const errorCount = testConfig.testHistory.filter(r => r.status === 'error').length;
  const avgDuration = testConfig.testHistory.length > 0
    ? Math.round(testConfig.testHistory.reduce((sum, r) => sum + r.duration, 0) / testConfig.testHistory.length)
    : 0;

  if (testConfig.testHistory.length === 0) {
    return (
      <div className="h-full flex flex-col border-l border-border bg-card/30">
        <div className="border-b border-border bg-card/50 p-4">
          <h3 className="text-sm font-medium">Test Results</h3>
          <p className="text-xs text-muted-foreground mt-1">
            History: 0 tests
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <ClockIcon className="size-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No test results yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Run tests to see results here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l border-border bg-card/30">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">Test Results</h3>
            <p className="text-xs text-muted-foreground mt-1">
              History: {testConfig.testHistory.length} test{testConfig.testHistory.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportResults}
              className="h-7 gap-1 text-xs"
            >
              <DownloadIcon className="size-3" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
            >
              <TrashIcon className="size-3" />
              Clear
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 p-2 rounded-md bg-green-500/10 border border-green-500/20">
            <CheckCircleIcon className="size-3 text-green-600" />
            <span className="text-green-600 font-medium">{successCount}</span>
          </div>
          <div className="flex items-center gap-1 p-2 rounded-md bg-red-500/10 border border-red-500/20">
            <XCircleIcon className="size-3 text-red-600" />
            <span className="text-red-600 font-medium">{errorCount}</span>
          </div>
          <div className="flex items-center gap-1 p-2 rounded-md bg-muted border border-border">
            <ClockIcon className="size-3 text-muted-foreground" />
            <span className="font-medium">{avgDuration}ms</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search results..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Results List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredResults.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground">No results match your search</p>
            </div>
          ) : (
            filteredResults.map((result) => {
              const mapping = actionMappings.find(m => m.id === result.actionMappingId);
              const isSelected = selectedResult === result.id;

              return (
                <button
                  key={result.id}
                  onClick={() => setSelectedResult(result.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {result.status === 'success' ? (
                      <CheckCircleIcon className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="size-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {mapping?.uiElementLabel || mapping?.uiElementId || 'Unknown'}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {result.duration}ms
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mapping?.toolName} • {format(result.timestamp, 'HH:mm:ss')}
                      </div>
                      {result.error && (
                        <div className="mt-1 text-xs text-red-600 truncate">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Selected Result Detail */}
      {selectedResultData && (
        <div className="border-t border-border p-4 space-y-3 max-h-80 overflow-auto">
          <div>
            <h4 className="text-sm font-medium mb-2">Test Details</h4>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="text-muted-foreground">Element:</span>
                <span>{selectedMapping?.uiElementLabel || 'Unknown'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Tool:</span>
                <Badge variant="outline">{selectedMapping?.toolName}</Badge>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Time:</span>
                <span>{format(selectedResultData.timestamp, 'PPpp')}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Duration:</span>
                <Badge variant="outline">{selectedResultData.duration}ms</Badge>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Request Parameters</h4>
            <div className="h-32 border border-border rounded-md overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={JSON.stringify(selectedResultData.request, null, 2)}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 11,
                  lineNumbers: 'off',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>

          {selectedResultData.response !== undefined && (
            <div>
              <h4 className="text-sm font-medium mb-2">Response</h4>
              <div className="h-32 border border-border rounded-md overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={JSON.stringify(selectedResultData.response, null, 2)}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 11,
                    lineNumbers: 'off',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
