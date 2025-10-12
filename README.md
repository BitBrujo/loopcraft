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

## 📚 MCP Integration

### Server Management
All MCP servers are user-specific and managed through the Settings UI:

### Transport Types
- **stdio**: Local process-based servers (e.g., filesystem, memory)
- **sse**: Remote HTTP-based servers via Server-Sent Events
- **http**: HTTP streaming transport (treated as SSE)

### MCPClientManager Features
- Connection management
- User server tracking and cleanup

## 📝 License

MIT License - see LICENSE file for details

---
