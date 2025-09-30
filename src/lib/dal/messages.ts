import { query, queryOne } from '../mysql-client';
import { Message, CreateMessage } from './types';

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Create a new message
 */
export async function createMessage(data: CreateMessage): Promise<Message> {
  const result = await query(
    `INSERT INTO messages (conversation_id, role, content, tool_calls, tool_results, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.conversation_id,
      data.role,
      data.content,
      JSON.stringify(data.tool_calls || {}),
      JSON.stringify(data.tool_results || {}),
      JSON.stringify(data.metadata || {}),
    ]
  );

  const insertId = (result as any).insertId;
  const message = await getMessageById(insertId);
  if (!message) throw new Error('Failed to create message');
  return message;
}

/**
 * Get message by ID
 */
export async function getMessageById(id: string): Promise<Message | null> {
  const msg = await queryOne<any>(
    'SELECT * FROM messages WHERE id = ?',
    [id]
  );

  if (!msg) return null;

  return parseMessageJson(msg);
}

/**
 * Get messages for a conversation
 */
export async function getMessagesByConversationId(
  conversationId: string,
  limit = 100,
  offset = 0
): Promise<Message[]> {
  const messages = await query<any[]>(
    `SELECT * FROM messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC
     LIMIT ? OFFSET ?`,
    [conversationId, limit, offset]
  );

  return messages.map(parseMessageJson);
}

/**
 * Get message count for conversation
 */
export async function getMessageCount(conversationId: string): Promise<number> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
    [conversationId]
  );
  return result?.count || 0;
}

/**
 * Delete message
 */
export async function deleteMessage(id: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM messages WHERE id = ?',
    [id]
  );
  return (result as any).affectedRows > 0;
}

/**
 * Delete all messages in a conversation
 */
export async function deleteMessagesByConversationId(conversationId: string): Promise<number> {
  const result = await query(
    'DELETE FROM messages WHERE conversation_id = ?',
    [conversationId]
  );
  return (result as any).affectedRows;
}

/**
 * Get last N messages for a conversation
 */
export async function getLastMessages(
  conversationId: string,
  count = 10
): Promise<Message[]> {
  const messages = await query<any[]>(
    `SELECT * FROM messages
     WHERE conversation_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [conversationId, count]
  );

  // Reverse to get chronological order
  return messages.reverse().map(parseMessageJson);
}

// Helper function to parse JSON fields
function parseMessageJson(msg: any): Message {
  return {
    ...msg,
    tool_calls: typeof msg.tool_calls === 'string' ? JSON.parse(msg.tool_calls) : msg.tool_calls,
    tool_results: typeof msg.tool_results === 'string' ? JSON.parse(msg.tool_results) : msg.tool_results,
    metadata: typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata,
  };
}