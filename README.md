# LoopCraft

A Next.js 15 application that integrates the Model Context Protocol (MCP) with an AI-powered chat interface. LoopCraft serves as an MCP client with MCP-UI integration, allowing AI assistants to interact with external tools and resources through MCP servers while rendering interactive UI components.

## ✨ Key Features

### 🤖 AI-Powered Chat Interface
- Natural language conversations with MCP tool integration
- User-configurable AI models and providers (Ollama)
- Streaming responses with real-time updates
- Per-user AI configuration (model selection, API endpoints)
- Interactive MCP-UI component rendering with bidirectional communication
- Clean, modern interface with gradient styling and smooth animations

### 🔌 Model Context Protocol (MCP) Integration
- **User-specific MCP servers** managed through Settings UI
- Support for stdio, SSE, and HTTP transports
- Dynamic tool registration and resource handling
- Automatic server cleanup and error tracking
- Authentication support (app-level JWT + MCP-level env vars)
- Bidirectional communication between UI and MCP servers

### 🎨 MCP-UI Builder

**Visual tool for creating UI resources following the official MCP-UI specification**

#### Core Features
- **Clean, Modern Interface**: Centered gradient title with orange accent theme
- **Reset Functionality**: Clear all builder state with confirmation dialog
- **Server Integration**: Select target MCP server or create standalone resources
- **3 Content Types**: rawHtml (default), externalUrl, remoteDom (coming soon)
- **HTML Template Library**: 13 ready-to-use templates
  - Forms, Dashboards, Tables, Galleries, Charts
  - Action Examples: AI Assistant Helper, Documentation Viewer, Navigation Panel, Status Notifier, Multi-Action Demo
- **Action Snippets Library**: 13 code snippets across 5 action types
  - Tool, Prompt, Link, Intent, Notify actions
  - "Insert at Cursor" functionality for Monaco editor
- **Size Presets**: 5 iframe size options (Small, Medium, Large, Full Width, Custom)
- **Renderer Options**: Auto-resize, sandbox permissions, iframe title, container styling
- **Template Placeholders**: Auto-detect `{{agent.name}}` patterns for dynamic content
- **Initial Render Data**: JSON editor for passing initial state
- **Export Options**: Integration snippet OR standalone server (TypeScript/JavaScript)
- **Live Preview**: Real-time iframe preview with MCPUIRenderer
- **Save/Load Templates**: Persist and reuse UI resources (JWT auth required)

#### 3-Tab Workflow

1. **Configure Tab**
   - Select MCP server or create standalone
   - Set resource URI (format: `ui://server/resource`)
   - Choose content type and size preset
   - Configure metadata and renderer options

2. **Design Tab**
   - Browse 13 HTML templates or use action snippets library
   - Edit content in Monaco editor with live preview
   - Configure initial render data (collapsible)
   - Insert action snippets at cursor position

3. **Export Tab**
   - Choose integration snippet or standalone server
   - Select language (TypeScript/JavaScript)
   - Copy code or download file
   - Server-aware code generation

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
│   │   ├── code-generation.ts        # Code export utilities
│   │   └── stores/                   # Zustand state management
│   ├── types/
│   │   ├── ui-builder.ts             # MCP-UI Builder types
│   │   ├── server-builder.ts         # Server builder types
│   │   └── database.ts               # Database types
│   └── mcp-servers/                  # Demo MCP servers
│       ├── demo-server.ts            # Contact form demo
│       └── hypermemory-server.ts     # Knowledge graph demo
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
- **React Flow**: Visual flow diagrams

## 🔐 Authentication & Security

### User Authentication
- JWT token-based authentication
- Bcrypt password hashing
- Token expiration with configurable lifetime
- Secure HTTP-only cookie support (optional)

### MCP Server Security
- **App-level auth**: JWT tokens for accessing user-specific database servers
- **MCP-level auth**: Environment variables for remote server authentication
  - Stdio: Env vars passed to spawned process
  - SSE/HTTP: Converted to HTTP headers
    - `API_KEY` → `Authorization: Bearer {value}`
    - `BEARER_TOKEN` → `Authorization: Bearer {value}`
    - `HEADER_X_Custom` → `X-Custom: {value}` custom header

## 📚 MCP Integration

### Server Management
All MCP servers are user-specific and managed through the Settings UI:
- Stored in MySQL `mcp_servers` table per user
- Managed via `/settings` page with UI
- Supports authentication via `env` field
- Auto-connects when user is logged in
- Automatic cleanup when servers are deleted

