// UI Builder types for MCP-UI resource creation
// Aligned with @mcp-ui/server and @modelcontextprotocol/sdk

export type ContentType = 'rawHtml' | 'externalUrl' | 'remoteDom';

/**
 * Companion mode for creating UI-only servers
 * - 'disabled': Standalone server or integration with existing server
 * - 'enabled': Create UI-only server that calls tools from another MCP server
 */
// CompanionMode removed - UI Builder is now companion-only

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
   * Sets the initial dimensions when iframe first renders
   *
   * Example: ['800px', '600px']
   *
   * Works with auto-resize-iframe for two-phase rendering:
   * 1. Initial render at preferred size (loading state)
   * 2. Auto-resize to content if enabled (final state)
   */
  'preferred-frame-size'?: [string, string];

  /**
   * Initial data to pass to iframe on render
   * Merged with client-side iframeRenderData if provided
   */
  'initial-render-data'?: Record<string, unknown>;

  /**
   * Auto-resize iframe to content size after initial render
   * Can be boolean (both dimensions) or object for granular control
   *
   * Examples:
   * - false: Iframe stays at preferred-frame-size (default behavior)
   * - true: Resizes both width and height to match content
   * - { width: true }: Only width adjusts, height stays at preferred size
   * - { height: true }: Only height adjusts, width stays at preferred size
   *
   * Two-phase rendering timeline:
   * 1. Iframe renders at preferred-frame-size: ['800px', '600px']
   * 2. After 100ms delay, auto-resize adjusts to content dimensions
   *
   * Common patterns:
   * - Fixed size: preferred-frame-size + auto-resize: false
   * - Dynamic height: preferred-frame-size + auto-resize: { height: true }
   * - Fully responsive: preferred-frame-size + auto-resize: true
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

  /** Target MCP server ID for integration (null = standalone) */
  selectedServerId?: number | null;

  /** Target MCP server name for integration */
  selectedServerName?: string | null;

  /** Tool-to-action bindings for visual configuration */
  toolBindings?: ToolBinding[];

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
 * Form field information from parsed HTML
 */
export interface FormField {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

/**
 * Interactive HTML element that can trigger actions
 */
export interface InteractiveElement {
  id: string;
  type: 'button' | 'form' | 'input' | 'select' | 'textarea' | 'custom';
  tagName: string;
  text?: string;
  formFields?: FormField[];      // For forms
}

/**
 * How a tool parameter gets its value
 */
export interface ParameterMapping {
  source: 'static' | 'form';    // Static value or form field
  value: string;                 // Static value or form field ID
}

/**
 * Tool-to-action binding configuration
 * Maps a tool to an HTML element and configures parameter sources
 */
export interface ToolBinding {
  toolName: string;              // Tool name (e.g., "create_contact")
  triggerId: string | null;      // HTML element ID that triggers this tool
  parameterMappings: Record<string, ParameterMapping>;  // How each param gets its value
}

export interface UIBuilderState {
  currentResource: UIResource | null;
  savedTemplates: Template[];
  previewKey: number;
  showPreview: boolean;
  isLoading: boolean;
  error: string | null;

  // Companion server state (always companion mode)
  targetServerName: string | null;
  availableTools: ToolSchema[];
  selectedTools: string[]; // Array of tool names to interact with
}

export interface ValidationError {
  field: string;
  message: string;
}

/** Builder tabs - 4 core tabs (added Composition for guided pattern building) */
export type TabId = 'configure' | 'design' | 'composition' | 'export';

/** Export format options */
export type ExportFormat = 'integration' | 'standalone' | 'fastmcp';

/** Language options for code generation */
export type ExportLanguage = 'typescript' | 'javascript';
