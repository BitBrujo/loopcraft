# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoopCraft is a Next.js 15 AI chat application that provides a modern interface for interacting with local AI models via Ollama. The application uses React 19, TypeScript, Tailwind CSS, and the Assistant UI framework.

## src/components Directory

This directory contains all React components organized by functionality and purpose for the LoopCraft AI chat application.

### Directory Structure

```
src/components/
├── assistant-ui/         # Assistant UI framework components
│   ├── attachment.tsx    # File attachment handling
│   ├── markdown-text.tsx # Markdown rendering for messages
│   ├── mcp-ui-renderer.tsx # MCP-UI iframe renderer (fixed 2025-09-30)
│   ├── thread-list.tsx   # Conversation thread list
│   ├── thread.tsx        # Main conversation thread component
│   ├── tool-fallback.tsx # Tool execution fallback UI with MCP-UI support
│   └── tooltip-icon-button.tsx # Reusable tooltip button
├── chat/                 # Chat-specific UI components
│   ├── ChatHeader.tsx    # Top navigation bar
│   ├── ChatLayout.tsx    # Overall chat page layout
│   ├── MobileSidebar.tsx # Mobile responsive sidebar
│   └── ThemeToggle.tsx   # Dark/light mode toggle
├── providers/            # React context providers
│   └── ThemeProvider.tsx # Theme context provider
└── ui/                   # shadcn/ui base components
    ├── avatar.tsx        # User avatar component
    ├── badge.tsx         # Status badges
    ├── button.tsx        # Button variants
    ├── card.tsx          # Card container
    ├── dialog.tsx        # Modal dialogs
    ├── dropdown-menu.tsx # Dropdown menus
    ├── input.tsx         # Input fields
    ├── scroll-area.tsx   # Custom scrollable areas
    ├── separator.tsx     # Visual separators
    ├── sheet.tsx         # Sliding panel (used for mobile sidebar)
    └── tooltip.tsx       # Tooltips
```

### Component Categories

#### Assistant UI Components
- **Purpose**: Specialized components for the chat interface
- **Framework**: Built on `@assistant-ui/react` (^0.11.20) primitives with AI SDK integration
- **Dependencies**:
  - `@assistant-ui/react` (^0.11.20) - Core UI framework
  - `@assistant-ui/react-ai-sdk` (^1.1.1) - AI SDK bridge
  - `@assistant-ui/react-markdown` (^0.11.0) - Markdown rendering
  - `remark-gfm` (^4.0.1) - GitHub Flavored Markdown support
  - `@mcp-ui/client` (^5.12.0) - MCP-UI renderer for interactive iframe components
- **Features**:
  - Thread management and conversation flow (works with `useChatRuntime`)
  - Message rendering with markdown support via remark-gfm
  - File attachment handling
  - Tool execution and fallback states
  - Branch picker for conversation alternatives
  - Suggestion handling (ThreadPrimitive.Suggestion components)
  - **MCP-UI Rendering** (`mcp-ui-renderer.tsx`): Renders interactive MCP-UI components in sandboxed iframes
    - Properly preserves `_meta` field from MCP server responses (fixed 2025-09-30)
    - Handles base64-encoded HTML content with correct decoding via `UIResourceRenderer`
    - Supports interactive UI actions (tool calls, prompts, links, intents, notifications)

#### Chat Components
- **Purpose**: Application-specific UI components
- **Features**:
  - Responsive layout management
  - Mobile-first design with collapsible sidebar
  - Theme switching functionality
  - Header navigation

#### UI Components (shadcn/ui)
- **Purpose**: Reusable design system components
- **Style**: "New York" variant with Tailwind CSS v4
- **Dependencies**:
  - `@radix-ui/*` components for accessibility and behavior
  - `class-variance-authority` (^0.7.1) for component variants
  - `lucide-react` (^0.544.0) for icons
- **Features**:
  - Consistent design tokens with CSS variables
  - Accessibility features built-in via Radix UI
  - Dark/light theme support with CSS variables
  - Responsive by default with Tailwind CSS v4

#### Providers
- **Purpose**: React context management
- **Dependencies**: `next-themes` (^0.4.6) for theme persistence
- **ThemeProvider**: Manages dark/light mode state using next-themes with system preference detection

### Development Guidelines

- Follow shadcn/ui component patterns for new UI components
- Use Assistant UI primitives for chat-specific functionality
- Maintain responsive design patterns established in existing components
- All components use TypeScript with proper prop interfaces
- CSS classes follow Tailwind utility-first approach with custom CSS variables for theming
- Integrate with LoopCraft's AI SDK runtime using `useChatRuntime` from `@assistant-ui/react-ai-sdk`
- Environment Configuration: Use `.env.local` for Ollama settings (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`)
- Follow LoopCraft's architecture for local AI model integration via `ollama-ai-provider-v2`

### Core Technologies

- **Next.js 15.5.4** with App Router and Turbopack
- **React 19.1.0** with modern hooks and server components
- **TypeScript 5** with strict configuration
- **Tailwind CSS v4** with CSS variables for theming
- **shadcn/ui** components (New York style) with Radix UI primitives
- **Assistant UI** framework (`@assistant-ui/react` ^0.11.20) for chat interface
- **AI SDK** integration (`@assistant-ui/react-ai-sdk` ^1.1.1, `@ai-sdk/react` ^2.0.56, `ai` ^5.0.56)
- **Ollama** for local AI model inference via `ollama-ai-provider-v2` ^1.3.1 (actively maintained)