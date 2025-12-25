# OpenCode Plugin System

## Overview

OpenCode extensions use a different but equally powerful system based on plugins, commands, agents, skills, and custom tools. Understanding this system enables creating well-organized extensions that integrate seamlessly with OpenCode.

## Directory Structure

Every OpenCode extension follows this organizational pattern:

```
project/
├── .opencode/
│   ├── plugin/              # Plugin code (TypeScript)
│   ├── command/              # Slash commands (.md files)
│   ├── agent/                # Agent definitions (.md files)
│   └── tool/                 # Custom tools (TypeScript files)
├── .opencode/skills/           # Skills (auto-discovered)
└── opencode.json             # Configuration (optional)
```

## Critical Rules

1. **Plugin Code**: TypeScript files in `.opencode/plugin/`
2. **Component Locations**: Commands, agents in `.opencode/` with table format
3. **Skills**: Auto-discovered by opencode-skills plugin from `.opencode/skills/`
4. **Naming Convention**: Use kebab-case for all file names

## Plugin System

### Plugin Structure

Plugins are TypeScript modules that extend OpenCode:

```typescript
import type { Plugin } from "@opencode-ai/plugin"

const plugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  console.log("Plugin loaded")
  
  return {
    // Plugin hooks and tools here
  }
}

export default plugin
```

### Plugin Events

OpenCode plugins can hook into various events:

| Event | Description |
|--------|-------------|
| `command.executed` | After command execution |
| `file.edited` | After file modification |
| `file.watcher.updated` | When file watcher detects changes |
| `installation.updated` | When installation changes |
| `lsp.client.diagnostics` | When LSP diagnostics update |
| `lsp.updated` | When LSP state changes |
| `message.part.removed` | When message part removed |
| `message.part.updated` | When message part updated |
| `message.removed` | When message removed |
| `message.updated` | When message updated |
| `permission.replied` | When permission response |
| `permission.updated` | When permission changes |
| `server.connected` | When server connects |
| `session.created` | When session created |
| `session.compacted` | When session compacted |
| `session.deleted` | When session deleted |
| `session.diff` | When session diff requested |
| `session.error` | When session error occurs |
| `session.idle` | When session goes idle |
| `session.status` | When session status changes |
| `session.updated` | When session updated |
| `todo.updated` | When todo list updates |
| `tool.execute.after` | After tool execution |
| `tool.execute.before` | Before tool execution |
| `tui.prompt.append` | When TUI prompt appends |
| `tui.command.execute` | When TUI command executes |
| `tui.toast.show` | When TUI toast shows |

### Plugin Example

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export default (async ({ project, client, $, directory, worktree }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        throw new Error("Do not read .env files")
      }
    },
  }
}
```

## Commands

### Command Format

Commands are Markdown files with table frontmatter:

```markdown
| description | agent |
|---|---|
| Command description | agent-name |

# Command Content

Command instructions here with $ARGUMENTS placeholder...
```

### Frontmatter Table

| Field | Description |
|--------|-------------|
| **description** | Brief description shown in command list |
| **agent** | Which agent should handle this command (optional) |
| **subtask** | Run as subtask (optional) |
| **model** | Override default model (optional) |
| **temperature** | Override temperature (optional) |

### Dynamic Arguments

- `$ARGUMENTS`: All arguments as single string
- `$1`, `$2`, `$3`: Positional arguments
- `@file.txt`: Include file content
- `!`command``: Include shell command output

### Command Example

```markdown
| description | agent |
|---|---|
| Run tests with coverage | build |

# Test Command

Run the full test suite with coverage report and show any failures.

Focus on the failing tests and suggest fixes.
```

## Agents

### Agent Format

Agents are Markdown files with table frontmatter:

```markdown
| description | mode |
|---|---|
| Agent description | subagent |

# System Prompt

Agent system prompt here...
```

### Frontmatter Table

| Field | Description |
|--------|-------------|
| **description** | Triggering conditions and purpose |
| **mode** | "primary" or "subagent" |
| **temperature** | 0.0-1.0 (optional) |
| **tools** | Tool access control (optional) |
| **permission** | Permission overrides (optional) |

### Agent Example

```markdown
| description | mode |
|---|---|
| Reviews code for quality and best practices | subagent |

You are a senior code reviewer with 10+ years of experience...

## Skills

