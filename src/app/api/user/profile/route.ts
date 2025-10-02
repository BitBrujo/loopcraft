import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { User } from '@/types/database';

// GET /api/user/profile - Get user profile
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

    // Fetch user profile
    const users = await query<User[]>(
      'SELECT id, email, created_at, updated_at FROM users WHERE id = ?',
      [user.userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile (email only)
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
    const { email } = body as { email: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingUsers = await query<User[]>(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, user.userId]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Update email
    await query(
      'UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [email, user.userId]
    );

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
