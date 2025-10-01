import { query, queryOne, execute } from '../db';
import { v4 as uuidv4 } from 'crypto';

export interface UIBuilderTemplate {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description?: string;
  resource: Record<string, unknown>;
  action_mappings?: unknown[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateTemplateInput {
  user_id: string;
  name: string;
  category: string;
  description?: string;
  resource: Record<string, unknown>;
  action_mappings?: unknown[];
}

export interface UpdateTemplateInput {
  name?: string;
  category?: string;
  description?: string;
  resource?: Record<string, unknown>;
  action_mappings?: unknown[];
}

// Get template by ID
export async function getTemplateById(id: string): Promise<UIBuilderTemplate | null> {
  const result = await queryOne<any>(
    'SELECT * FROM ui_builder_templates WHERE id = ?',
    [id]
  );

  if (!result) return null;

  return {
    ...result,
    resource: JSON.parse(result.resource),
    action_mappings: result.action_mappings ? JSON.parse(result.action_mappings) : undefined,
  };
}

// List templates for user
export async function listTemplates(
  userId: string,
  category?: string,
  limit = 50,
  offset = 0
): Promise<UIBuilderTemplate[]> {
  let sql = 'SELECT * FROM ui_builder_templates WHERE user_id = ?';
  const params: any[] = [userId];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const results = await query<any>(sql, params);

  return results.map((row) => ({
    ...row,
    resource: JSON.parse(row.resource),
    action_mappings: row.action_mappings ? JSON.parse(row.action_mappings) : undefined,
  }));
}

// Create template
export async function createTemplate(
  input: CreateTemplateInput
): Promise<UIBuilderTemplate> {
  const id = uuidv4();

  await execute(
    `INSERT INTO ui_builder_templates (id, user_id, name, category, description, resource, action_mappings)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.user_id,
      input.name,
      input.category,
      input.description || null,
      JSON.stringify(input.resource),
      input.action_mappings ? JSON.stringify(input.action_mappings) : null,
    ]
  );

  const template = await getTemplateById(id);
  if (!template) {
    throw new Error('Failed to create template');
  }

  return template;
}

// Update template
export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput
): Promise<UIBuilderTemplate | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.category !== undefined) {
    fields.push('category = ?');
    values.push(input.category);
  }
  if (input.description !== undefined) {
    fields.push('description = ?');
    values.push(input.description);
  }
  if (input.resource !== undefined) {
    fields.push('resource = ?');
    values.push(JSON.stringify(input.resource));
  }
  if (input.action_mappings !== undefined) {
    fields.push('action_mappings = ?');
    values.push(JSON.stringify(input.action_mappings));
  }

  if (fields.length === 0) {
    return getTemplateById(id);
  }

  values.push(id);

  await execute(
    `UPDATE ui_builder_templates SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return getTemplateById(id);
}

// Delete template
export async function deleteTemplate(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM ui_builder_templates WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Get template by name and category (for unique check)
export async function getTemplateByNameAndCategory(
  userId: string,
  name: string,
  category: string
): Promise<UIBuilderTemplate | null> {
  const result = await queryOne<any>(
    'SELECT * FROM ui_builder_templates WHERE user_id = ? AND name = ? AND category = ?',
    [userId, name, category]
  );

  if (!result) return null;

  return {
    ...result,
    resource: JSON.parse(result.resource),
    action_mappings: result.action_mappings ? JSON.parse(result.action_mappings) : undefined,
  };
}

// List categories for user
export async function listCategories(userId: string): Promise<string[]> {
  const results = await query<{ category: string }>(
    'SELECT DISTINCT category FROM ui_builder_templates WHERE user_id = ? ORDER BY category',
    [userId]
  );

  return results.map((row) => row.category);
}
