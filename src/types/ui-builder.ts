// UI Builder types for MCP-UI resource creation
// Aligned with @mcp-ui/server and @modelcontextprotocol/sdk

export type ContentType = 'rawHtml' | 'externalUrl' | 'remoteDom';

/**
 * Resource audience targeting
 * Controls who can see and interact with the UI resource
 * - 'user': End-users in production interfaces
 * - 'assistant': AI assistants only (hidden from end-users)
 */
export type Audience = 'user' | 'assistant' | 'all';

/**
 * Content encoding format
 * - 'text': UTF-8 text encoding (default)
 * - 'base64': Base64-encoded binary data (for images, binary files)
 */
export type Encoding = 'text' | 'base64';

/**
 * Supported content types for rendering
 * Used to restrict which rendering modes are allowed for security/policy enforcement
 */
export type SupportedContentType = 'rawHtml' | 'externalUrl' | 'remoteDom';

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
 * Container style configuration for iframe wrapper
 */
export interface ContainerStyle {
  border?: string;        // e.g., "1px solid #ccc"
  borderColor?: string;   // e.g., "#007acc"
  borderRadius?: string;  // e.g., "8px"
  minHeight?: string;     // e.g., "400px"
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

  /**
   * Iframe sandbox permissions
   * Controls security restrictions for iframe content
   * Common values: 'allow-scripts', 'allow-forms allow-scripts allow-same-origin'
   */
  'sandbox-permissions'?: string;

  /**
   * Iframe title attribute for accessibility
   * Helps screen readers identify the iframe content
   */
  'iframe-title'?: string;

  /**
   * Container style configuration
   * CSS properties for the iframe wrapper element
   */
  'container-style'?: ContainerStyle;
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

  // ==================== Companion Mode Options ====================

  /**
   * Companion mode setting
   * When enabled, creates a UI-only server that calls tools from another MCP server
   * - 'disabled': Regular server integration or standalone mode
   * - 'enabled': Companion server that forwards tool calls to target server
   */
  companionMode?: 'disabled' | 'enabled';

  /**
   * Target server name for companion mode
   * The name of the MCP server whose tools will be called
   * Only used when companionMode is 'enabled'
   */
  companionTargetServerName?: string | null;

  /**
   * Selected tools for companion mode
   * Array of tool names from the target server to expose via this UI
   * Only used when companionMode is 'enabled'
   */
  companionSelectedTools?: string[];

  // ==================== Advanced Resource Options ====================

  /**
   * Target audience for this UI resource
   * Controls visibility and access:
   * - ['user']: Only visible to end-users in production interfaces
   * - ['assistant']: Only visible to AI assistants (hidden from end-users)
   * - undefined: Visible to both (default behavior)
   */
  audience?: ('user' | 'assistant')[];

  /**
   * Display priority for this resource (0.0 to 1.0)
   * Higher priority resources are displayed first when multiple UIs are available
   * - 0.0: Lowest priority
   * - 0.5: Medium priority
   * - 1.0: Highest priority
   * - undefined: Default priority (no preference)
   */
  priority?: number;

  /**
   * Last modification timestamp (ISO 8601 format)
   * Automatically updated when resource is modified
   * Used for versioning and cache invalidation
   * Example: "2025-10-10T12:34:56Z"
   */
  lastModified?: string;

  /**
   * MIME type override for specialized content handling
   * Default values if not specified:
   * - rawHtml: "text/html"
   * - externalUrl: "text/uri-list"
   * - remoteDom: "application/vnd.mcp-ui.remote-dom"
   */
  mimeType?: string;

  /**
   * Content encoding format
   * - 'text': UTF-8 text encoding (default, standard HTML)
   * - 'base64': Base64-encoded binary data (for embedding images, binary files)
   * Only applies to rawHtml content type
   */
  encoding?: 'text' | 'base64';

  /**
   * Supported content types for rendering
   * Restricts which rendering modes are allowed for security/policy enforcement
   * - undefined: All content types allowed (default)
   * - ['rawHtml']: Only raw HTML rendering
   * - ['externalUrl']: Only external URL embeds
   * - ['rawHtml', 'externalUrl']: Both HTML and URL, but not Remote DOM
   */
  supportedContentTypes?: ('rawHtml' | 'externalUrl' | 'remoteDom')[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  resource: UIResource;
  thumbnail?: string;
}

/**
 * MCP Tool schema information
 * Used for companion mode to display available tools from target server
 */
export interface ToolSchema {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * Companion server mode
 * Creates a UI-only server that interacts with an existing MCP server's tools
 */
export type CompanionMode = 'disabled' | 'enabled';

export interface UIBuilderState {
  currentResource: UIResource | null;
  savedTemplates: Template[];
  previewKey: number;
  showPreview: boolean;
  isLoading: boolean;
  error: string | null;

  // Companion mode state
  companionMode: CompanionMode;
  targetServerName: string | null;
  availableTools: ToolSchema[];
  selectedTools: string[]; // Array of tool names to interact with
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
