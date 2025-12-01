# Command Format Guide

## Overview

Commands are the primary way to provide reusable workflows in both Claude Code and OpenCode. While the frontmatter format differs between platforms, the core concepts and best practices remain the same.

## Platform Comparison

| Aspect | Claude Code | OpenCode | Canonical (content/) |
|---------|-------------|----------|------------------|
| **Frontmatter** | YAML block | YAML table | YAML block |
| **File Extension** | `.md` | `.md` | `.md` |
| **Arguments** | `$ARGUMENTS`, `$1`, `$2` | `$ARGUMENTS`, `$1`, `$2` | `$ARGUMENTS`, `$1`, `$2` |
| **File References** | `@file.txt` | `@file.txt` | `@file.txt` |
| **Shell Output** | Triple backticks | Exclamation marks | Exclamation marks |
| **Agent Specification** | `agent: name` | `agent: name` | `agent: name` |
| **Model Override** | `model: sonnet` | `model: sonnet` | `model: sonnet` |
| **Tool Restrictions** | `allowed-tools: [...]` | `tools: { read: true }` | `tools: { read: true }` |

## Canonical Format (content/)

Use this format in `content/commands/` for maximum compatibility:

```yaml
---
name: my-command
description: Brief description of what this command does
agent: build           # Optional: which agent handles this
subtask: true          # Optional: run as subtask
model: sonnet         # Optional: override model
temperature: 0.3      # Optional: override temperature
tools:                 # Optional: tool restrictions
  read: true
  write: true
---
```

## Claude Code Output

Build.ts transforms canonical to Claude Code format (YAML frontmatter):

```markdown
---
name: my-command
description: Brief description of what this command does
agent: build
subtask: true
model: sonnet
temperature: 0.3
tools:
  read: true
  write: true
---

# Command Content

Command instructions here with $ARGUMENTS placeholder...
```

## OpenCode Output

Build.ts transforms canonical to OpenCode format (table frontmatter):

```markdown
| description | agent |
|---|---|
| Brief description | build |

# Command Content

Command instructions here with $ARGUMENTS placeholder...
```

## Argument Handling

### Positional Arguments

Both platforms support positional arguments:

```bash
/command arg1 arg2 arg3
```

- `$1` = "arg1"
- `$2` = "arg2"
- `$3` = "arg3"

### All Arguments String

Both platforms support the full arguments string:

```bash
/command "multiple words as one argument"
```

- `$ARGUMENTS` = "multiple words as one argument"

### File References

Include file content in commands:

```markdown
---
name: review-config
description: Review configuration file
---

Review the configuration in @config.json:

Current settings:
!`cat config.json`

Recommendations:
...
```

### Shell Output

#### Claude Code

```markdown
---
name: list-files
description: List files in directory
---

Files in current directory:
```bash
ls -la
```
```

#### OpenCode

```markdown
| description | agent |
|---|---|
| List files in directory | build |

# List Files Command

Files in current directory:
!`ls -la`
```

## Agent Specification

### Claude Code

```yaml
agent: build
```

### OpenCode

```markdown
| description | agent |
|---|---|
| Description here | build |
```

## Tool Restrictions

### Claude Code

```yaml
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
```

### OpenCode

```yaml
tools:
  read: true
  write: true
  bash: true
  grep: true
  glob: true
```

## Best Practices

### Command Design

1. **Clear Description**: Explain what command does in one sentence
2. **Specific Arguments**: Document expected arguments
3. **Agent Assignment**: Assign to appropriate agent when needed
4. **Error Handling**: Provide helpful error messages
5. **Examples**: Include usage examples in command content

### Writing Style

1. **Instructions FOR Claude**: Write as directives to Claude, not explanations to user
2. **Imperative Mood**: Use command form, not suggestive language
3. **Structured Output**: Define clear output format
4. **Context Awareness**: Reference project context when helpful

### Security

1. **Input Validation**: Validate arguments before processing
2. **Safe Shell**: Avoid dangerous shell commands
3. **File Access**: Check file permissions before reading
4. **No Secrets**: Never log or expose sensitive data

## Examples

### Simple Command

```yaml
---
name: status
description: Show git repository status
---

Check current git status:

!`git status`

Summary: [brief analysis]
```

### Command with Agent

```yaml
---
name: analyze
description: Analyze code for performance issues
agent: performance-engineer
---

Analyze the current codebase for performance bottlenecks:

1. Check database queries
2. Review algorithmic complexity
3. Identify slow operations

Provide optimization recommendations.
```

### Interactive Command

```yaml
---
name: configure
description: Interactive project configuration
subtask: true
---

Let's configure your project step by step:

1. What type of project? (web/api/cli)
2. Which database? (postgres/mysql/nosql)
3. Deployment target? (aws/gcp/azure)

Configuration will be saved to config.json.
```

## Advanced Features

### Conditional Logic

```markdown
---
name: deploy
description: Deploy with environment-specific logic
---

!`if [ "$ENV" = "production" ]; then
  echo "Deploying to production..."
  # Production deployment steps
else
  echo "Deploying to staging..."
  # Staging deployment steps
fi
```

### Multiple Commands

```markdown
---
name: full-test
description: Run complete test suite
---

!`npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e`

All tests completed with coverage report.
```

## Integration with Ferg System

### Existing Commands

- `/ferg/plan` - Implementation planning
- `/ferg/review` - Multi-perspective code review
- `/ferg/deploy` - Deployment automation

### Plugin-Dev Commands

- `/ferg/create-command` - Quick command creation
- `/ferg/create-agent` - Quick agent creation
- `/ferg/create-plugin` - Full plugin development workflow

All commands follow the same quality standards and use the build.ts transformation system.