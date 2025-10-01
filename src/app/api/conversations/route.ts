import { NextRequest, NextResponse } from 'next/server';
import { listConversations, createConversation } from '@/lib/db/conversations';

// Default demo user ID (in production, get from JWT token)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

function getUserIdFromRequest(request: NextRequest): string {
  // TODO: Extract user ID from JWT token in Authorization header
  // For now, use demo user
  return DEMO_USER_ID;
}

// GET /api/conversations - List user's conversations
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const conversations = await listConversations(userId, limit, offset);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to list conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();

    const conversation = await createConversation({
      user_id: userId,
      title: body.title,
      model: body.model,
      system_prompt: body.system_prompt,
      metadata: body.metadata,
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
