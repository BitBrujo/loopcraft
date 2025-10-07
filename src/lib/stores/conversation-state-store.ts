import { create } from 'zustand';
import {
  ConversationState,
  ConversationMessage,
  ConversationPhase,
  UserIntent,
  DetectedEntity,
  Capability,
  ClarificationQuestion,
  BuilderSuggestion,
  ConfigSnapshot,
} from '@/types/conversational-builder';
import { UIResource, ActionMapping, CustomTool } from '@/types/ui-builder';

interface ConversationStateStore extends ConversationState {
  // Message management
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Phase management
  setPhase: (phase: ConversationPhase) => void;

  // AI analysis
  setIntent: (intent: UserIntent) => void;
  addEntity: (entity: DetectedEntity) => void;
  updateCapability: (id: string, updates: Partial<Capability>) => void;
  addCapability: (capability: Capability) => void;
  setPendingQuestions: (questions: ClarificationQuestion[]) => void;
  clearQuestion: (id: string) => void;
  setSuggestions: (suggestions: BuilderSuggestion[]) => void;
  acceptSuggestion: (id: string) => void;

  // Configuration management
  updateUIResource: (updates: Partial<UIResource>) => void;
  setUIResource: (resource: UIResource) => void;
  setActionMappings: (mappings: ActionMapping[]) => void;
  setCustomTools: (tools: CustomTool[]) => void;

  // Snapshot management
  createSnapshot: () => void;
  restoreSnapshot: (index: number) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;

  // Deployment
  setDeploying: (deploying: boolean) => void;
  setDeployedServer: (name: string) => void;
  setDeploymentError: (error: string | undefined) => void;

  // Reset
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const initialState: ConversationState = {
  messages: [],
  currentPhase: 'discovery',
  entities: [],
  capabilities: [],
  pendingQuestions: [],
  suggestions: [],
  uiResource: {
    uri: 'ui://conversational-builder/initial',
    contentType: 'rawHtml',
    content: '',
    preferredSize: { width: 800, height: 600 },
    templatePlaceholders: [],
    metadata: {
      title: 'New UI Component',
      description: '',
    },
  },
  actionMappings: [],
  customTools: [],
  snapshots: [],
  currentSnapshotIndex: -1,
  isDeploying: false,
};

export const useConversationState = create<ConversationStateStore>((set, get) => ({
  ...initialState,

  // Message management
  addMessage: (message) => {
    const newMessage: ConversationMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  clearMessages: () => set({ messages: [] }),

  // Phase management
  setPhase: (phase) => set({ currentPhase: phase }),

  // AI analysis
  setIntent: (intent) => set({ intent }),

  addEntity: (entity) =>
    set((state) => ({
      entities: [...state.entities, entity],
    })),

  updateCapability: (id, updates) =>
    set((state) => ({
      capabilities: state.capabilities.map((cap) =>
        cap.id === id ? { ...cap, ...updates } : cap
      ),
    })),

  addCapability: (capability) =>
    set((state) => ({
      capabilities: [...state.capabilities, capability],
    })),

  setPendingQuestions: (questions) => set({ pendingQuestions: questions }),

  clearQuestion: (id) =>
    set((state) => ({
      pendingQuestions: state.pendingQuestions.filter((q) => q.id !== id),
    })),

  setSuggestions: (suggestions) => set({ suggestions }),

  acceptSuggestion: (id) => {
    set((state) => ({
      suggestions: state.suggestions.filter((s) => s.id !== id),
    }));
  },

  // Configuration management
  updateUIResource: (updates) =>
    set((state) => ({
      uiResource: { ...state.uiResource, ...updates },
    })),

  setUIResource: (resource) => set({ uiResource: resource }),

  setActionMappings: (mappings) => set({ actionMappings: mappings }),

  setCustomTools: (tools) => set({ customTools: tools }),

  // Snapshot management
  createSnapshot: () => {
    const state = get();
    const snapshot: ConfigSnapshot = {
      id: generateId(),
      timestamp: new Date(),
      phase: state.currentPhase,
      uiResource: JSON.parse(JSON.stringify(state.uiResource)),
      actionMappings: JSON.parse(JSON.stringify(state.actionMappings)),
      customTools: JSON.parse(JSON.stringify(state.customTools)),
    };

    set((state) => ({
      snapshots: [
        ...state.snapshots.slice(0, state.currentSnapshotIndex + 1),
        snapshot,
      ],
      currentSnapshotIndex: state.currentSnapshotIndex + 1,
    }));
  },

  restoreSnapshot: (index) => {
    const snapshot = get().snapshots[index];
    if (snapshot) {
      set({
        currentPhase: snapshot.phase,
        uiResource: JSON.parse(JSON.stringify(snapshot.uiResource)),
        actionMappings: JSON.parse(JSON.stringify(snapshot.actionMappings)),
        customTools: JSON.parse(JSON.stringify(snapshot.customTools)),
        currentSnapshotIndex: index,
      });
    }
  },

  canUndo: () => {
    const state = get();
    return state.currentSnapshotIndex > 0;
  },

  canRedo: () => {
    const state = get();
    return state.currentSnapshotIndex < state.snapshots.length - 1;
  },

  undo: () => {
    const state = get();
    if (state.canUndo()) {
      state.restoreSnapshot(state.currentSnapshotIndex - 1);
    }
  },

  redo: () => {
    const state = get();
    if (state.canRedo()) {
      state.restoreSnapshot(state.currentSnapshotIndex + 1);
    }
  },

  // Deployment
  setDeploying: (deploying) => set({ isDeploying: deploying }),

  setDeployedServer: (name) => set({ deployedServerName: name }),

  setDeploymentError: (error) => set({ deploymentError: error }),

  // Reset
  reset: () => set(initialState),
}));
