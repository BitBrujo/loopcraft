# LoopCraft

A Next.js 15 application that integrates the Model Context Protocol (MCP) with an AI-powered chat interface. LoopCraft serves as an MCP client with MCP-UI integration, allowing AI assistants to interact with external tools and resources through MCP servers while rendering interactive UI components.

## ✨ Key Features

### 🤖 AI-Powered Chat Interface
- Natural language conversations with MCP tool integration
- User-configurable AI models and providers, including local Ollama
- Interactive MCP-UI component rendering with bidirectional communication

### 🔌 Model Context Protocol (MCP) Integration
- **User-specific MCP servers** managed through Settings UI
- Support for stdio, SSE, and HTTP transports
- Dynamic tool registration and resource handling

### 🎨 MCP-UI Builder

**Visual tool for creating UI resources following the official MCP-UI specification**

#### Core Features
- **3 Content Types**: rawHtml (default), externalUrl, remoteDom
- **Companion Mode**
  - Create UI-only servers that call tools from existing MCP servers
  - Select target server and choose which tools to expose via UI
  - Auto-generates tool call snippets for selected tools
  - Visual distinction with orange theme and puzzle icon
  - Recommended for FastMCP format (lightweight, declarative)
- **Auto-Deployment**
  - One-click deployment with 6-step automated process
  - Real-time streaming progress updates via NDJSON
  - Automatic rollback on failure to prevent orphaned resources
  - Supports both Standalone and FastMCP formats
- **HTML Template Library**: 13 ready-to-use templates
  - Forms, Dashboards, Tables, Galleries, Charts
  - Action Examples: AI Assistant Helper, Documentation Viewer, Navigation Panel, Status Notifier, Multi-Action Demo
- **Action Snippets Library**: 13 code snippets across 5 action types
  - Tool, Prompt, Link, Intent, Notify actions
  - "Insert at Cursor" functionality for Monaco editor
  - Companion Tools category (when companion mode enabled)
- **Size Presets**: 5 iframe size options (Small, Medium, Large, Full Width, Custom)
- **Renderer Options**: Auto-resize, sandbox permissions, iframe title, container styling
- **Template Placeholders**: Auto-detect `{{agent.name}}` patterns for dynamic content
- **Initial Render Data**: JSON editor for passing initial state
- **Export Options**: Integration snippet OR Standalone server OR FastMCP server
- **Live Preview**: Real-time iframe preview with MCPUIRenderer
- **Save/Load Templates**: Persist and reuse UI resources

### 🔄 MCP-UI Action Types

All 5 action types fully implemented for bidirectional communication:

1. **Tool** - Execute MCP tools (form submissions, data creation)
2. **Prompt** - Send message to AI (context-aware help requests)
3. **Link** - Open external URL (documentation, dashboards)
4. **Intent** - Trigger app actions (navigation, settings)
5. **Notify** - Show notification (success/error feedback with auto-variant detection)

**Message Format:**
```javascript
window.parent.postMessage({
  type: 'tool' | 'prompt' | 'link' | 'intent' | 'notify',
  payload: { /* action-specific data */ }
}, '*');
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Docker** and Docker Compose
- **Ollama** (for AI functionality)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hyperface
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env.local
```

Edit `.env.local` and set required variables:
```env
# AI Configuration (can be overridden per user in Settings)
OLLAMA_BASE_URL=http://localhost:11434/api
OLLAMA_MODEL=llama3.2:latest

# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=loopcraft
MYSQL_USER=loopcraft
MYSQL_PASSWORD=your_secure_password
MYSQL_ROOT_PASSWORD=your_root_password

# Authentication
JWT_SECRET=your_jwt_secret_here  # Generate with: openssl rand -hex 32
JWT_EXPIRES_IN=7d
```

4. **Start MySQL database**
```bash
docker-compose up -d
```

The database will automatically initialize with the schema on first run.

5. **Run development server**
```bash
npm run dev
```

6. **Open application**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Database
docker-compose up -d     # Start MySQL
docker-compose down      # Stop MySQL

