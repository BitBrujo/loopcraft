import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UIResource,
  Template,
  TabId,
  DesignSubTab,
  ToolSchema,
  ToolBinding,
} from '@/types/ui-builder';
import type {
  CompositionState,
  PatternType,
  PatternInstance,
  ElementConfig,
  ActionConfig,
  HandlerConfig,
} from '@/components/mcp-ui-builder/tabs/composition/types';

// Simple UUID v4 generator that works in all environments
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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

  // Active Design sub-tab (Composition | Code | Preview)
  activeDesignTab: DesignSubTab;

  // Target server state (companion mode is always enabled)
  targetServerName: string | null;
  availableTools: ToolSchema[];
  selectedTools: string[];

  // Composition workflow state
  composition: CompositionState;

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
  setActiveDesignTab: (tab: DesignSubTab) => void;

  // Actions - Target Server (always in companion mode)
  setTargetServerName: (serverName: string | null) => void;
  setAvailableTools: (tools: ToolSchema[]) => void;
  setSelectedTools: (tools: string[]) => void;
  toggleToolSelection: (toolName: string) => void;

  // Actions - Tool Bindings
  setToolBindings: (bindings: ToolBinding[]) => void;
  updateToolBinding: (toolName: string, updates: Partial<ToolBinding>) => void;
  removeToolBinding: (toolName: string) => void;

  // Actions - Composition Workflow
  setCompositionStep: (step: 1 | 2 | 3 | 4) => void;
  setSelectedPattern: (pattern: PatternType | null) => void;
  setElementConfig: (config: ElementConfig | null) => void;
  setActionConfig: (config: ActionConfig | null) => void;
  setHandlerConfig: (config: HandlerConfig | null) => void;
  updateCompositionValidity: (step: 1 | 2 | 3 | 4, isValid: boolean) => void;
  setGeneratedCode: (code: string | null) => void;
  resetComposition: () => void;

  // Actions - Multi-Pattern Management
  addNewPattern: (options?: { isChained?: boolean }) => void;
  removePattern: (index: number) => void;
  setCurrentPatternIndex: (index: number) => void;
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
      activeDesignTab: 'composition',

      // Target server initial state (always in companion mode)
      targetServerName: null,
      availableTools: [],
      selectedTools: [],

      // Composition workflow initial state
      composition: {
        currentStep: 1,
        currentPatternIndex: 0,
        patterns: [
          {
            id: generateUUID(),
            selectedPattern: null,
            elementConfig: null,
            actionConfig: null,
            handlerConfig: null,
            isChained: false,
            chainedFromPatternId: undefined,
            isValid: {
              step1: false,
              step2: false,
              step3: false,
              step4: false,
            },
          },
        ],
        generatedCode: null,
      },

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
          targetServerName: null,
          availableTools: [],
          selectedTools: [],
          activeTab: 'configure',
          activeDesignTab: 'composition',
          showPreview: true,
          error: null,
          // Reset composition workflow state
          composition: {
            currentStep: 1,
            currentPatternIndex: 0,
            patterns: [
              {
                id: generateUUID(),
                selectedPattern: null,
                elementConfig: null,
                actionConfig: null,
                handlerConfig: null,
                isChained: false,
                chainedFromPatternId: undefined,
                isValid: {
                  step1: false,
                  step2: false,
                  step3: false,
                  step4: false,
                },
              },
            ],
            generatedCode: null,
          },
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

      setActiveDesignTab: (tab) =>
        set({ activeDesignTab: tab }),

      // Target server actions (always in companion mode)
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

      // Tool binding actions
      setToolBindings: (bindings) =>
        set((state) => ({
          currentResource: state.currentResource
            ? { ...state.currentResource, toolBindings: bindings }
            : null,
        })),

      updateToolBinding: (toolName, updates) =>
        set((state) => {
          if (!state.currentResource) return {};

          const bindings = state.currentResource.toolBindings || [];
          const existingIndex = bindings.findIndex(b => b.toolName === toolName);

          let newBindings: ToolBinding[];
          if (existingIndex >= 0) {
            // Update existing binding
            newBindings = bindings.map((b, i) =>
              i === existingIndex ? { ...b, ...updates } : b
            );
          } else {
            // Add new binding
            newBindings = [...bindings, {
              toolName,
              triggerId: null,
              parameterMappings: {},
              ...updates
            } as ToolBinding];
          }

          return {
            currentResource: {
              ...state.currentResource,
              toolBindings: newBindings,
            },
          };
        }),

      removeToolBinding: (toolName) =>
        set((state) => ({
          currentResource: state.currentResource
            ? {
                ...state.currentResource,
                toolBindings: (state.currentResource.toolBindings || []).filter(
                  b => b.toolName !== toolName
                ),
              }
            : null,
        })),

      // Composition workflow actions
      setCompositionStep: (step) =>
        set((state) => ({
          composition: {
            ...state.composition,
            currentStep: step,
          },
        })),

      setSelectedPattern: (pattern) =>
        set((state) => {
          const { currentPatternIndex, patterns } = state.composition;
          const updatedPatterns = [...patterns];
          updatedPatterns[currentPatternIndex] = {
            ...updatedPatterns[currentPatternIndex],
            selectedPattern: pattern,
          };
          return {
            composition: {
              ...state.composition,
              patterns: updatedPatterns,
            },
          };
        }),

      setElementConfig: (config) =>
        set((state) => {
          const { currentPatternIndex, patterns } = state.composition;
          const updatedPatterns = [...patterns];
          updatedPatterns[currentPatternIndex] = {
            ...updatedPatterns[currentPatternIndex],
            elementConfig: config,
          };
          return {
            composition: {
              ...state.composition,
              patterns: updatedPatterns,
            },
          };
        }),

      setActionConfig: (config) =>
        set((state) => {
          const { currentPatternIndex, patterns } = state.composition;
          const updatedPatterns = [...patterns];
          updatedPatterns[currentPatternIndex] = {
            ...updatedPatterns[currentPatternIndex],
            actionConfig: config,
          };
          return {
            composition: {
              ...state.composition,
              patterns: updatedPatterns,
            },
          };
        }),

      setHandlerConfig: (config) =>
        set((state) => {
          const { currentPatternIndex, patterns } = state.composition;
          const updatedPatterns = [...patterns];
          updatedPatterns[currentPatternIndex] = {
            ...updatedPatterns[currentPatternIndex],
            handlerConfig: config,
          };
          return {
            composition: {
              ...state.composition,
              patterns: updatedPatterns,
            },
          };
        }),

      updateCompositionValidity: (step, isValid) =>
        set((state) => {
          const { currentPatternIndex, patterns } = state.composition;
          const updatedPatterns = [...patterns];
          updatedPatterns[currentPatternIndex] = {
            ...updatedPatterns[currentPatternIndex],
            isValid: {
              ...updatedPatterns[currentPatternIndex].isValid,
              [`step${step}`]: isValid,
            },
          };
          return {
            composition: {
              ...state.composition,
              patterns: updatedPatterns,
            },
          };
        }),

      setGeneratedCode: (code) =>
        set((state) => ({
          composition: {
            ...state.composition,
            generatedCode: code,
          },
        })),

      addNewPattern: (options) =>
        set((state) => {
          const isChained = options?.isChained || false;
          const previousPattern = isChained
            ? state.composition.patterns[state.composition.currentPatternIndex]
            : null;

          const newPattern: PatternInstance = {
            id: generateUUID(),
            selectedPattern: null,
            elementConfig: null,
            actionConfig: null,
            handlerConfig: null,
            isChained,
            chainedFromPatternId: previousPattern?.id,
            isValid: {
              step1: false,
              step2: false,
              step3: false,
              step4: false,
            },
          };
          return {
            composition: {
              ...state.composition,
              patterns: [...state.composition.patterns, newPattern],
              currentPatternIndex: state.composition.patterns.length,
              currentStep: 1,
            },
          };
        }),

      removePattern: (index) =>
        set((state) => {
          const patterns = state.composition.patterns.filter((_, i) => i !== index);
          // If we removed all patterns, add a blank one
          if (patterns.length === 0) {
            patterns.push({
              id: generateUUID(),
              selectedPattern: null,
              elementConfig: null,
              actionConfig: null,
              handlerConfig: null,
              isChained: false,
              chainedFromPatternId: undefined,
              isValid: {
                step1: false,
                step2: false,
                step3: false,
                step4: false,
              },
            });
          }
          // Adjust currentPatternIndex if needed
          let newIndex = state.composition.currentPatternIndex;
          if (newIndex >= patterns.length) {
            newIndex = patterns.length - 1;
          }
          return {
            composition: {
              ...state.composition,
              patterns,
              currentPatternIndex: newIndex,
            },
          };
        }),

      setCurrentPatternIndex: (index) =>
        set((state) => ({
          composition: {
            ...state.composition,
            currentPatternIndex: index,
          },
        })),

      resetComposition: () =>
        set((state) => ({
          composition: {
            currentStep: 1,
            currentPatternIndex: 0,
            patterns: [
              {
                id: generateUUID(),
                selectedPattern: null,
                elementConfig: null,
                actionConfig: null,
                handlerConfig: null,
                isChained: false,
                chainedFromPatternId: undefined,
                isValid: {
                  step1: false,
                  step2: false,
                  step3: false,
                  step4: false,
                },
              },
            ],
            generatedCode: null,
          },
        })),
    }),
    {
      name: 'ui-builder-storage',
      version: 4, // Increment when state structure changes (v4 adds response destination)
      migrate: (persistedState: unknown, version: number) => {
        // Clear old state if version doesn't match
        if (version < 4) {
          console.log('Migrating UI Builder state from version', version, 'to 4 (adding response destination support)');
          return {
            currentResource: defaultResource,
            showPreview: true,
            activeTab: 'configure',
            activeDesignTab: 'composition',
            targetServerName: null,
            selectedTools: [],
            composition: {
              currentStep: 1,
              currentPatternIndex: 0,
              patterns: [
                {
                  id: generateUUID(),
                  selectedPattern: null,
                  elementConfig: null,
                  actionConfig: null,
                  handlerConfig: null,
                  isChained: false,
                  chainedFromPatternId: undefined,
                  isValid: {
                    step1: false,
                    step2: false,
                    step3: false,
                    step4: false,
                  },
                },
              ],
              generatedCode: null,
            },
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        currentResource: state.currentResource,
        showPreview: state.showPreview,
        activeTab: state.activeTab,
        activeDesignTab: state.activeDesignTab,
        targetServerName: state.targetServerName,
        selectedTools: state.selectedTools,
        composition: state.composition,
      }),
    }
  )
);
