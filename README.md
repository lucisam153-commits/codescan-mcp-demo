# Codescan MCP Server

A Model Context Protocol (MCP) server that integrates with Codescan to provide AI assistants with access to code quality metrics, issues, and analysis results.

## Overview

The Codescan MCP Server enables AI assistants to interact with Codescan's code quality analysis capabilities through the Model Context Protocol. This integration allows AI assistants to:

* Retrieve code metrics and analysis results
* Access and filter issues
* Check quality status
* Analyze project quality over time

## Features

- List all Codescan projects with pagination support
- Get detailed issue information from Codescan projects with extensive filtering options
- Comprehensive parameter validation using Zod schemas
- Full TypeScript support

## Usage with Claude Desktop

1. Edit `claude_desktop_config.json`:
   - Open Claude Desktop
   - Go to `Settings` -> `Developer` -> `Edit Config`
   - Add the one of the configurations below to the `mcpServers` section

2. Restart Claude Desktop to apply the changes

### Docker

```json
{
  "mcpServers": {
    "codescan": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "codescan_URL",
        "-e",
        "codescan_TOKEN",
        "-e",
        "CODESCAN_ORGANIZATION",
        "presh-ar/codescan-mcp-server"
      ],
      "env": {
        "CODESCAN_URL": "https://app.codescan.io",
        "CODESCAN_TOKEN": "your-codescan-token",
        "CODESCAN_ORGANIZATION": "your-organization-key (optional)"
      }
    }
  }
}
```
```

## Available Tools

The Codescan MCP Server provides the following tools:

### Codescan Tools

1. `projects`: List all Codescan projects
   * Parameters:
     * `organization` (optional) - Organization key for Codescan
     * `page` (optional) - Page number for results pagination
     * `page_size` (optional) - Number of items per page

2. `issues`: Get issues from a Codescan project
   * Parameters:
     * `project_key` (required) - The unique identifier for the Codescan project
     * `severity` (optional) - Filter issues by severity (INFO, MINOR, MAJOR, CRITICAL, BLOCKER)
     * `organization` (optional) - Organization key for Codescan Cloud
     * `page` (optional) - Page number for results pagination
     * `page_size` (optional) - Number of items per page
     * `statuses` (optional) - Filter issues by status (array of: OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED, TO_REVIEW, IN_REVIEW, REVIEWED)
     * `resolutions` (optional) - Filter issues by resolution (array of: FALSE-POSITIVE, WONTFIX, FIXED, REMOVED)
     * `resolved` (optional) - Whether to return only resolved issues (true) or unresolved issues (false)
     * `types` (optional) - Filter issues by type (array of: CODE_SMELL, BUG, VULNERABILITY, SECURITY_HOTSPOT)
     * `rules` (optional) - Array of rule keys to filter issues
     * `tags` (optional) - Array of tags to filter issues
     * `created_after` (optional) - Return issues created after the given date (format: YYYY-MM-DD)
     * `created_before` (optional) - Return issues created before the given date (format: YYYY-MM-DD)
     * `created_at` (optional) - Return issues created on the given date
     * `created_in_last` (optional) - Return issues created during a time span before the current time (e.g., "1d" for issues created in the last day)
     * `assignees` (optional) - Array of assignee login names to filter issues
     * `authors` (optional) - Array of author login names to filter issues
     * `cwe` (optional) - Array of CWE identifiers to filter vulnerability issues
     * `languages` (optional) - Array of languages to filter issues
     * `owasp_top10` (optional) - Array of OWASP Top 10 categories to filter issues
     * `sans_top25` (optional) - Array of SANS Top 25 categories to filter issues 
     * `sonarsource_security` (optional) - Array of SonarSource security categories to filter issues
     * `on_component_only` (optional) - Return only issues at the specified component level (true) or issues from the component's subtree (false)
     * `facets` (optional) - Array of facets to return along with the issues
     * `since_leak_period` (optional) - Return only issues created since the leak period
     * `in_new_code_period` (optional) - Return only issues created in the new code period

## Environment Variables

* `CODESCAN_URL` - URL of your Codescan instance (default: https://app.codescan.io/codescan)
* `CODESCAN_TOKEN` - Authentication token for Codescan API access
* `CODESCAN_ORGANIZATION` - (Optional) Organization key for Codescan Cloud

## Development

1. Clone the repository:
```bash
git clone https://github.com/Presh-AR/codescan-mcp-server
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

4. Configure Claude Desktop
```json
{
  "mcpServers": {
    "codescan": {
      "command": "node",
      "args": [
        "/path/to/codescan-mcp-server/dist/index.js"
      ],
      "env": {
        "CODESCAN_TOKEN": "your-codescan-token"
      }
    }
  }
}
```

### Prerequisites

* Node.js 20 or higher
* pnpm 10.7.0 or higher
* Docker (for container builds)

### Scripts

* `pnpm run build` - Build the TypeScript code
* `pnpm run start` - Start the server
* `pnpm run dev` - Start the server in development mode
* `pnpm run test` - Run tests
* `pnpm run lint` - Run ESLint
* `pnpm run format` - Format code with Prettier

## License

MIT 