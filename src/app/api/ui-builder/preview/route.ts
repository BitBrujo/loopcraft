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

    // Prepare metadata - merge standard and UI metadata with proper prefixes
    const metadata: Record<string, unknown> = {};

    // Add standard metadata
    if (resource.metadata?.title) metadata.title = resource.metadata.title;
    if (resource.metadata?.description) metadata.description = resource.metadata.description;

    // Add UI metadata with mcpui.dev/ui- prefix (required by MCP-UI spec)
    if (resource.uiMetadata?.['preferred-frame-size']) {
      metadata['mcpui.dev/ui-preferred-frame-size'] = resource.uiMetadata['preferred-frame-size'];
    }
    if (resource.uiMetadata?.['initial-render-data']) {
      metadata['mcpui.dev/ui-initial-render-data'] = resource.uiMetadata['initial-render-data'];
    }

    switch (resource.contentType) {
      case 'rawHtml': {
        // Replace placeholders with test values for preview
        let htmlContent = resource.content;
        if (resource.placeholderTestData) {
          Object.entries(resource.placeholderTestData).forEach(([placeholder, value]) => {
            // Escape special regex characters in placeholder name
            const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\{\\{${escapedPlaceholder}\\}\\}`, 'g');
            htmlContent = htmlContent.replace(regex, value);
          });
        }

        mcpResource = createUIResource({
          uri: resource.uri as `ui://${string}`,
          content: { type: 'rawHtml', htmlString: htmlContent },
          encoding: 'text',
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
        break;
      }

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
        });
        break;

      case 'remoteDom': {
        // Get framework from config, default to 'react' per official MCP-UI spec
        const framework = resource.remoteDomConfig?.framework || 'react';

        // Validate framework is supported
        if (framework !== 'react' && framework !== 'webcomponents') {
          return NextResponse.json(
            { error: `Unsupported Remote DOM framework: ${framework}. Use 'react' or 'webcomponents'.` },
            { status: 400 }
          );
        }

        mcpResource = createUIResource({
          uri: resource.uri as `ui://${string}`,
          content: {
            type: 'remoteDom',
            script: resource.content,
            framework: framework,
          },
          encoding: 'text',
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
        break;
      }

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
