import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { Setting } from '@/types/database';

// GET /api/ai-config - Get current AI configuration
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (optional - will return defaults if not authenticated)
    const user = getUserFromRequest(request);

    let apiUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api';
    let modelName = process.env.OLLAMA_MODEL || 'llama3.2:latest';

    // If user is authenticated, check for user-specific settings
    if (user) {
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
        apiUrl = userApiUrl.value;
      }
      if (userModelName && userModelName.value) {
        modelName = userModelName.value;
      }
    }

    return NextResponse.json({
      apiUrl,
      modelName,
      isCustom: user !== null && (
        (await queryOne<Setting>(
          'SELECT * FROM settings WHERE user_id = ? AND `key` IN (?, ?)',
          [user.userId, 'ollama_base_url', 'ollama_model']
        )) !== null
      )
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
    const { apiUrl, modelName } = body as { apiUrl?: string; modelName?: string };

    if (!apiUrl && !modelName) {
      return NextResponse.json(
        { error: 'At least one setting (apiUrl or modelName) is required' },
        { status: 400 }
      );
    }

    // Update or insert API URL setting
    if (apiUrl) {
      await query(
        `INSERT INTO settings (user_id, \`key\`, value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
        [user.userId, 'ollama_base_url', apiUrl]
      );
    }

    // Update or insert model name setting
    if (modelName) {
      await query(
        `INSERT INTO settings (user_id, \`key\`, value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
        [user.userId, 'ollama_model', modelName]
      );
    }

    return NextResponse.json({
      message: 'AI configuration updated successfully',
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
