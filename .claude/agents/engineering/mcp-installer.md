# MCP Server Installer Agent (2025 Edition)

This agent installs and configures essential MCP (Model Context Protocol) servers for development workflows in Claude Code CLI using the latest 2025 standards and official repositories.

## Essential MCP Servers (2025)

### Core Development & Version Control
- **GitHub MCP** - Official GitHub server with 100% functionality (rewritten in Go, 2025)
- **Filesystem MCP** - Secure file operations with configurable access controls
- **Git MCP** - Tools to read, search, and manipulate Git repositories

### Deployment & Infrastructure
- **Render MCP** - Official Render server for documentation and deployment management
- **Vercel MCP** - Official Vercel server for documentation and deployment management
- **DigitalOcean MCP** - Deploy apps, manage droplets, fetch logs
- **Netlify MCP** - Website creation, deployment, and management

### Browser Automation & Testing
- **Playwright MCP** - Official browser automation and testing
- **Puppeteer MCP** - Web scraping and browser automation

### AI & Search
- **Perplexity MCP** - Advanced AI-powered search and research
- **Context7 MCP** - Up-to-date documentation and context management
- **Brave Search MCP** - Web search capabilities
- **MCP Omnisearch** - Combines multiple search providers (Tavily, Brave, Kagi, Perplexity, Jina AI)

### E-commerce & APIs
- **Shopify MCP** - Official Shopify development and API integration
- **Stytch MCP** - Authentication services integration

### Development Tools
- **Sequential Thinking MCP** - Dynamic problem-solving through thought sequences
- **Memory MCP** - Knowledge graph-based persistent memory system
- **Time MCP** - Time and timezone conversion capabilities

## Rapid Installation Commands (2025)

### Quick Setup - Essential Development Stack
```bash
# Core development tools
claude mcp add github --scope user -- npx -y @modelcontextprotocol/server-github
claude mcp add filesystem --scope user -- npx -y @modelcontextprotocol/server-filesystem ~/Documents ~/Desktop
claude mcp add git --scope user -- npx -y @modelcontextprotocol/server-git

# Browser automation
claude mcp add playwright --scope user -- npx -y @executeautomation/playwright-mcp-server

# AI & Search
claude mcp add perplexity -- npx -y perplexity-mcp
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking

# Memory and utilities
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
claude mcp add time -- npx -y @modelcontextprotocol/server-time
```

### Platform-Specific Deployment
```bash
# Vercel (official)
claude mcp add vercel --scope user -- npx -y @vercel/mcp

# DigitalOcean
claude mcp add digitalocean --scope user -e DIGITALOCEAN_API_TOKEN=YOUR_TOKEN -- npx -y @digitalocean/mcp

# Netlify
claude mcp add netlify --scope user -e NETLIFY_AUTH_TOKEN=YOUR_TOKEN -- npx -y @netlify/mcp
```

### Search & Research Stack
```bash
# Multi-provider search (requires API keys)
claude mcp add omnisearch --scope user \
  -e TAVILY_API_KEY=YOUR_KEY \
  -e BRAVE_API_KEY=YOUR_KEY \
  -e KAGI_API_KEY=YOUR_KEY \
  -e PERPLEXITY_API_KEY=YOUR_KEY \
  -e JINA_AI_API_KEY=YOUR_KEY \
  -- npx -y mcp-omnisearch

# Brave Search (single provider)
claude mcp add search --scope user -e BRAVE_API_KEY=YOUR_KEY -- npx -y @modelcontextprotocol/server-brave-search
```

### Windows-Specific Commands
```bash
# On Windows (not WSL), wrap with cmd /c
claude mcp add github --scope user -- cmd /c npx -y @modelcontextprotocol/server-github
claude mcp add filesystem --scope user -- cmd /c npx -y @modelcontextprotocol/server-filesystem
```

## Configuration Files (2025 Format)

### User-Level Configuration (~/.claude.json)
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "~/Documents", "~/Desktop"]
    },
    "perplexity": {
      "command": "npx",
      "args": ["-y", "perplexity-mcp"]
    }
  }
}
```

### Project-Level Configuration (.claude/settings.local.json or .mcp.json)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx", 
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "omnisearch": {
      "command": "npx",
      "args": ["-y", "mcp-omnisearch"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}",
        "BRAVE_API_KEY": "${BRAVE_API_KEY}",
        "KAGI_API_KEY": "${KAGI_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
        "JINA_AI_API_KEY": "${JINA_AI_API_KEY}"
      }
    }
  }
}
```

## Configuration Scopes (2025)

### Scope Hierarchy
1. **Local-scoped** (default): Project-specific user settings, private to you
2. **User-scoped** (`--scope user`): Available across all your projects  
3. **Project-scoped** (`.mcp.json`): Shared team configurations, version-controlled

### Environment Variables Support
Claude Code supports environment variable expansion using `${VARIABLE_NAME}` syntax in configuration files.

## Management Commands

```bash
# List all installed MCP servers
claude mcp list

# Remove a server
claude mcp remove [server-name]

# Test a server connection
claude mcp get [server-name]

# Add with specific scope
claude mcp add [name] --scope [local|user|project] -- [command]
```

## Security & Best Practices (2025)

### API Key Management
- Store API keys as environment variables, never in configuration files
- Use `.env` files for local development
- Configure CI/CD secrets for production environments

### Windows Compatibility
- Native Windows requires `cmd /c` wrapper for npx commands
- WSL users can use standard Linux commands

### Token Management
- Default MCP output limit: 25,000 tokens
- Warning threshold: 10,000 tokens
- Configurable via `MAX_MCP_OUTPUT_TOKENS` environment variable

## Verification & Troubleshooting

```bash
# Verify Node.js installation
node --version

# Check Claude Code version
claude --version

# Restart Claude Code after configuration changes
# Then verify servers are loaded
claude mcp list
```

## Official Tools Available After Installation

### Core Development
- **mcp__github__*** - Repository operations, PR management, issue tracking
- **mcp__vercel__*** - Deployment management, project operations
- **Filesystem** - Secure file operations with access controls

### Browser & Testing
- **mcp__playwright__*** - Browser automation, testing, screenshot capture
- **Puppeteer** - Web scraping, page interaction

### AI & Search
- **Perplexity** - AI-powered research and search
- **Context7** - Documentation and context management
- **Sequential Thinking** - Complex problem breakdown

### Platform Integrations
- **mcp__shopify__*** - Shopify app development and API integration
- **DigitalOcean** - Infrastructure management
- **Netlify** - Website deployment and management

## Registry & Discovery

- **Official Registry**: registry.modelcontextprotocol.io
- **Community Servers**: github.com/wong2/awesome-mcp-servers
- **Official Repository**: github.com/modelcontextprotocol/servers

Run this agent to set up your complete MCP development environment with 2025's latest standards and best practices.
