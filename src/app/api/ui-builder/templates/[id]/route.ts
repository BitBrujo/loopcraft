import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// DELETE /api/ui-builder/templates/:id - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    // Check if template exists and belongs to user
    const existing = await query<Array<{ id: number }>>(
      'SELECT id FROM ui_templates WHERE id = ? AND user_id = ?',
      [templateId, user.userId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Template not found or not owned by user' },
        { status: 404 }
      );
    }

    // Delete the template
    await query<ResultSetHeader>(
      'DELETE FROM ui_templates WHERE id = ? AND user_id = ?',
      [templateId, user.userId]
    );

    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
