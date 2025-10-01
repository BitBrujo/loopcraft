# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoopCraft is a Next.js 15 AI chat application that provides a modern interface for interacting with AI models and Model Context Protocol (MCP) servers. The application uses React 19, TypeScript, Tailwind CSS, the Assistant UI framework, and MCP-UI for interactive components. It combines the power of local AI models via Ollama with the extensibility of the Model Context Protocol ecosystem.

**Naming**: The name "LoopCraft" reflects the iterative, loop-based workflow nature of MCP development - where developers continuously iterate through the cycle of exploring resources, editing configurations, triggering runs, monitoring metrics, debugging issues, and refining until the system behaves as expected.

## Common Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Core Technologies
- **Next.js 15.5.4** with App Router and Turbopack
- **React 19.1.0** with modern hooks and server components
- **TypeScript 5** for type safety with strict configuration
- **Tailwind CSS v4** for styling with CSS variables
- **shadcn/ui** components (New York style) with Radix UI primitives
- **Assistant UI** framework (`@assistant-ui/react` ^0.11.20) for chat interface
- **AI SDK** (`@ai-sdk/react` ^2.0.56, `ai` ^5.0.56) for streaming and model integration
- **Ollama** for local AI model inference via `ollama-ai-provider-v2` ^1.3.1 (actively maintained)
- **MCP SDK** (`@modelcontextprotocol/sdk` ^1.18.2) for Model Context Protocol integration
- **MCP-UI** (`@mcp-ui/client` ^5.12.0, `@mcp-ui/server` ^5.11.0) for interactive UI components
- **MySQL 8.0** for local database via Docker (`mysql2` ^3.15.1) with persistent storage

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/
│   │   ├── auth/          # Authentication endpoints (login)
│   │   ├── chat/          # Chat API endpoint (MCP + Ollama integration)
│   │   ├── conversations/ # Conversation management API
│   │   ├── mcp/           # MCP API routes (servers, resources, tools)
│   │   ├── metrics/       # Metrics collection endpoint
│   │   ├── settings/      # User settings API
│   │   └── templates/     # UI Builder templates API
│   ├── dashboard/         # MCP-UI Lab dashboard page
│   ├── settings/          # Settings and configuration page
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Home page
│   └── assistant.tsx      # Main assistant component
├── components/
│   ├── assistant-ui/      # Assistant UI framework components
│   │   ├── mcp-ui-renderer.tsx # MCP-UI integration component
│   │   └── ...           # Other Assistant UI components
│   ├── dashboard/         # Dashboard panel components
│   │   ├── ResourceExplorer.tsx # MCP resource browser
│   │   ├── ConfigEditor.tsx     # JSON config editor
│   │   ├── MetricsDashboard.tsx # Performance metrics
│   │   ├── DebuggerPanel.tsx    # Request/response inspector
│   │   ├── ConsolePanel.tsx     # Log viewer
│   │   ├── UIBuilderPanel.tsx   # MCP-UI Function Builder main panel
│   │   └── ui-builder/          # Function Builder tab components
│   │       ├── ContextSidebar.tsx     # Integration status sidebar
│   │       ├── ContextTabContent.tsx  # Tool discovery & selection
│   │       ├── DesignTabContent.tsx   # UI creation (wraps existing)
│   │       ├── ActionsTabContent.tsx  # Action mapping (3-panel layout)
│   │       ├── FlowTabContent.tsx     # Flow visualization (React Flow)
│   │       ├── TestTabContent.tsx     # Integration testing (2-panel layout)
│   │       ├── ContentTypeSelector.tsx # HTML/URL/RemoteDom selector
│   │       ├── ConfigurationPanel.tsx  # Metadata configuration
│   │       ├── PreviewPanel.tsx        # Live preview with logging
│   │       ├── ExportDialog.tsx        # Code export dialog
│   │       ├── TemplateGallery.tsx     # Template browser
│   │       ├── actions/               # Actions tab components
│   │       │   ├── InteractiveElementDetector.tsx  # HTML element parser
│   │       │   ├── ActionMappingEditor.tsx         # Parameter binding UI
│   │       │   └── ActionMappingList.tsx           # Mappings management
│   │       ├── flow/                  # Flow tab components
│   │       │   ├── FlowDiagram.tsx    # React Flow visualization
│   │       │   └── FlowControls.tsx   # Diagram controls & export
│   │       └── test/                  # Test tab components
│   │           ├── TestRunner.tsx     # Execute real MCP tool calls
│   │           └── TestResultsViewer.tsx  # Test history & results
│   ├── chat/             # Chat-specific components (header, layout, mobile sidebar, theme toggle)
│   ├── providers/        # React context providers (theme provider)
│   └── ui/              # shadcn/ui components (button, dialog, sheet, etc.)
└── lib/
    ├── db.ts             # MySQL database connection pool and query helpers
    ├── db/               # Database layer
    │   ├── schema.sql    # Database schema (tables, indexes, constraints)
    │   ├── users.ts      # User data access operations
    │   ├── settings.ts   # Settings data access operations
    │   ├── conversations.ts # Conversation/message data access operations
    │   └── templates.ts  # Template data access operations
    ├── mcp-client.ts     # MCP client management service (refactored with SDK convenience methods)
    ├── mcp-config.ts     # MCP server configuration
    ├── mcp-ui-helpers.ts # MCP-UI resource creation helpers (HTML, external URLs, Remote DOM)
    ├── stores/           # Zustand state management
    │   ├── dashboard-store.ts  # Dashboard state (logs, metrics, debug)
    │   ├── mcp-store.ts        # MCP state (servers, resources, tools)
    │   ├── settings-store.ts   # User settings (API-backed)
    │   └── ui-builder-store.ts # Function Builder state (API-backed templates)
    ├── utils.ts          # Utility functions (cn, etc.)
    └── CLAUDE.md         # Documentation for src/lib directory
