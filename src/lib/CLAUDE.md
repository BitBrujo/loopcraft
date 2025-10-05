# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Library

This directory contains core utilities and MCP client implementation.

### Files

**mcp-client.ts** - MCP Client Manager
- Exports `MCPClientManager` class and global singleton instance
- Manages connections to multiple MCP servers simultaneously
- **Transport Types**:
  - `stdio`: Local process-based servers using StdioClientTransport
  - `sse`: Remote HTTP servers using SSEClientTransport (Server-Sent Events)
  - `http`: HTTP streaming (treated as SSE)

**MCPServer Interface:**
```typescript
interface MCPServer {
  name: string;
  command?: string[];      // For stdio servers
  url?: string;            // For sse/http servers
  type: 'stdio' | 'sse' | 'http';
  env?: Record<string, string>; // Environment variables for authentication
}
```

**Key Methods:**
- `connectToServer(server)`: Establishes connection to MCP server
  - **Idempotent**: Skips connection if already connected (lines 20-23)
  - Creates appropriate transport based on server type
  - **Stdio transport** (lines 28-44):
    - Passes environment variables to spawned process
    - Merges `server.env` with `process.env`
    - Filters out undefined values from process.env
  - **SSE/HTTP transport** (lines 45-60):
    - Converts environment variables to HTTP headers
    - **Smart header mapping**:
      - `API_KEY` → `Authorization: Bearer {value}`
      - `BEARER_TOKEN` → `Authorization: Bearer {value}`
      - `HEADER_X_Custom` → `X-Custom: {value}` (custom headers)
      - Other variables passed as-is
  - Initializes Client with capabilities: tools, resources, prompts
  - Stores client and transport in Maps keyed by server name
  - **Error tracking**: On connection failure, stores error message in `connectionErrors` Map
  - **Error cleanup**: Clears error message on successful connection
- `getAllTools()`: Fetches tools from all connected servers
  - Returns array with tool metadata + serverName
  - Handles errors per server without failing entire operation
- `getAllResources()`: Fetches resources from all connected servers
  - Resources can include UI resources (uri starting with `ui://`)
- `callTool(serverName, toolName, args)`: Executes a tool on specific server
  - Sends `tools/call` request via MCP protocol
  - Returns tool result (may include UI resources)
- `getResource(serverName, uri)`: Fetches a resource by URI
  - Sends `resources/read` request via MCP protocol
- `getConnectedServers()`: Lists active server connections
- `isConnected(serverName)`: Checks if server is connected
- `disconnectFromServer(serverName)`: Closes client and transport, clears error messages
- `getConnectionError(serverName)`: Get error message for failed connection (returns undefined if no error)
- `clearConnectionError(serverName)`: Clear stored error message for a server
- `trackUserServer(userId, serverName)`: Track which servers belong to which user
- `getUserServers(userId)`: Get Set of server names for a specific user
- `cleanupUserServers(userId, currentServerNames)`: Disconnect servers deleted from database
  - Compares tracked servers with current database list
  - Disconnects any servers no longer in database
  - Updates tracked server list for the user

**Authentication Patterns:**
- **Stdio servers**: Environment variables passed directly to child process
  - Example: `{ env: { "API_KEY": "sk-xxx" } }` → process receives API_KEY
- **SSE/HTTP servers**: Environment variables converted to headers
  - Example: `{ env: { "API_KEY": "sk-xxx" } }` → `Authorization: Bearer sk-xxx` header
  - Custom headers: `HEADER_X_API_Key` → `X-API-Key` header

**Global Instance:**
Exports singleton `mcpClientManager` for use across the application.

**mcp-config.ts** - MCP Configuration (Reference Only)
- Defines MCP server configuration structure for reference
- **Not used in production** - all servers are user-specific via database
- `loadMCPConfig()`: Legacy function, returns empty config by default
- `defaultMCPConfig`: Empty servers array (no global servers)
- `exampleMCPServers`: Example configurations for reference:
  - filesystem: File system access
  - brave-search: Web search via Brave
  - memory: Persistent memory/storage

