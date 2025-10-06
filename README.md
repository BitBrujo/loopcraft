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
