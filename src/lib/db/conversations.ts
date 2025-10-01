import { query, queryOne, execute } from '../db';
import { v4 as uuidv4 } from 'crypto';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model?: string;
  system_prompt?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content?: string;
  tool_calls?: unknown[];
  tool_results?: unknown[];
  metadata?: Record<string, unknown>;
  created_at: Date;
}

export interface CreateConversationInput {
  user_id: string;
  title?: string;
  model?: string;
  system_prompt?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateConversationInput {
  title?: string;
  model?: string;
  system_prompt?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateMessageInput {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content?: string;
  tool_calls?: unknown[];
  tool_results?: unknown[];
  metadata?: Record<string, unknown>;
}

// Get conversation by ID
export async function getConversationById(id: string): Promise<Conversation | null> {
  const result = await queryOne<any>(
    'SELECT * FROM conversations WHERE id = ?',
    [id]
  );

  if (!result) return null;

  return {
    ...result,
    metadata: result.metadata ? JSON.parse(result.metadata) : undefined,
  };
}

// List conversations for user
export async function listConversations(
  userId: string,
  limit = 50,
  offset = 0
): Promise<Conversation[]> {
  const results = await query<any>(
    'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?',
    [userId, limit, offset]
  );

  return results.map((row) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}

// Create conversation
export async function createConversation(
  input: CreateConversationInput
): Promise<Conversation> {
  const id = uuidv4();

  await execute(
    `INSERT INTO conversations (id, user_id, title, model, system_prompt, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.user_id,
      input.title || 'New Conversation',
      input.model || null,
      input.system_prompt || null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  );

  const conversation = await getConversationById(id);
  if (!conversation) {
    throw new Error('Failed to create conversation');
  }

  return conversation;
}

// Update conversation
export async function updateConversation(
  id: string,
  input: UpdateConversationInput
): Promise<Conversation | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.model !== undefined) {
    fields.push('model = ?');
    values.push(input.model);
  }
  if (input.system_prompt !== undefined) {
    fields.push('system_prompt = ?');
    values.push(input.system_prompt);
  }
  if (input.metadata !== undefined) {
    fields.push('metadata = ?');
    values.push(JSON.stringify(input.metadata));
  }

  if (fields.length === 0) {
    return getConversationById(id);
  }

  values.push(id);

  await execute(
    `UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return getConversationById(id);
}

// Delete conversation (and all its messages via CASCADE)
export async function deleteConversation(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM conversations WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Get messages for conversation
export async function getMessages(conversationId: string): Promise<Message[]> {
  const results = await query<any>(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]
  );

  return results.map((row) => ({
    ...row,
    tool_calls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
    tool_results: row.tool_results ? JSON.parse(row.tool_results) : undefined,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}

// Create message
export async function createMessage(input: CreateMessageInput): Promise<Message> {
  const id = uuidv4();

  await execute(
    `INSERT INTO messages (id, conversation_id, role, content, tool_calls, tool_results, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.conversation_id,
      input.role,
      input.content || null,
      input.tool_calls ? JSON.stringify(input.tool_calls) : null,
      input.tool_results ? JSON.stringify(input.tool_results) : null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  );

  const messages = await query<any>(
    'SELECT * FROM messages WHERE id = ?',
    [id]
  );

  const message = messages[0];
  if (!message) {
    throw new Error('Failed to create message');
  }

  return {
    ...message,
    tool_calls: message.tool_calls ? JSON.parse(message.tool_calls) : undefined,
    tool_results: message.tool_results ? JSON.parse(message.tool_results) : undefined,
    metadata: message.metadata ? JSON.parse(message.metadata) : undefined,
  };
}

// Delete message
export async function deleteMessage(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM messages WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Count messages in conversation
export async function countMessages(conversationId: string): Promise<number> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
    [conversationId]
  );
  return result?.count || 0;
}
