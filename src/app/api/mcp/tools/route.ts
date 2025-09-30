import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';

export const dynamic = 'force-dynamic';

// GET /api/mcp/tools - List all available tools from connected MCP servers
export async function GET() {
  try {
    const tools = await mcpClientManager.getAllTools();

    return NextResponse.json({
      success: true,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        serverName: tool.serverName,
      })),
    });
  } catch (error) {
    console.error('Error fetching MCP tools:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tools',
    }, { status: 500 });
  }
}

// POST /api/mcp/tools - Execute a tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverName, toolName, args } = body;

    if (!serverName || !toolName) {
      return NextResponse.json({
        success: false,
        error: 'Server name and tool name are required',
      }, { status: 400 });
    }

    const startTime = Date.now();
    const result = await mcpClientManager.callTool(serverName, toolName, args || {});
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      result,
      duration,
    });
  } catch (error) {
    console.error('Error executing MCP tool:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute tool',
    }, { status: 500 });
  }
}