import { query, queryOne } from '../mysql-client';
import { FileUpload, CreateFileUpload } from './types';

// ============================================================================
// File Upload Operations
// ============================================================================

/**
 * Create a new file upload record
 */
export async function createFileUpload(data: CreateFileUpload): Promise<FileUpload> {
  const result = await query(
    `INSERT INTO file_uploads (user_id, conversation_id, file_name, file_path, file_size, mime_type, is_temporary, expires_at, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_id,
      data.conversation_id,
      data.file_name,
      data.file_path,
      data.file_size,
      data.mime_type,
      data.is_temporary,
      data.expires_at,
      JSON.stringify(data.metadata || {}),
    ]
  );

  const insertId = (result as any).insertId;
  const file = await getFileUploadById(insertId);
  if (!file) throw new Error('Failed to create file upload');
  return file;
}

/**
 * Get file upload by ID
 */
export async function getFileUploadById(id: string): Promise<FileUpload | null> {
  const file = await queryOne<any>(
    'SELECT * FROM file_uploads WHERE id = ?',
    [id]
  );

  if (!file) return null;

  return parseFileUploadJson(file);
}

/**
 * Get file uploads by user ID
 */
export async function getFileUploadsByUserId(
  userId: string,
  limit = 50,
  offset = 0
): Promise<FileUpload[]> {
  const files = await query<any[]>(
    `SELECT * FROM file_uploads
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  return files.map(parseFileUploadJson);
}

/**
 * Get file uploads by conversation ID
 */
export async function getFileUploadsByConversationId(conversationId: string): Promise<FileUpload[]> {
  const files = await query<any[]>(
    'SELECT * FROM file_uploads WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]
  );

  return files.map(parseFileUploadJson);
}

/**
 * Delete file upload record
 */
export async function deleteFileUpload(id: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM file_uploads WHERE id = ?',
    [id]
  );
  return (result as any).affectedRows > 0;
}

/**
 * Delete expired temporary files
 */
export async function deleteExpiredFiles(): Promise<number> {
  const result = await query(
    'DELETE FROM file_uploads WHERE is_temporary = true AND expires_at < NOW()'
  );
  return (result as any).affectedRows;
}

/**
 * Get expired file uploads (for cleanup)
 */
export async function getExpiredFiles(): Promise<FileUpload[]> {
  const files = await query<any[]>(
    'SELECT * FROM file_uploads WHERE is_temporary = true AND expires_at < NOW()'
  );

  return files.map(parseFileUploadJson);
}

/**
 * Check if user owns file
 */
export async function userOwnsFile(userId: string, fileId: string): Promise<boolean> {
  const file = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM file_uploads WHERE id = ?',
    [fileId]
  );
  return file?.user_id === userId;
}

// Helper function to parse JSON fields
function parseFileUploadJson(file: any): FileUpload {
  return {
    ...file,
    metadata: typeof file.metadata === 'string' ? JSON.parse(file.metadata) : file.metadata,
  };
}