import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hashPassword, verifyPassword } from '@/lib/auth';
import { query } from '@/lib/db';
import { User } from '@/types/database';

// PUT /api/user/password - Change user password
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
    const { currentPassword, newPassword } = body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Fetch current user with password hash
    const users = await query<User[]>(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [user.userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentUser = users[0];

    // Verify current password
    const isValidPassword = await verifyPassword(
      currentPassword,
      currentUser.password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, user.userId]
    );

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
