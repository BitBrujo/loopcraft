import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Prompt, PromptCreate } from '@/types/database';

// GET /api/prompts - List all prompts for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all prompts for user
    const prompts = await query<Prompt[]>(
      'SELECT id, user_id, title, content, created_at, updated_at FROM prompts WHERE user_id = ? ORDER BY created_at DESC',
      [user.userId]
    );

    return NextResponse.json(prompts, { status: 200 });
  } catch (error) {
    console.error('Get prompts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/prompts - Create new prompt
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as PromptCreate;
    const { title, content } = body;

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Insert prompt
    const result = await query<any>(
      'INSERT INTO prompts (user_id, title, content) VALUES (?, ?, ?)',
      [user.userId, title, content]
    );

    const promptId = result.insertId;

    // Get created prompt
    const prompt = await query<Prompt[]>(
      'SELECT id, user_id, title, content, created_at, updated_at FROM prompts WHERE id = ?',
      [promptId]
    );

    if (!prompt || prompt.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json(prompt[0], { status: 201 });
  } catch (error) {
    console.error('Create prompt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
