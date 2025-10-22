# LoopCraft

An application that integrates the Model Context Protocol (MCP) with an AI-powered chat interface. LoopCraft serves as an MCP client with MCP-UI integration, allowing AI assistants to interact with external tools and resources through MCP servers while rendering interactive UI components.

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
- **Action Snippets Library**: 13 code snippets across 5 action types
  - Tool, Prompt, Link, Intent, Notify actions
  - "Insert at Cursor" functionality for Monaco editor
  - Companion Tools category (when companion mode enabled)

### 🔄 MCP-UI Action Types

All 5 action types fully implemented for bidirectional communication:

1. **Tool** - Execute MCP tools (form submissions, data creation)
2. **Prompt** - Send message to AI (context-aware help requests)
3. **Link** - Open external URL (documentation, dashboards)
4. **Intent** - Trigger app actions (navigation, settings)
5. **Notify** - Show notification (success/error feedback with auto-variant detection)

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Docker** and Docker Compose
- **Ollama** or other model (for AI functionality)

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

### Auto-Deployment Process

When you click "Auto-Deploy", LoopCraft performs these steps:

1. **Write Server File** - Generates server code and writes to `mcp-servers/` directory
2. **Install Dependencies** - Runs `npm install` for required packages
3. **Test Server Startup** - Validates the process can start successfully
4. **Validate MCP Protocol** - Connects test server and lists tools
5. **Add to Database** - Creates entry in `mcp_servers` table (enabled by default)
6. **Enable and Connect** - Makes server immediately available in chat

##  Roadmap

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


## 📝 License

MIT License - see LICENSE file for details

---
