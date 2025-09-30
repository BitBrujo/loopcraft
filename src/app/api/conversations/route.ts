import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  createConversation,
  getConversationsByUserId,
  getConversationCount,
} from '@/lib/dal/conversations';

// GET /api/conversations - List user's conversations
export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conversations = await getConversationsByUserId(user.id, limit, offset);
    const total = await getConversationCount(user.id);

    return NextResponse.json({
      conversations,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const { title, model, system_prompt, metadata } = body;

    const conversation = await createConversation({
      user_id: user.id,
      title: title || 'New Conversation',
      model: model || process.env.OLLAMA_MODEL || 'llama3.2:latest',
      system_prompt,
      metadata: metadata || {},
    });

    return NextResponse.json(conversation);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}