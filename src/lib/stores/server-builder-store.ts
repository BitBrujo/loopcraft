import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';
import type {
  ServerConfig,
  ToolDefinition,
  ResourceDefinition,
  TabId,
  TestResult,
  ComponentRelationship,
  DependencyWarning,
  AnalysisContext,
} from '@/types/server-builder';

interface ServerBuilderStore {
  // Current server configuration
  serverConfig: ServerConfig | null;

  // Active tool being edited (for customize view)
  activeTool: ToolDefinition | null;

  // Active resource being edited (for customize view)
  activeResource: ResourceDefinition | null;

  // Selected tools (for multi-select in browse view)
  selectedTools: ToolDefinition[];

  // Selected resources (for multi-select in browse view)
  selectedResources: ResourceDefinition[];

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

  // Relationship Analysis state
  relationships: ComponentRelationship[];
  warnings: DependencyWarning[];
  isAnalyzing: boolean;

  // Actions - Server Config
  setServerConfig: (config: ServerConfig | null) => void;
  updateServerConfig: (updates: Partial<ServerConfig>) => void;
  resetServerConfig: () => void;
  addTool: (tool: ToolDefinition) => void;
  updateTool: (id: string, updates: Partial<ToolDefinition>) => void;
  removeTool: (id: string) => void;
  addResource: (resource: ResourceDefinition) => void;
  updateResource: (id: string, updates: Partial<ResourceDefinition>) => void;
  removeResource: (id: string) => void;

  // Actions - Active Tool
  setActiveTool: (tool: ToolDefinition | null) => void;
  updateActiveTool: (updates: Partial<ToolDefinition>) => void;

  // Actions - Active Resource
  setActiveResource: (resource: ResourceDefinition | null) => void;
  updateActiveResource: (updates: Partial<ResourceDefinition>) => void;

  // Actions - Selected Tools
  toggleToolSelection: (tool: ToolDefinition) => void;
  clearSelectedTools: () => void;
  addSelectedToolsToServer: () => void;

  // Actions - Selected Resources
  toggleResourceSelection: (resource: ResourceDefinition) => void;
  clearSelectedResources: () => void;
  addSelectedResourcesToServer: () => void;

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

  // Actions - Relationship Analysis
  setRelationships: (relationships: ComponentRelationship[]) => void;
  setWarnings: (warnings: DependencyWarning[]) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  analyzeDependencies: (useAI?: boolean) => Promise<void>;
  acceptSuggestion: (relationshipId: string, suggestionId: string) => void;
  dismissRelationship: (relationshipId: string) => void;
}

const defaultServerConfig: ServerConfig = {
  name: 'my-mcp-server',
  description: 'Custom MCP server',
  tools: [],
  resources: [],
  transportType: 'stdio',
};