**Note**: MCP_CONFIG environment variable is deprecated. Use Settings UI to configure servers.

**mcp-init.ts** - Shared MCP Initialization Utilities
- Provides centralized MCP server initialization logic used across all API routes
- Ensures consistent server connection handling for user-specific servers
- **State Management**:
  - `globalMCPInitialized`: Legacy flag (always false, no global servers)
- **Key Functions**:
  - `initializeGlobalMCP()`: Legacy function - loads empty config (no-op)
    - Maintained for backward compatibility
    - Does not connect any servers
  - `loadUserMCPServers(request)`: Load and connect user-specific MCP servers from database
    - Idempotent: `connectToServer()` skips if already connected
    - Extracts user from JWT token in request via `getUserFromRequest()`
    - Returns silently if user not authenticated
    - Fetches enabled servers from `mcp_servers` table
    - Parses JSON config and connects each server
    - Tracks user's servers via `mcpClientManager.trackUserServer()`
    - **Cleanup deleted servers**: Compares current database servers with cached connections
    - Automatically disconnects servers that were deleted from settings
    - Logs errors without failing (non-blocking)
  - `initializeAllMCPServers(request)`: Convenience wrapper for initialization
    - Calls `loadUserMCPServers(request)` (no global servers)
    - Recommended for all API routes that need MCP access
- **Usage Pattern**:
  ```typescript
  import { initializeAllMCPServers } from '@/lib/mcp-init';

  export async function GET(request: Request) {
    await initializeAllMCPServers(request);
    // Now mcpClientManager has all user-configured servers
    const tools = await mcpClientManager.getAllTools();
  }
  ```
- **Used By**:
  - `/api/chat` - Chat endpoint with tool calling (user servers only)
  - `/api/mcp/servers` - List connected servers (user servers only)
  - `/api/mcp/tools` - List available tools from user servers
  - `/api/mcp/resources` - List available resources from user servers

**utils.ts** - Utility functions
- `cn()`: Tailwind CSS class merging utility using clsx and tailwind-merge
- Ensures proper class name handling and conflict resolution

**db.ts** - Database Connection & Query Utilities
- Exports MySQL connection pool singleton using `mysql2/promise`
- **Connection Pool Configuration**:
  - Host, port, user, password, database from environment variables
  - 10 concurrent connections max
  - Keep-alive enabled for persistent connections
  - Automatic reconnection handling
- **Key Functions**:
  - `getPool()`: Returns singleton connection pool instance
  - `query<T>(sql, params)`: Execute parameterized SQL query
    - Returns typed results (array of rows)
    - Automatically uses connection pool
    - Supports prepared statements for SQL injection prevention
  - `queryOne<T>(sql, params)`: Execute query and return first result or null
    - Convenient wrapper for single-row queries
  - `testConnection()`: Test database connectivity (returns boolean)
  - `closePool()`: Close all connections (cleanup on shutdown)
- **Security**: All queries use parameterized statements to prevent SQL injection

**auth.ts** - Authentication & Authorization Utilities
- Handles JWT token management and password hashing
- **Constants**:
  - `JWT_SECRET`: from env or default (change in production!)
  - `JWT_EXPIRES_IN`: Token expiration time (default: 7d)
  - `SALT_ROUNDS`: bcrypt salt rounds (10)
- **Key Functions**:
  - `hashPassword(password)`: Generate bcrypt hash for password storage
    - Uses 10 salt rounds for security/performance balance
    - Returns Promise<string> with hashed password
  - `verifyPassword(password, hash)`: Verify password against stored hash
    - Returns Promise<boolean>
    - Constant-time comparison via bcrypt
  - `generateToken(payload)`: Create JWT token from payload
    - Payload: `{ userId: number, email: string }`
    - Returns signed JWT string with expiration
  - `verifyToken(token)`: Validate and decode JWT
    - Returns decoded payload or null if invalid/expired
    - Handles all JWT errors gracefully
  - `extractTokenFromHeader(authHeader)`: Parse Bearer token from Authorization header
    - Expects format: "Bearer <token>"
    - Returns token string or null
  - `getUserFromRequest(request)`: Extract and verify user from request
    - Convenience function combining header extraction and token verification
    - Returns decoded payload or null
    - Use in API routes to authenticate requests

