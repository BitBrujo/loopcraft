import { create } from 'zustand';

export type PanelView = 'resources' | 'config' | 'metrics' | 'debugger' | 'console' | 'ui-builder';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: unknown;
  source?: string;
}

export interface DebugEntry {
  id: string;
  timestamp: Date;
  type: 'tool-call' | 'resource-fetch' | 'api-request';
  serverName: string;
  toolName?: string;
  resourceUri?: string;
  request: unknown;
  response?: unknown;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export interface MetricData {
  toolCalls: number;
  successRate: number;
  averageLatency: number;
  activeConnections: number;
  errorCount: number;
  lastUpdated: Date;
}

interface DashboardState {
  // Active panel
  activePanel: PanelView;
  setActivePanel: (panel: PanelView) => void;

  // Logs
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  filterLogLevel: 'all' | 'info' | 'warn' | 'error' | 'debug';
  setFilterLogLevel: (level: 'all' | 'info' | 'warn' | 'error' | 'debug') => void;

  // Debug entries
  debugEntries: DebugEntry[];
  addDebugEntry: (entry: Omit<DebugEntry, 'id' | 'timestamp'>) => void;
  updateDebugEntry: (id: string, updates: Partial<DebugEntry>) => void;
  clearDebugEntries: () => void;

  // Metrics
  metrics: MetricData;
  updateMetrics: (metrics: Partial<MetricData>) => void;

  // Selected items
  selectedResource: string | null;
  setSelectedResource: (uri: string | null) => void;
  selectedDebugEntry: string | null;
  setSelectedDebugEntry: (id: string | null) => void;

  // Refresh triggers
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activePanel: 'resources',
  setActivePanel: (panel) => set({ activePanel: panel }),

  logs: [],
  addLog: (log) => set((state) => ({
    logs: [
      ...state.logs,
      {
        ...log,
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      }
    ].slice(-1000) // Keep last 1000 logs
  })),
  clearLogs: () => set({ logs: [] }),
  filterLogLevel: 'all',
  setFilterLogLevel: (level) => set({ filterLogLevel: level }),

  debugEntries: [],
  addDebugEntry: (entry) => set((state) => ({
    debugEntries: [
      ...state.debugEntries,
      {
        ...entry,
        id: `debug-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      }
    ].slice(-500) // Keep last 500 debug entries
  })),
  updateDebugEntry: (id, updates) => set((state) => ({
    debugEntries: state.debugEntries.map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    )
  })),
  clearDebugEntries: () => set({ debugEntries: [] }),

  metrics: {
    toolCalls: 0,
    successRate: 0,
    averageLatency: 0,
    activeConnections: 0,
    errorCount: 0,
    lastUpdated: new Date(),
  },
  updateMetrics: (metrics) => set((state) => ({
    metrics: {
      ...state.metrics,
      ...metrics,
      lastUpdated: new Date(),
    }
  })),

  selectedResource: null,
  setSelectedResource: (uri) => set({ selectedResource: uri }),
  selectedDebugEntry: null,
  setSelectedDebugEntry: (id) => set({ selectedDebugEntry: id }),

  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));