import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serverFilter = searchParams.get('server');

  const allResources = await mcpClientManager.getAllResources();

  const filteredResources = serverFilter
    ? allResources.filter((resource) => resource.serverName === serverFilter)
    : allResources;

  return NextResponse.json({ resources: filteredResources });
}
