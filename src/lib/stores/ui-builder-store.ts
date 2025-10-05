import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';
import type {
  UIResource,
  Template,
  TabId,
  MCPContext,
  ActionMapping,
  TestConfig,
  ValidationStatus,
  CustomTool,
  UIMode,
} from '@/types/ui-builder';

interface UIBuilderStore {
  // Current resource being edited
  currentResource: UIResource | null;

  // Saved templates (from API)
  savedTemplates: Template[];

  // Preview control
  previewKey: number;
  showPreview: boolean;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Active tab
  activeTab: TabId;

  // UI Mode (readonly or interactive)
  uiMode: UIMode;

  // MCP Integration context
  mcpContext: MCPContext;

  // Connected server (for UI wrapper workflow)
  connectedServerName: string | null;

  // Custom tools
  customTools: CustomTool[];

  // Action mappings
  actionMappings: ActionMapping[];

  // Test configuration
  testConfig: TestConfig;

  // Validation status
  validationStatus: ValidationStatus;

  // Test server state
  isTestServerActive: boolean;
  testServerName: string | null;
  testServerId: number | null;
  testServerFile: string | null;

  // Actions - Basic
  setCurrentResource: (resource: UIResource | null) => void;
  updateResource: (updates: Partial<UIResource>) => void;
  resetResource: () => void;

  setSavedTemplates: (templates: Template[]) => void;
  addTemplate: (template: Template) => void;
  removeTemplate: (id: string) => void;

  refreshPreview: () => void;
  setShowPreview: (show: boolean) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  loadTemplate: (template: Template) => void;
  loadCompleteState: (state: {
    currentResource: UIResource;
    mcpContext: MCPContext;
    actionMappings: ActionMapping[];
    testConfig?: TestConfig;
  }) => void;

  // Actions - Tabs
  setActiveTab: (tab: TabId) => void;

  // Actions - UI Mode
  setUIMode: (mode: UIMode) => void;

  // Actions - MCP Context
  setMCPContext: (context: Partial<MCPContext>) => void;
  addSelectedTool: (tool: { name: string; description?: string; inputSchema?: object; serverName: string }) => void;
  removeSelectedTool: (toolName: string, serverName: string) => void;
  toggleServer: (serverName: string) => void;
  setPurpose: (purpose: string) => void;

  // Actions - Connected Server
  setConnectedServerName: (serverName: string | null) => void;

  // Actions - Custom Tools
  addCustomTool: (tool: CustomTool) => void;
  updateCustomTool: (id: string, updates: Partial<CustomTool>) => void;
  removeCustomTool: (id: string) => void;
  clearCustomTools: () => void;

  // Actions - Action Mappings
  addActionMapping: (mapping: ActionMapping) => void;
  updateActionMapping: (id: string, updates: Partial<ActionMapping>) => void;
  removeActionMapping: (id: string) => void;
  clearActionMappings: () => void;

  // Actions - Test Config
  setTestConfig: (config: Partial<TestConfig>) => void;
  addMockResponse: (response: { toolName: string; serverName: string; response: unknown }) => void;
  removeMockResponse: (toolName: string, serverName: string) => void;
  addTestResult: (result: { id: string; mappingId: string; timestamp: Date; status: 'passed' | 'failed'; error?: string; executionTime: number }) => void;
  toggleMockData: () => void;

  // Actions - Validation
  setValidationStatus: (status: Partial<ValidationStatus>) => void;
  addValidationWarning: (warning: string) => void;
  clearValidationWarnings: () => void;

  // Actions - Test Server
  startTestServer: (name: string, id: number, file: string) => void;
  stopTestServer: () => void;
}

const defaultResource: UIResource = {
  uri: 'ui://loopcraft/new-resource',
  contentType: 'rawHtml',
  content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>New UI Resource</title>\n</head>\n<body>\n  <h1>Hello from MCP-UI!</h1>\n  <p>Edit this HTML to create your custom UI.</p>\n</body>\n</html>',
  preferredSize: {
    width: 800,
    height: 600,
  },
  actions: [],
};

