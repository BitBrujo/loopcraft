import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import type { UITemplateCreate } from '@/types/database';

// GET /api/ui-builder/templates - List all templates for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's templates from database
    const templates = await query<Array<{
      id: number;
      user_id: number;
      name: string;
      category: string;
      resource_data: string;
      created_at: Date;
      updated_at: Date;
    }>>(
      `SELECT
        id,
        user_id,
        name,
        category,
        resource_data,
        created_at,
        updated_at
      FROM ui_templates
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [user.userId]
    );

    // Parse JSON resource_data for each template
    const parsedTemplates = templates.map((template) => ({
      ...template,
      resource_data: JSON.parse(template.resource_data),
    }));

    return NextResponse.json(parsedTemplates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/ui-builder/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = (await request.json()) as UITemplateCreate;
    const { name, category, resource_data } = body;

    // Validate required fields
    if (!name || !category || !resource_data) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, resource_data' },
        { status: 400 }
      );
    }

    // Convert resource_data object to JSON string for storage
    const resourceDataJson = JSON.stringify(resource_data);

    // Insert template into database
    const result = await query<ResultSetHeader>(
      `INSERT INTO ui_templates (user_id, name, category, resource_data)
       VALUES (?, ?, ?, ?)`,
      [user.userId, name, category, resourceDataJson]
    );

    // Fetch the created template
    const createdTemplate = await query<Array<{
      id: number;
      user_id: number;
      name: string;
      category: string;
      resource_data: string;
      created_at: Date;
      updated_at: Date;
    }>>(
      `SELECT
        id,
        user_id,
        name,
        category,
        resource_data,
        created_at,
        updated_at
      FROM ui_templates
      WHERE id = ?`,
      [result.insertId]
    );

    if (createdTemplate.length === 0) {
      return NextResponse.json(
        { error: 'Template created but not found' },
        { status: 500 }
      );
    }

    // Parse resource_data before returning
    const template = {
      ...createdTemplate[0],
      resource_data: JSON.parse(createdTemplate[0].resource_data),
    };

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
