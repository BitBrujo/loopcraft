import { NextRequest, NextResponse } from 'next/server';
import {
  listTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  listCategories,
} from '@/lib/db/templates';

// Default demo user ID (in production, get from JWT token)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

function getUserIdFromRequest(request: NextRequest): string {
  // TODO: Extract user ID from JWT token in Authorization header
  // For now, use demo user
  return DEMO_USER_ID;
}

// GET /api/templates - List templates
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const action = searchParams.get('action');

    // Special action: list categories
    if (action === 'categories') {
      const categories = await listCategories(userId);
      return NextResponse.json(categories);
    }

    const templates = await listTemplates(userId, category, limit, offset);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create template
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();

    if (!body.name || !body.category || !body.resource) {
      return NextResponse.json(
        { error: 'Name, category, and resource are required' },
        { status: 400 }
      );
    }

    const template = await createTemplate({
      user_id: userId,
      name: body.name,
      category: body.category,
      description: body.description,
      resource: body.resource,
      action_mappings: body.action_mappings,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Update template (handled via query param)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const template = await updateTemplate(id, {
      name: body.name,
      category: body.category,
      description: body.description,
      resource: body.resource,
      action_mappings: body.action_mappings,
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates - Delete template (handled via query param)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteTemplate(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
