"use client";

import { useState } from 'react';
import { Play, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function DebuggerPanel() {
  const { debugEntries, selectedDebugEntry, setSelectedDebugEntry, addDebugEntry, addLog } = useDashboardStore();
  const [selectedServer, setSelectedServer] = useState('all');
  const selectedEntry = debugEntries.find(e => e.id === selectedDebugEntry);

  const filteredEntries = selectedServer === 'all'
    ? debugEntries
    : debugEntries.filter(e => e.serverName === selectedServer);

  const servers = Array.from(new Set(debugEntries.map(e => e.serverName)));

  const executeToolCall = async () => {
    // Example tool execution for testing
    const testEntry = {
      type: 'tool-call' as const,
      serverName: 'test-server',
      toolName: 'test-tool',
      request: { arg1: 'value1' },
      status: 'pending' as const,
    };

    addDebugEntry(testEntry);
    addLog({
      level: 'info',
      message: `Executing tool: ${testEntry.toolName}`,
      source: 'Debugger',
    });

    // Simulate async execution
    setTimeout(() => {
      // This would be replaced with actual tool execution
      addLog({
        level: 'info',
        message: `Tool execution completed: ${testEntry.toolName}`,
        source: 'Debugger',
      });
    }, 1000);
  };

  return (
    <div className="flex h-full">
      {/* Debug entry list */}
      <div className="flex w-1/2 flex-col border-r border-border">
        <div className="flex items-center gap-2 border-b border-border bg-card/50 p-4">
          <h3 className="text-sm font-medium flex-1">Debug Entries</h3>
          <select
            value={selectedServer}
            onChange={(e) => setSelectedServer(e.target.value)}
            className="text-xs border border-border rounded px-2 py-1 bg-background"
          >
            <option value="all">All Servers</option>
            {servers.map(server => (
              <option key={server} value={server}>{server}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={executeToolCall}>
            <Play className="size-4 mr-2" />
            Test Call
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredEntries.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No debug entries yet. Execute some MCP operations to see them here.
              </div>
            )}

            {filteredEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedDebugEntry(entry.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  selectedDebugEntry === entry.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <div className="mt-0.5">
                  {entry.status === 'success' && <CheckCircle2 className="size-4 text-green-500" />}
                  {entry.status === 'error' && <AlertCircle className="size-4 text-destructive" />}
                  {entry.status === 'pending' && <Clock className="size-4 text-yellow-500 animate-pulse" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {entry.toolName || entry.resourceUri || 'API Request'}
                    </span>
                    {entry.duration && (
                      <Badge variant="secondary" className="text-xs">{entry.duration}ms</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {entry.serverName} • {format(entry.timestamp, 'HH:mm:ss')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Debug entry details */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card/50 p-4">
          <h3 className="text-sm font-medium">Request/Response Inspector</h3>
        </div>
        <ScrollArea className="flex-1">
          {selectedEntry ? (
            <div className="p-4 space-y-4">
              {/* Entry metadata */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    selectedEntry.status === 'success' ? 'default' :
                    selectedEntry.status === 'error' ? 'destructive' : 'secondary'
                  }>
                    {selectedEntry.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(selectedEntry.timestamp, 'PPpp')}
                  </span>
                </div>
                <div className="text-sm">
                  <strong>Server:</strong> {selectedEntry.serverName}
                </div>
                {selectedEntry.toolName && (
                  <div className="text-sm">
                    <strong>Tool:</strong> {String(selectedEntry.toolName)}
                  </div>
                )}
                {selectedEntry.duration !== undefined && (
                  <div className="text-sm">
                    <strong>Duration:</strong> {String(selectedEntry.duration)}ms
                  </div>
                )}
              </div>

              {/* Request */}
              {selectedEntry.request !== undefined && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Request</h4>
                  <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto">
                    <code>{JSON.stringify(selectedEntry.request, null, 2)}</code>
                  </pre>
                </div>
              )}

              {/* Response */}
              {selectedEntry.response !== undefined && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Response</h4>
                  <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto">
                    <code>{JSON.stringify(selectedEntry.response, null, 2)}</code>
                  </pre>
                </div>
              )}

              {/* Error */}
              {selectedEntry.error && (
                <div className="border border-destructive rounded-lg p-4 bg-destructive/5">
                  <h4 className="text-sm font-semibold text-destructive mb-2">Error</h4>
                  <p className="text-sm">{selectedEntry.error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              Select a debug entry to inspect its details
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}