# Demo MCP Servers
npm run mcp:demo         # Contact form demo server (port 3001)
npm run mcp:hypermemory  # HyperMemory knowledge graph server
```

## 🗂️ Project Structure

```
hyperface/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API routes
│   │   │   ├── chat/                 # Chat endpoint with MCP tool integration
│   │   │   ├── mcp/                  # MCP server management
│   │   │   ├── ui-builder/           # MCP-UI Builder API
│   │   │   │   ├── preview/          # Live preview endpoint
│   │   │   │   ├── templates/        # Save/load templates
│   │   │   │   └── deploy/           # Auto-deploy endpoint
│   │   │   └── auth/                 # Authentication
│   │   ├── mcp-ui-builder/           # MCP-UI Builder page
│   │   ├── mcp-servers/              # MCP Servers management page
│   │   ├── chat/                     # Chat interface page
│   │   └── settings/                 # Settings page
│   ├── components/
│   │   ├── HomePage.tsx              # Landing page with Artwork33
│   │   ├── Artwork33.tsx             # Animated double helix canvas
│   │   ├── mcp-ui-builder/           # Builder components
│   │   │   ├── tabs/                 # ConfigureTab, DesignTab, ExportTab
│   │   │   │   ├── ConfigureTab.tsx  # Deployment mode & companion config
│   │   │   │   ├── DesignTab.tsx     # Templates & companion snippets
│   │   │   │   └── ExportTab.tsx     # Auto-deploy & export options
│   │   │   └── editors/              # HTMLEditor, URLInput
│   │   ├── assistant-ui/             # Chat interface components
│   │   │   └── mcp-ui-renderer.tsx   # MCP-UI rendering with actions
│   │   ├── chat/                     # Layout and navigation
│   │   │   ├── ChatLayout.tsx        # Main layout wrapper
│   │   │   └── ChatHeader.tsx        # Navigation bar (3 tabs)
│   │   └── ui/                       # Radix UI components
│   ├── lib/
│   │   ├── mcp-client.ts             # MCPClientManager
│   │   ├── mcp-init.ts               # Shared MCP initialization
│   │   ├── db.ts                     # Database utilities
│   │   ├── auth.ts                   # JWT authentication
│   │   ├── ai-config.ts              # AI configuration with user overrides
│   │   ├── ui-templates.ts           # HTML templates (13+ templates)
│   │   ├── action-snippets.ts        # MCP-UI action snippets (13 snippets)
│   │   ├── code-generation.ts        # Code export utilities (3 formats)
│   │   └── stores/                   # Zustand state management
│   │       └── ui-builder-store.ts   # Builder state with companion mode
│   ├── types/
│   │   ├── ui-builder.ts             # MCP-UI Builder types
│   │   ├── server-builder.ts         # Server builder types
│   │   └── database.ts               # Database types
│   └── mcp-servers/                  # Example & Demo MCP servers
│       ├── demo-server.ts            # Contact form demo
│       ├── hypermemory-server.ts     # Knowledge graph demo
│       └── hyperface-server.ts       # Companion UI example
├── docker/
│   └── mysql/
│       └── init.sql                  # Database schema
├── docker-compose.yml                # MySQL container config
└── .env.example                      # Environment template
```

## 🛠️ Tech Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI**: React 19, TypeScript, Tailwind CSS 4, Radix UI
- **AI**: Vercel AI SDK, @assistant-ui/react, Ollama
- **MCP**: @modelcontextprotocol/sdk, @mcp-ui/client, @mcp-ui/server
- **Database**: MySQL 8.0 with Docker, mysql2 driver
- **Auth**: JWT with bcrypt password hashing
- **State**: Zustand with persistence

### Key Libraries
- **Monaco Editor**: Code editing with syntax highlighting
- **Lucide React**: Icon library
- **Zod**: Schema validation
- **React Hook Form**: Form management

## 📚 MCP Integration

### Server Management
All MCP servers are user-specific and managed through the Settings UI:

### Transport Types
- **stdio**: Local process-based servers (e.g., filesystem, memory)
- **sse**: Remote HTTP-based servers via Server-Sent Events
- **http**: HTTP streaming transport (treated as SSE)

### MCPClientManager Features
- Connection management with error tracking
- User server tracking and automatic cleanup
- Tool and resource operations
- Support for authentication via environment variables

### Example MCP Servers

#### hyperface-server.ts - Companion UI Example

Located in `mcp-servers/hyperface-server.ts`, this is a production example of a **Companion UI Server** deployed via the MCP-UI Builder.

**Key Features:**
- **FastMCP Format**: Lightweight, declarative server structure
- **UI-Only Pattern**: Provides interactive help interface with prompt actions
- **MCP-UI Integration**: Uses `@mcp-ui/server` for UI resource delivery
- **Tools API Approach**: `get_ui` tool returns UI resources when called
- **Interactive Components**: Help buttons using `window.parent.postMessage()`
- **Stdio Transport**: Standard MCP client communication

**Technology Stack:**
- FastMCP with `@mcp-ui/server` integration
- MCP-UI compliant resource structure
- Proper error handling with uncaught exception handlers

**Usage:**
Add to Settings > MCP Servers:
- Type: `stdio`
- Command: `["node", "mcp-servers/hyperface-server.ts"]` (or `.js` if transpiled)

**Purpose:**
Reference implementation demonstrating:
- Companion server pattern (UI-only server)
- FastMCP format best practices
- Tools API for UI delivery (`__MCP_UI_RESOURCE__:` prefix)
- Proper MCP protocol compliance

This server demonstrates how to create companion UIs that enhance existing MCP servers with visual interfaces.

## 🎯 MCP-UI Builder Workflow

### 3-Tab Workflow

#### 1️⃣ Configure Tab
- **Deployment Mode Selection:**
  - **Server Integration**: Add UI to existing MCP server
  - **Companion Server**: Create UI-only server that calls tools from another MCP server
- **Companion Mode Configuration** (when enabled):
  - Select target MCP server from dropdown
  - View and select tools to expose via UI
  - Visual tools counter badge
  - Orange-themed companion UI with puzzle icon
- Set resource URI (format: `ui://server/resource`)
- Choose content type (rawHtml, externalUrl, remoteDom)
- Set size preset and add metadata
- Configure renderer options in UI Metadata card

