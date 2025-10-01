# LoopCraft

**Build AI Workflows with Model Context Protocol**

LoopCraft is a modern AI chat application that combines the power of local AI models via Ollama with the extensibility of the Model Context Protocol (MCP) ecosystem. Built with Next.js 15, React 19, and TypeScript.

## Features

- 🤖 **Local AI Models**: Run AI models locally using Ollama
- 🔌 **MCP Integration**: Connect to MCP servers for extensible tools and resources
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 📊 **Dashboard**: Real-time monitoring of MCP servers, tools, and resources
- 🌓 **Dark Mode**: Full theme support with system preference detection
- ⚡ **Fast**: Powered by Next.js 15 with Turbopack

## Architecture

LoopCraft follows the typical MCP-UI workflow:

1. **Resource Explorer** - Browse data and models from connected MCP servers
2. **Config Editor** - Edit MCP server configuration parameters
3. **Trigger Runs** - Execute AI workflows with updated configurations
4. **Metrics Dashboard** - Monitor performance (latency, success rates)
5. **Debug Panel** - Inspect requests/responses for troubleshooting
6. **Console** - View error logs and system messages
7. **Iterate** - Repeat the loop until workflows behave as expected

## Getting Started

### Prerequisites

- Node.js 20 or later
- Ollama installed and running locally
- (Optional) Supabase account for backend features

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your configuration
# Required: OLLAMA_BASE_URL, OLLAMA_MODEL
# Optional: Supabase credentials, MCP server configs
```

### Environment Configuration

Create a `.env.local` file with:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434/api
OLLAMA_MODEL=llama3.2:latest

# Supabase (Optional)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_PROJECT_REF=your-project-ref

# MCP Server Configuration (Optional)
MCP_CONFIG={"servers":[...]}
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **UI Library**: React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **AI Integration**:
  - Assistant UI (`@assistant-ui/react` ^0.11.20)
  - AI SDK (`ai` ^5.0.56)
  - Ollama (`ollama-ai-provider-v2` ^1.3.1)
- **MCP Integration**:
  - MCP SDK (`@modelcontextprotocol/sdk` ^1.18.2)
  - MCP-UI (`@mcp-ui/client` ^5.12.0, `@mcp-ui/server` ^5.11.0)
- **Backend**: Supabase (optional)
- **State Management**: Zustand ^5.0.8
- **Charts**: Recharts ^3.2.1

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes (chat, mcp, metrics)
│   ├── dashboard/         # Dashboard page
│   ├── settings/          # Settings page
│   └── layout.tsx         # Root layout
├── components/
│   ├── assistant-ui/      # Chat UI components
│   ├── dashboard/         # Dashboard panels
│   ├── chat/             # Chat header/layout
│   └── ui/               # shadcn/ui components
└── lib/
    ├── mcp-client.ts      # MCP client manager
    ├── stores/           # Zustand stores
    └── utils.ts          # Utility functions
```

## MCP Server Integration

LoopCraft supports connecting to any MCP server via the `MCP_CONFIG` environment variable:

```json
{
  "servers": [
    {
      "name": "filesystem",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "."],
      "type": "stdio"
    },
    {
      "name": "supabase",
      "command": ["npx", "-y", "@supabase/mcp-server-supabase@latest", "--project-ref=YOUR_REF"],
      "type": "stdio",
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    }
  ]
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Ollama](https://ollama.ai)
- [Assistant UI](https://www.assistant-ui.com)
- [Supabase](https://supabase.com)
