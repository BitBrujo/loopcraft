# LoopCraft

LoopCraft is a Next.js application that integrates the Model Context Protocol (MCP) with an interactive chat interface and visual UI builder. It serves as both an MCP client and development environment, allowing AI assistants to interact with external tools and resources through MCP servers while rendering interactive UI components.

## Key Features

- **MCP Integration**: Connect to multiple MCP servers (stdio, SSE, HTTP transports)
- **Interactive Chat**: AI-powered chat with tool calling and MCP resource rendering
- **Visual UI Builder**: 5-tab progressive workflow for creating MCP-UI resources
  - Tool discovery and server exploration
  - Visual UI design with live preview
  - Action mapping (UI elements → MCP tools)
  - Flow visualization with execution simulation
  - Integration testing
- **User Authentication**: JWT-based auth with per-user MCP server configurations
- **Template System**: Save/load UI builder configurations
- **Real-time Validation**: Type checking and completeness validation for action mappings

## Technologies

- **Next.js 15** with App Router and Turbopack
- **React 19** with TypeScript
- **MCP**: `@modelcontextprotocol/sdk`, `@mcp-ui/client`, `@mcp-ui/server`
- **AI SDK**: Vercel AI SDK with `@assistant-ui/react`
- **LLM**: Ollama (configurable)
- **Database**: MySQL 8.0
- **Authentication**: JWT + bcrypt
- **Styling**: Tailwind CSS 4, Radix UI
- **State**: Zustand

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for MySQL)
- Ollama with a compatible model (e.g., `llama3.2:latest`)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd loopcraft
```

2. Install dependencies:
```bash
npm install
```

3. Start MySQL database:
```bash
docker-compose up -d
```

4. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:
- `OLLAMA_BASE_URL`: Ollama API endpoint (default: `http://localhost:11434/api`)
- `OLLAMA_MODEL`: Model to use (default: `llama3.2:latest`)
- `MYSQL_PASSWORD`: Database password (required)
- `MYSQL_ROOT_PASSWORD`: MySQL root password (required)
- `JWT_SECRET`: Secret key for JWT tokens (generate with `openssl rand -hex 32`)

5. Start development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Stop database
docker-compose down
```

## MCP Server Configuration

Configure MCP servers in three ways:

### 1. Database Configuration (Per-User)
- Navigate to `/settings` after login
- Add/edit/delete MCP servers via UI
- Supports authentication via `env` field
- Auto-connects when user is logged in

### 2. Environment Variable (Global)
Set `MCP_CONFIG` in `.env.local`:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  }
}
```

### 3. Config File (Global)
Edit `src/lib/mcp-config.ts` for default configurations.

### Transport Types

- **stdio**: Local process-based servers (e.g., filesystem, memory)
- **sse**: Remote HTTP-based servers via Server-Sent Events
- **http**: HTTP streaming transport

### Authentication

Environment variables in MCP server configs are used for authentication:
- **stdio**: Passed to spawned process as environment variables
- **sse/http**: Converted to HTTP headers
  - `API_KEY` → `Authorization: Bearer {value}`
  - `BEARER_TOKEN` → `Authorization: Bearer {value}`
  - `HEADER_X_Custom` → `X-Custom: {value}`

## MCP-UI Builder

The visual UI builder (`/mcp-ui-builder`) provides a complete workflow for creating MCP-UI resources:


## License

[Add your license here] MIT License