**stores/server-builder-store.ts** - MCP Server Builder State Management
- Zustand store with localStorage persistence
- Manages MCP Server Builder state

**State Fields:**
- `serverConfig`: Current server configuration (name, description, tools, transport type)
- `activeTool`: Tool being edited
- `activeTab`: Current tab ('templates' | 'customize' | 'test')
- `testResults`: Array of TestResult objects
- `isTestServerActive`: Boolean flag for test server status
- `testServerName`: Name of active test server (or null)
- `testServerId`: Database ID of test server (or null)
- `testServerFile`: File path of temp server (or null)
- `isLoading`: Loading state
- `error`: Error message

**Action Methods:**
- **Server Config**: `setServerConfig`, `updateServerConfig`, `resetServerConfig`
- **Tools**: `addTool`, `updateTool`, `removeTool`
- **Active Tool**: `setActiveTool`, `updateActiveTool`
- **Tabs**: `setActiveTab`
- **Test**: `addTestResult`, `clearTestResults`, `startTestServer`, `stopTestServer`
- **Loading/Error**: `setLoading`, `setError`

**Persistence:**
Partial persistence via Zustand middleware:
- Persisted: `serverConfig`, `activeTool`, `activeTab`
- Not persisted: `testResults`, `isLoading`, `error`, test server state

**stores/ui-builder-store.ts** - MCP-UI Wrapper Builder State Management
- Zustand store with localStorage persistence
- Manages UI Wrapper Builder state

**State Fields:**
- `currentResource`: UIResource being edited (includes `templatePlaceholders`)
- `savedTemplates`: User's saved templates
- `activeTab`: Current tab ('design' | 'tools' | 'actions' | 'generate' | 'test')
- `uiMode`: UI mode ('readonly' | 'interactive')
- `connectedServerName`: Selected MCP server to wrap with UI (**new field**)
- `mcpContext`: MCP integration context
- `customTools`: User-defined custom tools
- `actionMappings`: UI element → tool bindings
- `testConfig`: Test configuration
- `validationStatus`: Validation state
- `isTestServerActive`, `testServerName`, `testServerId`, `testServerFile`: Test server tracking
- `previewKey`, `showPreview`, `isLoading`, `error`: UI state

**Action Methods:**
- **Basic**: `setCurrentResource`, `updateResource`, `resetResource`, `loadTemplate`
- **Complete State**: `loadCompleteState(state)` - Restores saved template state
- **Templates**: `setSavedTemplates`, `addTemplate`, `removeTemplate`
- **Tabs**: `setActiveTab`
- **UI Mode**: `setUIMode`
- **Connected Server**: `setConnectedServerName` (**new method**)
- **MCP Context**: `setMCPContext`, `addSelectedTool`, `removeSelectedTool`, `toggleServer`, `setPurpose`
- **Custom Tools**: `addCustomTool`, `updateCustomTool`, `removeCustomTool`, `clearCustomTools`
- **Action Mappings**: `addActionMapping`, `updateActionMapping`, `removeActionMapping`, `clearActionMappings`
- **Test Config**: `setTestConfig`, `addMockResponse`, `removeMockResponse`, `addTestResult`, `toggleMockData`
- **Test Server**: `startTestServer`, `stopTestServer`
- **Validation**: `setValidationStatus`, `addValidationWarning`, `clearValidationWarnings`
- **Preview**: `refreshPreview`, `setShowPreview`
- **Loading/Error**: `setLoading`, `setError`