export const useUIBuilderStore = create<UIBuilderStore>()(
  persist(
    (set) => ({
      currentResource: defaultResource,
      savedTemplates: [],
      previewKey: 0,
      showPreview: true,
      isLoading: false,
      error: null,
      activeTab: 'design',
      uiMode: 'interactive',
      mcpContext: {
        selectedServers: [],
        selectedTools: [],
        purpose: '',
      },
      connectedServerName: null,
      customTools: [],
      actionMappings: [],
      testConfig: {
        mockResponses: [],
        testHistory: [],
        useMockData: true,
      },
      validationStatus: {
        missingMappings: [],
        typeMismatches: [],
        warnings: [],
      },
      isTestServerActive: false,
      testServerName: null,
      testServerId: null,
      testServerFile: null,

      setCurrentResource: (resource) =>
        set({ currentResource: resource }),

      updateResource: (updates) =>
        set((state) => ({
          currentResource: state.currentResource
            ? { ...state.currentResource, ...updates }
            : null,
        })),

      resetResource: () =>
        set({ currentResource: defaultResource, previewKey: Date.now() }),

      setSavedTemplates: (templates) =>
        set({ savedTemplates: templates }),

      addTemplate: (template) =>
        set((state) => ({
          savedTemplates: [template, ...state.savedTemplates],
        })),

      removeTemplate: (id) =>
        set((state) => ({
          savedTemplates: state.savedTemplates.filter((t) => t.id !== id),
        })),

      refreshPreview: () =>
        set((state) => ({ previewKey: state.previewKey + 1 })),

      setShowPreview: (show) =>
        set({ showPreview: show }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      setError: (error) =>
        set({ error }),

      loadTemplate: (template) =>
        set({
          currentResource: template.resource,
          uiMode: template.uiMode || 'interactive', // Default to interactive if not specified
          previewKey: Date.now(),
        }),

      loadCompleteState: (state) =>
        set({
          currentResource: state.currentResource,
          mcpContext: state.mcpContext,
          actionMappings: state.actionMappings,
          testConfig: state.testConfig || {
            mockResponses: [],
            testHistory: [],
            useMockData: true,
          },
          previewKey: Date.now(),
        }),

      setActiveTab: (tab) =>
        set({ activeTab: tab }),

      setUIMode: (mode) =>
        set({ uiMode: mode }),

      setMCPContext: (context) =>
        set((state) => ({
          mcpContext: { ...state.mcpContext, ...context },
        })),

      addSelectedTool: (tool) =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            selectedTools: [...state.mcpContext.selectedTools, tool],
          },
        })),

      removeSelectedTool: (toolName, serverName) =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            selectedTools: state.mcpContext.selectedTools.filter(
              (t) => !(t.name === toolName && t.serverName === serverName)
            ),
          },
        })),

      toggleServer: (serverName) =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            selectedServers: state.mcpContext.selectedServers.includes(serverName)
              ? state.mcpContext.selectedServers.filter((s) => s !== serverName)
              : [...state.mcpContext.selectedServers, serverName],
          },
        })),

      setPurpose: (purpose) =>
        set((state) => ({
          mcpContext: { ...state.mcpContext, purpose },
        })),

      setConnectedServerName: (serverName) =>
        set({ connectedServerName: serverName }),

      addCustomTool: (tool) =>
        set((state) => ({
          customTools: [...state.customTools, tool],
        })),

      updateCustomTool: (id, updates) =>
        set((state) => ({
          customTools: state.customTools.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      removeCustomTool: (id) =>
        set((state) => ({
          customTools: state.customTools.filter((t) => t.id !== id),
        })),

      clearCustomTools: () =>
        set({ customTools: [] }),

      addActionMapping: (mapping) =>
        set((state) => ({
          actionMappings: [...state.actionMappings, mapping],
        })),

      updateActionMapping: (id, updates) =>
        set((state) => ({
          actionMappings: state.actionMappings.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      removeActionMapping: (id) =>
        set((state) => ({
          actionMappings: state.actionMappings.filter((m) => m.id !== id),
        })),

      clearActionMappings: () =>
        set({ actionMappings: [] }),

      setTestConfig: (config) =>
        set((state) => ({
          testConfig: { ...state.testConfig, ...config },
        })),

      addMockResponse: (response) =>
        set((state) => ({
          testConfig: {
            ...state.testConfig,
            mockResponses: [...state.testConfig.mockResponses, response],
          },
        })),

      removeMockResponse: (toolName, serverName) =>
        set((state) => ({
          testConfig: {
            ...state.testConfig,
            mockResponses: state.testConfig.mockResponses.filter(
              (r) => !(r.toolName === toolName && r.serverName === serverName)
            ),
          },
        })),

      addTestResult: (result) =>
        set((state) => ({
          testConfig: {
            ...state.testConfig,
            testHistory: [...state.testConfig.testHistory, result],
          },
        })),

      toggleMockData: () =>
        set((state) => ({
          testConfig: {
            ...state.testConfig,
            useMockData: !state.testConfig.useMockData,
          },
        })),

      setValidationStatus: (status) =>
        set((state) => ({
          validationStatus: { ...state.validationStatus, ...status },
        })),

      addValidationWarning: (warning) =>
        set((state) => ({
          validationStatus: {
            ...state.validationStatus,
            warnings: [...state.validationStatus.warnings, warning],
          },
        })),

      clearValidationWarnings: () =>
        set((state) => ({
          validationStatus: { ...state.validationStatus, warnings: [] },
        })),

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
    }),
    {
      name: 'ui-builder-storage',
      partialize: (state) => ({
        currentResource: state.currentResource,
        showPreview: state.showPreview,
        activeTab: state.activeTab,
        uiMode: state.uiMode,
        mcpContext: state.mcpContext,
        connectedServerName: state.connectedServerName,
        customTools: state.customTools,
        actionMappings: state.actionMappings,
        testConfig: {
          mockResponses: state.testConfig.mockResponses,
          useMockData: state.testConfig.useMockData,
          testHistory: [],
        },
      }),
      onRehydrateStorage: () => (state) => {
        // Migration: Fix duplicate mapping IDs from old Date.now() format
        if (state?.actionMappings) {
          const seenIds = new Set<string>();
          const migratedMappings = state.actionMappings.map((mapping) => {
            // Check for duplicate or old Date.now() format (mapping-[timestamp])
            if (seenIds.has(mapping.id) || /^mapping-\d+$/.test(mapping.id)) {
              return { ...mapping, id: generateId() };
            }
            seenIds.add(mapping.id);
            return mapping;
          });
          state.actionMappings = migratedMappings;
        }
      },
    }
  )
);
