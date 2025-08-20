# @weirdscience/mcp-gitlab

A Model Context Protocol (MCP) server that provides GitLab integration tools using the `glab` CLI. This server enables AI assistants to interact with GitLab repositories, issues, merge requests, and pipelines through a standardized MCP interface.

## Features

- **Issue Management**: List, create, and manage GitLab issues
- **Merge Requests**: List and create merge requests
- **Pipeline Monitoring**: View project pipelines and their status
- **Raw API Access**: Direct access to GitLab REST API endpoints
- **Multi-Instance Support**: Works with gitlab.com and self-hosted GitLab instances
- **Pagination Support**: Automatic handling of large result sets

## Prerequisites

- Node.js 18+ 
- `glab` CLI tool installed and configured
- GitLab personal access token

## Installation

### Global Installation

```bash
npm install -g @weirdscience/mcp-gitlab
```

### Local Installation

```bash
npm install @weirdscience/mcp-gitlab
```

## Setup

### 1. Install glab CLI

First, install the `glab` CLI tool:

```bash
# macOS
brew install glab

# Linux
sudo apt install glab

# Windows
winget install GitLab.GLab
```

### 2. Configure glab

Authenticate with your GitLab instance:

```bash
# For gitlab.com
glab auth login

# For self-hosted GitLab
glab auth login --hostname gitlab.your-instance.com
```

### 3. Configure MCP

Add the server to your MCP configuration file (`~/.config/mcp.json` or similar):

```json
{
  "mcpServers": {
    "gitlab-glab": {
      "command": "mcp-gitlab",
      "env": {
        "GITLAB_HOST": "gitlab.com",
        "GITLAB_TOKEN": "your-gitlab-token"
      }
    }
  }
}
```

## Cursor Configuration

To use this MCP server with Cursor, you need to configure it in Cursor's settings:

### Method 1: Global Configuration

1. Open Cursor's Command Palette (`Cmd/Ctrl + Shift + P`)
2. Search for "MCP" and select "MCP: Configure Servers"
3. Add a new server configuration:

```json
{
  "name": "gitlab-glab",
  "command": "mcp-gitlab",
  "env": {
    "GITLAB_HOST": "gitlab.com",
    "GITLAB_TOKEN": "your-gitlab-token"
  }
}
```

### Method 2: Workspace Configuration

Create a `.cursorrules` file in your project root:

```json
{
  "mcpServers": {
    "gitlab-glab": {
      "command": "mcp-gitlab",
      "env": {
        "GITLAB_HOST": "gitlab.com",
        "GITLAB_TOKEN": "your-gitlab-token"
      }
    }
  }
}
```

### Method 3: Settings UI

1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Search for "MCP"
3. Add the server configuration in the MCP settings section

### Verification

After configuration, you can verify the server is working by:

1. Opening Cursor's Command Palette
2. Running "MCP: List Available Tools"
3. You should see tools like `gitlab.issues.list`, `gitlab.mrs.list`, etc.

### Usage in Cursor

Once configured, you can use GitLab tools directly in Cursor:

- Ask Cursor to "list open issues in my project"
- Request "create a merge request for the current branch"
- Ask "show me the latest pipeline status"

Cursor will automatically use the appropriate MCP tools to fulfill these requests.

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GITLAB_HOST` | GitLab instance hostname | `gitlab.com` or `gitlab.your-company.com` |
| `GITLAB_TOKEN` | GitLab personal access token | `glpat-xxxxxxxxxxxxxxxxxxxx` |
| `GITLAB_URI` | Full GitLab instance URI | `https://gitlab.your-company.com` |

## Available Tools

### `gitlab.issues.list`
List issues for a project.

**Parameters:**
- `project` (string): Project path or numeric ID (e.g., `'gitlab-org/cli'`)
- `state` (optional): Issue state (`'opened'`, `'closed'`, `'all'`)
- `labels` (optional): Comma-separated label names
- `assignee` (optional): Assignee username

### `gitlab.mrs.list`
List merge requests for a project.

**Parameters:**
- `project` (string): Project path or numeric ID
- `state` (optional): MR state (`'opened'`, `'merged'`, `'closed'`, `'all'`)
- `labels` (optional): Comma-separated label names
- `draft` (optional): Filter for draft MRs

### `gitlab.mr.create`
Create a new merge request.

**Parameters:**
- `project` (string): Project path or numeric ID
- `sourceBranch` (string): Source branch name
- `targetBranch` (string): Target branch name
- `title` (string): MR title
- `description` (optional): MR description
- `draft` (optional): Create as draft MR
- `labels` (optional): Comma-separated labels
- `assignees` (optional): Comma-separated assignee usernames

### `gitlab.pipelines.list`
List pipelines for a project.

**Parameters:**
- `project` (string): Project path or numeric ID
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Items per page (default: 50, max: 100)
- `status` (optional): Pipeline status filter

### `gitlab.api`
Low-level access to GitLab REST API.

**Parameters:**
- `method` (optional): HTTP method (`'GET'`, `'POST'`, `'PUT'`, `'PATCH'`, `'DELETE'`)
- `path` (string): API path below `/api/v4`
- `fields` (optional): Request body fields
- `headers` (optional): Custom headers

### `glab.version`
Get the installed `glab` CLI version.

## Usage Examples

### List Open Issues
```json
{
  "tool": "gitlab.issues.list",
  "arguments": {
    "project": "gitlab-org/cli",
    "state": "opened"
  }
}
```

### Create Merge Request
```json
{
  "tool": "gitlab.mr.create",
  "arguments": {
    "project": "my-group/my-project",
    "sourceBranch": "feature/new-feature",
    "targetBranch": "main",
    "title": "Add new feature",
    "description": "This PR adds a new feature to improve user experience.",
    "labels": "enhancement,frontend"
  }
}
```

### Get Project Pipelines
```json
{
  "tool": "gitlab.pipelines.list",
  "arguments": {
    "project": "my-group/my-project",
    "perPage": 10,
    "status": "success"
  }
}
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
git clone https://github.com/weirdscience/mcp-gitlab.git
cd mcp-gitlab
npm install
```

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Testing
```bash
npm run check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Formatting
```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
- [glab CLI](https://gitlab.com/gitlab-org/cli) for GitLab command-line interface
- [GitLab](https://gitlab.com/) for the GitLab platform

## Support

If you encounter any issues or have questions:

1. Check the [GitHub Issues](https://github.com/weirdscience/mcp-gitlab/issues)
2. Review the [glab CLI documentation](https://gitlab.com/gitlab-org/cli/-/blob/main/docs/source/index.md)
3. Consult the [MCP documentation](https://modelcontextprotocol.io/)

## Changelog

### 0.1.0
- Initial release
- Basic GitLab integration via glab CLI
- Support for issues, merge requests, and pipelines
- Raw API access capability
