# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoopCraft is a Next.js 15 AI chat application that provides a modern interface for interacting with local AI models via Ollama and the Model Context Protocol (MCP) ecosystem. The application uses React 19, TypeScript, Tailwind CSS, and the Assistant UI framework.

## src/lib Directory

This directory contains utility functions and shared libraries used throughout the LoopCraft application.

### Directory Structure

```
src/lib/
├── mcp-client.ts        # MCP client management service
├── mcp-config.ts        # MCP server configuration
├── mcp-ui-helpers.ts    # MCP-UI resource creation helpers
├── supabase-client.ts   # Supabase client setup
├── stores/              # Zustand state management
│   ├── dashboard-store.ts # Dashboard state (logs, metrics, debug)
│   ├── mcp-store.ts      # MCP state (servers, resources, tools)
│   └── settings-store.ts # User settings (persisted)
├── utils.ts             # Utility functions and helpers
└── CLAUDE.md            # This file
```

### Key Files

#### mcp-client.ts
- **Purpose**: MCP client management and server connection handling
- **Main Exports**: `MCPClientManager` class, `mcpClientManager` singleton
- **Features**:
  - Connect/disconnect from MCP servers (stdio, SSE)
  - List and call tools from all connected servers
  - List and read resources from all connected servers
  - Uses official `@modelcontextprotocol/sdk` convenience methods
- **Key Methods**:
  - `connectToServer(server)` - Establish connection to MCP server
  - `getAllTools()` - Get all available tools from connected servers
  - `callTool(serverName, toolName, args)` - Execute MCP tool
  - `getAllResources()` - Get all available resources
  - `getResource(serverName, uri)` - Read specific resource

#### mcp-config.ts
- **Purpose**: Load and parse MCP server configuration
- **Main Export**: `loadMCPConfig()` function
- **Features**:
  - Reads `MCP_CONFIG` environment variable
  - Parses JSON configuration for MCP servers
  - Returns structured server definitions with command, type, env vars

#### mcp-ui-helpers.ts
- **Purpose**: Helper functions for creating MCP-UI resources
- **Main Exports**:
  - `createHtmlUIResource()` - Create HTML-based UI components
  - `createExternalUrlUIResource()` - Embed external applications
  - `createRemoteDomUIResource()` - Create Remote DOM components
  - `createDashboardExample()` - Interactive dashboard example
  - `createFormExample()` - Contact form example
- **Features**:
  - Proper metadata configuration (preferred frame size, initial data)
  - Type-safe URI validation with `` `ui://${string}` ``
  - Full support for MCP-UI specification
  - Example components demonstrating all capabilities

#### supabase-client.ts
- **Purpose**: Supabase client setup and configuration
- **Main Export**: `supabase` client instance
- **Features**:
  - Configured with project URL and anon key from environment
  - Ready for authentication, database, storage operations

#### stores/ (Zustand State Management)

**dashboard-store.ts**
- Manages MCP-UI Lab dashboard state
- Exports: `useDashboardStore` hook
- State: logs, debug entries, metrics, active panel, filters
- Actions: addLog, addDebugEntry, updateMetrics, triggerRefresh

**mcp-store.ts**
- Manages MCP server and resource state
- Exports: `useMCPStore` hook
- State: servers, resources, tools, loading states
- Actions: setServers, setResources, setTools, loading flags

**settings-store.ts**
- Manages user settings with persistence
- Exports: `useSettingsStore` hook
- State: theme, language, notifications, Ollama config, MCP preferences
- Actions: updateSettings, save state to localStorage

#### utils.ts
- **Purpose**: Common utility functions used across components
- **Main Export**: `cn()` function for conditional className merging
- **Dependencies**:
  - `clsx` (^2.1.1) - For conditional class name construction
  - `tailwind-merge` (^3.3.1) - For intelligent Tailwind CSS class merging
- **Usage**: Primary utility for combining Tailwind CSS classes while handling conflicts

### Utility Functions

#### cn() Function
```typescript
cn(...inputs: ClassValue[]) => string
```
- **Purpose**: Intelligently merge CSS class names
- **Features**:
  - Handles conditional classes via clsx
  - Resolves Tailwind CSS class conflicts via tailwind-merge
  - Removes duplicate and conflicting classes
