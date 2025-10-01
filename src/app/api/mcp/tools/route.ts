import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serverFilter = searchParams.get('server');

  const allTools = await mcpClientManager.getAllTools();

  const filteredTools = serverFilter
    ? allTools.filter((tool) => tool.serverName === serverFilter)
    : allTools;

  return NextResponse.json({ tools: filteredTools });
}