**Persistence:**
Partial persistence via Zustand middleware:
- Persisted: `currentResource`, `showPreview`, `activeTab`, `uiMode`, `mcpContext`, `connectedServerName`, `customTools`, `actionMappings`, `testConfig` (excluding testHistory)
- Not persisted: `savedTemplates`, `isLoading`, `error`, `validationStatus`

**tool-templates.ts** - MCP Server Builder Template Library
- 60+ pre-built tool templates across 10 categories
- Plain language descriptions for non-technical users

**Key Functions:**
- `toolTemplates`: Array of 60+ ToolTemplate objects
  - Each template includes: id, name, category, description
  - Plain language fields: `userEnters` (what user provides), `userSees` (what user experiences)
  - Complete tool definition with parameters, return type, examples
- `getCategorizedTemplates()`: Group templates by category
  - Returns: `Record<string, ToolTemplate[]>`
- `getCategoryInfo(category)`: Get category metadata
  - Returns: `{ icon, title, description }`

**Template Categories:**
- `forms`: Accept Form Data (6 templates: Contact, Sign Up, Feedback, Settings, Survey, Booking)
- `search`: Search & Find (6 templates: Simple, Advanced, Auto-Complete, Find by ID, Location, Faceted)
- `save`: Save & Store (6 templates: Add New, Edit, Save Draft, Import, Delete, Batch Update)
- `show`: Show Information (6 templates: Profile, Dashboard, List, Status Check, Activity Log, Report)
- `process`: Process Data (6 templates: Calculate, Convert, Validate, Generate Code, Transform, Aggregate)
- `messages`: Send Messages (6 templates: Email, Push Notification, Webhook, SMS, Slack, In-App)
- `security`: Security & Access (6 templates: Login, Permissions, Password Reset, 2FA, API Key, Session)
- `payments`: Money & Payments (6 templates: Payment, Pricing, Discount, Refund, Subscription, Invoice)
- `files`: Files & Media (6 templates: Upload, Download, Preview, Convert, List, Delete)
- `external`: External Services (6 templates: Weather, URL Shortener, Translate, Geocode, QR Code, Currency)

**html-parser.ts** - HTML Parser for MCP-UI Wrapper Builder
- Parses HTML content to detect interactive elements and template placeholders
- Uses native browser DOMParser for client-side parsing

**Key Functions:**
- `parseHTMLForInteractiveElements(htmlContent)`: Parse HTML and extract interactive elements
  - Detects: buttons, forms, links, inputs, selects, textareas, elements with `[data-action]`
  - Returns array of InteractiveElement with id, type, tagName, attributes, text, formFields
  - Auto-generates IDs for elements without explicit IDs
  - Special handling for forms: extracts form fields with types and required status
- `validateElementId(htmlContent, elementId)`: Check if element ID exists in HTML
  - Searches by id, data-action-id, or name attribute
- `getElementType(htmlContent, elementId)`: Get element type by ID
  - Returns: 'button' | 'form' | 'link' | 'input' | 'select' | 'textarea' | 'custom'
- **`extractTemplatePlaceholders(htmlContent)`**: **[New]** Extract template placeholders from HTML
  - Finds patterns like `{{agent.name}}`, `{{context.data}}`, etc.
  - Uses regex: `/\{\{([^}]+)\}\}/g`
  - Returns array of unique placeholder names (without `{{}}`)
- **`hasTemplatePlaceholders(htmlContent)`**: **[New]** Quick check for template placeholders
  - Returns boolean: true if HTML contains any `{{...}}` patterns

**Types:**
- `InteractiveElement`: { id, type, tagName, attributes, text?, formFields? }
- `FormField`: { id, name, type, required }

**validation-engine.ts** - Validation Engine for MCP-UI Builder
- Validates action mappings against tool schemas and HTML content
- Provides type checking and completeness validation
- **Updated to validate parameter sources** (static, form, agent, tool)

