# Ferg Engineering System

A compounding engineering system for UnFergettable-Designs and ferg-cod3s. Provides shared agents, commands, and skills for **Claude Code** and **OpenCode** (SST/OpenCode agentic platform).

## Quick Start

Install as a plugin for your preferred platform:

**Claude Code:**
```bash
claude plugin add https://github.com/ferg-cod3s/ferg-engineering-system
```

**OpenCode:**
```bash
# Projects using this scaffold have the plugin pre-configured
opencode  # Plugin loads automatically
```

## Commands Available

- `/plan` — Create detailed implementation plans
- `/work` — Execute plans with worktrees and task tracking
- `/review` — Multi-perspective code review (quality, performance, SEO, security, architecture)
- `/seo` — SEO audits with Core Web Vitals and accessibility checks
- `/compound` — Document solved problems for team knowledge
- `/deploy` — Pre-deployment checklist and Coolify deployment

## Philosophy: Compounding Engineering

Each unit of work should make future work easier: **Plan → Build → Review → Codify**

## Documentation

- **[PLUGIN.md](PLUGIN.md)** — Installation and usage for Claude Code & OpenCode
- **[CLAUDE.md](CLAUDE.md)** — Philosophy and core commands
- **[AGENTS.md](AGENTS.md)** — Agent coordination and specialized subagents

## Architecture

**Shared:** Workflow definitions in `commands/` and `skills/`
**Claude Code:** Plugin metadata in `.claude-plugin/`, commands symlinked to `.claude/commands/`
**OpenCode:** Commands in `.opencode/command/`, agents in `.opencode/agent/`, plugin in `.opencode/plugin/`

## License

MIT
