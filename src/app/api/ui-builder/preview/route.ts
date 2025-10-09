import { NextRequest, NextResponse } from 'next/server';
import { createUIResource } from '@mcp-ui/server';
import type { UIResource } from '@/types/ui-builder';

// POST /api/ui-builder/preview - Convert UI resource to MCP format for preview
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as { resource: UIResource };
    const { resource } = body;

    if (!resource) {
      return NextResponse.json(
        { error: 'Missing resource in request body' },
        { status: 400 }
      );
    }

    // Convert UI resource to MCP UI resource format
    let mcpResource;

    // Prepare metadata
    const metadata: Record<string, unknown> = {};
    if (resource.metadata?.title) metadata.title = resource.metadata.title;
    if (resource.metadata?.description) metadata.description = resource.metadata.description;

    // Prepare UI metadata from existing uiMetadata
    const uiMetadata: Record<string, unknown> = {};
    if (resource.uiMetadata?.['preferred-frame-size']) {
      uiMetadata['preferred-frame-size'] = resource.uiMetadata['preferred-frame-size'];
    }
    if (resource.uiMetadata?.['initial-render-data']) {
      uiMetadata['initial-render-data'] = resource.uiMetadata['initial-render-data'];
    }

    switch (resource.contentType) {
      case 'rawHtml':
        mcpResource = createUIResource({
          uri: resource.uri as `ui://${string}`,
          content: { type: 'rawHtml', htmlString: resource.content },
          encoding: 'text',
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          uiMetadata: Object.keys(uiMetadata).length > 0 ? uiMetadata : undefined,
        });
        break;

      case 'externalUrl':
        // Validate URL is not empty
        if (!resource.content || !resource.content.trim()) {
          return NextResponse.json(
            { error: 'URL cannot be empty for external URL resources' },
            { status: 400 }
          );
        }
        mcpResource = createUIResource({
          uri: resource.uri as `ui://${string}`,
          content: { type: 'externalUrl', iframeUrl: resource.content },
          encoding: 'text',
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          uiMetadata: Object.keys(uiMetadata).length > 0 ? uiMetadata : undefined,
        });
        break;

      case 'remoteDom':
        mcpResource = createUIResource({
          uri: resource.uri as `ui://${string}`,
          content: {
            type: 'remoteDom',
            script: resource.content,
            framework: 'react',
          },
          encoding: 'text',
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          uiMetadata: Object.keys(uiMetadata).length > 0 ? uiMetadata : undefined,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown content type: ${resource.contentType}` },
          { status: 400 }
        );
    }

    // Return the MCP resource wrapped in content format for MCPUIRenderer
    return NextResponse.json({
      success: true,
      mcpResource: {
        type: 'resource',
        resource: mcpResource
      },
      message: 'UI resource generated successfully for preview.',
    });
  } catch (error) {
    console.error('Failed to generate preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
