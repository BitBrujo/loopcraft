# LoopCraft

A Next.js 15 application that integrates the Model Context Protocol (MCP) with an AI-powered chat interface. LoopCraft serves as an MCP client with MCP-UI integration, allowing AI assistants to interact with external tools and resources through MCP servers while rendering interactive UI components.

## ✨ Features

### 🤖 AI-Powered Chat Interface
- Natural language conversations with MCP tool integration
- User-configurable AI models and providers (Ollama)
- Streaming responses with real-time updates
- Per-user AI configuration (model selection, API endpoints)

### 🔌 Model Context Protocol (MCP) Integration
- **User-specific MCP servers** managed through Settings UI
- Support for stdio, SSE, and HTTP transports
- Dynamic tool registration and resource handling
- Interactive MCP-UI component rendering with bidirectional communication
- Automatic server cleanup and error tracking

### 🛠️ Three Specialized Builders

#### 1. **Conversational Builder** (`/conversational-builder`)
Natural language-driven server creation through AI conversation:
- Describe server needs in plain English
- AI-powered intent detection and entity extraction
- Progressive questioning for clarification
- 60+ tool and resource templates
- Real-time configuration preview
- One-click deployment

#### 2. **MCP Server Builder** (`/mcp-server-builder`)
Template-first approach for creating functional MCP servers:
- Browse 60+ pre-built tool and resource templates
- 10 categories: Forms, Search, Storage, Display, Processing, Messaging, Security, Payments, Files, External APIs
- AI-powered relationship analysis and suggestions
- 3-tab workflow: Browse → Customize → Test
- Export in 8 formats (TypeScript, JavaScript, Python, etc.)

#### 3. **MCP-UI Wrapper Builder** (`/mcp-ui-builder`)
Visual tool for adding UI presentation to MCP servers:
- Connect to existing servers or create standalone UIs
- Read-only (dashboards) and interactive (forms) modes
- HTML/URL content with template placeholders
- Action mapping UI → MCP tool bindings
- Live preview and one-click testing

### 🔐 Authentication & Database
- JWT-based authentication with bcrypt password hashing
- MySQL 8.0 with Docker containerization
- User-specific prompts, settings, and MCP server configurations
- Persistent storage with automatic schema initialization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Ollama (for AI functionality)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd loopcraft
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

# Demo MCP Server (for testing)
npm run mcp:demo         # Start demo server on port 3001
```

## 🏗️ Architecture

### MCP Integration Flow

1. **Server Initialization** (`src/lib/mcp-init.ts`)
   - User-specific servers loaded from database per request
   - Managed by `MCPClientManager` singleton
   - Automatic cleanup of deleted servers
   - Error tracking for troubleshooting

2. **Tool Registration** (`src/app/api/chat/route.ts`)
   - MCP tools dynamically fetched from connected servers
   - Tools prefixed as `mcp_{serverName}_{toolName}`
   - Support for UI resources with `ui://` URIs

3. **UI Rendering** (`src/components/assistant-ui/mcp-ui-renderer.tsx`)
   - Interactive MCP UI components with iframe sandboxing
   - Bidirectional communication via postMessage
   - Tool execution with authentication

4. **Resource Handling**
   - Custom `getMCPResource` tool for fetching resources
   - Standard MCP format without custom wrappers
   - Support for templates and dynamic URIs

### Key Components

- **MCPClientManager** - Connection management, tool calls, error tracking
- **Chat API Route** - Streaming LLM responses with MCP integration
- **Assistant Component** - Main chat interface with sidebar
- **Builder Components** - Three specialized builder UIs
- **Database Utilities** - Connection pooling and query helpers

## 📚 API Documentation

### Authentication (Public)
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Get JWT token

### AI Configuration
- `GET /api/ai-config` - Get current AI config
- `PUT /api/ai-config` - Update user AI settings (auth required)

### MCP Management (Auth Required)
- `GET /api/mcp/servers` - List connected servers with status
- `GET /api/mcp/tools` - List available tools
- `GET /api/mcp/resources` - List available resources
- `POST /api/mcp/call-tool` - Execute MCP tool

### MCP Server Management (Auth Required)
- `GET /api/mcp-servers` - List user MCP servers
- `POST /api/mcp-servers` - Create server config
- `PUT /api/mcp-servers/:id` - Update server
- `DELETE /api/mcp-servers/:id` - Delete server

### Builders
- `POST /api/conversational-builder/chat` - Streaming AI conversation
- `POST /api/relationships/analyze` - AI relationship analysis
- `POST /api/ui-builder/test` - Create test server
- `POST /api/ui-builder/preview` - Preview UI resource

All authenticated endpoints require `Authorization: Bearer <token>` header.

## 🗄️ Database Schema

### Tables
- **users** - User accounts with email/password
- **prompts** - User-created prompts
- **settings** - User settings (key-value pairs)
- **mcp_servers** - Per-user MCP server configurations

Schema automatically initializes on first Docker run via `docker/mysql/init.sql`.

## 🔧 MCP Server Configuration

All MCP servers are user-specific and managed through Settings UI:

### Transport Types
- **stdio**: Local process-based servers
  - Environment variables passed to spawned process
  - Example: `{ command: ["npx", "-y", "server"], env: { "API_KEY": "xxx" } }`

- **sse**: Remote HTTP servers via Server-Sent Events
  - Environment variables converted to HTTP headers
  - Example: `{ url: "https://api.example.com/mcp", env: { "API_KEY": "xxx" } }`

- **http**: HTTP streaming (treated as SSE)

### Authentication Support
- **App-level**: JWT tokens for database access
- **MCP-level**: Environment variables for remote server auth
  - `API_KEY` → `Authorization: Bearer {value}`
  - `BEARER_TOKEN` → `Authorization: Bearer {value}`
  - `HEADER_X_Custom` → `X-Custom: {value}`

## 🎯 Use Cases

### Recommended Workflows

1. **Quick Start (Conversational Builder)**
   - Best for beginners
   - Natural language server creation
   - AI-guided configuration

2. **Template-Based (Server Builder)**
   - Choose from 60+ templates
   - Customize tools and resources
   - Export and deploy

3. **UI Enhancement (UI Builder)**
   - Wrap existing servers with UI
   - Create standalone dashboards
   - Interactive form builders

4. **Full Stack (Combined)**
   - Create server → Add UI → Map actions
   - End-to-end MCP application development

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **UI**: React 19, TypeScript, Tailwind CSS 4, Radix UI
- **AI**: Vercel AI SDK, @assistant-ui/react, Ollama
- **MCP**: @modelcontextprotocol/sdk, @mcp-ui/client, @mcp-ui/server
- **Database**: MySQL 8.0, Docker, mysql2 driver
- **Auth**: JWT, bcrypt
- **State**: Zustand

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## 📞 Support

For issues and questions, please open a GitHub issue.
