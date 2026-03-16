# Ferg Engineering System

Engineering workflow automation using the [ai-eng-system](https://github.com/v1truvius/ai-eng-system) toolkit.

## Overview

This project uses a comprehensive AI engineering toolkit with 29 specialized agents for development workflows including architecture, coding, testing, and deployment.

## Project-Level Skills

### ralph-wiggum

Continuous iteration loop pattern for well-defined tasks with clear completion criteria.

**Use when:**
- Getting tests to pass (TDD)
- Implementing features with automatic verification
- Bug fixing with clear success conditions
- Running automated development overnight

```bash
@full-stack-developer "Get all tests passing in src/auth.
Output <promise>ALL_TESTS_PASSING</promise> when done."
```

## Global Dependencies

This project requires the ai-eng-system toolkit installed globally:

- `~/.claude/skills/` - Claude Code skills (21)
- `~/.claude/agents/` - Claude Code agents (112)
- `~/.claude/commands/` - Claude Code commands (22)
- `~/.config/opencode/skill/` - OpenCode skills (9)
- `~/.config/opencode/agent/` - OpenCode agents (42)

## Key Agents

| Agent | Purpose |
|-------|---------|
| `@full-stack-developer` | End-to-end feature delivery |
| `@code-reviewer` | Code quality assessment |
| `@architect-advisor` | System architecture decisions |
| `@deployment-engineer` | CI/CD pipeline design |
| `@security-scanner` | Security vulnerability detection |

## Installation

```bash
# Clone this repository
git clone https://github.com/v1truv1us/ferg-engineering-system.git

# Install ai-eng-system globally (see ai-eng-system docs)
```

## License

MIT
