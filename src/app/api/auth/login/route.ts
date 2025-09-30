import { NextResponse } from 'next/server';
import { login, createAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Login user
    const result = await login(username, password);

    // Create response with auth cookie
    const response = NextResponse.json({
      user: result.user,
      token: result.token,
    });

    // Set HTTP-only cookie
    response.headers.set('Set-Cookie', createAuthCookie(result.token));

    return response;
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.message === 'Invalid username or password') {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}