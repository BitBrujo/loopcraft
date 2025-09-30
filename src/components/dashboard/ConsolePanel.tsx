"use client";

import { useState } from 'react';
import { Trash2, Download, AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function ConsolePanel() {
  const { logs, clearLogs, filterLogLevel, setFilterLogLevel } = useDashboardStore();
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredLogs = filterLogLevel === 'all'
    ? logs
    : logs.filter(log => log.level === filterLogLevel);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="size-4 text-destructive" />;
      case 'warn': return <AlertTriangle className="size-4 text-yellow-500" />;
      case 'info': return <Info className="size-4 text-blue-500" />;
      case 'debug': return <Bug className="size-4 text-muted-foreground" />;
      default: return <Info className="size-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-destructive';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-muted-foreground';
      default: return '';
    }
  };

  const exportLogs = () => {
    const logText = filteredLogs
      .map(log => `[${format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}] [${log.level.toUpperCase()}] ${log.source || 'System'}: ${log.message}`)
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-card/50 p-4">
        <h3 className="text-sm font-medium flex-1">Console</h3>

        {/* Log level filter */}
        <div className="flex items-center gap-1">
          {['all', 'info', 'warn', 'error', 'debug'].map(level => (
            <Button
              key={level}
              size="sm"
              variant={filterLogLevel === level ? 'default' : 'ghost'}
              onClick={() => setFilterLogLevel(level as typeof filterLogLevel)}
              className="h-7 text-xs"
            >
              {level}
            </Button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-l border-border pl-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoScroll(!autoScroll)}
            className="h-7 text-xs"
          >
            Auto-scroll: {autoScroll ? 'On' : 'Off'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportLogs}
            className="h-7"
          >
            <Download className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearLogs}
            className="h-7"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Log entries */}
      <ScrollArea className="flex-1 font-mono">
        <div className="p-2 space-y-0.5">
          {filteredLogs.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8 font-sans">
              No log entries. MCP operations will be logged here.
            </div>
          )}

          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 px-3 py-1.5 text-xs hover:bg-accent/50 rounded"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getLevelIcon(log.level)}
                <span className="text-muted-foreground whitespace-nowrap">
                  {format(log.timestamp, 'HH:mm:ss.SSS')}
                </span>
                {log.source && (
                  <Badge variant="outline" className="text-xs">
                    {log.source}
                  </Badge>
                )}
              </div>
              <div className={cn("flex-1 break-all", getLevelColor(log.level))}>
                {log.message}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <div className="flex items-center gap-4 border-t border-border bg-card/30 px-4 py-2 text-xs text-muted-foreground">
        <span>Total: {logs.length}</span>
        <span>Filtered: {filteredLogs.length}</span>
        <span>Errors: {logs.filter(l => l.level === 'error').length}</span>
        <span>Warnings: {logs.filter(l => l.level === 'warn').length}</span>
      </div>
    </div>
  );
}