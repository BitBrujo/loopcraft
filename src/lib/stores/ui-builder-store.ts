import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ContentType = 'rawHtml' | 'externalUrl' | 'remoteDom';
export type RemoteDomFramework = 'react' | 'webcomponents';
export type BuilderTab = 'context' | 'design' | 'actions' | 'flow' | 'test';

export interface UIResourceDraft {
  uri: string;
  contentType: ContentType;
  content: string; // HTML string, URL, or Remote DOM script
  framework?: RemoteDomFramework; // For remoteDom only
  title?: string;
  description?: string;
  preferredSize: {
    width: number;
    height: number;
  };
  initialData?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

export interface SavedTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  resource: UIResourceDraft;
  actionMappings?: ActionMapping[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionHandler {
  id: string;
  type: 'tool' | 'prompt' | 'link' | 'intent' | 'notify';
  enabled: boolean;
  // Tool call config
  toolName?: string;
  toolParams?: Record<string, unknown>;
  // Prompt config
  promptTemplate?: string;
  // Link config
  url?: string;
  target?: '_blank' | '_self';
  // Intent config
  intentName?: string;
  intentParams?: Record<string, unknown>;
  // Notification config
  notificationMessage?: string;
  notificationType?: 'info' | 'warning' | 'error' | 'success';
}

// MCP Integration types
export interface MCPTool {
  name: string;
  serverName: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPServer {
  name: string;
  connected: boolean;
  toolCount: number;
}

export interface ActionMapping {
  id: string;
  uiElementId: string;
  uiElementType: 'button' | 'form' | 'link' | 'input' | 'select';
  uiElementLabel?: string;
  toolName: string;
  serverName: string;
  parameterBindings: Record<string, string>; // uiField -> toolParam
  responseHandler: 'update-ui' | 'show-notification' | 'refresh-page' | 'custom';
  customHandler?: string; // JavaScript code for custom handler
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string; // Which element/field
  fix?: string; // Suggested fix
}

export interface TestResult {
  id: string;
  timestamp: Date;
  actionMappingId: string;
  status: 'success' | 'error';
  request: unknown;
  response?: unknown;
  error?: string;
  duration: number;
}

interface UIBuilderState {
  // Current resource being built
  currentResource: UIResourceDraft;
  setCurrentResource: (resource: UIResourceDraft) => void;
  updateResource: (updates: Partial<UIResourceDraft>) => void;
  resetResource: () => void;

  // Action handlers (legacy - will be replaced by actionMappings)
  actionHandlers: ActionHandler[];
  addActionHandler: (handler: Omit<ActionHandler, 'id'>) => void;
  updateActionHandler: (id: string, updates: Partial<ActionHandler>) => void;
  removeActionHandler: (id: string) => void;

  // MCP Context
  mcpContext: {
    selectedServers: string[];
    selectedTools: MCPTool[];
    purpose: string;
  };
  setMCPContext: (context: Partial<UIBuilderState['mcpContext']>) => void;
  addSelectedTool: (tool: MCPTool) => void;
  removeSelectedTool: (toolName: string, serverName: string) => void;

  // Action Mappings (new approach)
  actionMappings: ActionMapping[];
  addActionMapping: (mapping: Omit<ActionMapping, 'id'>) => void;
  updateActionMapping: (id: string, updates: Partial<ActionMapping>) => void;
  removeActionMapping: (id: string) => void;
  clearActionMappings: () => void;

  // Validation
  validationIssues: ValidationIssue[];
  setValidationIssues: (issues: ValidationIssue[]) => void;
  addValidationIssue: (issue: Omit<ValidationIssue, 'id'>) => void;
  removeValidationIssue: (id: string) => void;
  clearValidationIssues: () => void;

  // Test Configuration
  testConfig: {
    mockResponses: Record<string, unknown>;
    testHistory: TestResult[];
  };
  setMockResponse: (actionMappingId: string, response: unknown) => void;
  addTestResult: (result: Omit<TestResult, 'id'>) => void;
  clearTestHistory: () => void;

  // Templates
  savedTemplates: SavedTemplate[];
  isLoadingTemplates: boolean;
  loadTemplates: () => Promise<void>;
  saveTemplate: (name: string, category: string, description?: string) => Promise<void>;
  loadTemplate: (id: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<SavedTemplate>) => Promise<void>;

  // Preview state
  previewKey: number;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  refreshPreview: () => void;

  // UI state
  activeTab: BuilderTab;
  setActiveTab: (tab: BuilderTab) => void;
  showTemplateGallery: boolean;
  setShowTemplateGallery: (show: boolean) => void;
  showExportDialog: boolean;
  setShowExportDialog: (show: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const defaultResource: UIResourceDraft = {
  uri: 'ui://my-app/component',
  contentType: 'rawHtml',
  content: '<div style="padding: 20px; font-family: sans-serif;">\n  <h2>Hello, MCP-UI!</h2>\n  <p>Start building your interactive component here.</p>\n</div>',
  preferredSize: {
    width: 800,
    height: 600,
  },
};

export const useUIBuilderStore = create<UIBuilderState>()((set, get) => ({
      // Current resource
      currentResource: defaultResource,
      setCurrentResource: (resource) => set({ currentResource: resource }),
      updateResource: (updates) =>
        set((state) => ({
          currentResource: { ...state.currentResource, ...updates },
        })),
      resetResource: () => set({
        currentResource: defaultResource,
        actionMappings: [],
        validationIssues: [],
      }),

      // Action handlers (legacy)
      actionHandlers: [],
      addActionHandler: (handler) =>
        set((state) => ({
          actionHandlers: [
            ...state.actionHandlers,
            {
              ...handler,
              id: `action-${Date.now()}-${Math.random()}`,
            },
          ],
        })),
      updateActionHandler: (id, updates) =>
        set((state) => ({
          actionHandlers: state.actionHandlers.map((handler) =>
            handler.id === id ? { ...handler, ...updates } : handler
          ),
        })),
      removeActionHandler: (id) =>
        set((state) => ({
          actionHandlers: state.actionHandlers.filter((handler) => handler.id !== id),
        })),

      // MCP Context
      mcpContext: {
        selectedServers: [],
        selectedTools: [],
        purpose: '',
      },
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

      // Action Mappings
      actionMappings: [],
      addActionMapping: (mapping) =>
        set((state) => ({
          actionMappings: [
            ...state.actionMappings,
            {
              ...mapping,
              id: `mapping-${Date.now()}-${Math.random()}`,
            },
          ],
        })),
      updateActionMapping: (id, updates) =>
        set((state) => ({
          actionMappings: state.actionMappings.map((mapping) =>
            mapping.id === id ? { ...mapping, ...updates } : mapping
          ),
        })),
      removeActionMapping: (id) =>
        set((state) => ({
          actionMappings: state.actionMappings.filter((m) => m.id !== id),
        })),
      clearActionMappings: () => set({ actionMappings: [] }),

      // Validation
      validationIssues: [],
      setValidationIssues: (issues) => set({ validationIssues: issues }),
      addValidationIssue: (issue) =>
        set((state) => ({
          validationIssues: [
            ...state.validationIssues,
            {
              ...issue,
              id: `issue-${Date.now()}-${Math.random()}`,
            },
          ],
        })),
      removeValidationIssue: (id) =>
        set((state) => ({
          validationIssues: state.validationIssues.filter((i) => i.id !== id),
        })),
      clearValidationIssues: () => set({ validationIssues: [] }),

      // Test Configuration
      testConfig: {
        mockResponses: {},
        testHistory: [],
      },
      setMockResponse: (actionMappingId, response) =>
        set((state) => ({
          testConfig: {
            ...state.testConfig,
            mockResponses: {
              ...state.testConfig.mockResponses,
              [actionMappingId]: response,
            },
          },
        })),
      addTestResult: (result) =>
        set((state) => ({
          testConfig: {
            ...state.testConfig,
            testHistory: [
              ...state.testConfig.testHistory,
              {
                ...result,
                id: `test-${Date.now()}-${Math.random()}`,
              },
            ].slice(-50), // Keep last 50 results
          },
        })),
      clearTestHistory: () =>
        set((state) => ({
          testConfig: {
            ...state.testConfig,
            testHistory: [],
          },
        })),

      // Templates
      savedTemplates: [],
      isLoadingTemplates: false,

      // Load templates from API
      loadTemplates: async () => {
        set({ isLoadingTemplates: true });
        try {
          const response = await fetch('/api/templates');
          if (response.ok) {
            const templates = await response.json();
            set({
              savedTemplates: templates.map((t: any) => ({
                ...t,
                createdAt: new Date(t.created_at),
                updatedAt: new Date(t.updated_at),
              })),
              isLoadingTemplates: false,
            });
          } else {
            console.error('Failed to load templates');
            set({ isLoadingTemplates: false });
          }
        } catch (error) {
          console.error('Error loading templates:', error);
          set({ isLoadingTemplates: false });
        }
      },

      // Save template (create or update)
      saveTemplate: async (name, category, description) => {
        const state = get();
        try {
          const response = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              category,
              description,
              resource: state.currentResource,
              action_mappings: state.actionMappings,
            }),
          });

          if (response.ok) {
            const template = await response.json();
            set((state) => ({
              savedTemplates: [
                ...state.savedTemplates.filter(
                  (t) => !(t.name === name && t.category === category)
                ),
                {
                  ...template,
                  createdAt: new Date(template.created_at),
                  updatedAt: new Date(template.updated_at),
                },
              ],
            }));
          } else {
            console.error('Failed to save template');
          }
        } catch (error) {
          console.error('Error saving template:', error);
        }
      },

      // Load template (into current workspace)
      loadTemplate: async (id) => {
        const template = get().savedTemplates.find((t) => t.id === id);
        if (template) {
          set({
            currentResource: { ...template.resource },
            actionMappings: template.actionMappings ? [...template.actionMappings] : [],
          });
        }
      },

      // Delete template
      deleteTemplate: async (id) => {
        try {
          const response = await fetch(`/api/templates?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            set((state) => ({
              savedTemplates: state.savedTemplates.filter((t) => t.id !== id),
            }));
          } else {
            console.error('Failed to delete template');
          }
        } catch (error) {
          console.error('Error deleting template:', error);
        }
      },

      // Update template
      updateTemplate: async (id, updates) => {
        try {
          const response = await fetch(`/api/templates?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });

          if (response.ok) {
            const template = await response.json();
            set((state) => ({
              savedTemplates: state.savedTemplates.map((t) =>
                t.id === id
                  ? {
                      ...template,
                      createdAt: new Date(template.created_at),
                      updatedAt: new Date(template.updated_at),
                    }
                  : t
              ),
            }));
          } else {
            console.error('Failed to update template');
          }
        } catch (error) {
          console.error('Error updating template:', error);
        }
      },

      // Preview state
      previewKey: 0,
      showPreview: true,
      setShowPreview: (show) => set({ showPreview: show }),
      refreshPreview: () => set((state) => ({ previewKey: state.previewKey + 1 })),

      // UI state
      activeTab: 'design',
      setActiveTab: (tab) => set({ activeTab: tab }),
      showTemplateGallery: false,
      setShowTemplateGallery: (show) => set({ showTemplateGallery: show }),
      showExportDialog: false,
      setShowExportDialog: (show) => set({ showExportDialog: show }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }));