### Skill Format

Skills follow Anthropic's Agent Skills Specification (same as Claude Code):

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          # Executable code
    ├── references/       # Documentation
    └── assets/           # Files used in output
```

### Skill Discovery

Skills are auto-discovered by the opencode-skills plugin:
- Scans `.opencode/skills/`, `~/.opencode/skills/`, `~/.config/opencode/skills/`
- Registers tools named `skills_{{skill_name}}`
- Validates YAML frontmatter
- Loads skill content on demand

### Skill Example

```yaml
---
name: git-worktree
description: Manage Git worktrees for parallel development
---

# Git Worktree Skill

Create worktree: `git worktree add ../project-feature -b feature/name`
List: `git worktree list`
Remove: `git worktree remove ../project-feature`
Best practices: name clearly, clean up after merge.
```

## Custom Tools

### Tool Format

Custom tools are TypeScript files using the `tool()` helper:

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args) {
    // Your tool logic here
    return `Executed query: ${args.query}`
  },
})
```

### Tool Schema

Use Zod schema for argument validation:

```typescript
args: {
  name: tool.schema.string().describe("File name"),
  count: tool.schema.number().describe("Number of items"),
  options: tool.schema.array(tool.schema.string()).describe("Options array"),
}
```

### Tool Context

Tools receive context about current session:

```typescript
async execute(args, context) {
  const { agent, sessionID, messageID } = context
  console.log(`Running in ${agent} context`)
  
  // Tool implementation
  return result
}
```

### Multiple Tools

Export multiple tools from one file:

```typescript
export const add = tool({ /* ... */ })
export const multiply = tool({ /* ... */ })
// Creates: math_add and math_multiply tools
```

## Configuration

### opencode.json

Global OpenCode configuration:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "my-command": {
      "template": "Command prompt here",
      "description": "Command description"
    }
  },
  "agent": {
    "my-agent": {
      "prompt": "Agent system prompt",
      "temperature": 0.3
    }
  }
}
```

### Plugin Configuration

Plugins can access configuration via context parameters:
- `project`: Current project information
- `client`: OpenCode SDK client
- `$`: Bun shell API
- `directory`: Current working directory
- `worktree`: Git worktree path

## Security Best Practices

- No hardcoded credentials in tool code
- Validate user inputs in tools
- Use environment variables for secrets
- Follow principle of least privilege
- Secure file operations in plugins

## Auto-Discovery

OpenCode automatically discovers components:

1. **Commands**: All `.md` files in `.opencode/command/`
2. **Agents**: All `.md` files in `.opencode/agent/`
3. **Tools**: All `.ts` files in `.opencode/tool/`
4. **Skills**: Via opencode-skills plugin
5. **Plugins**: All `.ts` files in `.opencode/plugin/`

## Installation

### Project-Local

Components in `.opencode/` load automatically when OpenCode starts in that directory.

### Global

Install to `~/.config/opencode/` for use across all projects:

```bash
mkdir -p ~/.config/opencode/command
mkdir -p ~/.config/opencode/agent
mkdir -p ~/.config/opencode/tool
# Copy components here
```

## Testing

### Local Testing

```bash
# Test with local components
opencode  # Starts in current directory

# Test with global installation
opencode --reload  # Reloads global components
```

### Validation

OpenCode provides built-in validation:
- Command frontmatter syntax
- Agent frontmatter syntax
- Tool TypeScript compilation
- Plugin TypeScript compilation

## Distribution

### npm Package

Publish as npm package for easy installation:

```json
{
  "name": "@username/my-extension",
  "version": "1.0.0",
  "description": "OpenCode extension for...",
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  },
  "keywords": ["opencode", "extension", "plugin"]
}
```

### Installation

```bash
npm install -g @username/my-extension
```

## Key Differences from Claude Code

| Feature | Claude Code | OpenCode |
|---------|-------------|----------|
| **Commands** | YAML frontmatter | Table format |
| **Agents** | YAML frontmatter | Table format |
| **Skills** | Built-in | Via opencode-skills plugin |
| **Hooks** | hooks.json | Plugin events |
| **Custom Tools** | MCP servers | TypeScript tool() helper |
| **Manifest** | plugin.json | package.json + plugin.ts |
| **Auto-Discovery** | Built-in | Built-in |

Both systems provide powerful extension capabilities but use different approaches.