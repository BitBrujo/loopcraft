import { query, queryOne } from '../mysql-client';
import {
  UserProfile,
  UserSettings,
  CreateUserProfile,
  CreateUserSettings,
  UpdateUserProfile,
  UpdateUserSettings,
} from './types';

// ============================================================================
// User Profile Operations
// ============================================================================

/**
 * Create a new user profile
 */
export async function createUser(data: CreateUserProfile): Promise<UserProfile> {
  const result = await query(
    `INSERT INTO user_profiles (username, email, password_hash, display_name, avatar_url, bio)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.username, data.email, data.password_hash, data.display_name, data.avatar_url, data.bio]
  );

  const insertId = (result as any).insertId;
  const user = await getUserById(insertId);
  if (!user) throw new Error('Failed to create user');
  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<UserProfile | null> {
  return queryOne<UserProfile>(
    'SELECT * FROM user_profiles WHERE id = ?',
    [id]
  );
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  return queryOne<UserProfile>(
    'SELECT * FROM user_profiles WHERE username = ?',
    [username]
  );
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  return queryOne<UserProfile>(
    'SELECT * FROM user_profiles WHERE email = ?',
    [email]
  );
}

/**
 * Update user profile
 */
export async function updateUser(id: string, data: UpdateUserProfile): Promise<UserProfile | null> {
  const fields = Object.keys(data)
    .map(key => `${key} = ?`)
    .join(', ');

  if (!fields) return getUserById(id);

  await query(
    `UPDATE user_profiles SET ${fields} WHERE id = ?`,
    [...Object.values(data), id]
  );

  return getUserById(id);
}

/**
 * Delete user profile (cascades to related records)
 */
export async function deleteUser(id: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM user_profiles WHERE id = ?',
    [id]
  );
  return (result as any).affectedRows > 0;
}

// ============================================================================
// User Settings Operations
// ============================================================================

/**
 * Create user settings
 */
export async function createUserSettings(data: CreateUserSettings): Promise<UserSettings> {
  await query(
    `INSERT INTO user_settings (user_id, theme, language, notifications_enabled, ai_model_preference, custom_settings)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.user_id,
      data.theme,
      data.language,
      data.notifications_enabled,
      data.ai_model_preference,
      JSON.stringify(data.custom_settings || {}),
    ]
  );

  const settings = await getUserSettings(data.user_id);
  if (!settings) throw new Error('Failed to create user settings');
  return settings;
}

/**
 * Get user settings by user ID
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const settings = await queryOne<any>(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [userId]
  );

  if (!settings) return null;

  return {
    ...settings,
    custom_settings: typeof settings.custom_settings === 'string'
      ? JSON.parse(settings.custom_settings)
      : settings.custom_settings,
  };
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  data: UpdateUserSettings
): Promise<UserSettings | null> {
  const fields = Object.keys(data)
    .map(key => `${key} = ?`)
    .join(', ');

  if (!fields) return getUserSettings(userId);

  const values = Object.entries(data).map(([key, value]) => {
    if (key === 'custom_settings') {
      return JSON.stringify(value);
    }
    return value;
  });

  await query(
    `UPDATE user_settings SET ${fields} WHERE user_id = ?`,
    [...values, userId]
  );

  return getUserSettings(userId);
}

/**
 * Get or create user settings (ensures settings exist for a user)
 */
export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  let settings = await getUserSettings(userId);

  if (!settings) {
    settings = await createUserSettings({
      user_id: userId,
      theme: 'system',
      language: 'en',
      notifications_enabled: true,
    });
  }

  return settings;
}