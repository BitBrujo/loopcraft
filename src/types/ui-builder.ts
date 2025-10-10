// UI Builder types for MCP-UI resource creation
// Aligned with @mcp-ui/server and @modelcontextprotocol/sdk

export type ContentType = 'rawHtml' | 'externalUrl' | 'remoteDom';

/**
 * Remote DOM configuration
 * Used when contentType is 'remoteDom'
 * Framework options per official MCP-UI specification
 */
export interface RemoteDomConfig {
  framework: 'react' | 'webcomponents';
  script?: string; // Optional: script can also be in content field
}

/**
 * Standard metadata that maps to resource _meta property
 * Follows MCP specification for resource metadata
 */
export interface StandardMetadata {
  title?: string;
  description?: string;
  [key: string]: unknown; // Allow additional custom metadata
}

/**
 * MCP-UI specific metadata
 * These keys are automatically prefixed with 'mcpui.dev/ui-' in the resource
 */
export interface UIMetadata {
  /**
   * Preferred initial frame size as [width, height] strings
   * Example: ['800px', '600px']
   */
  'preferred-frame-size'?: [string, string];

  /**
   * Initial data to pass to iframe on render
   * Merged with client-side iframeRenderData if provided
   */
  'initial-render-data'?: Record<string, unknown>;

  /**
   * Auto-resize iframe to content size
   * Can be boolean (both dimensions) or object for granular control
   */
  'auto-resize-iframe'?: boolean | { width?: boolean; height?: boolean };
}

/**
 * UI Resource configuration for the builder
 * Aligns with @mcp-ui/server createUIResource() API
 */
export interface UIResource {
  /** URI for the resource, must start with 'ui://' */
  uri: string;

  /** Type of content being provided */
  contentType: ContentType;

  /**
   * Content string:
   * - For 'rawHtml': HTML string
   * - For 'externalUrl': Full URL
   * - For 'remoteDom': JavaScript/TypeScript script
   */
  content: string;

  /** Standard metadata (maps to _meta property) */
  metadata?: StandardMetadata;

  /** UI-specific metadata (prefixed with mcpui.dev/ui-) */
  uiMetadata?: UIMetadata;

  /** Remote DOM configuration (only when contentType is 'remoteDom') */
  remoteDomConfig?: RemoteDomConfig;

  /** Auto-detected template placeholders like {{agent.name}} */
  templatePlaceholders?: string[];

  /** Test data for placeholders (preview only, not used in export) */
  placeholderTestData?: Record<string, string>;

  /** Selected MCP server ID for integration (optional - null means standalone) */
  selectedServerId?: number | null;

  /** Selected MCP server name for integration (optional - null means standalone) */
  selectedServerName?: string | null;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  resource: UIResource;
  thumbnail?: string;
}

export interface UIBuilderState {
  currentResource: UIResource | null;
  savedTemplates: Template[];
  previewKey: number;
  showPreview: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

/** Builder tabs - simplified to 3 core tabs */
export type TabId = 'configure' | 'design' | 'export';

/** Export format options */
export type ExportFormat = 'integration' | 'standalone' | 'fastmcp';

/** Language options for code generation */
export type ExportLanguage = 'typescript' | 'javascript';
