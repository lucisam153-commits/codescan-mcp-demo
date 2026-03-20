# Codescan MCP Server

A Model Context Protocol (MCP) server implementation for Codescan, enabling AI models to interact with Codescan's API through a standardized interface.

## Features

- List Codescan projects
- Get project metrics
- Query project issues with advanced filtering
- Environment-based configuration
- Docker support
- TypeScript implementation

## Prerequisites

- Node.js 20 or later
- pnpm 10.7.1 or later
- Docker (optional, for containerized deployment)

## Installation

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd codescan-mcp-server
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the project:
```bash
pnpm run build
```

4. Start the server:
```bash
pnpm start
```

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t codescan-mcp-server .
```

2. Run the container:
```bash
docker run -d \
  -e CODESCAN_URL=https://app.codescan.io \
  -e CODESCAN_TOKEN=your_token_here \
  -e CODESCAN_ORGANIZATION=your_org \
  -e CODESCAN_PROJECT=your_project \
  -e CODESCAN_COMPONENT=your_component \
  -e NODE_OPTIONS="--experimental-specifier-resolution=node" \
  -p 3000:3000 \
  codescan-mcp-server
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| CODESCAN_URL | URL of your Codescan instance | Yes | https://app.codescan.io |
| CODESCAN_TOKEN | Authentication token for Codescan API | Yes | - |
| CODESCAN_ORGANIZATION | Organization key for Codescan Cloud | No | - |
| CODESCAN_PROJECT | Default project key | No | - |
| CODESCAN_COMPONENT | Default component key | No | - |
| NODE_OPTIONS | Node.js runtime options | No | --experimental-specifier-resolution=node |

## MCP Client Configuration

Here's an example MCP client configuration for interacting with the Codescan MCP server:

```json
{
  "name": "codescan-mcp-client",
  "version": "1.0.0",
  "description": "MCP client for Codescan integration",
  "servers": [
    {
      "name": "codescan-mcp-server",
      "url": "http://localhost:3000",
      "tools": ["projects", "metrics", "issues"]
    }
  ],
  "env": {
    "CODESCAN_URL": "https://app.codescan.io",
    "CODESCAN_TOKEN": "your_token_here",
    "CODESCAN_ORGANIZATION": "your_org",
    "CODESCAN_PROJECT": "your_project",
    "CODESCAN_COMPONENT": "your_component"
  }
}
```

### Tool Usage Examples

1. List Projects:
```json
{
  "tool": "projects",
  "params": {
    "page": "1",
    "page_size": "10"
  }
}
```

2. Get Metrics:
```json
{
  "tool": "metrics",
  "params": {
    "component": "your_component",
    "page": "1",
    "page_size": "10"
  }
}
```

3. Get Issues:
```json
{
  "tool": "issues",
  "params": {
    "component": "your_component",
    "severity": "MAJOR",
    "page": "1",
    "page_size": "10",
    "statuses": ["OPEN", "CONFIRMED"],
    "types": ["BUG", "VULNERABILITY"]
  }
}
```

## Development

### Available Scripts

- `pnpm run build`: Build the TypeScript code
- `pnpm start`: Start the MCP server
- `pnpm test`: Run tests
- `pnpm lint`: Run linter
- `pnpm format`: Format code

### Project Structure

```
codescan-mcp-server/
├── src/
│   ├── index.ts        # Main server entry point
│   └── codescan.ts     # Codescan API client
├── dist/               # Compiled JavaScript
├── Dockerfile          # Docker configuration
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── mcp.json           # MCP server configuration
```

## License

[License Type] - See LICENSE file for details 