**Key Functions:**
- `validateActionMappings(mappings, htmlContent, availableTools, templatePlaceholders?)`: **[Updated]** Validate all action mappings
  - Returns ValidationStatus with missingMappings, typeMismatches, warnings
  - **New parameter sources validation**:
    - **Static**: Checks value is non-empty
    - **Form**: Validates field exists in HTML + type compatibility check
    - **Agent**: Validates placeholder exists in `templatePlaceholders` array
    - **Tool**: Shows warning (not yet supported)
  - **Backward compatible**: Still validates legacy `parameterBindings` if `parameterSources` not present
  - Checks: element existence, tool availability, required parameters, type compatibility
  - Type mapping: HTML input types → TypeScript types (text→string, number→number, checkbox→boolean)
- `validateActionMappingsDebounced(mappings, htmlContent, tools, callback, delay, templatePlaceholders?)`: **[Updated]** Debounced validation
  - Default delay: 300ms
  - Prevents excessive validation on rapid changes
  - Now accepts `templatePlaceholders` parameter for agent context validation
- `isValidationValid(status)`: Check if validation passed (no errors)
- `getValidationSummary(status)`: Get summary message (e.g., "2 errors, 1 warning")

**Type Mappings:**
- HTML input → TypeScript: text/email/url→string, number/range→number, checkbox→boolean, select-multiple→array
- JSON Schema → TypeScript: string→string, number/integer→number, boolean→boolean, array→array, object→object

**code-generation.ts** - Code Generation Utilities for MCP-UI Builder
- Generates TypeScript, server code, and export formats for MCP-UI resources
- Used by GenerateTab, TestTab, and ExportDialog for code preview and export

**Key Functions:**
- `generateTypeScriptCode(resource: UIResource)`: Generate `createUIResource` TypeScript code
  - Returns code using `@mcp-ui/server` package
  - Uses correct API format: `{ content: { type: 'rawHtml', htmlString: '...' } }`
  - Includes metadata (title, description) when available
- `generateServerCode(resource: UIResource)`: Generate complete MCP server implementation
  - Returns ready-to-run stdio server code with shebang (`#!/usr/bin/env node`)
  - **Agent Placeholder Support**:
    - Extracts placeholders from `resource.templatePlaceholders`
    - Generates `fillAgentPlaceholders()` helper function with regex replacement
    - Creates `get_ui` tool with agent context parameters (one per placeholder)
    - Replaces placeholders in HTML before calling `createUIResource()`
  - Server initialization with capabilities
  - Tool list handler with `get_ui` tool schema
  - Tool call handler with placeholder replacement logic
  - Stdio transport with error handling
- `generateUIToolCode(resource: UIResource)`: Generate standalone UI tool
  - Returns tool definition and handler function
  - Uses `__MCP_UI_RESOURCE__:` prefix pattern for MCP protocol
  - Ready to integrate into existing MCP servers
- `generateQuickStartGuide(agentSlots: number, userActions: number, tools: number)`: Generate setup guide
  - Returns markdown guide with installation steps
  - **Agent context instructions**: How to test with placeholder values
  - Example prompts for testing with agent context
  - Includes troubleshooting for placeholder issues
  - Provides troubleshooting tips and configuration examples

**Agent Placeholder Implementation:**
- Detects `{{placeholders}}` from `resource.templatePlaceholders` array
- Escapes special regex characters: `placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
- Generates helper: `function fillAgentPlaceholders(html, agentContext) { ... }`
- Each placeholder gets: `if (agentContext['placeholder']) { result = result.replace(/\{\{placeholder\}\}/g, agentContext['placeholder']); }`
- `get_ui` tool schema includes all placeholders as string parameters
- Example flow:
  - HTML: `<p>Welcome {{agent.name}}!</p>`
  - AI calls: `get_ui({ "agent.name": "Alice" })`
  - Server: Replaces `{{agent.name}}` → `Alice`
  - Returns: `<p>Welcome Alice!</p>`

**Usage Pattern:**
```typescript
import {
  generateTypeScriptCode,
  generateServerCode,
  generateUIToolCode,
  generateQuickStartGuide,
} from '@/lib/code-generation';