components/                 # Legacy components directory
└── CustomMessageInput.tsx # Custom message input component
```

### Key Architectural Patterns

1. **Hybrid AI Integration**: Combines Ollama for AI model inference with MCP for extensible tool and resource access:
   - Uses Ollama provider v2 with environment-configured base URL (`OLLAMA_BASE_URL`) and model (`OLLAMA_MODEL`) from `.env.local`
   - Integrates MCP client to connect to various MCP servers for tools, resources, and prompts
   - **Refactored MCP Client** (`src/lib/mcp-client.ts`) uses official SDK convenience methods:
     - `client.listTools()` instead of manual request construction
     - `client.callTool({name, arguments})` for tool execution
     - `client.listResources()` for resource discovery
     - `client.readResource({uri})` for resource retrieval
   - Automatic tool discovery from connected MCP servers
   - **Full MCP-UI Support** (`@mcp-ui/client` + `@mcp-ui/server`):
     - Interactive UI components rendered securely in sandboxed iframes
     - Support for `rawHtml`, `externalUrl`, and `remoteDom` content types
     - Bi-directional communication between UI and host via postMessage
     - Action handlers for tool calls, prompts, links, intents, and notifications
     - Auto-resizing iframes with configurable sandbox permissions
     - Metadata support for preferred frame size and initial render data

2. **Assistant UI Framework**: Built on `@assistant-ui/react` with AI SDK integration:
   - Uses `useChatRuntime()` from `@assistant-ui/react-ai-sdk` for direct AI SDK integration
   - Thread-based conversation management
   - Message streaming and real-time updates
   - Branch picker for conversation alternatives
   - Attachment support
   - Tool integration capabilities

3. **Component Architecture**:
   - `Assistant` - Main chat interface with sidebar and thread view (uses `useChatRuntime` for AI SDK integration)
   - `Thread` - Core conversation component with welcome screen and suggestions
   - `ChatLayout` - Overall page layout with header
   - `ChatHeader` - Top navigation with mobile sidebar toggle and theme controls
   - `MobileSidebar` - Responsive sidebar for mobile devices using sheet component
   - `ThemeProvider` & `ThemeToggle` - Dark/light mode theme system

4. **API Design**: Single `/api/chat` endpoint handles:
   - Message streaming via AI SDK
   - MCP server initialization and connection management
   - Dynamic tool discovery and integration from MCP servers
   - Interactive UI resource rendering via MCP-UI
   - System prompt configuration enhanced for MCP capabilities

5. **Database Architecture**: Local MySQL 8.0 database with Docker containerization:
   - **Database**: MySQL 8.0 running in Docker container with persistent volumes
   - **Connection Pool**: `mysql2/promise` connection pooling for efficient queries
   - **Data Access Layer**: Type-safe TypeScript DAL for users, settings, conversations, templates
   - **API Routes**: RESTful API endpoints for all data operations
   - **State Management**: Zustand stores with API synchronization (replacing localStorage)

### Environment Configuration

**Required environment variables** (must be set in `.env.local` - no fallbacks):

- `MYSQL_HOST` - MySQL server host (default: localhost)
- `MYSQL_PORT` - MySQL server port (default: 3306)
- `MYSQL_DATABASE` - Database name (default: loopcraft)
- `MYSQL_USER` - Database user (default: loopcraft)
- `MYSQL_PASSWORD` - Database password
- `OLLAMA_BASE_URL` - Ollama server URL (must include `/api` path)
- `OLLAMA_MODEL` - Model name to use
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 7d)

**Optional environment variables**:

- `MCP_CONFIG` - JSON string defining MCP servers to connect to
- `NEXT_PUBLIC_APP_URL` - Application URL

**Example Configuration (.env.local):**
```
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=loopcraft
MYSQL_USER=loopcraft
MYSQL_PASSWORD=your_secure_password_here

