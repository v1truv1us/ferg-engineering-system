# Ferg Engineering System

A compounding engineering system for UnFergettable-Designs and v1truv1us. Provides shared agents, commands, and skills for **Claude Code** and **OpenCode** (SST/OpenCode agentic platform).

## 🚀 Easy Installation

### For Claude Code

**Option 1: Marketplace (Recommended)**
```bash
/plugin marketplace add v1truv1us/ai-eng-marketplace
/plugin install ai-eng-system@v1truv1us
```

**Option 2: Direct Repository**
```bash
claude plugin add https://github.com/v1truv1us/ai-eng-system
```

### For OpenCode (Global - Recommended)

**Option 1: Shell Script (Local Build - Recommended)**
```bash
git clone https://github.com/v1truv1us/ai-eng-system
cd ai-eng-system
bun run build  # Build the system
bun run install:global  # Install to ~/.config/opencode with ai-eng/ namespace
```

**Option 2: Bun Package (Requires GitHub Packages Access)**
```bash
# Configure bun for GitHub Packages registry
echo '[install.scopes]
"@v1truv1us" = { url = "https://npm.pkg.github.com" }' >> ~/.bunfig.toml

# Authenticate with GitHub (requires GitHub CLI with packages scope)
gh auth login

# Install globally
bun install -g @v1truv1us/ai-eng-system
```

**Option 3: npm Package (Requires GitHub Packages Access)**
```bash
# Configure npm for GitHub Packages
npm config set @v1truv1us:registry https://npm.pkg.github.com

# Install globally (requires GitHub authentication with packages scope)
npm install -g @v1truv1us/ai-eng-system
```

### For OpenCode (Project-Local)
```bash
git clone https://github.com/v1truv1us/ai-eng-system
cd ai-eng-system
./setup.sh  # Creates symlinks in current project
```

> **No Bun required for installation** - pre-built `dist/` is included. Bun only needed if you want to modify the system.

## Troubleshooting

### Authentication Issues with GitHub Packages

If you encounter `403 Forbidden` errors when installing from GitHub Packages:

1. **Token Scope Requirements:**
   Your GitHub token needs `read:packages` permission. Standard GitHub CLI tokens may not include this scope.

2. **Repository Access:**
   You need read access to the `v1truv1us/ai-eng-system` repository.

3. **Recommended Solution: Use Local Installation**
   The shell script method (Option 1) works reliably and doesn't require special token permissions:
   ```bash
   git clone https://github.com/v1truv1us/ai-eng-system
   cd ai-eng-system
   bun run install:global
   ```

4. **For GitHub Packages Access:**
   If you need to use the package registry, ensure your GitHub token has the `read:packages` scope. You may need to create a Personal Access Token with the appropriate permissions.

### Registry Configuration

Bun automatically uses the configuration from `~/.bunfig.toml`. For npm, the registry is configured per-scope.

## 📋 Quick Reference

| Platform | Installation | Commands | Agents | Example Usage |
|----------|-------------|----------|--------|---------------|
| **Claude Code** | `/plugin marketplace add v1truv1us/ai-eng-marketplace`<br>`/plugin install ai-eng-system@v1truv1us` | `/ai-eng/plan`, `/ai-eng/review`, `/ai-eng/optimize`, `/ai-eng/seo`, `/ai-eng/deploy`, `/ai-eng/compound`, `/ai-eng/recursive-init`, `/ai-eng/work`, `/ai-eng/create-plugin`, `/ai-eng/create-agent`, `/ai-eng/create-command`, `/ai-eng/create-skill`, `/ai-eng/create-tool`, `/ai-eng/research`, `/ai-eng/context` | N/A | `/ai-eng/plan "Add user authentication"` or `/ai-eng/create-plugin "database migration tool"` |
| **OpenCode** | `git clone https://github.com/v1truv1us/ai-eng-system`<br>`cd ai-eng-system && bun run install:global` | `/ai-eng/plan`, `/ai-eng/review`, `/ai-eng/optimize`, `/ai-eng/seo`, `/ai-eng/deploy`, `/ai-eng/compound`, `/ai-eng/recursive-init`, `/ai-eng/work`, `/ai-eng/create-plugin`, `/ai-eng/create-agent`, `/ai-eng/create-command`, `/ai-eng/create-skill`, `/ai-eng/create-tool`, `/ai-eng/research`, `/ai-eng/context` | `ai-eng/architect-advisor`, `ai-eng/frontend-reviewer`, `ai-eng/seo-specialist`, `ai-eng/prompt-optimizer`, `ai-eng/agent-creator`, `ai-eng/command-creator`, `ai-eng/skill-creator`, `ai-eng/tool-creator`, `ai-eng/plugin-validator`, `ai-eng/code-reviewer`, `ai-eng/database-optimizer`, `ai-eng/api-builder-enhanced`, `ai-eng/full-stack-developer`, `ai-eng/deployment-engineer`, `ai-eng/ml-engineer`, `ai-eng/security-scanner`, `ai-eng/performance-engineer`, `ai-eng/test-generator`, `ai-eng/monitoring-expert`, `ai-eng/cost-optimizer`, `ai-eng/infrastructure-builder`, `ai-eng/backend-architect`, `ai-eng/java-pro`, `ai-eng/ai-engineer` | `/ai-eng/optimize 'Fix this slow query'` or `Use ai-eng/architect-advisor to evaluate...` or `/ai-eng/create-agent "code reviewer"` |

## Architecture (v2.0)

This system uses a **single source of truth** architecture with automated build:

