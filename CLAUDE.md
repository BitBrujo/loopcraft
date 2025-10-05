# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Warning
Never store any sensitive information in a CLAUDE.md file
Do not write commits by Claude

## Project Overview

LoopCraft is a Next.js 15 application that integrates the Model Context Protocol (MCP) with a chat interface. It serves as an MCP client with MCP-UI integration, allowing AI assistants to interact with external tools and resources through MCP servers while rendering interactive UI components.

## Key Technologies

- **Next.js 15** with App Router and Turbopack
- **React 19** with TypeScript
- **MCP Integration**: `@modelcontextprotocol/sdk`, `@mcp-ui/client`, `@mcp-ui/server`
- **AI SDK**: Vercel AI SDK (`ai` package) with `@assistant-ui/react`
- **LLM Provider**: Ollama (configurable via `ollama-ai-provider-v2`)
- **Database**: MySQL 8.0 with Docker, `mysql2` driver
- **Authentication**: JWT with bcrypt password hashing
- **Styling**: Tailwind CSS 4, Radix UI components
- **State Management**: Zustand

## Development Commands

```bash
# Start MySQL database
docker-compose up -d

# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Stop database
docker-compose down

# Start demo MCP server with UI resources (for testing MCP-UI Builder)
npm run mcp:demo
```

Development server runs on http://localhost:3000

## Demo MCP Server

A demo MCP server is included for testing the MCP-UI Function Builder (`src/mcp-servers/demo-server.ts`).

**To use:**
1. Start the demo server: `npm run mcp:demo` (runs on port 3001)
2. Add via Settings UI:
   - Name: `demo-ui`
   - Type: `sse`
   - URL: `http://localhost:3001/mcp`
3. Enable the server
4. Test in MCP-UI Builder

**Available Tools:**
- `get_contact_form` - Returns interactive HTML contact form
- `get_dashboard` - Returns external URL embed
- `submit_form` - Processes form submissions

**To remove:** See `DEMO_SERVER_README.md` for complete instructions.

**Note:** The demo server is excluded from TypeScript compilation (`tsconfig.json`) as it's a standalone Node.js server, not part of the Next.js app

## Environment Configuration

Copy `.env.example` to `.env.local` and configure:

