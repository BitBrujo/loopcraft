# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoopCraft is a fully self-contained, Docker-based Next.js 15 AI chat application that provides a modern interface for interacting with AI models and Model Context Protocol (MCP) servers. The application uses React 19, TypeScript, Tailwind CSS, the Assistant UI framework, and MCP-UI for interactive components. It combines the power of local AI models via Ollama with a local MySQL database and the extensibility of the Model Context Protocol ecosystem. Everything runs locally with no external dependencies.

## Common Development Commands

### Local Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Docker Commands
- `npm run docker:build` - Build all Docker images
- `npm run docker:up` - Start full stack (MySQL, Ollama, Next.js app)
- `npm run docker:down` - Stop and remove containers
- `npm run docker:logs` - View service logs
- `npm run docker:mysql` - Connect to MySQL CLI

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
- **MySQL 8.0** for local database with connection pooling via `mysql2` ^3.11.6
- **JWT Authentication** via `jsonwebtoken` ^9.0.2 with bcrypt password hashing
- **Docker** for containerization and orchestration (MySQL, Ollama, Next.js app)

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/
│   │   ├── chat/          # Chat API endpoint (MCP + Ollama integration)
│   │   ├── mcp/           # MCP API routes (servers, resources, tools)
│   │   └── metrics/       # Metrics collection endpoint
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
│   │   └── ConsolePanel.tsx     # Log viewer
│   ├── settings/          # Settings page components
│   │   └── AddServerDialog.tsx  # MCP server add/edit dialog
│   ├── chat/             # Chat-specific components (header, layout, mobile sidebar, theme toggle)
│   ├── providers/        # React context providers (theme provider)
│   └── ui/              # shadcn/ui components (button, dialog, sheet, etc.)
└── lib/
    ├── mcp-client.ts     # MCP client management service
    ├── mcp-config.ts     # MCP server configuration
    ├── mysql-client.ts   # MySQL connection pool and query utilities
    ├── auth.ts           # JWT authentication and password hashing
    ├── dal/              # Data Access Layer
    │   ├── types.ts      # TypeScript interfaces for database models
    │   ├── users.ts      # User profile and settings operations
    │   ├── conversations.ts # Conversation management
    │   ├── messages.ts   # Message persistence
    │   ├── mcp-servers.ts # MCP server configurations
    │   └── files.ts      # File upload tracking
    ├── stores/           # Zustand state management
    │   ├── dashboard-store.ts # Dashboard state (logs, metrics, debug)
    │   ├── mcp-store.ts      # MCP state (servers, resources, tools)
    │   └── settings-store.ts # User settings (persisted)
    └── utils.ts          # Utility functions (cn, etc.)
