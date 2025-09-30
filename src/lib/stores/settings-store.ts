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
  aiModelPreference: 'gpt-oss:20b',
  ollamaBaseUrl: 'http://100.87.169.2:11434/api',
  ollamaModel: 'gpt-oss:20b',
  mcpAutoConnect: true,
  mcpDebugMode: false,
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
      name: 'hyperface-settings',
    }
  )
);