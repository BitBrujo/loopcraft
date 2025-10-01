import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Prompt, PromptUpdate } from '@/types/database';

// GET /api/prompts/[id] - Get specific prompt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get prompt
    const prompt = await queryOne<Prompt>(
      'SELECT id, user_id, title, content, created_at, updated_at FROM prompts WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt, { status: 200 });
  } catch (error) {
    console.error('Get prompt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/prompts/[id] - Update prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as PromptUpdate;
    const { title, content } = body;

    // Validate at least one field is provided
    if (!title && !content) {
      return NextResponse.json(
        { error: 'At least one field (title or content) must be provided' },
        { status: 400 }
      );
    }

    // Check if prompt exists and belongs to user
    const existingPrompt = await queryOne<Prompt>(
      'SELECT id FROM prompts WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }

    values.push(id, user.userId);

    await query(
      `UPDATE prompts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    // Get updated prompt
    const updatedPrompt = await queryOne<Prompt>(
      'SELECT id, user_id, title, content, created_at, updated_at FROM prompts WHERE id = ?',
      [id]
    );

    return NextResponse.json(updatedPrompt, { status: 200 });
  } catch (error) {
    console.error('Update prompt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id] - Delete prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if prompt exists and belongs to user
    const existingPrompt = await queryOne<Prompt>(
      'SELECT id FROM prompts WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Delete prompt
    await query(
      'DELETE FROM prompts WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    return NextResponse.json(
      { message: 'Prompt deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete prompt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