components/                 # Legacy components directory
└── CustomMessageInput.tsx # Custom message input component
```

### Key Architectural Patterns

1. **Hybrid AI Integration**: Combines Ollama for AI model inference with MCP for extensible tool and resource access:
   - Uses Ollama provider v2 with environment-configured base URL (`OLLAMA_BASE_URL`) and model (`OLLAMA_MODEL`) from `.env.local`
   - Integrates MCP client to connect to various MCP servers for tools, resources, and prompts
   - Automatic tool discovery from connected MCP servers
   - Support for both traditional tools and interactive UI components via MCP-UI

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

5. **Backend Architecture**: Self-hosted MySQL database with JWT authentication:
   - **Authentication**: JWT-based with bcrypt password hashing, HTTP-only cookies
   - **Database**: MySQL 8.0 with connection pooling and transaction support
   - **Data Access Layer**: Type-safe DAL with CRUD operations for all tables
   - **Message Persistence**: Conversations and messages stored in MySQL
   - **User Management**: Profile, settings, and MCP server configurations per user
   - **File Tracking**: File upload records with TTL-based cleanup for temporary files

6. **Docker Architecture**: Fully containerized stack for easy deployment:
   - **MySQL Container**: Persistent database with automatic schema initialization
   - **Ollama Container**: Local AI model server with model persistence
   - **Next.js App Container**: Production-optimized multi-stage build
   - **Docker Compose**: Orchestration with health checks and service dependencies
   - **Networking**: Internal Docker network for secure service communication

### Environment Configuration

**Required environment variables** (must be set in `.env.local` for local dev or `.env.docker` for Docker):

**MySQL Configuration:**
- `MYSQL_HOST` - MySQL host (default: `localhost` for dev, `mysql` for Docker)
- `MYSQL_PORT` - MySQL port (default: `3306`)
- `MYSQL_DATABASE` - Database name (default: `hyperface`)
- `MYSQL_USER` - Database user (default: `hyperface`)
- `MYSQL_PASSWORD` - Database password (MUST change in production)
- `MYSQL_ROOT_PASSWORD` - Root password for initial setup (Docker only)

**Ollama Configuration:**
- `OLLAMA_BASE_URL` - Ollama server URL (must include `/api` path)
- `OLLAMA_MODEL` - Model name to use

**Authentication Configuration:**
- `JWT_SECRET` - Secret key for JWT signing (MUST be 32+ characters in production)
- `JWT_EXPIRES_IN` - Token expiration time (default: `7d`)

**Application Configuration:**
- `NODE_ENV` - Environment (`development` or `production`)
- `NEXT_PUBLIC_APP_URL` - Public URL for the application

**Optional environment variables:**
- `MCP_CONFIG` - JSON string defining MCP servers to connect to

**Local Development Configuration (.env.local):**
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=loopcraft
MYSQL_USER=loopcraft
MYSQL_PASSWORD=loopcraft_password

OLLAMA_BASE_URL=http://localhost:11434/api
OLLAMA_MODEL=llama3.2:latest

JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

NEXT_PUBLIC_APP_URL=http://localhost:3000
MCP_CONFIG=
```

