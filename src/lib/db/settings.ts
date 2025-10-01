import { query, queryOne, execute } from '../db';
import { v4 as uuidv4 } from 'crypto';

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications_enabled: boolean;
  ai_model_preference?: string;
  ollama_base_url?: string;
  ollama_model?: string;
  mcp_auto_connect: boolean;
  mcp_debug_mode: boolean;
  dashboard_layout: 'horizontal' | 'vertical';
  panel_sizes?: Record<string, number>;
  custom_settings?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateSettingsInput {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications_enabled?: boolean;
  ai_model_preference?: string;
  ollama_base_url?: string;
  ollama_model?: string;
  mcp_auto_connect?: boolean;
  mcp_debug_mode?: boolean;
  dashboard_layout?: 'horizontal' | 'vertical';
  panel_sizes?: Record<string, number>;
  custom_settings?: Record<string, unknown>;
}

// Get user settings
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const result = await queryOne<any>(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [userId]
  );

  if (!result) return null;

  return {
    ...result,
    panel_sizes: result.panel_sizes ? JSON.parse(result.panel_sizes) : {},
    custom_settings: result.custom_settings ? JSON.parse(result.custom_settings) : {},
  };
}

// Create default settings for user
export async function createDefaultSettings(userId: string): Promise<UserSettings> {
  const id = uuidv4();

  await execute(
    `INSERT INTO user_settings (
      id, user_id, theme, language, notifications_enabled,
      mcp_auto_connect, mcp_debug_mode, dashboard_layout,
      panel_sizes, custom_settings
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      'system',
      'en',
      true,
      true,
      false,
      'horizontal',
      JSON.stringify({}),
      JSON.stringify({}),
    ]
  );

  const settings = await getUserSettings(userId);
  if (!settings) {
    throw new Error('Failed to create default settings');
  }

  return settings;
}

// Update user settings
export async function updateUserSettings(
  userId: string,
  input: UpdateSettingsInput
): Promise<UserSettings> {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.theme !== undefined) {
    fields.push('theme = ?');
    values.push(input.theme);
  }
  if (input.language !== undefined) {
    fields.push('language = ?');
    values.push(input.language);
  }
  if (input.notifications_enabled !== undefined) {
    fields.push('notifications_enabled = ?');
    values.push(input.notifications_enabled);
  }
  if (input.ai_model_preference !== undefined) {
    fields.push('ai_model_preference = ?');
    values.push(input.ai_model_preference);
  }
  if (input.ollama_base_url !== undefined) {
    fields.push('ollama_base_url = ?');
    values.push(input.ollama_base_url);
  }
  if (input.ollama_model !== undefined) {
    fields.push('ollama_model = ?');
    values.push(input.ollama_model);
  }
  if (input.mcp_auto_connect !== undefined) {
    fields.push('mcp_auto_connect = ?');
    values.push(input.mcp_auto_connect);
  }
  if (input.mcp_debug_mode !== undefined) {
    fields.push('mcp_debug_mode = ?');
    values.push(input.mcp_debug_mode);
  }
  if (input.dashboard_layout !== undefined) {
    fields.push('dashboard_layout = ?');
    values.push(input.dashboard_layout);
  }
  if (input.panel_sizes !== undefined) {
    fields.push('panel_sizes = ?');
    values.push(JSON.stringify(input.panel_sizes));
  }
  if (input.custom_settings !== undefined) {
    fields.push('custom_settings = ?');
    values.push(JSON.stringify(input.custom_settings));
  }

  if (fields.length > 0) {
    values.push(userId);
    await execute(
      `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );
  }

  const settings = await getUserSettings(userId);
  if (!settings) {
    throw new Error('Settings not found after update');
  }

  return settings;
}

// Get or create user settings
export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  let settings = await getUserSettings(userId);
  if (!settings) {
    settings = await createDefaultSettings(userId);
  }
  return settings;
}
