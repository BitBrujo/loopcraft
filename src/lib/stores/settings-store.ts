import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSettings {
  // UI Preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;

  // AI Model Configuration
  aiModelPreference: string;
  ollamaBaseUrl: string;
  ollamaModel: string;

  // MCP Configuration
  mcpAutoConnect: boolean;
  mcpDebugMode: boolean;
  mcpSelectedServers: string[]; // Array of server IDs to auto-connect

  // Dashboard preferences
  dashboardLayout: 'horizontal' | 'vertical';
  panelSizes: Record<string, number>;

  // Custom settings
  customSettings: Record<string, unknown>;
}

interface SettingsState {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  lastSaved: Date | null;
  setLastSaved: (date: Date) => void;
}

const defaultSettings: UserSettings = {
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  aiModelPreference: 'llama3.2:latest',
  ollamaBaseUrl: 'http://localhost:11434/api',
  ollamaModel: 'llama3.2:latest',
  mcpAutoConnect: true,
  mcpDebugMode: false,
  mcpSelectedServers: [], // No servers selected by default
  dashboardLayout: 'horizontal',
  panelSizes: {},
  customSettings: {},
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      resetSettings: () => set({ settings: defaultSettings }),
      isSaving: false,
      setIsSaving: (saving) => set({ isSaving: saving }),
      lastSaved: null,
      setLastSaved: (date) => set({ lastSaved: date }),
    }),
    {
      name: 'loopcraft-settings',
    }
  )
);