- **Example Usage**:
  ```typescript
  cn("px-4 py-2", isActive && "bg-blue-500", "px-6")
  // Result: "py-2 bg-blue-500 px-6" (px-4 is overridden by px-6)
  ```

### Development Guidelines

- Add new utility functions to `utils.ts` when they're needed across multiple components
- Follow functional programming patterns for utilities
- Use TypeScript for all utility functions with proper type definitions
- Consider creating separate files in this directory if utilities become numerous or domain-specific
- Keep utilities pure and side-effect free when possible
- All utilities should work with the project's current tech stack

### Current Project Context

This library directory supports LoopCraft's architecture:
- **Next.js 15.5.4** with App Router and Turbopack
- **React 19.1.0** with modern hooks and server components
- **TypeScript 5** with strict configuration
- **Tailwind CSS v4** with CSS variables for theming
- **shadcn/ui** components (New York style) with Radix UI primitives
- **Assistant UI** framework (`@assistant-ui/react` ^0.11.20) for chat interface
- **AI SDK** (`@ai-sdk/react` ^2.0.56, `ai` ^5.0.56) for streaming and model integration
- **Ollama** for local AI model inference via `ollama-ai-provider-v2` ^1.3.1
- **MCP SDK** (`@modelcontextprotocol/sdk` ^1.18.2) for Model Context Protocol integration
- **MCP-UI** (`@mcp-ui/client` ^5.12.0, `@mcp-ui/server` ^5.11.0) for interactive UI components
- **Supabase** (`@supabase/supabase-js` ^2.58.0) for backend database and authentication
- **Zustand** (^5.0.8) for state management

### Common Patterns

When adding new utilities:
1. Export individual functions for tree-shaking
2. Use consistent naming conventions
3. Include TypeScript types for parameters and return values
4. Consider if the utility should be testable and add tests if appropriate
5. Document complex utilities with JSDoc comments
6. Ensure compatibility with the shadcn/ui design system and Assistant UI framework
7. Follow LoopCraft's architecture patterns for AI chat applications

### Environment Configuration

When utilities need environment variables, follow LoopCraft's pattern:
- Use `.env.local` for configuration (required variables with no fallbacks)
- Current setup uses Ollama with configurable base URL and model
- All environment variables must be explicitly set

**Required Environment Variables:**
- `OLLAMA_BASE_URL` - Ollama server URL (must include `/api` path)
- `OLLAMA_MODEL` - Model name to use (e.g., `gpt-oss:20b`)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public API key
- `SUPABASE_ACCESS_TOKEN` - Personal access token for Supabase MCP server
- `SUPABASE_PROJECT_REF` - Supabase project reference ID

**Optional Environment Variables:**
- `MCP_CONFIG` - JSON string defining MCP servers to connect to

### MCP Integration

The `src/lib` directory contains core MCP integration code:

1. **MCP Client** (`mcp-client.ts`):
   - Manages connections to MCP servers via stdio or SSE transports
   - Provides unified interface for tool and resource operations
   - Handles client lifecycle (connect, disconnect, cleanup)

2. **MCP Configuration** (`mcp-config.ts`):
   - Parses MCP server configuration from environment
   - Validates server definitions
   - Provides structured configuration objects

3. **MCP-UI Helpers** (`mcp-ui-helpers.ts`):
   - Creates interactive UI resources for MCP responses
   - Supports three content types: rawHtml, externalUrl, remoteDom
   - Includes example components (dashboard, forms)
   - Proper metadata support for frame sizing and initialization

### State Management

The `stores/` directory uses Zustand for global state:

- **No Provider Required**: Direct hook usage
- **Persistence**: Settings store persists to localStorage
- **DevTools**: Compatible with Redux DevTools extension
- **Type Safety**: Full TypeScript support

Example usage:
```typescript
import { useDashboardStore } from '@/lib/stores/dashboard-store';

const { addLog, logs } = useDashboardStore();
addLog({ level: 'info', message: 'Hello' });
```

### Best Practices for src/lib

1. **Utilities should be pure functions** - No side effects when possible
2. **Use TypeScript** - Full type definitions for all exports
3. **Document complex functions** - JSDoc for complex utilities
4. **State management** - Use Zustand stores for global state
5. **MCP operations** - Always use `mcpClientManager` singleton
6. **Environment vars** - Validate at module load, fail fast
7. **Error handling** - Wrap external calls in try/catch
8. **Testing** - Keep functions testable and isolated