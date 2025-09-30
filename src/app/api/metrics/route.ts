import { NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client';

export const dynamic = 'force-dynamic';

// GET /api/metrics - Get current metrics for MCP operations
export async function GET() {
  try {
    const connectedServers = mcpClientManager.getConnectedServers();
    const tools = await mcpClientManager.getAllTools();
    const resources = await mcpClientManager.getAllResources();

    // In a real implementation, you would track these metrics over time
    // For now, we'll return basic connection information
    const metrics = {
      toolCalls: 0, // Would be tracked via middleware/logging
      successRate: 100, // Would be calculated from tracked calls
      averageLatency: 0, // Would be averaged from tracked calls
      activeConnections: connectedServers.length,
      errorCount: 0, // Would be tracked via error logging
      totalTools: tools.length,
      totalResources: resources.length,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch metrics',
    }, { status: 500 });
  }
}