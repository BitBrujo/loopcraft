import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';

export const dynamic = 'force-dynamic';

// GET /api/mcp/resources - List all available resources from connected MCP servers
export async function GET() {
  try {
    const resources = await mcpClientManager.getAllResources();

    return NextResponse.json({
      success: true,
      resources: resources.map(resource => ({
        uri: resource.uri,
        name: resource.name || resource.uri,
        description: resource.description,
        mimeType: resource.mimeType,
        serverName: resource.serverName,
      })),
    });
  } catch (error) {
    console.error('Error fetching MCP resources:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch resources',
    }, { status: 500 });
  }
}

// POST /api/mcp/resources - Fetch a specific resource
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverName, uri } = body;

    if (!serverName || !uri) {
      return NextResponse.json({
        success: false,
        error: 'Server name and resource URI are required',
      }, { status: 400 });
    }

    const resource = await mcpClientManager.getResource(serverName, uri);

    return NextResponse.json({
      success: true,
      resource,
    });
  } catch (error) {
    console.error('Error fetching MCP resource:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch resource',
    }, { status: 500 });
  }
}