- `OLLAMA_BASE_URL`: Ollama API endpoint (default: http://localhost:11434/api) - can be overridden per user in Settings
- `OLLAMA_MODEL`: Model to use (default: llama3.2:latest) - can be overridden per user in Settings
- `MYSQL_HOST`: MySQL host (default: localhost)
- `MYSQL_PORT`: MySQL port (default: 3306)
- `MYSQL_DATABASE`: Database name (default: loopcraft)
- `MYSQL_USER`: Database user (default: loopcraft)
- `MYSQL_PASSWORD`: Database password (required)
- `MYSQL_ROOT_PASSWORD`: MySQL root password (required)
- `JWT_SECRET`: Secret key for JWT tokens (required, generate with `openssl rand -hex 32`)
- `JWT_EXPIRES_IN`: JWT expiration time (default: 7d)

### MCP Server Configuration

**All MCP servers are user-specific and managed through the Settings UI:**
- Stored in MySQL `mcp_servers` table per user
- Managed via `/settings` page with UI
- Supports authentication via `env` field
- Auto-connects when user is logged in
- Each user has complete control over their own MCP servers

**Transport Types:**
- **stdio**: Local process-based servers (e.g., filesystem, memory)
  - Environment variables passed to spawned process
  - Example: `{ command: ["npx", "-y", "server"], env: { "API_KEY": "xxx" } }`
- **sse**: Remote HTTP-based servers via Server-Sent Events
  - Environment variables converted to HTTP headers
  - Example: `{ url: "https://api.example.com/mcp", env: { "API_KEY": "xxx" } }`
- **http**: HTTP streaming transport (treated as SSE)

**Authentication Support:**
- **App-level**: JWT tokens for accessing user-specific database servers
- **MCP-level**: Environment variables for authenticating to remote MCP servers
  - `API_KEY` or `BEARER_TOKEN` → `Authorization: Bearer {value}` header
  - `HEADER_X_Custom` → `X-Custom: {value}` custom header
  - Other variables passed as-is to stdio processes

Example MCP server configurations can be found in `src/lib/mcp-config.ts:45-61` (for reference only, not used in production).

## Architecture

### MCP Integration Flow

1. **Server Initialization** (via `src/lib/mcp-init.ts`):
   - **Shared initialization utility**: Used by all MCP-related API endpoints
   - **User servers**: Loaded per-request from database (if authenticated, idempotent)
   - Connections managed by `MCPClientManager` singleton
   - Supports both app-level (JWT) and MCP-level (env vars) authentication
   - **Error tracking**: Failed connections store error messages for troubleshooting
   - **Automatic cleanup**: Servers deleted from database are automatically disconnected
   - **Key functions**:
     - `initializeGlobalMCP()`: Legacy function, currently loads empty config (no-op)
     - `loadUserMCPServers(request)`: Connects user database servers, cleans up deleted servers
     - `initializeAllMCPServers(request)`: Wrapper that calls loadUserMCPServers (no global servers)
   - **Used by**:
     - `/api/chat` - Chat with tool calling (user servers from settings)
     - `/api/mcp/servers` - List connected servers with error messages
     - `/api/mcp/tools` - List available tools from connected user servers
     - `/api/mcp/resources` - List available resources from connected user servers

2. **Tool Registration** (`src/app/api/chat/route.ts:82-100`):
   - MCP tools are dynamically fetched from all connected servers
   - Tools are prefixed as `mcp_{serverName}_{toolName}`
   - Tool results are returned in standard MCP format (may include UI resources with `uri` starting with `ui://`)

3. **Resource Handling** (`src/app/api/chat/route.ts:102-123`):
   - Custom `getMCPResource` tool allows fetching resources from MCP servers
   - Resources are returned in standard MCP format without custom wrappers

4. **UI Rendering** (`src/components/assistant-ui/mcp-ui-renderer.tsx`):
   - Uses `isUIResource()` utility from `@mcp-ui/client` to detect UI resources
   - `UIResourceRenderer` renders interactive MCP UI components with correct `resource` and `onUIAction` props
   - Supports `htmlProps` for iframe configuration:
     - `sandboxPermissions`: Enables forms, scripts, and same-origin access
     - `autoResizeIframe`: Auto-resize based on content
     - `iframeProps`: Custom iframe attributes (e.g., `data-mcp-ui-resource`)
   - Handles user actions: tool calls, prompts, links, intents, notifications

5. **Bidirectional Communication** (`src/app/api/mcp/call-tool`):
   - **UI → Server**: Interactive elements in MCP UIs send actions via `window.parent.postMessage()`
     - Message format: `{ type: 'tool', payload: { toolName, params } }`
     - Captured by `@mcp-ui/client` and passed to `onUIAction` handler
   - **Server → UI**: Tool results posted back to iframe
     - MCPUIRenderer executes tool via `/api/mcp/call-tool` endpoint
     - Result posted to iframe: `iframe.contentWindow.postMessage({ type: 'mcp-ui-tool-response', result })`
     - UI listens for response and updates display
   - **Authentication**: JWT token from localStorage passed to API
   - **Example**: HyperMemory server's entity creation and search features

### Key Components

- **MCPClientManager** (`src/lib/mcp-client.ts`): Manages MCP server connections, tool calls, resource fetching, error tracking, and user server cleanup
- **MCP Initialization** (`src/lib/mcp-init.ts`): Shared utilities for initializing user-specific MCP servers with automatic cleanup of deleted servers
- **Chat API Route** (`src/app/api/chat/route.ts`): Streams LLM responses with MCP tool integration (user-configured servers only)
- **MCP API Routes** (`src/app/api/mcp/`): Endpoints for listing servers (with error messages), tools, resources, and calling tools
  - `/api/mcp/servers`: List connected servers with status
  - `/api/mcp/tools`: List available tools
  - `/api/mcp/resources`: List available resources
  - `/api/mcp/call-tool`: Execute MCP tools from UI (bidirectional communication)
- **Assistant Component** (`src/app/assistant.tsx`): Main chat interface using `@assistant-ui/react` with sidebar containing ThreadList and ActiveMCPServers
- **Thread Component** (`src/components/assistant-ui/thread.tsx`): Renders chat messages
- **ActiveMCPServers** (`src/components/assistant-ui/active-mcp-servers.tsx`): Displays connected MCP servers in sidebar with UI badges for servers with MCP-UI resources
- **MCPUIRenderer** (`src/components/assistant-ui/mcp-ui-renderer.tsx`): Renders interactive MCP UI resources with bidirectional tool calling
- **ToolFallback** (`src/components/assistant-ui/tool-fallback.tsx`): Detects UI resources and extracts server names for tool execution
- **ChatHeader** (`src/components/chat/ChatHeader.tsx`): Three-column navigation bar with centered grouped tabs (Builder, Chat), left branding, and right utilities (Theme, Account with Settings dropdown)

### File Structure

- `src/app/`: Next.js App Router pages and API routes
  - `api/chat/route.ts`: Main chat endpoint with streaming
- `src/lib/`: Core utilities and MCP client logic
- `src/components/`: React components
  - `assistant-ui/`: Chat interface components
  - `chat/`: Layout and navigation components
  - `ui/`: Radix UI-based design system components

### Import Paths

Uses TypeScript path alias `@/*` mapping to `./src/*` (configured in `tsconfig.json:21-23`)

## MCP Client Implementation

The `MCPClientManager` class (`src/lib/mcp-client.ts`) manages MCP server connections and provides:

**Connection Management:**
- `connectToServer(server)`: Establish connection to MCP server (idempotent)
  - Skips if already connected
  - Supports `env` field for authentication
  - **Stdio**: Passes environment variables to spawned process
  - **SSE/HTTP**: Converts env vars to HTTP headers with smart patterns
  - Stores error messages on connection failure
  - Clears error messages on successful connection
- `disconnectFromServer(serverName)`: Close connection and cleanup (clears error messages)
- `getConnectedServers()`: List active server connections
- `isConnected(serverName)`: Check server connection status

**Error Tracking:**
- `getConnectionError(serverName)`: Get error message for failed connection
- `clearConnectionError(serverName)`: Clear stored error message

**User Server Management:**
- `trackUserServer(userId, serverName)`: Track which servers belong to which user
- `getUserServers(userId)`: Get Set of server names for a specific user
- `cleanupUserServers(userId, currentServerNames)`: Disconnect servers deleted from database

**Tool & Resource Operations:**
- `getAllTools()`: List all available tools from connected servers using `client.listTools()`
- `getAllResources()`: List all available resources from connected servers using `client.listResources()`
- `callTool(serverName, toolName, args)`: Execute a tool on a specific server using `client.callTool()`
- `getResource(serverName, uri)`: Fetch a resource from a server using `client.readResource()`

**MCPServer Interface**:
```typescript
interface MCPServer {
  name: string;
  command?: string[];      // For stdio servers
  url?: string;            // For sse/http servers
  type: 'stdio' | 'sse' | 'http';
  env?: Record<string, string>; // Authentication/config
}
```

**Environment Variable Handling**:
- **Stdio**: Merged with `process.env` and passed to child process
- **SSE/HTTP**: Converted to headers:
  - `API_KEY` → `Authorization: Bearer {value}`
  - `BEARER_TOKEN` → `Authorization: Bearer {value}`
  - `HEADER_X_Custom` → `X-Custom: {value}`

**Important**: The implementation uses the high-level MCP SDK methods (`listTools()`, `callTool()`, etc.) rather than the low-level `client.request()` API. This ensures proper protocol handling and prevents parsing errors.

## AI Integration

The chat endpoint (`src/app/api/chat/route.ts`):

1. **Initializes user MCP servers** (line 15): Calls `initializeAllMCPServers(req)` to connect user-configured servers from database
2. **Loads AI configuration** (lines 47-76):
   - Checks database for user-specific `ollama_base_url` and `ollama_model` settings
   - Falls back to environment variables if not set
   - Allows per-user model and provider configuration
3. Converts UI message format to model message format (lines 29-45)
4. Registers MCP tools with the AI SDK (lines 89-107)
   - Tools use `parameters` property (not `inputSchema`) to match AI SDK expectations
   - Tools are prefixed as `mcp_{serverName}_{toolName}`
   - Tool results are returned as-is in standard MCP format
5. Provides `getMCPResource` tool for fetching resources (lines 109-130)
   - Returns resources in standard MCP format without custom wrappers
6. Streams responses using `streamText` from Vercel AI SDK (line 132)
7. Returns UI-compatible message stream

**Important**:
- All MCP servers are user-configured via Settings and automatically available in chat via `initializeAllMCPServers()`
- User-specific AI model settings override environment variable defaults
- There are no global/shared MCP servers - each user manages their own servers

System prompt defines the assistant as "LoopCraft" with MCP capabilities.

## UI Resources

MCP servers can return UI resources with `uri` starting with `ui://`. These are automatically detected using the `isUIResource()` utility from `@mcp-ui/client` and rendered using `UIResourceRenderer` with proper props (`resource`, `onUIAction`, `htmlProps`). The renderer handles user interactions and can trigger tool calls, prompts, links, intents, and notifications.

## Database Integration

### Architecture

LoopCraft uses MySQL 8.0 for persistent storage with the following architecture:

- **Connection Pool** (`src/lib/db.ts`): Singleton connection pool with 10 concurrent connections
- **Authentication** (`src/lib/auth.ts`): JWT token generation/verification and bcrypt password hashing
- **Docker Setup** (`docker-compose.yml`): Containerized MySQL with persistent volume storage
- **Schema** (`docker/mysql/init.sql`): Automatic database initialization on first run

### Database Tables

- **users**: User accounts with email and password_hash (bcrypt)
- **prompts**: User-created prompts with title and content
- **settings**: User settings as key-value pairs
  - `ollama_base_url`: User-specific AI provider API endpoint
  - `ollama_model`: User-specific model identifier
- **mcp_servers**: Per-user MCP server configurations with JSON config field

All tables include foreign key relationships, proper indexes, and automatic timestamp management.

### API Endpoints

**Authentication** (Public):
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and receive JWT token

**AI Configuration**:
- `GET /api/ai-config` - Get current AI config (user settings or env defaults)
- `PUT /api/ai-config` - Update user AI settings (Requires JWT)

**Prompts** (Requires JWT):
- `GET /api/prompts` - List all user prompts
- `POST /api/prompts` - Create new prompt
- `GET /api/prompts/:id` - Get specific prompt
- `PUT /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt

**MCP Servers** (Requires JWT):
- `GET /api/mcp-servers` - List all user MCP servers
- `POST /api/mcp-servers` - Create new MCP server config
- `GET /api/mcp-servers/:id` - Get specific server
- `PUT /api/mcp-servers/:id` - Update server config
- `DELETE /api/mcp-servers/:id` - Delete server

All authenticated endpoints require `Authorization: Bearer <token>` header.

### Database Utilities

**`src/lib/db.ts`**:
- `getPool()`: Get connection pool singleton
- `query<T>(sql, params)`: Execute parameterized query
- `queryOne<T>(sql, params)`: Execute query and return first result
- `testConnection()`: Verify database connectivity
- `closePool()`: Close all connections

**`src/lib/auth.ts`**:
- `hashPassword(password)`: Bcrypt hash generation
- `verifyPassword(password, hash)`: Verify password against hash
- `generateToken(payload)`: Create JWT token
- `verifyToken(token)`: Validate and decode JWT
- `getUserFromRequest(request)`: Extract user from Authorization header

**`src/types/database.ts`**:
TypeScript interfaces for all database entities and API request/response types.

## MCP-UI Function Builder

The MCP-UI Function Builder is a visual tool for creating MCP-UI resources with integrated action mapping. It provides a **4-tab progressive workflow** focused on distinguishing between static UI content and agent-fillable content.

### Architecture Overview

**Route**: `/mcp-ui-builder`

**State Management**: Zustand store (`src/lib/stores/ui-builder-store.ts`)
- `currentResource`: UI resource being edited (includes `templatePlaceholders` array)
- `activeTab`: Current tab ('design' | 'actions' | 'generate' | 'test')
- `mcpContext`: Server/tool selection (auto-loaded from Settings)
- `actionMappings`: UI element → MCP tool bindings with `parameterSources`
- `testConfig`: Mock responses and test history
- `validationStatus`: Missing mappings, type mismatches, warnings
- `testServerState`: Active test server tracking

**Layout**: `src/components/mcp-ui-builder/BuilderLayout.tsx`
- **Header**: Centered gradient title "MCP-UI Function Builder" (orange to blue gradient) with floating action buttons on right
  - **Title styling**: `text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`
  - **Action buttons** (absolute positioned right): Reset All (with confirmation) | Refresh (re-fetch servers) | File dropdown (Load/Save/Export)
- **Tab navigation**: 4 centered tabs with orange brand outline (`ring-2 ring-primary/60 bg-background/50`)
  - Active tab: `bg-primary text-primary-foreground shadow-sm font-medium`
  - Inactive tabs: hover states for completed/pending tabs
- **Context Sidebar** (right side, always visible on all tabs)
- Tab-specific content area
- Configuration panel (far left on Design tab, collapsible, includes template dropdown)

**Layout per Tab:**
- **Design Tab**: Config Panel (optional, far left, includes template dropdown) → Content → Context Sidebar
- **Other Tabs**: Content → Context Sidebar (right)

**Header Actions:**
- **Reset All**: Opens confirmation dialog before clearing all builder state (resource, context, mappings, test config, validation)
- **Refresh**: Re-fetches MCP server status and updates connection indicators
- **File Dropdown** (combined menu):
  - **Load Template**: Opens LoadDialog to browse and restore saved templates
  - **Save Template**: Opens SaveDialog to save complete builder state to database
  - **Export Code**: Opens ExportDialog with 8 export formats (TypeScript, JSON, cURL, Handlers, Server, UI Tool, Quick Start, Guide)

### Core Concept: Static vs Agent-Fillable Content

The builder distinguishes between:
- **Static content**: Fixed HTML that never changes
- **Agent-fillable slots**: Template placeholders using `{{placeholder}}` syntax that AI fills dynamically
- **User interactions**: Form fields, buttons that trigger tool calls with parameters from static values, form fields, or agent context

### Tab Workflow

**Tab 1: Design** (`src/components/mcp-ui-builder/tabs/DesignTab.tsx`)
- **Purpose**: Create UI content with template placeholder syntax for agent-fillable sections
- **Components**:
  - `EditorPanel`: Code editor (Raw HTML or External URL)
    - Raw HTML or External URL editors (Remote DOM currently disabled)
    - Content automatically resets when switching types to prevent crashes
  - `PreviewPanel`: Live preview of UI resource
  - `ConfigPanel`: Template dropdown (always visible), URI, frame size, initial data
- **Template Placeholder Detection**: Auto-detects `{{placeholder}}` patterns in HTML
  - Uses `extractTemplatePlaceholders()` from `src/lib/html-parser.ts`
  - Stores detected placeholders in `currentResource.templatePlaceholders` array
  - Updates automatically as HTML content changes (useEffect hook)
- **Footer Indicators**:
  - "UI design ready" (green) when content exists
  - "X agent slots detected" (blue sparkle icon) when template placeholders found
- **Navigation**: "Next: Configure Actions" button (enabled when content exists)

**Tab 2: Actions** (`src/components/mcp-ui-builder/tabs/ActionsTab.tsx`)
- **Purpose**: Map UI interactions to MCP tool calls with parameter source configuration
- **Components**:
  - `ActionMapper`: Auto-detect interactive elements (buttons, forms, links, [data-action]), map to tools via dropdown, add/edit/delete mappings
  - `ParameterBindingEditor`: 3-column split view with **parameter source configuration**
    - **Left**: Tool schema reference with collapsible parameters
    - **Center**: Parameter source configuration for each parameter:
      - **Source Type Dropdown**: Static Value | Form Field | Agent Context | Tool Result (coming soon)
      - **Source Value Input**: Changes dynamically based on source type:
        - **Static**: Text input for hardcoded values
        - **Form**: Dropdown to select HTML form fields
        - **Agent**: Dropdown to select from detected `{{placeholders}}`
        - **Tool**: Disabled (not yet supported)
      - **Visual indicators**: Blue sparkle icon hints when no agent placeholders detected
    - **Right**: JSON preview of parameter sources
- **Parameter Sources** (`parameterSources` field in ActionMapping):
  - Each parameter has `{ sourceType, sourceValue }` configuration
  - Replaces legacy `parameterBindings` (still supported for backward compatibility)
  - Example: `{ name: { sourceType: 'agent', sourceValue: 'agent.name' } }`
- **Validation**: Real-time validation with debounced execution (300ms)
  - Validates parameter sources based on type:
    - **Static**: Non-empty value
    - **Form**: Field exists in HTML + type compatibility
    - **Agent**: Placeholder exists in `templatePlaceholders`
    - **Tool**: Warning (not yet supported)
  - Passes `templatePlaceholders` to validation engine
  - Visual status indicators (✓ valid, ⚠ warning, ✗ error)
- **Navigation**: "Next: Generate Code" button (enabled when validation passes and no errors)

**Tab 3: Generate** (`src/components/mcp-ui-builder/tabs/GenerateTab.tsx`)
- **Purpose**: Preview and export production-ready MCP server code
- **Components**:
  - **Summary Panel**: Statistics display with color-coded cards
    - Agent-fillable slots (blue)
    - User interactions (green)
    - MCP tools used (purple)
  - **Export Tabs** (4 formats with copy-to-clipboard):
    - **TypeScript**: `createUIResource` code using `@mcp-ui/server`
    - **Server**: Complete MCP server with stdio transport (ready to run)
    - **UI Tool**: Standalone tool for adding to existing servers
    - **Quick Start**: Setup instructions with agent slot/interaction stats
- **Code Generation**: Uses `src/lib/code-generation.ts` utilities
  - `generateTypeScriptCode(resource)`: UIResource creation code
  - `generateServerCode(resource)`: Full MCP server implementation
  - `generateUIToolCode(resource)`: Tool handler with `__MCP_UI_RESOURCE__:` prefix
  - `generateQuickStartGuide(agentSlots, userActions, tools)`: Installation/setup guide
- **Navigation**: "Next: Test Integration" button (always enabled)

**Tab 4: Test** (`src/components/mcp-ui-builder/tabs/TestTab.tsx`)
- **Purpose**: One-click test workflow from Builder to Chat
- **Components**:
  - Resource summary display (URI, content type, action mappings count, agent slots count)
  - "Export & Test in Chat" button with loading states
  - "Stop Test Server" button (when test active)
  - Status messages and error handling
  - How It Works instructions
- **Workflow**:
  1. Click "Export & Test" → generates complete MCP server code with agent placeholder support
  2. Creates temp server file in `/tmp/mcp-ui-builder/`
  3. Auto-adds server to database (stdio transport)
  4. Navigates to `/chat` for immediate testing
  5. Click "Stop Test Server" to cleanup (or auto-cleanup on unmount)
- **State**: Manages `isTestServerActive`, `testServerName`, `testServerId`, `testServerFile`
- **API**: `POST /api/ui-builder/test` creates temp servers with file write + database insert
- **Server Generation** (`generateServerCode()` function):
  - Uses correct `createUIResource()` API format: `{ uri, content: { type: 'rawHtml', htmlString: '...' }, encoding: 'text' }`
  - Generates `fillAgentPlaceholders()` helper when `{{placeholders}}` detected
  - Creates `get_ui` tool with agent context parameters from `templatePlaceholders`
  - Uses `parameterSources` for action mapping tools (not deprecated `parameterBindings`)
  - Includes metadata (title, description) when available
- **Features**:
  - Server code generation matching Export "Server" tab
  - Temporary file creation with unique timestamp-based names
  - Automatic navigation to chat after setup
  - Manual or automatic cleanup (DELETE server from database)
  - **Agent placeholder replacement**: Server replaces `{{placeholders}}` with AI-provided values
- **Navigation**: Auto-navigates to `/chat` when test starts

### Context Sidebar

**File**: `src/components/mcp-ui-builder/ContextSidebar.tsx`

Persistent sidebar showing real-time status (**always visible on all tabs**):
- **Servers**: Connected MCP servers with status indicators (fetched from `/api/mcp/servers`)
- **Agent Slots**: Detected `{{placeholders}}` from HTML with blue highlighting
  - Shows count and list of all template placeholders
  - Displays helpful hint if no placeholders detected
- **Action Mappings**: Count of configured UI → tool mappings
- **Validation Status**: Errors, type mismatches, warnings with quick-fix links
  - Clickable errors navigate to Actions tab
  - Real-time updates as validation runs
- **Test Server** (conditional): Shows when test server is active
  - Green "Active" badge with server name
  - "Stop Test Server" button
  - Calls `/api/mcp-servers/:id` DELETE endpoint for cleanup
  - Updates test server state via `stopTestServer()` action
- Positioned on right side for all tabs (Design, Actions, Generate, Test)

### API Endpoints

**GET /api/mcp/servers** (`src/app/api/mcp/servers/route.ts`)
- Lists connected MCP servers with status
- Response: `{ servers: Array<{ name, type, status }> }`

**GET /api/mcp/tools** (`src/app/api/mcp/tools/route.ts`)
- Lists available MCP tools from all connected servers
- Query param: `?server=name` to filter by server
- Response: `{ tools: Array<{ name, description, inputSchema, serverName }> }`

**GET /api/mcp/resources** (`src/app/api/mcp/resources/route.ts`)
- Lists available MCP resources from all connected servers
- Query param: `?server=name` to filter by server
- Response: `{ resources: Array<{ uri, name, description, mimeType, serverName }> }`

**POST /api/ui-builder/preview** (`src/app/api/ui-builder/preview/route.ts`)
- Convert UI resource to MCP format for live preview
- No authentication required (public endpoint)
- Accepts: `resource` (UIResource object)
- Returns: `mcpResource` (MCP UI resource for rendering)
- Used by PreviewPanel for live preview in Design tab

**GET/POST /api/ui-builder/templates** (`src/app/api/ui-builder/templates/route.ts`)
- List and create user-saved UI templates (requires authentication)
- GET: Returns all templates for authenticated user
- POST: Saves complete builder state (resource, context, mappings, test config)

**DELETE /api/ui-builder/templates/:id** (`src/app/api/ui-builder/templates/[id]/route.ts`)
- Delete specific template (requires authentication and ownership)

**POST /api/ui-builder/test** (`src/app/api/ui-builder/test/route.ts`)
- Create temporary test MCP server for one-click testing
- Requires authentication (JWT token)
- Accepts: `serverCode` (string), `fileName` (string), `serverName` (string)
- Creates temp directory: `/tmp/mcp-ui-builder/`
- Writes server code to temp file
- Inserts server config into database (stdio transport)
- Returns: `serverId`, `filePath`, `serverName`
- Used by TestTab "Export & Test" workflow

### Type Definitions

**File**: `src/types/ui-builder.ts`

Key interfaces:
- `UIResource`: UI resource with contentType, content, preferredSize, actions
- `ActionMapping`: UI element → MCP tool binding with parameter mappings
  - `uiElementType`: 'button' | 'form' | 'link' | 'input' | 'select' | 'textarea' | 'custom'
  - Supports all interactive HTML elements detected by the HTML parser
- `MCPContext`: Selected servers, tools, and purpose
- `TestConfig`: Mock responses and test history
- `ValidationStatus`: Validation errors and warnings
- `FlowNode` / `FlowEdge`: Flow diagram representation

### Export Functionality

**File**: `src/components/mcp-ui-builder/ExportDialog.tsx`

Export formats (8 tabs):
- **TypeScript**: `createUIResource` code using `@mcp-ui/server`
- **JSON**: Raw UI resource object
- **cURL**: Example API request
- **Handlers**: Generated TypeScript action handlers with typed functions, MCP tool calls, response handling (show-notification/update-ui/custom), error handling, exported actionHandlers object
- **Server**: Complete MCP server implementation with:
  - Server initialization with capabilities
  - `fillAgentPlaceholders()` helper function (when placeholders detected)
  - `get_ui` tool with agent context parameters
  - Tool call handler with placeholder replacement logic
  - Stdio transport, ready-to-run code with shebang
- **UI Tool**: Complete tool definition with handler function using `__MCP_UI_RESOURCE__:` prefix pattern, ready to copy into existing MCP servers
- **Quick Start**: One-click copy-paste setup guide with:
  - Package.json template
  - Installation commands
  - Server start commands
  - LoopCraft configuration
  - **Agent context instructions**: How to test with placeholder values
  - Troubleshooting tips
- **Guide**: Comprehensive integration guide with:
  - Prerequisites and configuration
  - **Adding to Existing Server**: Code examples for integrating UI tool into existing CallToolRequestSchema handler
  - **Creating New Server from Scratch**: Complete step-by-step guide with package.json template
  - **Testing in LoopCraft Chat**: How to add server via Settings UI, example prompts, verification steps
  - **Bidirectional Communication**: postMessage patterns, authentication, tool call handling
  - **Deployment**: Server and client integration instructions
  - **Troubleshooting**: 5 categorized sections (Server Connection, UI Rendering, Bidirectional Communication, Authentication, iframe Sandbox)

**Features**:
- Copy-to-clipboard for all formats
- "Handlers" tab disabled when no action mappings exist
- Generated code includes proper types and error handling
- **Agent placeholder support**: Auto-generates replacement logic
- **Correct API usage**: `createUIResource({ content: { type: 'rawHtml', htmlString: '...' } })`
- **parameterSources support**: Uses new parameter mapping format
- Server code ready for `npx` distribution
- Quick Start provides complete workflow in single copy-paste session
- Comprehensive troubleshooting covering all common issues

**Agent Placeholder Implementation**:
- Detects `{{placeholders}}` from `resource.templatePlaceholders`
- Generates `fillAgentPlaceholders()` function with regex replacement for each placeholder
- `get_ui` tool accepts agent context parameters (one per placeholder)
- Server replaces placeholders in HTML before creating UIResource
- Example: `{{agent.name}}` with `{ "agent.name": "Alice" }` → `Alice` in HTML

**Important Implementation Notes**:
- JSON.stringify() calls are extracted to variables before being used in template literals to avoid parsing errors
- All lucide-react icon imports use `Wrench` instead of the non-existent `Tool` icon
- Conditional rendering in ExecutionTracer uses ternary operators instead of `&&` for proper React type inference
- Placeholder regex escaping: `placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` for safe replacement

### Templates

**File**: `src/lib/ui-builder-templates.ts`

Built-in templates:
- Blank Canvas
- Contact Form (with tool call example)
- Metrics Dashboard
- Data Table
- Settings Panel
- Notification Center
- Chart Display
- External URL embed

### Database Schema

**Table**: `ui_templates`
- `id`: Primary key
- `user_id`: Foreign key to users table
- `name`: Template name
- `category`: Template category
- `resource_data`: JSON field containing complete builder state:
  - `currentResource`: UIResource (UI content & config)
  - `mcpContext`: MCPContext (selected servers/tools/purpose)
  - `actionMappings`: ActionMapping[] (all UI→tool mappings)
  - `testConfig`: TestConfig (mock responses, excluding test history)
  - `savedAt`: ISO timestamp
- Timestamps: `created_at`, `updated_at`

### Save/Load Functionality

**Save** (`src/components/mcp-ui-builder/SaveDialog.tsx`):
- Opens modal with name/category input
- Saves complete builder state as single JSON blob to database
- Requires JWT authentication
- API: `POST /api/ui-builder/templates`

**Load** (`src/components/mcp-ui-builder/LoadDialog.tsx`):
- Opens modal with saved templates grid
- Search/filter by name and category
- Restores complete builder state via `loadCompleteState()`
- Delete templates with two-click confirmation
- API: `GET /api/ui-builder/templates`, `DELETE /api/ui-builder/templates/:id`

**State Restoration**:
All builder state is saved/loaded as a single file including:
- UI resource (content, config, metadata)
- MCP context (servers, tools, purpose)
- Action mappings (UI→tool bindings with parameters)
- Test configuration (mock responses and settings)

### Implementation Status

**✅ ALL PHASES COMPLETE (1-9)**:
- ✅ Enhanced state management and type definitions (Phase 1)
- ✅ Tabbed layout with 5-tab navigation (Phase 2)
- ✅ MCP API endpoints for servers/tools/resources (Phase 3)
- ✅ Context Tab with server/tool discovery (Phase 4)
- ✅ Design Tab with Tool Palette sidebar (Phase 4)
- ✅ Context Sidebar with real-time status (Phase 4)
- ✅ Actions Tab with action mapper and parameter binding (Phase 5)
- ✅ Flow Tab with React Flow visualization (Phase 6)
- ✅ Test Tab with one-click testing workflow (Phase 7)
  - Export & Test button creates temp MCP server
  - Auto-navigation to chat for immediate testing
  - Stop Test Server button with cleanup
  - API endpoint for temp server creation
  - ContextSidebar test status indicator
- ✅ Enhanced export formats (Phase 8)
  - 8 export formats (TypeScript, JSON, cURL, Handlers, Server, UI Tool, Quick Start, Guide)
  - UI Tool format for easy integration into existing servers
  - Quick Start with one-click copy-paste setup
  - Comprehensive Integration Guide with 5 major sections
- ✅ Save/Load functionality with database persistence (Phase 9)
  - SaveDialog: Save complete builder state with name/category
  - LoadDialog: Browse, search, filter, and restore saved templates
  - DELETE endpoint for template management
  - Refresh button to update server connection status

**Key Achievements**:
- HTML parser with interactive element detection
- Validation engine with debounced execution and type checking
- React Flow integration with Dagre auto-layout
- Custom node components for flow visualization
- Execution tracer with step-by-step simulation
- Complete MCP server code generation
- **8 production-ready export formats** with comprehensive documentation
- Complete state persistence to database (save/load as single file)
- **One-click test workflow** from Builder to Chat
- **Comprehensive developer experience** with Quick Start and detailed guides

### Design Principles

1. **Progressive Disclosure**: Tabs unlock sequentially as prerequisites are met
2. **Contextual Sidebars**:
   - Context Sidebar hidden on Context tab (full-width), visible on all other tabs
   - Configuration Panel far left on Design tab only (includes template dropdown)
3. **No Fallback Logic**: Validation reports errors without fallback behavior
4. **State Persistence**: Builder state persists to localStorage via Zustand
5. **Real-time Validation**: Continuous validation with ContextSidebar updates
6. **Confirmation for Destructive Actions**: Reset All requires confirmation dialog
7. **Server-Client Bidirectionality**: Represents MCP server ↔ client relationship

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- do not write or use fallbacks