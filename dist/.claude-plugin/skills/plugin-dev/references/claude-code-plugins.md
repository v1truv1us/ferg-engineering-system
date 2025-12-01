# Claude Code Plugin Structure

## Overview

Claude Code plugins follow a standardized directory structure with automatic component discovery. Understanding this structure enables creating well-organized, maintainable plugins that integrate seamlessly with Claude Code.

## Directory Structure

Every Claude Code plugin follows this organizational pattern:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Required: Plugin manifest
├── commands/                 # Slash commands (.md files)
├── agents/                   # Subagent definitions (.md files)
├── skills/                   # Agent skills (subdirectories)
│   └── skill-name/
│       └── SKILL.md         # Required for each skill
├── hooks/
│   └── hooks.json           # Event handler configuration
├── .mcp.json                # MCP server definitions
└── scripts/                 # Helper scripts and utilities
```

## Critical Rules

1. **Manifest Location**: The `plugin.json` manifest MUST be in `.claude-plugin/` directory
2. **Component Locations**: All component directories (commands, agents, skills, hooks) MUST be at plugin root level, NOT nested inside `.claude-plugin/`
3. **Optional Components**: Only create directories for components that plugin actually uses
4. **Naming Convention**: Use kebab-case for all directory and file names

## Plugin Manifest (plugin.json)

The manifest defines plugin metadata and configuration. Located at `.claude-plugin/plugin.json`:

### Required Fields

```json
{
  "name": "plugin-name"
}
```

**Name Requirements:**
- Use kebab-case format (lowercase with hyphens)
- Must be unique across installed plugins
- No spaces or special characters
- Example: `code-review-assistant`, `test-runner`, `api-docs`

### Recommended Metadata

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Brief explanation of plugin purpose",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://example.com"
  },
  "homepage": "https://docs.example.com",
  "repository": "https://github.com/user/plugin-name",
  "license": "MIT",
  "keywords": ["testing", "automation", "ci-cd"]
}
```

**Version Format**: Follow semantic versioning (MAJOR.MINOR.PATCH)
**Keywords**: Use for plugin discovery and categorization

### Component Path Configuration

Specify custom paths for components (supplements default directories):

```json
{
  "name": "plugin-name",
  "commands": "./custom-commands",
  "agents": ["./agents", "./specialized-agents"],
  "hooks": "./config/hooks.json",
  "mcpServers": "./.mcp.json"
}
```

**Important**: Custom paths supplement defaults—they don't replace them. Components in both default directories and custom paths will load.

## Commands

### Command Format

Commands are Markdown files with YAML frontmatter:

```markdown
---
name: my-command
description: What this command does
agent: build           # Optional: which agent handles this
subtask: true          # Optional: run as subtask
model: sonnet         # Optional: override model
temperature: 0.3      # Optional: temperature
tools:                 # Optional: tool restrictions
  read: true
  write: true
---

# Command Content

Command instructions here with $ARGUMENTS placeholder...
```

### Frontmatter Fields

- **name** (required): Command identifier (kebab-case)
- **description** (required): Brief description shown in `/help`
- **agent** (optional): Which agent should handle this command
- **subtask** (optional): Run as subtask (default: false)
- **model** (optional): Override default model
- **temperature** (optional): Override default temperature
- **tools** (optional): Restrict available tools

### Dynamic Arguments

- `$ARGUMENTS`: All arguments as single string
- `$1`, `$2`, `$3`: Positional arguments
- `@file.txt`: Include file content
- `!`command``: Include shell command output

## Agents

### Agent Format

Agents are Markdown files with YAML frontmatter:

```markdown
---
name: my-agent
description: Use this agent when... <example>...</example>
mode: subagent
model: sonnet
color: cyan
temperature: 0.3
tools:
  read: true
  write: true
---

# System Prompt

Agent system prompt here...
```

### Frontmatter Fields

- **name** (required): Agent identifier (kebab-case, 3-50 chars)
- **description** (required): Triggering conditions with examples
- **mode** (required): "primary" or "subagent"
- **model** (optional): "inherit", "sonnet", "opus", "haiku"
- **color** (optional): "blue", "cyan", "green", "yellow", "magenta", "red"
- **temperature** (optional): 0.0-1.0 (default: model-specific)
- **tools** (optional): Tool access control

