import { query, queryOne } from '../mysql-client';
import {
  Conversation,
  CreateConversation,
  UpdateConversation,
} from './types';

// ============================================================================
// Conversation Operations
// ============================================================================

/**
 * Create a new conversation
 */
export async function createConversation(data: CreateConversation): Promise<Conversation> {
  const result = await query(
    `INSERT INTO conversations (user_id, title, model, system_prompt, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.user_id,
      data.title,
      data.model,
      data.system_prompt,
      JSON.stringify(data.metadata || {}),
    ]
  );

  const insertId = (result as any).insertId;
  const conversation = await getConversationById(insertId);
  if (!conversation) throw new Error('Failed to create conversation');
  return conversation;
}

/**
 * Get conversation by ID
 */
export async function getConversationById(id: string): Promise<Conversation | null> {
  const conv = await queryOne<any>(
    'SELECT * FROM conversations WHERE id = ?',
    [id]
  );

  if (!conv) return null;

  return {
    ...conv,
    metadata: typeof conv.metadata === 'string' ? JSON.parse(conv.metadata) : conv.metadata,
  };
}

/**
 * Get all conversations for a user
 */
export async function getConversationsByUserId(
  userId: string,
  limit = 50,
  offset = 0
): Promise<Conversation[]> {
  const conversations = await query<any[]>(
    `SELECT * FROM conversations
     WHERE user_id = ?
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  return conversations.map(conv => ({
    ...conv,
    metadata: typeof conv.metadata === 'string' ? JSON.parse(conv.metadata) : conv.metadata,
  }));
}

/**
 * Update conversation
 */
export async function updateConversation(
  id: string,
  data: UpdateConversation
): Promise<Conversation | null> {
  const fields = Object.keys(data)
    .map(key => `${key} = ?`)
    .join(', ');

  if (!fields) return getConversationById(id);

  const values = Object.entries(data).map(([key, value]) => {
    if (key === 'metadata') {
      return JSON.stringify(value);
    }
    return value;
  });

  await query(
    `UPDATE conversations SET ${fields} WHERE id = ?`,
    [...values, id]
  );

  return getConversationById(id);
}

/**
 * Delete conversation (cascades to messages)
 */
export async function deleteConversation(id: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM conversations WHERE id = ?',
    [id]
  );
  return (result as any).affectedRows > 0;
}

/**
 * Check if user owns conversation
 */
export async function userOwnsConversation(userId: string, conversationId: string): Promise<boolean> {
  const conv = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM conversations WHERE id = ?',
    [conversationId]
  );
  return conv?.user_id === userId;
}

/**
 * Get conversation count for user
 */
export async function getConversationCount(userId: string): Promise<number> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM conversations WHERE user_id = ?',
    [userId]
  );
  return result?.count || 0;
}