```
content/                    # ✏️ EDIT HERE - canonical source
├── commands/              # Command definitions (YAML frontmatter)
└── agents/                # Agent definitions (YAML frontmatter)

skills/                     # Skills with progressive disclosure
└── plugin-dev/            # Plugin development knowledge base

build.ts                   # Bun script: transforms content → platform formats

dist/                      # 🚫 GENERATED - never edit directly
├── .claude-plugin/        # Claude Code output (YAML frontmatter)
├── .opencode/             # OpenCode output (table format)
└── skills/                # Shared skills (copied)
```

**Key Benefits:**
- ✅ Single edit point for all changes
- ✅ Guaranteed consistency across platforms
- ✅ Automated transformation via `bun run build`
- ✅ Easy to add future platforms

## ✅ Installation Verification

**Latest Installation:** Successfully installed globally using the local build method.

**What was installed:**
- ✅ **15 Commands** in `~/.config/opencode/command/ai-eng/`
- ✅ **24 Agents** in `~/.config/opencode/agent/ai-eng/`
- ✅ **Skills** in `~/.config/opencode/skills/`

**Available Commands:**
- `/ai-eng/plan`, `/ai-eng/review`, `/ai-eng/optimize`, `/ai-eng/seo`, `/ai-eng/deploy`
- `/ai-eng/compound`, `/ai-eng/recursive-init`, `/ai-eng/work`, `/ai-eng/research`, `/ai-eng/context`
- `/ai-eng/create-plugin`, `/ai-eng/create-agent`, `/ai-eng/create-command`, `/ai-eng/create-skill`, `/ai-eng/create-tool`

**Available Agents:**
- `ai-eng/architect-advisor`, `ai-eng/frontend-reviewer`, `ai-eng/seo-specialist`, `ai-eng/prompt-optimizer`
- `ai-eng/code-reviewer`, `ai-eng/database-optimizer`, `ai-eng/api-builder-enhanced`, `ai-eng/full-stack-developer`
- And 18 more specialized agents...

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) - Fast JavaScript runtime
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Installation

**Build from source:**
```bash
git clone https://github.com/v1truv1us/ai-eng-system
cd ai-eng-system
bun run build
```

**Claude Code:**
```bash
claude plugin add https://github.com/v1truv1us/ai-eng-system
```

**OpenCode (global install):**
```bash
bun run install:global  # Installs to ~/.config/opencode with ai-eng/ namespace
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
| `/plan` | Create detailed implementation plans with atomic task decomposition |
| `/work` | Execute plans with automated task tracking and quality gates |
| `/research` | Perform multi-phase research with parallel discovery and synthesis |
| `/review` | Multi-perspective code review (quality, performance, SEO, security, architecture) |
| `/seo` | SEO audits with Core Web Vitals and accessibility checks |
| `/compound` | Document solved problems for team knowledge |
| `/deploy` | Pre-deployment checklist and Coolify deployment |
| `/optimize` | Transform prompts using research-backed incentive techniques (+45% quality) |
| `/recursive-init` | Recursively initialize AGENTS.md in all subdirectories |
| `/create-plugin` | Guided end-to-end plugin creation workflow |
| `/create-agent` | AI-assisted agent generation for both platforms |
| `/create-command` | AI-assisted command generation for both platforms |
| `/create-skill` | AI-assisted skill creation with progressive disclosure |
| `/create-tool` | AI-assisted custom tool creation for OpenCode |

## Agents Available (OpenCode)

| Agent | Description |
|-------|-------------|
| `ai-eng/architect-advisor` | System architecture decisions with trade-off analysis |
| `ai-eng/frontend-reviewer` | Frontend code review specialist (React, TypeScript, a11y) |
| `ai-eng/seo-specialist` | Technical & on-page SEO expert |
| `ai-eng/prompt-optimizer` | Prompt enhancement using research-backed techniques |
| `ai-eng/agent-creator` | AI-assisted agent generation for both platforms |
| `ai-eng/command-creator` | AI-assisted command generation for both platforms |
| `ai-eng/skill-creator` | AI-assisted skill creation with progressive disclosure |
| `ai-eng/tool-creator` | AI-assisted custom tool creation for OpenCode |
| `ai-eng/plugin-validator` | Validates plugin structure and best practices |

## Plugin Development System

The ai-eng-system now includes a comprehensive plugin development system that helps you create extensions for both Claude Code and OpenCode platforms.

### Plugin-Dev Commands

| Command | Purpose |
|---------|---------|
| `/create-plugin` | Full 8-phase guided workflow for creating complete plugins |
| `/create-agent` | Quick agent creation with AI assistance |
| `/create-command` | Quick command creation with AI assistance |
| `/create-skill` | Quick skill creation with progressive disclosure |
| `/create-tool` | Quick custom tool creation for OpenCode |

### Plugin-Dev Agents

| Agent | Purpose |
|-------|---------|
| `agent-creator` | Generates properly formatted agents for both platforms |
| `command-creator` | Generates properly formatted commands for both platforms |
| `skill-creator` | Creates skills with progressive disclosure |
| `tool-creator` | Creates TypeScript custom tools for OpenCode |
| `plugin-validator` | Validates plugin structure and best practices |

### Plugin-Dev Knowledge Base

The `plugin-dev` skill provides comprehensive knowledge about:
- Claude Code plugin structure (commands, agents, skills, hooks, MCP)
- OpenCode extension system (commands, agents, skills, custom tools)
- Cross-platform development patterns
- Best practices and validation

### Example Usage

```bash
# Create a complete plugin
/create-plugin "database migration tool"

# Quick agent creation
/create-agent "code reviewer that checks for security issues"

# Quick command creation
/create-command "deploy to staging with health checks"

# Quick skill creation
/create-skill "PostgreSQL optimization patterns"

# Quick tool creation (OpenCode only)
/create-tool "database query executor with connection pooling"
```

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