#### 2️⃣ Design Tab
- Browse 13 HTML templates or use action snippets library
- **Companion Mode Features** (when enabled):
  - Auto-generates companion tool call snippets
  - "Companion Tools" category in action snippets (orange theme)
  - Ready-to-use code for calling tools from target server
- Edit content in Monaco editor with live preview
- Configure initial render data (collapsible)

#### 3️⃣ Export Tab
- **Deployment Options:**
  - **Integration Snippet**: Copy code for existing server (when server selected)
  - **Standalone Server**: Complete MCP server with stdio transport
  - **FastMCP Server**: Lightweight declarative server (recommended for companion mode)
  - **Auto-Deploy Button**: One-click deployment with real-time progress
- Select language (TypeScript/JavaScript)
- Copy code, download file, or deploy instantly
- Context-aware Quick Start Guide based on deployment mode

### Auto-Deployment Process

When you click "Auto-Deploy", LoopCraft performs these steps:

1. **Write Server File** - Generates server code and writes to `mcp-servers/` directory
2. **Install Dependencies** - Runs `npm install` for required packages
3. **Test Server Startup** - Validates the process can start successfully
4. **Validate MCP Protocol** - Connects test server and lists tools
5. **Add to Database** - Creates entry in `mcp_servers` table (enabled by default)
6. **Enable and Connect** - Makes server immediately available in chat

**Features:**
- Real-time streaming progress updates (NDJSON format)
- Automatic rollback on failure (reverse order cleanup)
- Collision handling (appends timestamp to duplicate names)
- Error reporting with detailed messages

Auto-deploy MCP server (requires JWT auth)
- **Request**: `{ resource: UIResource, format: 'standalone' | 'fastmcp', language: 'typescript' | 'javascript' }`
- **Response**: Streaming NDJSON with deployment progress
- **Steps**: Write file → Install deps → Test startup → Validate MCP → Add to DB → Connect
- **Rollback**: Automatic cleanup on failure (disconnect → delete DB → delete file → kill processes)

##  Roadmap

###  Phase 1: Foundation (Completed)

- [x] **MCP Client Integration**
  - Support for stdio, SSE, and HTTP transports
  - User-specific server management via Settings UI
  - Error tracking and automatic cleanup
  - Authentication via environment variables
- [x] **MCP-UI Builder**
  - Visual tool for creating UI resources
  - 3 content types: rawHtml, externalUrl, remoteDom (coming soon)
  - 13 HTML templates and 13 action snippets
  - Live preview with MCPUIRenderer
- [x] **Companion Mode**
  - UI-only servers that call tools from existing MCP servers
  - Auto-generated tool call snippets
  - Orange-themed UI with visual distinction
- [x] **Auto-Deployment**
  - One-click deployment with 6-step process
  - Real-time NDJSON streaming progress
  - Automatic rollback on failure
  - Support for Standalone and FastMCP formats
- [x] **User Authentication & Database**
  - JWT authentication with bcrypt
  - MySQL 8.0 with Docker
  - User-specific prompts and settings

###  Phase 2: Enhanced Builder (In Progress)

- [ ] **Remote DOM Support**
  - Full React component support in MCP-UI
  - Web Components framework integration
  - Client-side hydration and state management
- [ ] **Visual UI Editor**
  - Drag-and-drop component builder
  - Component library with pre-built blocks

###  Phase 3: Advanced Features (Planned)

- [ ] **Analytics & Monitoring**
  - Custom dashboards
- [ ] **MCP Orchestration**
  - Server chains and workflows
  - Conditional tool execution
  - Event-driven automation
- [ ] **Extended Capabilities**
  - Advanced debugging tools for MCP protocol
  - Webhook support for external integrations
- [ ] **Developer Experience**
  - Testing framework for MCP tools

###  Phase 4: Ecosystem (Future)

- [ ] **Marketplace & Monetization**
  - Server marketplace with ratings
  - Paid templates and servers
  - Subscription management
  - Developer revenue sharing
- [ ] **Platform Extensions**
  - Third-party integrations (Zapier, n8n, etc.)
  - AI-powered template generation


### 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

- **Report Issues**: Found a bug? [Open an issue](https://github.com/your-org/loopcraft/issues)
- **Request Features**: Have an idea? Share it in [Discussions](https://github.com/your-org/loopcraft/discussions)
- **Submit PRs**: Check out our [Contributing Guide](CONTRIBUTING.md)
- **Join Discord**: Connect with the community for real-time discussions

**Priority Areas:**
- Remote DOM implementation for Phase 2
- Visual UI editor components
- Template marketplace backend
- Documentation improvements
- Testing and QA

## 📝 License

MIT License - see LICENSE file for details

---