export const useServerBuilderStore = create<ServerBuilderStore>()(
  persist(
    (set) => ({
      serverConfig: defaultServerConfig,
      activeTool: null,
      activeResource: null,
      selectedTools: [],
      selectedResources: [],
      activeTab: 'templates',
      testResults: [],
      isTestServerActive: false,
      testServerName: null,
      testServerId: null,
      testServerFile: null,
      isLoading: false,
      error: null,
      relationships: [],
      warnings: [],
      isAnalyzing: false,

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
        set((state) => {
          if (!state.serverConfig) return { serverConfig: null };

          // Generate unique ID if tool with same ID already exists
          const existingIds = new Set(state.serverConfig.tools.map((t) => t.id));
          const toolToAdd = existingIds.has(tool.id)
            ? { ...tool, id: `${tool.id}_${generateId().slice(0, 8)}` }
            : tool;

          return {
            serverConfig: {
              ...state.serverConfig,
              tools: [...state.serverConfig.tools, toolToAdd],
            },
          };
        }),

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

      addResource: (resource) =>
        set((state) => {
          if (!state.serverConfig) return { serverConfig: null };

          // Generate unique ID if resource with same ID already exists
          const existingResources = state.serverConfig.resources || [];
          const existingIds = new Set(existingResources.map((r) => r.id));
          const resourceToAdd = existingIds.has(resource.id)
            ? { ...resource, id: `${resource.id}_${generateId().slice(0, 8)}` }
            : resource;

          return {
            serverConfig: {
              ...state.serverConfig,
              resources: [...existingResources, resourceToAdd],
            },
          };
        }),

      updateResource: (id, updates) =>
        set((state) => ({
          serverConfig: state.serverConfig
            ? {
                ...state.serverConfig,
                resources: (state.serverConfig.resources || []).map((r) =>
                  r.id === id ? { ...r, ...updates } : r
                ),
              }
            : null,
        })),

      removeResource: (id) =>
        set((state) => ({
          serverConfig: state.serverConfig
            ? {
                ...state.serverConfig,
                resources: (state.serverConfig.resources || []).filter((r) => r.id !== id),
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

      setActiveResource: (resource) =>
        set({ activeResource: resource }),

      updateActiveResource: (updates) =>
        set((state) => ({
          activeResource: state.activeResource
            ? { ...state.activeResource, ...updates }
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
          const existingTools = state.serverConfig.tools || [];
          const existingIds = new Set(existingTools.map((t) => t.id));
          const newTools = state.selectedTools.filter((t) => !existingIds.has(t.id));

          return {
            serverConfig: {
              ...state.serverConfig,
              tools: [...existingTools, ...newTools],
            },
            selectedTools: [], // Clear selections after adding
          };
        }),

      toggleResourceSelection: (resource) =>
        set((state) => {
          const isSelected = state.selectedResources.some((r) => r.id === resource.id);
          return {
            selectedResources: isSelected
              ? state.selectedResources.filter((r) => r.id !== resource.id)
              : [...state.selectedResources, resource],
          };
        }),

      clearSelectedResources: () =>
        set({ selectedResources: [] }),

      addSelectedResourcesToServer: () =>
        set((state) => {
          if (!state.serverConfig) return state;

          // Add selected resources to server config (avoid duplicates)
          const existingResources = state.serverConfig.resources || [];
          const existingIds = new Set(existingResources.map((r) => r.id));
          const newResources = state.selectedResources.filter((r) => !existingIds.has(r.id));

          return {
            serverConfig: {
              ...state.serverConfig,
              resources: [...existingResources, ...newResources],
            },
            selectedResources: [], // Clear selections after adding
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

      setRelationships: (relationships) =>
        set({ relationships }),

      setWarnings: (warnings) =>
        set({ warnings }),

      setIsAnalyzing: (analyzing) =>
        set({ isAnalyzing: analyzing }),

      analyzeDependencies: async (useAI = false) => {
        const state = useServerBuilderStore.getState();
        if (!state.serverConfig) return;

        set({ isAnalyzing: true, error: null });

        try {
          const context: AnalysisContext = {
            existingTools: state.serverConfig.tools,
            existingResources: state.serverConfig.resources || [],
          };

          // Get auth token from localStorage if available
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

          const response = await fetch('/api/relationships/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              context,
              useAI,
            }),
          });

          if (!response.ok) {
            throw new Error('Analysis failed');
          }

          const data = await response.json();
          set({
            relationships: data.relationships || [],
            warnings: data.warnings || [],
            isAnalyzing: false,
          });
        } catch (error) {
          console.error('Failed to analyze dependencies:', error);
          set({
            error: 'Failed to analyze dependencies',
            isAnalyzing: false,
          });
        }
      },

      acceptSuggestion: (relationshipId, suggestionId) =>
        set((state) => {
          if (!state.serverConfig) return state;

          // Find the suggestion
          const relationship = state.relationships.find((r) =>
            `${r.type}-${r.sourceId}` === relationshipId
          );

          if (!relationship) return state;

          const suggestion = relationship.suggestions.find((s) => s.id === suggestionId);
          if (!suggestion) return state;

          // Import the suggestion as a tool or resource
          const newServerConfig = { ...state.serverConfig };

          if (suggestion.type === 'tool') {
            // Find the tool template
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { toolTemplates } = require('@/lib/tool-templates');
            const template = toolTemplates.find(
              (t: { tool: { id: string } }) => t.tool.id === suggestion.id
            );
            if (template) {
              const existingIds = new Set(newServerConfig.tools.map((t) => t.id));
              const toolToAdd = existingIds.has(template.tool.id)
                ? { ...template.tool, id: `${template.tool.id}_${generateId().slice(0, 8)}` }
                : template.tool;
              newServerConfig.tools = [...newServerConfig.tools, toolToAdd];
            }
          } else if (suggestion.type === 'resource') {
            // Find the resource template
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { resourceTemplates } = require('@/lib/resource-templates');
            const template = resourceTemplates.find(
              (r: { resource: { id: string } }) => r.resource.id === suggestion.id
            );
            if (template) {
              const existingResources = newServerConfig.resources || [];
              const existingIds = new Set(existingResources.map((r) => r.id));
              const resourceToAdd = existingIds.has(template.resource.id)
                ? { ...template.resource, id: `${template.resource.id}_${generateId().slice(0, 8)}` }
                : template.resource;
              newServerConfig.resources = [...existingResources, resourceToAdd];
            }
          }

          // Remove the accepted suggestion from relationships
          const updatedRelationships = state.relationships.map((r) => {
            if (`${r.type}-${r.sourceId}` === relationshipId) {
              return {
                ...r,
                suggestions: r.suggestions.filter((s) => s.id !== suggestionId),
              };
            }
            return r;
          }).filter((r) => r.suggestions.length > 0); // Remove empty relationships

          return {
            serverConfig: newServerConfig,
            relationships: updatedRelationships,
          };
        }),

      dismissRelationship: (relationshipId) =>
        set((state) => ({
          relationships: state.relationships.filter(
            (r) => `${r.type}-${r.sourceId}` !== relationshipId
          ),
        })),
    }),
    {
      name: 'server-builder-storage',
      partialize: (state) => ({
        serverConfig: state.serverConfig,
        activeTool: state.activeTool,
        activeResource: state.activeResource,
        selectedTools: state.selectedTools,
        selectedResources: state.selectedResources,
        activeTab: state.activeTab,
      }),
    }
  )
);
