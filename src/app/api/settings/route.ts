import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { Setting } from '@/types/database';

// GET /api/settings - Get all user settings
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all settings for the user
    const settings = await query<Setting[]>(
      'SELECT * FROM settings WHERE user_id = ?',
      [user.userId]
    );

    // Convert array of settings to key-value object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string | null>);

    return NextResponse.json({ settings: settingsObject });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update user settings
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
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // Update or insert each setting
    for (const [key, value] of Object.entries(settings)) {
      await query(
        `INSERT INTO settings (user_id, \`key\`, value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
        [user.userId, key, value]
      );
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
