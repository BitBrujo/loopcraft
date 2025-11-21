import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { Setting } from '@/types/database';

// GET /api/ai-config - Get current AI configuration
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (optional - will return defaults if not authenticated)
    const user = getUserFromRequest(request);

    let provider = 'ollama';
    let apiKey = '';
    let apiUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api';
    let modelName = process.env.OLLAMA_MODEL || 'llama3.2:latest';

    // If user is authenticated, check for user-specific settings
    if (user) {
      const [providerSetting, apiKeySetting, apiUrlSetting, modelSetting] = await Promise.all([
        queryOne<Setting>('SELECT * FROM settings WHERE user_id = ? AND `key` = ?', [user.userId, 'ai_provider']),
        queryOne<Setting>('SELECT * FROM settings WHERE user_id = ? AND `key` = ?', [user.userId, 'ai_api_key']),
        queryOne<Setting>('SELECT * FROM settings WHERE user_id = ? AND `key` = ?', [user.userId, 'ai_base_url']),
        queryOne<Setting>('SELECT * FROM settings WHERE user_id = ? AND `key` = ?', [user.userId, 'ai_model']),
      ]);

      // Use user settings if they exist
      if (providerSetting?.value) provider = providerSetting.value;
      if (apiKeySetting?.value) apiKey = apiKeySetting.value;
      if (apiUrlSetting?.value) apiUrl = apiUrlSetting.value;
      if (modelSetting?.value) modelName = modelSetting.value;
    }

    return NextResponse.json({
      provider,
      apiKey: apiKey ? '***' : '', // Mask the actual API key for security
      apiUrl,
      modelName,
      isCustom: user !== null
    });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/ai-config - Update user AI configuration
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, apiKey, apiUrl, modelName } = body as {
      provider?: string;
      apiKey?: string;
      apiUrl?: string;
      modelName?: string;
    };

    if (!modelName) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      );
    }

    // Validate provider-specific requirements
    if (provider === 'anthropic' && !apiKey) {
      return NextResponse.json(
        { error: 'API key is required for Anthropic provider' },
        { status: 400 }
      );
    }

    // Update or insert provider setting
    if (provider) {
      await query(
        `INSERT INTO settings (user_id, \`key\`, value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
        [user.userId, 'ai_provider', provider]
      );
    }

    // Update or insert API key setting
    if (apiKey) {
      await query(
        `INSERT INTO settings (user_id, \`key\`, value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
        [user.userId, 'ai_api_key', apiKey]
      );
    }

    // Update or insert API URL setting
    if (apiUrl) {
      await query(
        `INSERT INTO settings (user_id, \`key\`, value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
        [user.userId, 'ai_base_url', apiUrl]
      );
    }

    // Update or insert model name setting
    if (modelName) {
      await query(
        `INSERT INTO settings (user_id, \`key\`, value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
        [user.userId, 'ai_model', modelName]
      );
    }

    return NextResponse.json({
      message: 'AI configuration updated successfully',
      provider: provider || undefined,
      apiUrl: apiUrl || undefined,
      modelName: modelName || undefined
    });
  } catch (error) {
    console.error('Error updating AI config:', error);
    return NextResponse.json(
      { error: 'Failed to update AI configuration' },
      { status: 500 }
    );
  }
}
