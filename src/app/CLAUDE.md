# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoopCraft is a Next.js 15 AI chat application that provides a modern interface for interacting with local AI models via Ollama. The application uses React 19, TypeScript, Tailwind CSS, and the Assistant UI framework.

## src/app Directory

This is the Next.js 15 App Router directory containing the main application pages, layouts, and API routes for the LoopCraft AI chat application.

### Directory Structure

```
src/app/
├── api/
│   └── chat/
│       └── route.ts      # Main chat API endpoint
├── layout.tsx            # Root layout with theme provider
├── page.tsx              # Home page component
├── assistant.tsx         # Main assistant chat interface
└── globals.css           # Global Tailwind CSS styles
```

### Key Components

#### API Routes (`api/chat/route.ts`)
- **Purpose**: Handles chat requests and streaming responses
- **Integration**: Uses Ollama AI provider v2 (^1.3.1) with configurable model and MCP tools
- **Dependencies**:
  - `ai` (^5.0.56) - Core AI SDK for streaming
  - `ollama-ai-provider-v2` (^1.3.1) - Modern Ollama provider (actively maintained)
  - `ollama` (^0.6.0) - Ollama client library
  - `@modelcontextprotocol/sdk` (^1.18.2) - MCP integration
- **Features**:
  - Streaming text responses via AI SDK
  - Message format conversion (UI format with `parts` to model format with `content`)
  - Enhanced error handling for connection issues and missing models
  - Frontend tools integration capability
  - **MCP Tool Integration**: Dynamic tool discovery and execution from connected MCP servers
  - **MCP-UI Support**: Returns UI resources with proper `_meta` field for iframe rendering (fixed 2025-09-30)
  - Configurable system prompt for LoopCraft personality
  - Environment variables: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `MCP_CONFIG`
- **Configuration** (required from `.env.local` - no fallback defaults):
  - `OLLAMA_BASE_URL`: "http://100.87.169.2:11434/api" (remote server with `/api` path)
  - `OLLAMA_MODEL`: "gpt-oss:20b" (must be set in environment variables)
- **Recent Updates**:
  - **MCP-UI Fix (2025-09-30)**: Chat API now properly returns UI resources with `_meta` field preserved for correct iframe rendering
  - Upgraded to `ollama-ai-provider-v2` for better maintenance and features
  - Added message format compatibility between Assistant UI and AI SDK
  - Improved error messages with helpful suggestions for common issues
  - Removed all fallback defaults - environment variables are now required

#### Root Layout (`layout.tsx`)
- **Purpose**: Application shell with theme support
- **Features**:
  - Inter font configuration
  - Theme provider setup (dark/light mode)
  - Metadata configuration for SEO
  - Suppresses hydration warnings for theme switching

#### Home Page (`page.tsx`)
- **Purpose**: Main application entry point
- **Structure**: Simple wrapper around ChatLayout and Assistant components

#### Assistant Component (`assistant.tsx`)
- **Purpose**: Core chat interface with sidebar and main chat area
- **Integration**: Uses AI SDK with Assistant UI framework
- **Dependencies**:
  - `@assistant-ui/react-ai-sdk` (^1.1.1) - AI SDK integration bridge
  - `@ai-sdk/react` (^2.0.56) - React hooks for AI SDK
- **Features**:
  - Direct AI SDK integration via `useChatRuntime()` from `@assistant-ui/react-ai-sdk`
  - Responsive layout (hidden sidebar on mobile, visible on desktop)
  - Thread list sidebar for conversation history
  - Main thread area for active conversation
  - Real-time message streaming and updates
- **Recent Updates**:
  - Switched from `useAISDKRuntime` to `useChatRuntime` to resolve provider context errors
  - Backend API now handles message format conversion for seamless integration
  - Enhanced error handling provides better debugging information
  - Improved compatibility with Assistant UI framework primitives

### Development Notes

- Uses Next.js App Router patterns
- All components are client-side rendered ("use client")
- API routes follow Next.js 15 conventions
- Streaming responses are handled through AI SDK
- Theme switching is handled at the layout level

### Implementation Pattern

The Assistant component follows this simplified integration pattern:

```typescript
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";

export const Assistant = () => {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* UI components */}
    </AssistantRuntimeProvider>
  );
};
```

This pattern provides direct AI SDK integration without requiring separate `useChat` and provider context setup, ensuring proper message streaming and thread management while avoiding provider context errors.

### Core Technologies

- **Next.js 15.5.4** with App Router and Turbopack
- **React 19.1.0** with modern hooks and server components
- **TypeScript 5** with strict configuration
- **Tailwind CSS v4** with CSS variables for theming
- **Assistant UI** framework (`@assistant-ui/react` ^0.11.20) for chat interface
- **AI SDK** (`@ai-sdk/react` ^2.0.56, `ai` ^5.0.56) for streaming and model integration
- **Ollama** for local AI model inference via `ollama-ai-provider-v2` ^1.3.1 (actively maintained)

### Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Environment Configuration

**Required environment variables** (must be set in `.env.local` - no fallbacks):

- `OLLAMA_BASE_URL` - Ollama server URL (must include `/api` path)
- `OLLAMA_MODEL` - Model name to use

**Current Configuration:**
```
OLLAMA_BASE_URL=http://100.87.169.2:11434/api
OLLAMA_MODEL=gpt-oss:20b
```