import { NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';
import { loadMCPConfig } from '@/lib/mcp-config';

export async function GET() {
  try {
    const config = loadMCPConfig();

    // Get connected servers
    const connectedServers = [];
    const availableTools = await mcpClientManager.getAllTools();

    // Group tools by server
    const toolsByServer = new Map<string, any[]>();
    for (const tool of availableTools) {
      if (!toolsByServer.has(tool.serverName)) {
        toolsByServer.set(tool.serverName, []);
      }
      toolsByServer.get(tool.serverName)!.push({
        name: tool.name,
        description: tool.description,
      });
    }

    return NextResponse.json({
      configured: config.servers.map(s => ({
        name: s.name,
        type: s.type,
        command: s.command,
      })),
      connected: Array.from(toolsByServer.keys()),
      tools: Object.fromEntries(toolsByServer),
      totalTools: availableTools.length,
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      configured: [],
      connected: [],
      tools: {},
    }, { status: 500 });
  }
}