### Triggering Examples

Include 2-4 `<example>` blocks in description:

```yaml
description: Use this agent when user asks to "create an agent", "generate an agent", or describes agent functionality. Examples:

<example>
Context: User wants to create a code review agent
user: "Create an agent that reviews code for quality issues"
assistant: "I'll use the agent-creator to generate a code review agent."
<commentary>
User requesting new agent creation, trigger agent-creator.
</commentary>
</example>
```

## Skills

### Skill Format

Skills follow Anthropic's Agent Skills Specification:

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

### SKILL.md Frontmatter

```yaml
---
name: skill-name
description: This skill should be used when...
version: 1.0.0
---
```

### Progressive Disclosure

- **Metadata** (name + description): Always in context (~100 words)
- **SKILL.md body**: When skill triggers (<5k words, ideally 1.5-2k)
- **Bundled resources**: Loaded as needed by Claude

## Hooks

### Hook Configuration

Hooks are defined in `hooks/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "description": "Initialize plugin on session start",
        "hooks": [
          {
            "type": "notification",
            "message": "Plugin loaded successfully"
          }
        ]
      }
    ]
  }
}
```

### Hook Types

- **SessionStart**: Triggered when Claude session starts
- **SessionEnd**: Triggered when Claude session ends
- **PreToolUse**: Before tool execution
- **PostToolUse**: After tool execution
- **Stop**: When user stops generation
- **SubagentStop**: When subagent finishes
- **UserPromptSubmit**: Before processing user input
- **PreCompact**: Before session compaction
- **Notification**: For sending notifications

### Hook Implementation

Two hook types:

1. **Command Hooks**: Execute shell scripts
2. **Prompt Hooks**: LLM evaluates conditions

## MCP Servers

### MCP Configuration

Define in `.mcp.json` (root level) or `mcpServers` in manifest:

```json
{
  "mcpServers": {
    "database": {
      "command": "python3 ${CLAUDE_PLUGIN_ROOT}/scripts/db_server.py",
      "args": ["--port", "5432"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432"
      }
    }
  }
}
```

### Server Types

- **stdio**: Local command execution
- **sse**: Hosted server with OAuth
- **http**: REST API server
- **ws**: WebSocket real-time connection

### Portable Paths

Use `${CLAUDE_PLUGIN_ROOT}` for portable paths:
- Scripts: `${CLAUDE_PLUGIN_ROOT}/scripts/myscript.py`
- Config: `${CLAUDE_PLUGIN_ROOT}/config/settings.json`

## Security Best Practices

- No hardcoded credentials
- Use HTTPS/WSS for external connections
- Validate user inputs in hooks
- Follow principle of least privilege
- Use environment variables for secrets

## File Organization

### Required Files

- `plugin.json`: Plugin manifest
- Component files: At least one component (command, agent, or skill)

### Recommended Files

- `README.md`: Documentation and usage
- `LICENSE`: License file
- `.gitignore`: Exclude unnecessary files

### GitIgnore Pattern

```
# Claude Code
.claude-plugin/node_modules/
.claude-plugin/.env
.claude-plugin/*.local.md

# General
node_modules/
.DS_Store
*.log
```

## Auto-Discovery

Claude Code automatically discovers components:

1. **Commands**: All `.md` files in `commands/`
2. **Agents**: All `.md` files in `agents/`
3. **Skills**: All `SKILL.md` files in `skills/*/`
4. **Hooks**: `hooks/hooks.json` if present
5. **MCP Servers**: `.mcp.json` or manifest `mcpServers`

## Testing

### Local Testing

```bash
# Test plugin locally
claude plugin add /path/to/plugin-name

# Or use NPX
npx /path/to/plugin-name
```

### Validation

Use Claude Code's built-in validation:
- Check manifest syntax
- Verify component formats
- Test auto-discovery
- Validate hook schemas

## Distribution

### Marketplace Publishing

1. Create marketplace entry in repository
2. Submit to Claude Code marketplace
3. Include version changelog
4. Provide documentation

### Version Management

- Use semantic versioning
- Update manifest version
- Document breaking changes
- Maintain backward compatibility