const tsCode = generateTypeScriptCode(currentResource);
const serverCode = generateServerCode(currentResource);
// serverCode includes fillAgentPlaceholders() if placeholders detected
```

**flow-generator.ts** - Flow Generator for MCP-UI Builder
- Generates React Flow diagram nodes and edges from builder state
- Uses Dagre for automatic hierarchical layout

**Key Functions:**
- `generateFlow(input)`: Generate flow diagram from builder state
  - Input: { mcpContext, actionMappings, currentResource }
  - Returns: { nodes: Node[], edges: Edge[] }
  - Generates nodes: Server (blue), Tool (purple), UI (green), Action (orange), Handler (pink)
  - Generates edges: Server→Tool, Tool→UI, UI→Action, Action→Tool, Action→Handler
  - Applies Dagre layout algorithm for hierarchical positioning
- `getFlowStatistics(input)`: Get flow statistics
  - Returns: { serverCount, toolCount, actionCount, handlerCount, totalNodes }

**Layout:**
- Direction: Top-to-bottom (TB)
- Node size: 180x60 pixels
- Rank separation: 100px
- Node separation: 50px

### MCP Integration Pattern

1. User adds MCP server via Settings UI
2. Server config stored in database per user
3. Connect to servers during API initialization (if user authenticated)
4. Fetch tools/resources dynamically from connected user servers
5. Prefix tools as `mcp_{serverName}_{toolName}` for uniqueness
6. Execute tools via MCPClientManager when AI calls them
7. Return results to AI (including UI resources for rendering)

### Adding New MCP Servers

All MCP servers are user-specific and configured through the Settings UI:
1. Navigate to Settings > MCP Servers tab
2. Click "Add Server" button
3. Configure server details:
   - Name: Unique identifier for the server
   - Type: stdio (local process) or sse/http (remote)
   - Command/URL: Execution command or API endpoint
   - Environment variables: Authentication tokens, API keys, etc.
4. Enable the server
5. Server auto-connects on next API request

**No global/shared servers**: Each user manages their own MCP servers independently.

### Demo MCP Server for Testing

A demo MCP server is included at `src/mcp-servers/demo-server.ts` for testing the MCP-UI Function Builder.

**Architecture:**
- **Express.js server** on port 3001
- **SSE transport** using `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk`
- **3 UI-enabled tools** that return `UIResource` objects via `@mcp-ui/server`

**Tools:**
- `get_contact_form`: Returns HTML form with interactive fields
  - Demonstrates `rawHtml` content type
  - Form submission triggers `submit_form` tool via `window.parent.postMessage()`
- `get_dashboard`: Returns external URL embed
  - Demonstrates `externalUrl` content type
  - Accepts `url` parameter
- `submit_form`: Processes form data
  - Stores submissions in memory
  - Returns text confirmation

**Key Implementation Details:**
- Uses `createUIResource()` to generate UIResource objects
- UIResource structure: `{ uri: 'ui://...', mimeType: '...', text: '...', _meta: {...} }`
- Actions in HTML use `window.parent.postMessage({ type: 'tool', payload: {...} })`
- Server maintains session-based transports in memory
- In-memory storage for demo purposes (not persisted)

**Usage:**
```bash
npm run mcp:demo  # Starts server on http://localhost:3001
```

Then add via Settings UI:
- Name: `demo-ui`
- Type: `sse`
- URL: `http://localhost:3001/mcp`

**Purpose:** Provides working examples of UI resources for testing the MCP-UI Builder's:
- Server/tool discovery (Context tab)
- HTML preview (Design tab)
- Action mapping (Actions tab)
- Flow visualization (Flow tab)

**Note:** Excluded from Next.js compilation via `tsconfig.json` as it's a standalone server.
