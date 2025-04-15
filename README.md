# Codescan MCP Server

A Model Context Protocol (MCP) server for interacting with Codescan (SonarQube) API.

## Features

- List all projects in Codescan
- Get issues for a specific project
- Get available metrics
- Filter by component/project
- Pagination support
- Error handling and logging

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Codescan account and API token

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/codescan-mcp-server.git
cd codescan-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

The server requires the following environment variables:

- `CODESCAN_TOKEN` (required): Your Codescan API token
- `CODESCAN_URL` (optional): Codescan instance URL (default: https://app.codescan.io)
- `CODESCAN_ORGANIZATION` (optional): Organization key
- `CODESCAN_COMPONENT` (optional): Default component key for issues and metrics
- `CODESCAN_PROJECT` (optional): Default project key for project search

## Usage

Start the server:
```bash
node --experimental-specifier-resolution=node dist/index.js
```

The server will log its configuration and any errors that occur.

## Development

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
```

3. Build the project:
```bash
npm run build
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 