### Transport Types
- **stdio**: Local process-based servers (e.g., filesystem, memory)
- **sse**: Remote HTTP-based servers via Server-Sent Events
- **http**: HTTP streaming transport (treated as SSE)

### MCPClientManager Features
- Connection management (idempotent connect/disconnect)
- Error tracking with stored error messages
- User server tracking and cleanup
- Tool & resource operations (listTools, callTool, listResources, getResource)
- Environment variable handling for authentication

## 🎯 Application Navigation

### Main Routes (3-Tab Navigation)
1. **UI Builder** (`/mcp-ui-builder`) - Visual tool for creating interactive MCP-UI components
2. **Servers** (`/mcp-servers`) - Manage MCP server connections and configurations
3. **Chat** (`/chat`) - Test MCP tools with AI-powered chat interface

### Additional Routes
- **Home** (`/`) - Landing page with animated artwork and feature cards
  - **Artwork33**: Animated double helix canvas visualization
    - Themes: balance, equilibrium, opposing forces in harmony
    - Responsive design with smooth 60fps animations
  - Streamlined 3-card layout with gradient styling
  - Hover effects with orange accent transitions
  - Direct navigation to Builder, Servers, and Chat
- **Settings** (`/settings`) - User settings (AI config, profile, MCP servers)
- **Login/Register** (`/login`, `/register`) - Authentication pages

## 📊 Database Schema

### Tables
- **users**: User accounts with email and password_hash
- **prompts**: User-created prompts with title and content
- **settings**: User settings as key-value pairs (ollama_base_url, ollama_model)
- **mcp_servers**: Per-user MCP server configurations with JSON config
- **ui_templates**: Saved MCP-UI templates with resource data

All tables include:
- Foreign key relationships
- Proper indexes for performance
- Automatic timestamp management (created_at, updated_at)

## 🧪 Demo MCP Servers

### Demo Contact Form Server

Start the demo server:
```bash
npm run mcp:demo  # Runs on port 3001
```

Add via Settings UI:
- Name: `demo-ui`
- Type: `sse`
- URL: `http://localhost:3001/mcp`

**Available Tools:**
- `get_contact_form` - Interactive HTML contact form
- `get_dashboard` - External URL embed
- `submit_form` - Process form submissions

### HyperMemory Knowledge Graph Server

Start the HyperMemory server:
```bash
npm run mcp:hypermemory
```

Add via Settings UI and test entity creation, search, and relationship management.

## 🔄 Bidirectional Communication Flow

```
┌─────────────┐
│  UI (iframe) │
│             │
│  User Click │
│      ↓      │
│ postMessage │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│  MCPUIRenderer   │
│                  │
│  onUIAction()    │
│      ↓           │
│  switch(type)    │
└────┬─────────────┘
     │
     ├─→ tool     → API call → MCPClientManager → MCP Server
     ├─→ prompt   → Chat textarea.value = prompt
     ├─→ link     → window.open(url)
     ├─→ intent   → router.push(path)
     └─→ notify   → toast(message)
```

## 🚧 Recommended Workflows

### Primary Workflow (via main navigation)
1. **UI Builder** → Create UI resources following MCP-UI spec
   - Configure: Select server, set URI, choose size preset
   - Design: Pick template, edit HTML, configure initial data
   - Export: Deploy to server or download standalone code
2. **Servers** → Manage MCP server connections
3. **Chat** → Test and interact with MCP tools

### Integrated Workflow
1. Configure MCP server in Settings
2. Create UI resource in UI Builder
3. Deploy to selected server
4. Test in Chat interface

### Standalone Workflow
1. Create UI in Builder without server selection
2. Export standalone server code
3. Add server via Settings
4. Test in Chat

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
- Follow existing code style and conventions
- Update CLAUDE.md files when adding new features
- Add tests for new functionality
- Update documentation as needed

## 📝 License

MIT License - see LICENSE file for details

## 📞 Support

For issues and questions:
- Check the [CLAUDE.md](./CLAUDE.md) documentation
- Review component-specific CLAUDE.md files in `src/components/`

## 🎉 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification
- [MCP-UI](https://github.com/modelcontextprotocol/mcp-ui) - UI resource rendering
- [Vercel AI SDK](https://sdk.vercel.ai) - AI integration
- [Radix UI](https://radix-ui.com) - Component primitives
- [Tailwind CSS](https://tailwindcss.com) - Styling framework

---

**Built with ❤️ using Next.js 15, MCP, and modern web technologies**
