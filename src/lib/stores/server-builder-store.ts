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

  // Active tool being edited (for customize view)
  activeTool: ToolDefinition | null;

  // Selected tools (for multi-select in browse view)
  selectedTools: ToolDefinition[];

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

  // Actions - Selected Tools
  toggleToolSelection: (tool: ToolDefinition) => void;
  clearSelectedTools: () => void;
  addSelectedToolsToServer: () => void;

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
      selectedTools: [],
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

      toggleToolSelection: (tool) =>
        set((state) => {
          const isSelected = state.selectedTools.some((t) => t.id === tool.id);
          return {
            selectedTools: isSelected
              ? state.selectedTools.filter((t) => t.id !== tool.id)
              : [...state.selectedTools, tool],
          };
        }),

      clearSelectedTools: () =>
        set({ selectedTools: [] }),

      addSelectedToolsToServer: () =>
        set((state) => {
          if (!state.serverConfig) return state;

          // Add selected tools to server config (avoid duplicates)
          const existingIds = new Set(state.serverConfig.tools.map((t) => t.id));
          const newTools = state.selectedTools.filter((t) => !existingIds.has(t.id));

          return {
            serverConfig: {
              ...state.serverConfig,
              tools: [...state.serverConfig.tools, ...newTools],
            },
            selectedTools: [], // Clear selections after adding
          };
        }),

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
        selectedTools: state.selectedTools,
        activeTab: state.activeTab,
      }),
    }
  )
);
