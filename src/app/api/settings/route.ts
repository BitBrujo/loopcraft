import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserSettings, updateUserSettings } from '@/lib/db/settings';

// Default demo user ID (in production, get from JWT token)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

function getUserIdFromRequest(request: NextRequest): string {
  // TODO: Extract user ID from JWT token in Authorization header
  // For now, use demo user
  return DEMO_USER_ID;
}

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const settings = await getOrCreateUserSettings(userId);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();

    const settings = await updateUserSettings(userId, body);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
