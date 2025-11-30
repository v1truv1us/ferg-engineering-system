# Ferg Engineering System

A compounding engineering system for UnFergettable-Designs and ferg-cod3s. Provides shared agents, commands, and skills for **Claude Code** and **OpenCode** (SST/OpenCode agentic platform).

## 🚀 Easy Installation

### For Claude Code

**Option 1: Marketplace (Recommended)**
```bash
/plugin marketplace add ferg-cod3s/ferg-marketplace
/plugin install ferg-engineering@ferg-cod3s
```

**Option 2: Direct Repository**
```bash
claude plugin add https://github.com/ferg-cod3s/ferg-engineering-system
```

### For OpenCode (Global - Recommended)

**Option 1: Shell Script**
```bash
git clone https://github.com/ferg-cod3s/ferg-engineering-system
cd ferg-engineering-system
./setup-global.sh  # Installs to ~/.config/opencode with ferg/ namespace
```

**Option 2: npm Package** (Coming Soon)
```bash
npm install -g @ferg-cod3s/engineering-system
```

### For OpenCode (Project-Local)
```bash
git clone https://github.com/ferg-cod3s/ferg-engineering-system
cd ferg-engineering-system
./setup.sh  # Creates symlinks in current project
```

> **No Bun required for installation** - pre-built `dist/` is included. Bun only needed if you want to modify the system.

## 📋 Quick Reference

| Platform | Installation | Commands | Agents | Example Usage |
|----------|-------------|----------|--------|---------------|
| **Claude Code** | `/plugin marketplace add ferg-cod3s/ferg-marketplace`<br>`/plugin install ferg-engineering@ferg-cod3s` | `/plan`, `/review`, `/optimize`, `/seo`, `/deploy`, `/compound`, `/recursive-init`, `/work` | N/A | `/plan "Add user authentication"` |
| **OpenCode** | `npm install -g @ferg-cod3s/engineering-system` | `/ferg/plan`, `/ferg/review`, `/ferg/optimize`, etc. | `ferg/architect-advisor`, `ferg/frontend-reviewer`, `ferg/seo-specialist`, `ferg/prompt-optimizer` | `/ferg/optimize 'Fix this slow query'` or `Use ferg/architect-advisor to evaluate...` |

## Architecture (v2.0)

This system uses a **single source of truth** architecture with automated build:

```
content/                    # ✏️ EDIT HERE - canonical source
├── commands/              # Command definitions (YAML frontmatter)
└── agents/                # Agent definitions (YAML frontmatter)

build.ts                   # Bun script: transforms content → platform formats

dist/                      # 🚫 GENERATED - never edit directly
├── .claude-plugin/        # Claude Code output (YAML frontmatter)
└── .opencode/             # OpenCode output (table format)
```

**Key Benefits:**
- ✅ Single edit point for all changes
- ✅ Guaranteed consistency across platforms
- ✅ Automated transformation via `bun run build`
- ✅ Easy to add future platforms

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) - Fast JavaScript runtime
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Installation

**Build from source:**
```bash
git clone https://github.com/ferg-cod3s/ferg-engineering-system
cd ferg-engineering-system
bun run build
```

**Claude Code:**
```bash
claude plugin add https://github.com/ferg-cod3s/ferg-engineering-system
```

**OpenCode (global install):**
```bash
./setup-global.sh  # Installs to ~/.config/opencode with ferg/ namespace
```

**OpenCode (project-local):**
```bash
./setup.sh  # Creates symlinks in current project
```

**Verify Installation:**
```bash
./verify-install.sh  # Check both platforms are working
```

## Commands Available

| Command | Description |
|---------|-------------|
| `/plan` | Create detailed implementation plans |
| `/work` | Execute plans with worktrees and task tracking |
| `/review` | Multi-perspective code review (quality, performance, SEO, security, architecture) |
| `/seo` | SEO audits with Core Web Vitals and accessibility checks |
| `/compound` | Document solved problems for team knowledge |
| `/deploy` | Pre-deployment checklist and Coolify deployment |
| `/optimize` | Transform prompts using research-backed incentive techniques (+45% quality) |
| `/recursive-init` | Recursively initialize AGENTS.md in all subdirectories |

## Agents Available (OpenCode)

| Agent | Description |
|-------|-------------|
| `ferg/architect-advisor` | System architecture decisions with trade-off analysis |
| `ferg/frontend-reviewer` | Frontend code review specialist (React, TypeScript, a11y) |
| `ferg/seo-specialist` | Technical & on-page SEO expert |
| `ferg/prompt-optimizer` | Prompt enhancement using research-backed techniques |

## Development

### Making Changes

1. Edit files in `content/commands/` or `content/agents/`
2. Run `bun run build` to generate platform outputs
3. Test with both platforms
4. Commit changes (including `dist/`)

### Build Commands

```bash
bun run build            # Build all platforms
bun run build --watch    # Watch mode for development
bun run build --validate # Validate content without building
```

### Content Format

**Commands** (content/commands/*.md):
```markdown
---
name: my-command
description: What this command does
agent: build           # Optional: which agent handles this
subtask: true          # Optional: run as subtask
---

# My Command

Command content here with $ARGUMENTS placeholder...
```

**Agents** (content/agents/*.md):
```markdown
---
name: my-agent
description: What this agent does
mode: subagent
---

Agent system prompt here...
```

## Philosophy: Compounding Engineering

Each unit of work should make future work easier: **Plan → Build → Review → Codify**

## Incentive-Based Prompting (Research-Backed)

This system integrates research-backed prompting techniques:
- **Bsharat et al. (2023, MBZUAI)**: +45% quality improvement with incentive framing
- **Yang et al. (2023, Google DeepMind)**: "Take a deep breath" reasoning optimization
- **Li et al. (2023, ICLR 2024)**: +115% improvement with challenge framing
- **Kong et al. (2023)**: 24% → 84% accuracy with expert personas

Use `/optimize` to apply these techniques to your own prompts.

## Documentation

- **[📖 Installation Guide](INSTALLATION.md)** — Complete installation options and troubleshooting
- **[PLUGIN.md](PLUGIN.md)** — Installation and usage for Claude Code & OpenCode
- **[CLAUDE.md](CLAUDE.md)** — Philosophy and core commands
- **[AGENTS.md](AGENTS.md)** — Agent coordination and specialized subagents

## License

MIT
