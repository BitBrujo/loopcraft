# LoopCraft - Self-Hosted AI Chat Application

LoopCraft is a fully self-contained, Docker-based Next.js 15 AI chat application that combines local AI models via Ollama with a MySQL database and Model Context Protocol (MCP) integration. Everything runs locally with no external dependencies.

## Features

- 🤖 **Local AI Models** - Powered by Ollama with configurable models
- 🐳 **Fully Dockerized** - MySQL, Ollama, and Next.js app in containers
- 🔐 **JWT Authentication** - Secure user authentication with bcrypt password hashing
- 💬 **Conversation History** - Persistent chat conversations stored in MySQL
- 🔧 **MCP Integration** - Connect to Model Context Protocol servers for extensible tools
- 📊 **MCP-UI Lab** - Dashboard for managing and debugging MCP servers
- 🎨 **Modern UI** - Built with React 19, Tailwind CSS v4, and shadcn/ui
- 🌙 **Dark Mode** - Theme support with system, light, and dark modes

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd loopcraft
   ```

2. **Configure environment variables**
   ```bash
   cp .env.docker .env.docker.local
   # Edit .env.docker.local and set secure passwords and JWT secret
   ```

3. **Start the stack**
   ```bash
   npm run docker:up
   ```

4. **Access the application**
   - Open http://localhost:3000
   - Default admin credentials: `admin` / `admin123` (change immediately!)

5. **View logs**
   ```bash
   npm run docker:logs
   ```

6. **Stop the stack**
   ```bash
   npm run docker:down
   ```

## Local Development

### Prerequisites

- Node.js 20+
- MySQL 8.0+
- Ollama (for AI model serving)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MySQL and Ollama configuration
   ```

3. **Initialize database**
   ```bash
   mysql -u root -p < docker/mysql/init.sql
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

## Environment Variables

### Required for Local Development (.env.local)

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=hyperface
MYSQL_USER=hyperface
MYSQL_PASSWORD=your_password

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434/api
OLLAMA_MODEL=llama3.2:latest

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Required for Docker (.env.docker)

Same variables as above, but:
- `MYSQL_HOST=mysql` (Docker service name)
- `OLLAMA_BASE_URL=http://ollama:11434/api` (Docker service name)
- Add `MYSQL_ROOT_PASSWORD` for MySQL root user

## Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui, Radix UI, Assistant UI framework
- **AI Integration**: Ollama (via ollama-ai-provider-v2), AI SDK
- **Database**: MySQL 8.0 with mysql2 connection pooling
- **Authentication**: JWT with jsonwebtoken, bcrypt password hashing
- **MCP**: Model Context Protocol SDK for extensible tools
- **Containerization**: Docker with docker-compose

### Project Structure

```
loopcraft/
├── docker/                    # Docker configuration
│   └── mysql/
│       └── init.sql          # Database schema
├── src/
│   ├── app/                  # Next.js app router
│   │   ├── api/
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── chat/        # Chat streaming endpoint
│   │   │   ├── conversations/ # Conversation management
│   │   │   └── health/      # Health check
│   │   ├── dashboard/       # MCP-UI Lab
│   │   └── settings/        # User settings
│   ├── components/          # React components
│   ├── lib/                 # Core libraries
│   │   ├── auth.ts          # JWT authentication
│   │   ├── mysql-client.ts  # MySQL connection pool
│   │   ├── mcp-client.ts    # MCP client manager
│   │   └── dal/             # Data Access Layer
│   │       ├── users.ts
│   │       ├── conversations.ts
│   │       ├── messages.ts
│   │       ├── mcp-servers.ts
│   │       └── files.ts
├── Dockerfile               # Multi-stage Next.js build
├── docker-compose.yml       # Service orchestration
└── package.json             # Dependencies and scripts
```

## Database Schema

### Tables

1. **user_profiles** - User accounts with password hashing
2. **user_settings** - Per-user preferences and configuration
3. **conversations** - Chat conversation threads
4. **messages** - Individual chat messages with tool calls
5. **mcp_servers** - User-configured MCP server definitions
6. **file_uploads** - File upload tracking with TTL cleanup

### Default Admin User

- **Username**: `admin`
- **Password**: `admin123`
- ⚠️ **IMPORTANT**: Change this password immediately after first login!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/[id]` - Get conversation with messages
- `PATCH /api/conversations/[id]` - Update conversation
- `DELETE /api/conversations/[id]` - Delete conversation

### Chat
- `POST /api/chat` - Stream AI responses

### Health
- `GET /api/health` - Check system health

## Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Docker
- `npm run docker:build` - Build Docker images
- `npm run docker:up` - Start full stack
- `npm run docker:down` - Stop containers
- `npm run docker:logs` - View logs
- `npm run docker:mysql` - Connect to MySQL CLI

## MCP Integration

HyperFace supports Model Context Protocol servers for extensible functionality. Configure MCP servers via:

1. **Environment Variable** (`.env.local` or `.env.docker`):
   ```env
   MCP_CONFIG={"servers":[{"name":"filesystem","command":["npx","-y","@modelcontextprotocol/server-filesystem","."],"type":"stdio"}]}
   ```

2. **Database** (per-user settings in `mcp_servers` table)

3. **MCP-UI Lab Dashboard** (`/dashboard` in the app)

### Example MCP Servers

- **Filesystem**: Access local files
  ```json
  {"name":"filesystem","command":["npx","-y","@modelcontextprotocol/server-filesystem","."],"type":"stdio"}
  ```

- **Memory**: Persistent context storage
  ```json
  {"name":"memory","command":["npx","-y","@modelcontextprotocol/server-memory"],"type":"stdio"}
  ```

## Security Considerations

### Production Deployment

1. **Change Default Passwords**
   - Update admin password immediately
   - Use strong MySQL passwords

2. **Generate Secure JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Environment Security**
   - Never commit `.env.local` or `.env.docker`
   - Use secrets management in production
   - Enable HTTPS/TLS

4. **Database Security**
   - Restrict MySQL network access
   - Use strong passwords
   - Regular backups

5. **Container Security**
   - Use official images only
   - Keep images updated
   - Run with minimal privileges

## Troubleshooting

### MySQL Connection Issues

```bash
# Check if MySQL is running
docker ps | grep loopcraft-mysql

# View MySQL logs
docker logs loopcraft-mysql

# Connect to MySQL
npm run docker:mysql
```

### Ollama Connection Issues

```bash
# Check if Ollama is running
docker ps | grep loopcraft-ollama

# View Ollama logs
docker logs loopcraft-ollama

# List available models
docker exec loopcraft-ollama ollama list
```

### Application Issues

```bash
# View app logs
docker logs loopcraft-app

# Check health endpoint
curl http://localhost:3000/api/health
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[License information here]

## Support

For issues and questions:
- GitHub Issues: [Repository issues page]
- Documentation: See `CLAUDE.md` for detailed architecture

---

Built with ❤️ using Next.js, React, Ollama, MySQL, and Docker