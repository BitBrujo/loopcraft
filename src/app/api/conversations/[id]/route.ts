import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getConversationById,
  updateConversation,
  deleteConversation,
  userOwnsConversation,
} from '@/lib/dal/conversations';
import { getMessagesByConversationId } from '@/lib/dal/messages';

// GET /api/conversations/[id] - Get conversation with messages
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const conversationId = params.id;

    // Check ownership
    const isOwner = await userOwnsConversation(user.id, conversationId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get conversation and messages
    const conversation = await getConversationById(conversationId);
    const messages = await getMessagesByConversationId(conversationId);

    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Failed to fetch conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Update conversation
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const conversationId = params.id;

    // Check ownership
    const isOwner = await userOwnsConversation(user.id, conversationId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, system_prompt, metadata } = body;

    const updated = await updateConversation(conversationId, {
      title,
      system_prompt,
      metadata,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Failed to update conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const conversationId = params.id;

    // Check ownership
    const isOwner = await userOwnsConversation(user.id, conversationId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const success = await deleteConversation(conversationId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Conversation deleted' });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}