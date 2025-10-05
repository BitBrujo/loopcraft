import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';
import type {
  ServerConfig,
  ToolDefinition,
  TabId,
  TestResult,
} from '@/types/server-builder';

interface ServerBuilderStore {
  // Current server configuration
  serverConfig: ServerConfig | null;

  // Active tool being edited
  activeTool: ToolDefinition | null;

  // Tab navigation
  activeTab: TabId;

  // Test state
  testResults: TestResult[];
  isTestServerActive: boolean;
  testServerName: string | null;
  testServerId: number | null;
  testServerFile: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions - Server Config
  setServerConfig: (config: ServerConfig | null) => void;
  updateServerConfig: (updates: Partial<ServerConfig>) => void;
  resetServerConfig: () => void;
  addTool: (tool: ToolDefinition) => void;
  updateTool: (id: string, updates: Partial<ToolDefinition>) => void;
  removeTool: (id: string) => void;

  // Actions - Active Tool
  setActiveTool: (tool: ToolDefinition | null) => void;
  updateActiveTool: (updates: Partial<ToolDefinition>) => void;

  // Actions - Tabs
  setActiveTab: (tab: TabId) => void;

  // Actions - Test
  addTestResult: (result: TestResult) => void;
  clearTestResults: () => void;
  startTestServer: (name: string, id: number, file: string) => void;
  stopTestServer: () => void;

  // Actions - Loading/Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultServerConfig: ServerConfig = {
  name: 'my-mcp-server',
  description: 'Custom MCP server',
  tools: [],
  transportType: 'stdio',
};

export const useServerBuilderStore = create<ServerBuilderStore>()(
  persist(
    (set) => ({
      serverConfig: defaultServerConfig,
      activeTool: null,
      activeTab: 'templates',
      testResults: [],
      isTestServerActive: false,
      testServerName: null,
      testServerId: null,
      testServerFile: null,
      isLoading: false,
      error: null,

      setServerConfig: (config) =>
        set({ serverConfig: config }),

      updateServerConfig: (updates) =>
        set((state) => ({
          serverConfig: state.serverConfig
            ? { ...state.serverConfig, ...updates }
            : null,
        })),

      resetServerConfig: () =>
        set({
          serverConfig: defaultServerConfig,
          activeTool: null,
          activeTab: 'templates',
        }),

      addTool: (tool) =>
        set((state) => ({
          serverConfig: state.serverConfig
            ? {
                ...state.serverConfig,
                tools: [...state.serverConfig.tools, tool],
              }
            : null,
        })),

      updateTool: (id, updates) =>
        set((state) => ({
          serverConfig: state.serverConfig
            ? {
                ...state.serverConfig,
                tools: state.serverConfig.tools.map((t) =>
                  t.id === id ? { ...t, ...updates } : t
                ),
              }
            : null,
        })),

      removeTool: (id) =>
        set((state) => ({
          serverConfig: state.serverConfig
            ? {
                ...state.serverConfig,
                tools: state.serverConfig.tools.filter((t) => t.id !== id),
              }
            : null,
        })),

      setActiveTool: (tool) =>
        set({ activeTool: tool }),

      updateActiveTool: (updates) =>
        set((state) => ({
          activeTool: state.activeTool
            ? { ...state.activeTool, ...updates }
            : null,
        })),

      setActiveTab: (tab) =>
        set({ activeTab: tab }),

      addTestResult: (result) =>
        set((state) => ({
          testResults: [...state.testResults, result],
        })),

      clearTestResults: () =>
        set({ testResults: [] }),

      startTestServer: (name, id, file) =>
        set({
          isTestServerActive: true,
          testServerName: name,
          testServerId: id,
          testServerFile: file,
        }),

      stopTestServer: () =>
        set({
          isTestServerActive: false,
          testServerName: null,
          testServerId: null,
          testServerFile: null,
        }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      setError: (error) =>
        set({ error }),
    }),
    {
      name: 'server-builder-storage',
      partialize: (state) => ({
        serverConfig: state.serverConfig,
        activeTool: state.activeTool,
        activeTab: state.activeTab,
      }),
    }
  )
);
