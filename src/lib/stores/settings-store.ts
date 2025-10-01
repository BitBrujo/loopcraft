import { create } from 'zustand';

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
  isLoaded: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
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

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,
  isSaving: false,
  lastSaved: null,

  // Load settings from API
  loadSettings: async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        set({
          settings: {
            theme: data.theme,
            language: data.language,
            notificationsEnabled: data.notifications_enabled,
            aiModelPreference: data.ai_model_preference || defaultSettings.aiModelPreference,
            ollamaBaseUrl: data.ollama_base_url || defaultSettings.ollamaBaseUrl,
            ollamaModel: data.ollama_model || defaultSettings.ollamaModel,
            mcpAutoConnect: data.mcp_auto_connect,
            mcpDebugMode: data.mcp_debug_mode,
            dashboardLayout: data.dashboard_layout,
            panelSizes: data.panel_sizes || {},
            customSettings: data.custom_settings || {},
          },
          isLoaded: true,
        });
      } else {
        console.error('Failed to load settings');
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ isLoaded: true });
    }
  },

  // Update settings (optimistic update + API call)
  updateSettings: async (newSettings: Partial<UserSettings>) => {
    const currentSettings = get().settings;
    const updatedSettings = { ...currentSettings, ...newSettings };

    // Optimistic update
    set({ settings: updatedSettings, isSaving: true });

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: updatedSettings.theme,
          language: updatedSettings.language,
          notifications_enabled: updatedSettings.notificationsEnabled,
          ai_model_preference: updatedSettings.aiModelPreference,
          ollama_base_url: updatedSettings.ollamaBaseUrl,
          ollama_model: updatedSettings.ollamaModel,
          mcp_auto_connect: updatedSettings.mcpAutoConnect,
          mcp_debug_mode: updatedSettings.mcpDebugMode,
          dashboard_layout: updatedSettings.dashboardLayout,
          panel_sizes: updatedSettings.panelSizes,
          custom_settings: updatedSettings.customSettings,
        }),
      });

      if (response.ok) {
        set({ isSaving: false, lastSaved: new Date() });
      } else {
        // Revert on error
        set({ settings: currentSettings, isSaving: false });
        console.error('Failed to update settings');
      }
    } catch (error) {
      // Revert on error
      set({ settings: currentSettings, isSaving: false });
      console.error('Error updating settings:', error);
    }
  },

  // Reset settings to default
  resetSettings: async () => {
    set({ isSaving: true });

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: defaultSettings.theme,
          language: defaultSettings.language,
          notifications_enabled: defaultSettings.notificationsEnabled,
          ai_model_preference: defaultSettings.aiModelPreference,
          ollama_base_url: defaultSettings.ollamaBaseUrl,
          ollama_model: defaultSettings.ollamaModel,
          mcp_auto_connect: defaultSettings.mcpAutoConnect,
          mcp_debug_mode: defaultSettings.mcpDebugMode,
          dashboard_layout: defaultSettings.dashboardLayout,
          panel_sizes: defaultSettings.panelSizes,
          custom_settings: defaultSettings.customSettings,
        }),
      });

      if (response.ok) {
        set({ settings: defaultSettings, isSaving: false, lastSaved: new Date() });
      } else {
        set({ isSaving: false });
        console.error('Failed to reset settings');
      }
    } catch (error) {
      set({ isSaving: false });
      console.error('Error resetting settings:', error);
    }
  },
}));