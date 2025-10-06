import { getUserFromRequest } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { Setting } from "@/types/database";

export interface AIConfig {
  baseURL: string;
  modelName: string;
}

/**
 * Get AI configuration from user settings or environment variables
 * @param request - The incoming request (to extract user from JWT)
 * @returns AI configuration with baseURL and modelName
 */
export async function getAIConfig(request: Request): Promise<AIConfig> {
  // Default to environment variables
  let baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api';
  let modelName = process.env.OLLAMA_MODEL || 'llama3.2:latest';

  // Check for user-specific AI settings
  const user = getUserFromRequest(request);
  if (user) {
    try {
      const userApiUrl = await queryOne<Setting>(
        'SELECT * FROM settings WHERE user_id = ? AND `key` = ?',
        [user.userId, 'ollama_base_url']
      );

      const userModelName = await queryOne<Setting>(
        'SELECT * FROM settings WHERE user_id = ? AND `key` = ?',
        [user.userId, 'ollama_model']
      );

      // Use user settings if they exist
      if (userApiUrl && userApiUrl.value) {
        baseURL = userApiUrl.value;
      }
      if (userModelName && userModelName.value) {
        modelName = userModelName.value;
      }
    } catch (error) {
      console.error('Error fetching user AI settings:', error);
      // Continue with environment variable defaults
    }
  }

  return { baseURL, modelName };
}