# Ollama AI Configuration
OLLAMA_BASE_URL=http://localhost:11434/api
OLLAMA_MODEL=gpt-oss:20b

# Authentication Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3004

# MCP Configuration
MCP_CONFIG='{"servers":[{"name":"memory","command":["npx","-y","@modelcontextprotocol/server-memory"],"type":"stdio"}]}'
```

**Available Model Options:**
```
# Other models you can use:
# OLLAMA_MODEL=llama3.2:latest
# OLLAMA_MODEL=codellama:latest
# OLLAMA_MODEL=mistral:latest
```

**MCP Server Configuration Examples:**
```
# Memory server (current setup - simple in-memory storage):
MCP_CONFIG='{"servers":[{"name":"memory","command":["npx","-y","@modelcontextprotocol/server-memory"],"type":"stdio"}]}'

# Basic filesystem server for current directory:
MCP_CONFIG='{"servers":[{"name":"filesystem","command":["npx","-y","@modelcontextprotocol/server-filesystem","."],"type":"stdio"}]}'

# Multiple servers (memory + filesystem):
MCP_CONFIG='{"servers":[{"name":"memory","command":["npx","-y","@modelcontextprotocol/server-memory"],"type":"stdio"},{"name":"filesystem","command":["npx","-y","@modelcontextprotocol/server-filesystem","."],"type":"stdio"}]}'
```

### Styling System

- Uses Tailwind CSS v4 with CSS variables for theming
- shadcn/ui components with "new-york" style
- Custom CSS classes prefixed with `aui-` for Assistant UI components
- Responsive design with mobile-first approach

### State Management

- Chat runtime management via `useChatRuntime` from `@assistant-ui/react-ai-sdk`
- Thread and conversation state handled by `@assistant-ui/react`
- Theme state managed by `next-themes`
- No external state management library - uses React's built-in state

## Development Notes

- The project uses strict TypeScript configuration
- ESLint is configured for Next.js with strict rules
- Path aliases: `@/*` maps to `src/*`
- Component aliases defined in `components.json` for shadcn/ui
- Motion animations powered by Framer Motion for smooth UX

## Key Dependencies

### AI & Chat Integration
- `@assistant-ui/react` (^0.11.20) - Main chat UI framework
- `@assistant-ui/react-ai-sdk` (^1.1.1) - AI SDK bridge for Assistant UI
- `@ai-sdk/react` (^2.0.56) - React hooks for AI SDK
- `ai` (^5.0.56) - Core AI SDK for streaming
- `ollama-ai-provider-v2` (^1.3.1) - Modern Ollama provider for AI SDK (actively maintained)
- `ollama` (^0.6.0) - Ollama client library

### MCP Integration
- `@modelcontextprotocol/sdk` (^1.18.2) - Model Context Protocol TypeScript SDK
- `@mcp-ui/client` (^5.12.0) - MCP-UI client components for React
- `@mcp-ui/server` (^5.11.0) - MCP-UI server SDK for creating UI resources
- `zod` (^4.1.11) - Schema validation for MCP data structures

### Dashboard & Visualization
- `react-resizable-panels` (^3.0.6) - Resizable dashboard panel layouts
- `recharts` (^3.2.1) - Charts and metrics visualization
- `@monaco-editor/react` (^4.7.0) - Monaco code editor for JSON config editing
- `date-fns` (^4.1.0) - Date formatting and manipulation
- `zustand` (^5.0.8) - State management for dashboard and settings
- `mysql2` (^3.15.1) - MySQL client for Node.js with promise support
- `jsonwebtoken` - JWT authentication token generation and verification

## Database Schema

### Setup and Initialization

LoopCraft uses MySQL 8.0 running in a Docker container for local development. The database is automatically initialized using the provided script:

```bash
# Start MySQL container and initialize database
./scripts/init-db.sh
```

This script will:
- Start the Docker container (if not already running)
- Create the database schema
- Set up a demo user (username: `demo`, password: `demo123`)
- Verify the installation

### Tables Overview

1. **users** - User accounts and authentication
   - `id` (CHAR(36), primary key, UUID)
   - `username` (VARCHAR(50), unique, NOT NULL)
   - `email` (VARCHAR(255), unique, NOT NULL)
   - `password_hash` (VARCHAR(255), NOT NULL)
   - `display_name` (VARCHAR(100))
   - `avatar_url` (TEXT)
   - `bio` (TEXT)
   - Timestamps: `created_at`, `updated_at`

2. **user_settings** - Per-user application settings
   - `id` (CHAR(36), primary key, UUID)
   - `user_id` (CHAR(36), unique, FK to users)
   - `theme` (VARCHAR: 'light', 'dark', 'system')
   - `language` (VARCHAR, default 'en')
   - `notifications_enabled` (BOOLEAN)
   - `ai_model_preference`, `ollama_base_url`, `ollama_model` (VARCHAR)
   - `mcp_auto_connect`, `mcp_debug_mode` (BOOLEAN)
   - `dashboard_layout` (VARCHAR: 'horizontal', 'vertical')
   - `panel_sizes`, `custom_settings` (JSON)
   - Timestamps: `created_at`, `updated_at`

3. **conversations** - Chat conversation threads
   - `id` (CHAR(36), primary key, UUID)
   - `user_id` (CHAR(36), FK to users)
   - `title` (VARCHAR(255), default 'New Conversation')
   - `model` (VARCHAR(100)) - AI model used
   - `system_prompt` (TEXT)
   - `metadata` (JSON) - Additional conversation metadata
   - Timestamps: `created_at`, `updated_at`

4. **messages** - Individual chat messages
   - `id` (CHAR(36), primary key, UUID)
   - `conversation_id` (CHAR(36), FK to conversations)
   - `role` (VARCHAR: 'user', 'assistant', 'system', 'tool')
   - `content` (TEXT)
   - `tool_calls`, `tool_results`, `metadata` (JSON)
   - `created_at` (TIMESTAMP)

5. **mcp_servers** - User-configured MCP server definitions
   - `id` (CHAR(36), primary key, UUID)
   - `user_id` (CHAR(36), FK to users)
   - `name` (VARCHAR(100), unique per user)
   - `command` (JSON) - Command array to spawn server
   - `type` (VARCHAR: 'stdio', 'http')
   - `env` (JSON) - Environment variables
   - `enabled` (BOOLEAN)
   - `description` (TEXT)
   - Timestamps: `created_at`, `updated_at`

6. **ui_builder_templates** - Saved UI Builder templates
   - `id` (CHAR(36), primary key, UUID)
   - `user_id` (CHAR(36), FK to users)
   - `name` (VARCHAR(255), unique per user/category)
   - `category` (VARCHAR(100))
   - `description` (TEXT)
   - `resource` (JSON) - UIResourceDraft object
   - `action_mappings` (JSON) - Action mappings array
   - Timestamps: `created_at`, `updated_at`

### Database Features

- **Foreign Key Constraints**: CASCADE delete for data integrity
- **Automatic UUID Generation**: UUID() function for primary keys
- **Automatic Timestamps**: ON UPDATE CURRENT_TIMESTAMP for `updated_at`
- **Indexes**: Optimized for common query patterns (username, user_id, created_at, etc.)
- **JSON Support**: Native JSON columns for flexible metadata storage
- **Demo User**: Pre-created demo user for quick testing

### Docker Configuration

The database runs in a Docker container (`loopcraft-mysql`) with:
- **Image**: `mysql:8.0`
- **Port**: `3306` (mapped to host)
- **Volume**: `loopcraft_mysql_data` for persistent storage
- **Health Check**: Automatic connection monitoring
- **Auto-start**: Container configured with `restart: unless-stopped`

### Docker Commands

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View logs
docker logs loopcraft-mysql

# MySQL shell access
docker exec -it loopcraft-mysql mysql -u loopcraft -p loopcraft

# Reinitialize database (destructive)
./scripts/init-db.sh
```

## MCP-UI Lab Workflow

HyperFace now includes a comprehensive dashboard for working with MCP servers following the typical MCP-UI workflow:

### Typical Workflow

1. **Launch MCP-UI Lab**: Navigate to `/dashboard` in the application
2. **Resource Explorer**: Verify that expected data and models are present from connected MCP servers
3. **Config Editor**: Edit configuration parameters for MCP servers using the Monaco JSON editor
4. **Trigger Model Run**: Use the "Reload" button to re-issue requests and reconnect with updated configuration
5. **Metrics Dashboard**: Confirm runs succeeded and note performance characteristics (latency, success rates)
6. **Debug Anomalies**: Step through the Debugger panel, inspecting intermediate requests/responses
7. **Check Console**: Review error logs and system messages for any issues
8. **Iterate**: Repeat the cycle until the system behaves as expected
9. **Commit Changes**: Save configuration changes to version control

### Dashboard Components

- **Resource Explorer**: Tree view of all MCP resources organized by server with search/filter
- **Config Editor**: Monaco-powered JSON editor with syntax validation and import/export
- **Metrics Dashboard**: Real-time charts showing latency, success rates, tool calls, and connections
- **Debugger Panel**: Request/response inspector with timing information and error details
- **Console Panel**: Filterable log viewer (info/warn/error/debug) with export to file

### Settings Management

Access `/settings` to configure:
- User preferences and UI settings
- Ollama AI model configuration
- MCP server connections (connect/disconnect/status)
- Dashboard behavior (auto-connect, debug mode)

## MCP-UI Integration

LoopCraft includes comprehensive support for creating and rendering interactive UI components via the Model Context Protocol (MCP-UI).

### Overview

MCP-UI enables servers to deliver rich, dynamic UI resources to be rendered by the client. It supports three content types:

1. **Raw HTML** (`rawHtml`) - Self-contained HTML rendered in sandboxed iframes
2. **External URLs** (`externalUrl`) - Embed external web applications
3. **Remote DOM** (`remoteDom`) - Shopify's remote-dom for host-styled components

### Architecture

**Server-Side** (`src/lib/mcp-ui-helpers.ts`):
- Helper functions for creating UI resources with proper metadata
- `createHtmlUIResource()` - Create HTML-based UI components
- `createExternalUrlUIResource()` - Embed external applications
- `createRemoteDomUIResource()` - Create Remote DOM components
- Example components: dashboard, forms, interactive widgets

**Client-Side** (`src/components/assistant-ui/mcp-ui-renderer.tsx`):
- `UIResourceRenderer` component from `@mcp-ui/client`
- Secure iframe sandboxing with configurable permissions
- Auto-resizing iframes for responsive rendering
- Bi-directional communication via postMessage API

**Action Handlers**:
- **Tool Calls**: Execute MCP tools from UI components via `/api/mcp/tools`
- **Prompts**: Inject prompts into conversation (runtime integration required)
- **Links**: Open external URLs in new tabs
- **Intents**: Custom intent handling
- **Notifications**: Display user notifications

### Creating UI Resources

```typescript
import { createHtmlUIResource } from '@/lib/mcp-ui-helpers';

// Create an interactive dashboard
const dashboard = createHtmlUIResource({
  uri: 'ui://my-app/dashboard',
  htmlString: '<div>...</div>',
  title: 'My Dashboard',
  description: 'Interactive analytics dashboard',
  preferredSize: { width: 800, height: 600 },
  initialData: { theme: 'dark' }
});
```

### Rendering UI Resources

UI resources are automatically detected and rendered when:
1. Tool result contains `uri` starting with `ui://`
2. MCP server returns `type: 'resource'` with proper MCP-UI format
3. Content type is one of: `text/html`, `text/uri-list`, or `application/vnd.mcp-ui.remote-dom`

The `ToolFallback` component in `thread.tsx` automatically renders UI resources using `MCPUIRenderer`.

### Security

All UI resources are rendered in sandboxed iframes with:
- `allow-scripts` - JavaScript execution
- `allow-same-origin` - CORS requests
- `allow-forms` - Form submissions
- `allow-popups` - Opening new windows
- `allow-popups-to-escape-sandbox` - Unrestricted popups
- `clipboard-write` - Clipboard access

### Communication Protocol

UI components communicate with the host via `window.parent.postMessage()`:

```javascript
// From UI component
window.parent.postMessage({
  type: 'tool',
  payload: {
    toolName: 'mcp_server_toolname',
    params: { key: 'value' }
  },
  messageId: 'unique-id' // Optional for async responses
}, '*');
```

### Examples

See `src/lib/mcp-ui-helpers.ts` for complete examples:
- **Dashboard Example**: Interactive metrics with live updates and action buttons
- **Form Example**: Contact form with validation and submission handling

### Best Practices

1. **Always use `createUIResource()` helpers** - Ensures proper metadata and validation
2. **Set preferred frame size** - Improves initial render performance
3. **Use messageId for async operations** - Enables response tracking
4. **Implement proper error handling** - Return error status in action handlers
5. **Validate tool names** - Prefix with `mcp_{serverName}_` for consistency

### Recent Updates

#### MCP-UI Function Builder Phases 2, 3, 4: Complete Integration Composer (2025-10-01)
Completed the core functionality of the MCP Integration Composer with three fully-functional tabs: Actions, Flow, and Test.

**Complete 5-Tab Architecture:**
- **Context Tab**: Discover MCP servers and select tools for integration ✅
  - Purpose definition textarea for documenting component goals
  - Real-time tool browser with search/filter capabilities
  - Tool selection interface with server attribution
  - Fetches available tools from `/api/mcp/tools`
- **Design Tab**: Create UI layout ✅
  - Content type selector (rawHtml, externalUrl, remoteDom)
  - Monaco code editor for HTML/JavaScript/Remote DOM
  - Configuration panel for metadata (URI, title, size, initialData)
  - Live preview with action logging
- **Actions Tab**: Wire UI interactions to MCP tools ✅ **NEW**
  - InteractiveElementDetector: Auto-detect buttons, forms, links via DOMParser
  - ActionMappingEditor: Parameter binding UI with static/field values
  - ActionMappingList: Manage mappings with validation status
  - Full 3-panel layout with real-time updates
- **Flow Tab**: Visualize complete interaction lifecycle ✅ **NEW**
  - React Flow-based diagram with custom nodes (UI Element → Tool → Handler)
  - Color-coded nodes (blue/purple/green) and animated edges
  - Export diagram as PNG, mini-map, zoom/pan controls
  - Error highlighting with red edges
- **Test Tab**: Validate integration with real API ✅ **NEW**
  - TestRunner: Execute actual MCP tool calls with parameter input
  - TestResultsViewer: Test history with success/error tracking
  - Statistics dashboard, search/filter, export results
  - No mocks - real API integration only

**Enhanced State Management** (`ui-builder-store.ts`):
- **MCP Context**: Track selected servers, tools, and component purpose
- **Action Mappings**: Map UI elements to MCP tool calls with parameter bindings
- **Validation**: Track errors, warnings, and validation status across the workflow
- **Test Configuration**: Mock responses and test history for integration testing
- **New Types**: `MCPTool`, `MCPServer`, `ActionMapping`, `ValidationIssue`, `TestResult`, `BuilderTab`
- Templates now save action mappings alongside UI resources

**ContextSidebar Component** (persistent across all tabs):
- MCP server connection status with tool counts (✓ connected / ✗ disconnected)
- Selected tools display showing chosen integrations
- Action mappings count showing wired interactions
- Validation status with error/warning/success indicators
- Component purpose display
- Collapsible via toggle button

**Progress Tracking System:**
- Tab completion indicators (● complete / ● partial / ○ incomplete)
- Smart status calculation based on state (selected tools, mappings, validation)
- Overall progress display: "X / 5 complete"
- Color-coded progress dots in navigation bar

**Key Benefits:**
- **Visibility**: Users see available MCP tools and server capabilities before designing
- **Guided Flow**: Step-by-step workflow ensures proper integration planning
- **Progress Tracking**: Visual feedback prevents users from missing critical steps
- **Context Awareness**: Sidebar keeps integration status visible across all tabs
- **Relationship Representation**: Clear mapping of MCP server vocabulary to client UI composition

**Technical Details:**
- **Phase 1**: 964 lines across 8 files (Context tab + sidebar)
- **Phases 2-4**: +1979 lines across 12 files (Actions, Flow, Test tabs)
- **New Dependencies**: `@xyflow/react@^12.8.6`, `html-to-image@^1.11.13`
- Full TypeScript with strict type safety
- Client-side components using "use client" directive
- Responsive layouts with react-resizable-panels
- All builds successful, production-ready

**Key Implementation Decisions:**
- Browser-native DOMParser (no HTML parsing library)
- Real API testing only (no mocks for simplicity)
- Monaco for code editors (consistency)
- React Flow for diagrams (industry standard)
- Type-safe throughout with strict mode

**Remaining Phases (Optional):**
- **Phase 5**: Enhanced export with complete MCP server templates
- **Phase 6**: Real-time validation engine + ContextSidebar validation UI

**Current Status:** Core MCP Integration Composer is **fully functional** with complete workflow:
Discover tools → Design UI → Map actions → Visualize flow → Test integration

#### MCP-UI Full Implementation (2025-10-01)
Complete MCP-UI integration with action handlers and metadata support:
- **Server-Side Helpers** (`src/lib/mcp-ui-helpers.ts`): Helper functions for creating UI resources
- **Enhanced Action Handlers**: Tool calls from UI execute via `/api/mcp/tools` endpoint
- **Metadata Support**: Preferred frame size, initial render data, resource properties
- **Content Type Validation**: Explicit support for rawHtml, externalUrl, remoteDom
- **Auto-Resize Iframes**: Dynamic iframe sizing based on content
- **Security Configuration**: Proper sandbox permissions and iframe properties
- **Example Components**: Dashboard and form examples demonstrating all features

#### LoopCraft Rebrand & MCP Client Refactoring (2025-09-30)
Rebranded application from HyperFace to LoopCraft to better reflect the iterative workflow nature of MCP development. Refactored MCP client to use official SDK convenience methods (listTools(), callTool(), listResources(), readResource()).

#### MCP-UI Lab Dashboard & Settings (2025-09-30)
Complete dashboard and settings system for MCP-UI workflow:
- **Dashboard Page** (`/dashboard`): Full-featured MCP-UI Lab with 5 interactive panels
  - Resource Explorer: Browse and preview MCP resources from connected servers
  - Config Editor: Monaco-powered JSON editor for MCP server configurations
  - Metrics Dashboard: Real-time performance charts (latency, success rate, tool calls)
  - Debugger Panel: Request/response inspector for MCP operations
  - Console Panel: Filterable log viewer with export capabilities
- **Settings Page** (`/settings`): Comprehensive configuration management
  - User preferences (theme, language, notifications)
  - AI model configuration (Ollama base URL and model selection)
  - MCP server management (connect/disconnect, status monitoring)
  - Dashboard preferences (auto-connect, debug mode)
- **State Management**: Zustand stores for dashboard, MCP, and settings state
- **API Routes**: `/api/mcp/*` for server/resource/tool operations, `/api/metrics` for performance data
- **New Dependencies**: react-resizable-panels, recharts, @monaco-editor/react, date-fns, mysql2, jsonwebtoken

#### MySQL Docker Database Integration (2025-10-01)
Complete migration from Supabase to local MySQL database with Docker containerization:
- **Database Layer**: MySQL 8.0 in Docker with persistent volumes
- **Connection Pool**: mysql2/promise for efficient query management
- **Data Access Layer**: Type-safe TypeScript DAL (users, settings, conversations, templates)
- **API Routes**: RESTful endpoints for all data operations
- **State Management**: Zustand stores with API synchronization (replacing localStorage)
- **Authentication**: Simple JWT-based auth for demo purposes
- **Initialization Script**: Automated database setup via `./scripts/init-db.sh`
- **Docker Compose**: One-command database startup and management

#### Previous Updates
- **MCP Integration**: Added full Model Context Protocol support with MCP-UI for interactive components
- **Dynamic Tool Discovery**: Automatically discovers and integrates tools from connected MCP servers
- **Interactive UI Components**: Support for MCP-UI resources rendered securely in sandboxed iframes
- **Hybrid Architecture**: Combines Ollama AI inference with MCP ecosystem extensibility
- **MCP Client Management**: Comprehensive MCP server connection and lifecycle management
- **Environment Configuration**: Extended configuration for MCP servers via JSON in environment variables
- **Upgraded to ollama-ai-provider-v2**: Switched from unmaintained v1 to actively maintained v2 provider
- **Message Format Compatibility**: Added conversion between Assistant UI message format (with `parts`) and AI SDK format (with `content`)
- **Enhanced Error Handling**: Improved error messages for connection issues and missing models
- **Configuration Fixes**: Updated environment variables to use correct API endpoints
- **Fixed Provider Context Issues**: Resolved `ThreadListItem is only available inside <AssistantProvider />` error
- **Simplified Integration**: Using `useChatRuntime({ api: "/api/chat" })` pattern for reliable AI SDK integration
- no sensative info in any claude.md