**Docker Configuration (.env.docker):**
```
MYSQL_HOST=mysql
OLLAMA_BASE_URL=http://ollama:11434/api
# Other variables same as above but with production-grade secrets
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
# Basic filesystem server for current directory:
MCP_CONFIG={"servers":[{"name":"filesystem","command":["npx","-y","@modelcontextprotocol/server-filesystem","."],"type":"stdio"}]}

# Memory server for persistent context:
MCP_CONFIG={"servers":[{"name":"memory","command":["npx","-y","@modelcontextprotocol/server-memory"],"type":"stdio"}]}

# Multiple servers (filesystem + memory):
MCP_CONFIG={"servers":[{"name":"filesystem","command":["npx","-y","@modelcontextprotocol/server-filesystem","."],"type":"stdio"},{"name":"memory","command":["npx","-y","@modelcontextprotocol/server-memory"],"type":"stdio"}]}
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

### Database & Authentication
- `mysql2` (^3.11.6) - MySQL client with promise support and connection pooling
- `jsonwebtoken` (^9.0.2) - JWT token generation and verification
- `bcrypt` (^5.1.1) - Password hashing with salt rounds

### Dashboard & Visualization
- `react-resizable-panels` (^3.0.6) - Resizable dashboard panel layouts
- `recharts` (^3.2.1) - Charts and metrics visualization
- `@monaco-editor/react` (^4.7.0) - Monaco code editor for JSON config editing
- `date-fns` (^4.1.0) - Date formatting and manipulation
- `zustand` (^5.0.8) - State management for dashboard and settings

## Database Schema

### Tables Overview (MySQL 8.0)

1. **user_profiles** - Extended user profile information
   - `id` (CHAR(36), UUID primary key)
   - `username` (VARCHAR(255), unique, NOT NULL)
   - `email` (VARCHAR(255), unique, NOT NULL)
   - `password_hash` (VARCHAR(255), NOT NULL)
   - `display_name` (VARCHAR(255))
   - `avatar_url` (TEXT)
   - `bio` (TEXT)
   - Timestamps: `created_at`, `updated_at`
   - Indexes: username, email

2. **user_settings** - Per-user application settings
   - `id` (CHAR(36), UUID primary key)
   - `user_id` (CHAR(36), FK to user_profiles, unique)
   - `theme` (VARCHAR(50): 'light', 'dark', 'system')
   - `language` (VARCHAR(10), default 'en')
   - `notifications_enabled` (BOOLEAN, default TRUE)
   - `ai_model_preference` (VARCHAR(255))
   - `custom_settings` (JSON) - Flexible settings storage
   - Timestamps: `created_at`, `updated_at`
   - Foreign key cascade on user deletion

3. **conversations** - Chat conversation threads
   - `id` (CHAR(36), UUID primary key)
   - `user_id` (CHAR(36), FK to user_profiles)
   - `title` (VARCHAR(500))
   - `model` (VARCHAR(255)) - AI model used
   - `system_prompt` (TEXT)
   - `metadata` (JSON) - Additional conversation metadata
   - Timestamps: `created_at`, `updated_at`
   - Foreign key cascade on user deletion
   - Index: (user_id, created_at DESC)

4. **messages** - Individual chat messages
   - `id` (CHAR(36), UUID primary key)
   - `conversation_id` (CHAR(36), FK to conversations)
   - `role` (VARCHAR(50): 'user', 'assistant', 'system', 'tool')
   - `content` (TEXT)
   - `tool_calls` (JSON) - Tool invocations
   - `tool_results` (JSON) - Tool execution results
   - `metadata` (JSON)
   - `created_at` (TIMESTAMP)
   - Foreign key cascade on conversation deletion
   - Index: (conversation_id, created_at ASC)

5. **mcp_servers** - User-configured MCP server definitions
   - `id` (CHAR(36), UUID primary key)
   - `user_id` (CHAR(36), FK to user_profiles)
   - `name` (VARCHAR(255), unique per user)
   - `command` (JSON) - Command array to spawn server
   - `type` (VARCHAR(50): 'stdio', 'sse', 'http')
   - `env` (JSON) - Environment variables
   - `enabled` (BOOLEAN, default TRUE)
   - `description` (TEXT)
   - Timestamps: `created_at`, `updated_at`
   - Foreign key cascade on user deletion
   - Unique constraint: (user_id, name)
   - Index: (user_id, enabled)

6. **file_uploads** - File upload tracking with temporary file support
   - `id` (CHAR(36), UUID primary key)
   - `user_id` (CHAR(36), FK to user_profiles)
   - `conversation_id` (CHAR(36), FK to conversations, nullable)
   - `file_name` (VARCHAR(500))
   - `file_path` (VARCHAR(1000)) - Storage path
   - `file_size` (BIGINT)
   - `mime_type` (VARCHAR(255))
   - `is_temporary` (BOOLEAN, default FALSE)
   - `expires_at` (TIMESTAMP, nullable) - TTL for temp files
   - `metadata` (JSON)
   - `created_at` (TIMESTAMP)
   - Foreign key cascade on user deletion
   - Foreign key set null on conversation deletion
   - Indexes: user_id, conversation_id, expires_at

### Security Features

- **User Isolation**: All tables have user_id foreign keys for data separation
- **JWT Authentication**: Secure token-based authentication with HTTP-only cookies
- **Password Security**: bcrypt hashing with configurable salt rounds (default 10)
- **Foreign Key Cascades**: Automatic cleanup of related records on user deletion
- **Updated Timestamps**: Automatic `updated_at` triggers on relevant tables
- **Temporary File Cleanup**: MySQL event `delete_expired_files` runs hourly for TTL-based cleanup
- **Default Admin Account**: Initial admin user created on database initialization
  - Username: `admin`
  - Password: `admin123` (MUST change after first login)

### Indexes

- Optimized for common query patterns:
  - User lookups: username, email (unique indexes)
  - Conversation listings: (user_id, created_at DESC)
  - Message retrieval: (conversation_id, created_at ASC)
  - MCP servers: (user_id, enabled)
  - File expiration: expires_at for temp file cleanup

### Views

- **active_conversations**: Conversation list with message count and last message timestamp
  - Joins conversations and messages tables
  - Useful for conversation list UI
  - Pre-aggregated for performance

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and receive JWT token
- `POST /api/auth/logout` - Clear authentication cookie
- `GET /api/auth/me` - Get current user profile (requires auth)

### Conversations
- `GET /api/conversations` - List user's conversations (requires auth)
- `POST /api/conversations` - Create new conversation (requires auth)
- `GET /api/conversations/[id]` - Get conversation with messages (requires auth)
- `PATCH /api/conversations/[id]` - Update conversation (requires auth)
- `DELETE /api/conversations/[id]` - Delete conversation (requires auth)

### Chat
- `POST /api/chat` - Stream AI responses with message persistence (auth optional)

### Health
- `GET /api/health` - Check database connection and service health

## MCP-UI Lab Workflow

LoopCraft now includes a comprehensive dashboard for working with MCP servers following the typical MCP-UI workflow:

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

### Recent Updates

#### MCP-UI Iframe Rendering Fix (2025-09-30)
Fixed critical bug preventing MCP-UI interactive components from rendering in iframes:
- **Root Cause**: The `mcp-ui-renderer.tsx` component was not passing the `_meta` field from MCP server responses to the `UIResourceRenderer`
- **Impact**: Without `_meta` metadata (`"mcpui.dev/ui-encoding"` and `"mcpui.dev/ui-contentType"`), the renderer couldn't decode base64 HTML or determine content type, causing HTML to display as text
- **Solution**:
  - Added `_meta` field preservation in mcpResponse resource object (`src/components/assistant-ui/mcp-ui-renderer.tsx:63`)
  - Updated TypeScript interfaces to include `_meta?: Record<string, string>` typing (lines 12, 20)
- **Result**: Demo MCP server UI components (greeting cards, counters, forms, charts) now properly render in sandboxed iframes
- **Key Insight**: The demo server (`src/mcp-servers/demo-ui-server.ts`) was working correctly all along - the issue was purely client-side metadata handling

#### MCP Server Save & Select Feature (2025-09-30)
Complete MCP server management with database persistence and full CRUD operations:
- **AddServerDialog Component**: Form-based dialog for adding/editing MCP servers
  - Fields: name, command, type (stdio/sse/http), environment variables, description
  - Validation for required fields with support for add and edit modes
  - Visual environment variable management with add/remove functionality
- **Enhanced API Endpoints** (`/api/mcp/servers`):
  - **GET**: Lists servers merged from environment config AND database (per-user)
  - **POST**: Create new server in database OR connect to existing server
  - **PUT**: Update existing server configuration in database
  - **DELETE**: Delete server from database OR disconnect from connected server
  - Full JWT authentication with user isolation for all database operations
  - Servers automatically labeled by source ('database' vs 'environment')
- **Database Integration**:
  - `loadMCPConfigWithUser()`: Automatically merges environment + database servers
  - Converts database MCP server format to client format seamlessly
  - Deduplicates servers by name to prevent conflicts
- **Settings Page Enhancements**:
  - "Add Server" button opens creation dialog with full form
  - Edit/Delete buttons for user-saved servers (database servers only)
  - Visual badges showing server source (Saved vs Env) for easy identification
  - Full CRUD operations with user feedback via dashboard logs
  - Connect/Disconnect functionality preserved for all server types
- **Store Updates**:
  - MCP Store: Added `source` field and `editingServer` state for dialog management
  - Settings Store: Added `mcpSelectedServers` array for tracking active servers
- **Chat API Integration**:
  - Automatically loads user-specific servers from database on initialization
  - Merges with environment servers for complete MCP ecosystem
  - `getUserIdFromRequest()` helper for seamless authentication
- **Key Features**:
  - ✅ Save MCP server configs to MySQL database with per-user association
  - ✅ Add/Edit/Delete UI in Settings page with intuitive controls
  - ✅ Auto-load user servers on chat initialization (no manual setup)
  - ✅ Environment servers are read-only (protected from modification)
  - ✅ Database servers fully manageable by authenticated users
  - ✅ User isolation ensures privacy and security with JWT authentication

#### MCP Server Management & Debug Tooling (2025-09-30)
Enhanced MCP server management with comprehensive debugging capabilities:
- **Enhanced Error Logging**: Added detailed error logging with stack traces across all MCP API routes
  - `POST /api/mcp/servers` now logs connection attempts with full command details
  - `DELETE /api/mcp/servers` logs disconnection operations with error details
  - `GET /api/mcp/tools` logs tool discovery operations from connected servers
- **Improved Error Handling**: Better error messages with stack traces and diagnostic details
- **Debug Tooling**: Added comprehensive console logging with emoji indicators (✅❌🔧📡🎉💥) for better visibility
- **Interactive UI Examples**: Updated welcome suggestions with MCP-UI component examples:
  - Greeting card with personalization
  - Interactive counter component
  - Contact form with validation
  - Data visualization with charts
- **Monaco Editor Improvements**: Suppressed harmless cancellation errors during unmount
- **Code Splitting**: Dynamic import for MobileSidebar to improve initial page load
- **Development Dependencies**: Added `tsx` (^4.20.6) for TypeScript execution in development scripts
- **MCP Configuration**: Enhanced config loading with detailed debug output for troubleshooting connection issues

#### Demo MCP Server (2025-09-30)
Added comprehensive demo MCP server showcasing MCP-UI capabilities:
- **Location**: `src/mcp-servers/demo-ui-server.ts`
- **Framework**: Built with `@mcp-ui/server` SDK demonstrating interactive components
- **Tools Implemented**:
  - `greet_user` - Personalized greeting cards with custom styling
  - `create_counter` - Interactive counters with increment/decrement controls
  - `show_form` - Contact forms with validation and submission
  - `show_chart` - Data visualization with bar/line/pie chart options
- **Startup Scripts**:
  - `scripts/start-demo-server.ts` - TypeScript launcher for the demo server
  - `start-dev.sh` - Shell script to run demo server with tsx
- **Usage**: Perfect for testing MCP-UI integration and developing new interactive tools
- **Status Endpoint**: Added `GET /api/mcp/status` to monitor MCP server connection health

#### Rebranding to LoopCraft (2025-09-30)
Complete rebranding from HyperFace to LoopCraft with security hardening:
- Removed all fallback values for environment variables
- Removed hardcoded IP addresses and passwords from codebase
- Updated all documentation and configuration files

#### Docker Migration & MySQL Backend (2025-09-30)
Complete migration from Supabase to self-hosted MySQL with Docker:
- **Docker Infrastructure**: Full containerization with docker-compose
  - MySQL 8.0 container with automatic schema initialization
  - Ollama container for local AI model serving
  - Next.js app container with production-optimized build
  - Health checks and service dependencies
  - Persistent volumes for database and model storage
- **MySQL Database**: Complete database schema with 6 tables
  - User profiles and settings with JWT authentication
  - Conversations and messages with JSON fields for metadata
  - MCP server configurations per user
  - File upload tracking with TTL-based cleanup
- **Authentication System**: JWT-based auth with bcrypt password hashing
  - Registration, login, logout, and user profile endpoints
  - HTTP-only cookies for secure token storage
  - Protected API routes with authentication middleware
- **Data Access Layer**: Type-safe DAL for all database operations
  - `mysql-client.ts` for connection pooling and queries
  - Individual DAL modules for each table (users, conversations, messages, mcp-servers, files)
  - Transaction support with begin/commit/rollback
- **Message Persistence**: Chat messages automatically saved to MySQL
  - Conversation history stored with user association
  - Tool calls and results stored in JSON fields
- **Removed Dependencies**: Eliminated all Supabase dependencies
  - Removed `@supabase/supabase-js` package
  - Removed Supabase MCP server configuration
  - Deleted supabase-client.ts
- **New Dependencies**: Added MySQL and auth packages
  - `mysql2` for MySQL connection pooling
  - `jsonwebtoken` for JWT token management
  - `bcrypt` for password hashing
- **Environment Updates**: New environment variables for MySQL and auth
  - MySQL connection configuration
  - JWT secret and expiration settings
  - Removed all Supabase-related variables

#### MCP-UI Lab Dashboard & Settings (2025-09-30)
Complete dashboard and settings system for MCP-UI workflow:
- MCP-UI Lab with 5 interactive panels (Resource Explorer, Config Editor, Metrics, Debugger, Console)
- Settings page for user preferences, AI model config, and MCP server management
- Zustand state management for dashboard and settings

#### Previous Updates
- **MCP Integration**: Full Model Context Protocol support with dynamic tool discovery
- **Interactive UI Components**: MCP-UI resources rendered in sandboxed iframes
- **Hybrid Architecture**: Ollama AI inference with MCP ecosystem extensibility
- **ollama-ai-provider-v2**: Upgraded to actively maintained v2 provider
- **Assistant UI Integration**: Using `useChatRuntime({ api: "/api/chat" })` pattern