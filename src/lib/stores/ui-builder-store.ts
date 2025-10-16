import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UIResource,
  Template,
  TabId,
  CompanionMode,
  ToolSchema,
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

  // Active tab (simplified to 3 tabs)
  activeTab: TabId;

  // Companion mode state
  companionMode: CompanionMode;
  targetServerName: string | null;
  availableTools: ToolSchema[];
  selectedTools: string[];

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

  // Actions - Tabs
  setActiveTab: (tab: TabId) => void;

  // Actions - Companion Mode
  setCompanionMode: (mode: CompanionMode) => void;
  setTargetServerName: (serverName: string | null) => void;
  setAvailableTools: (tools: ToolSchema[]) => void;
  setSelectedTools: (tools: string[]) => void;
  toggleToolSelection: (toolName: string) => void;
}

const defaultResource: UIResource = {
  uri: 'ui://loopcraft/new-resource',
  contentType: 'rawHtml',
  content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New UI Resource</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Hello from MCP-UI!</h1>
  <p>Edit this HTML to create your custom UI resource.</p>
  <p>Use the <strong>Configure</strong> tab to set metadata and frame size.</p>
</body>
</html>`,
  metadata: {
    title: 'New UI Resource',
    description: 'A new MCP-UI resource'
  },
  uiMetadata: {
    'preferred-frame-size': ['800px', '600px']
  },
  templatePlaceholders: [],
  selectedServerId: null,
  selectedServerName: null,
  // Advanced Resource Options (all undefined by default)
  audience: undefined,
  priority: undefined,
  lastModified: undefined,
  mimeType: undefined,
  encoding: undefined,
  supportedContentTypes: undefined,
};

export const useUIBuilderStore = create<UIBuilderStore>()(
  persist(
    (set) => ({
      // Initial state
      currentResource: defaultResource,
      savedTemplates: [],
      previewKey: 0,
      showPreview: true,
      isLoading: false,
      error: null,
      activeTab: 'configure',

      // Companion mode initial state
      companionMode: 'disabled',
      targetServerName: null,
      availableTools: [],
      selectedTools: [],

      // Actions
      setCurrentResource: (resource) =>
        set({ currentResource: resource }),

      updateResource: (updates) =>
        set((state) => ({
          currentResource: state.currentResource
            ? {
                ...state.currentResource,
                ...updates,
                lastModified: new Date().toISOString(),
              }
            : null,
        })),

      resetResource: () =>
        set({
          currentResource: defaultResource,
          previewKey: Date.now(),
          companionMode: 'disabled',
          targetServerName: null,
          availableTools: [],
          selectedTools: [],
          activeTab: 'configure',
          showPreview: true,
          error: null,
        }),

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
          previewKey: Date.now(),
        }),

      setActiveTab: (tab) =>
        set({ activeTab: tab }),

      // Companion mode actions
      setCompanionMode: (mode) =>
        set({ companionMode: mode }),

      setTargetServerName: (serverName) =>
        set({ targetServerName: serverName }),

      setAvailableTools: (tools) =>
        set({ availableTools: tools }),

      setSelectedTools: (tools) =>
        set({ selectedTools: tools }),

      toggleToolSelection: (toolName) =>
        set((state) => ({
          selectedTools: state.selectedTools.includes(toolName)
            ? state.selectedTools.filter((t) => t !== toolName)
            : [...state.selectedTools, toolName],
        })),
    }),
    {
      name: 'ui-builder-storage',
      partialize: (state) => ({
        currentResource: state.currentResource,
        showPreview: state.showPreview,
        activeTab: state.activeTab,
        companionMode: state.companionMode,
        targetServerName: state.targetServerName,
        selectedTools: state.selectedTools,
      }),
    }
  )
);
