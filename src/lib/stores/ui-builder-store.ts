import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ContentType = 'rawHtml' | 'externalUrl' | 'remoteDom';
export type RemoteDomFramework = 'react' | 'webcomponents';

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

interface UIBuilderState {
  // Current resource being built
  currentResource: UIResourceDraft;
  setCurrentResource: (resource: UIResourceDraft) => void;
  updateResource: (updates: Partial<UIResourceDraft>) => void;
  resetResource: () => void;

  // Action handlers
  actionHandlers: ActionHandler[];
  addActionHandler: (handler: Omit<ActionHandler, 'id'>) => void;
  updateActionHandler: (id: string, updates: Partial<ActionHandler>) => void;
  removeActionHandler: (id: string) => void;

  // Templates
  savedTemplates: SavedTemplate[];
  saveTemplate: (name: string, category: string, description?: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<SavedTemplate>) => void;

  // Preview state
  previewKey: number;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  refreshPreview: () => void;

  // UI state
  activeTab: 'content' | 'actions' | 'preview';
  setActiveTab: (tab: 'content' | 'actions' | 'preview') => void;
  showTemplateGallery: boolean;
  setShowTemplateGallery: (show: boolean) => void;
  showExportDialog: boolean;
  setShowExportDialog: (show: boolean) => void;
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

export const useUIBuilderStore = create<UIBuilderState>()(
  persist(
    (set, get) => ({
      // Current resource
      currentResource: defaultResource,
      setCurrentResource: (resource) => set({ currentResource: resource }),
      updateResource: (updates) =>
        set((state) => ({
          currentResource: { ...state.currentResource, ...updates },
        })),
      resetResource: () => set({ currentResource: defaultResource }),

      // Action handlers
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

      // Templates
      savedTemplates: [],
      saveTemplate: (name, category, description) =>
        set((state) => {
          const existingIndex = state.savedTemplates.findIndex(
            (t) => t.name === name && t.category === category
          );

          const template: SavedTemplate = {
            id: existingIndex >= 0
              ? state.savedTemplates[existingIndex].id
              : `template-${Date.now()}-${Math.random()}`,
            name,
            category,
            description,
            resource: { ...state.currentResource },
            createdAt: existingIndex >= 0
              ? state.savedTemplates[existingIndex].createdAt
              : new Date(),
            updatedAt: new Date(),
          };

          if (existingIndex >= 0) {
            // Update existing
            return {
              savedTemplates: state.savedTemplates.map((t, i) =>
                i === existingIndex ? template : t
              ),
            };
          } else {
            // Add new
            return {
              savedTemplates: [...state.savedTemplates, template],
            };
          }
        }),
      loadTemplate: (id) => {
        const template = get().savedTemplates.find((t) => t.id === id);
        if (template) {
          set({ currentResource: { ...template.resource } });
        }
      },
      deleteTemplate: (id) =>
        set((state) => ({
          savedTemplates: state.savedTemplates.filter((t) => t.id !== id),
        })),
      updateTemplate: (id, updates) =>
        set((state) => ({
          savedTemplates: state.savedTemplates.map((template) =>
            template.id === id
              ? { ...template, ...updates, updatedAt: new Date() }
              : template
          ),
        })),

      // Preview state
      previewKey: 0,
      showPreview: true,
      setShowPreview: (show) => set({ showPreview: show }),
      refreshPreview: () => set((state) => ({ previewKey: state.previewKey + 1 })),

      // UI state
      activeTab: 'content',
      setActiveTab: (tab) => set({ activeTab: tab }),
      showTemplateGallery: false,
      setShowTemplateGallery: (show) => set({ showTemplateGallery: show }),
      showExportDialog: false,
      setShowExportDialog: (show) => set({ showExportDialog: show }),
    }),
    {
      name: 'ui-builder-storage',
      // Only persist templates, not current working state
      partialize: (state) => ({
        savedTemplates: state.savedTemplates,
      }),
    }
  )
);
