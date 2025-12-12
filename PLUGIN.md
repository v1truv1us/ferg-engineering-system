# Ferg Engineering System - Plugin Installation & Usage

The Ferg Engineering System is available as plugins for both **Claude Code** and **OpenCode**, providing a unified engineering workflow across both platforms.

## Claude Code Installation

### Option 1: Marketplace (Recommended)

```bash
/plugin marketplace add v1truv1us/ai-eng-marketplace
/plugin install ai-eng-system@v1truv1us
```

### Option 2: Direct Repository

```bash
# Install directly from repository
claude plugin add https://github.com/v1truv1us/ai-eng-system
```

### Option 3: Local Development

Clone and link the repository:
```bash
git clone https://github.com/v1truv1us/ai-eng-system.git
cd ai-eng-system
claude plugin link .
```

### Verification

After installation, verify in Claude Code:
- **15 Commands available**: `/plan`, `/review`, `/seo`, `/work`, `/compound`, `/deploy`, `/optimize`, `/recursive-init`, `/research`, `/context`, `/create-plugin`, `/create-agent`, `/create-command`, `/create-skill`, `/create-tool`
- **26 Agents available**: All specialized agents for development, testing, deployment, and architecture
- **Skills**: DevOps, prompting, and research skills

## OpenCode Installation

### Option 1: Global Installation (Recommended)

Install commands, agents, and skills globally for use across all OpenCode projects:

```bash
# Install via npm from GitHub Packages
npm install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com

# Or install via bun
bun install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
```

### Option 2: Local Build Installation

Build from source and install globally:

```bash
# Clone and build
git clone https://github.com/v1truv1us/ai-eng-system.git
cd ai-eng-system
bun run install:global
```

### Option 3: Project-Local Installation

Install locally within a specific project:

```bash
# Clone into project
git clone https://github.com/v1truv1us/ai-eng-system.git .ai-eng-system
cd .ai-eng-system
bun run install:local
```

### Setup Verification

After installation, verify in OpenCode:

```
/ai-eng/plan "test installation"
```

Expected output shows all available commands and agents:

```
Available commands (15): /ai-eng/plan, /ai-eng/review, /ai-eng/seo, /ai-eng/work,
/ai-eng/compound, /ai-eng/deploy, /ai-eng/optimize, /ai-eng/recursive-init,
/ai-eng/research, /ai-eng/context, /ai-eng/create-plugin, /ai-eng/create-agent,
/ai-eng/create-command, /ai-eng/create-skill, /ai-eng/create-tool

Available agents (24): ai-eng/architect-advisor, ai-eng/frontend-reviewer,
ai-eng/seo-specialist, ai-eng/prompt-optimizer, ai-eng/agent-creator,
ai-eng/command-creator, ai-eng/skill-creator, ai-eng/tool-creator,
ai-eng/plugin-validator, ai-eng/code-reviewer, ai-eng/database-optimizer,
ai-eng/api-builder-enhanced, ai-eng/full-stack-developer, ai-eng/deployment-engineer,
ai-eng/ml-engineer, ai-eng/security-scanner, ai-eng/performance-engineer,
ai-eng/test-generator, ai-eng/monitoring-expert, ai-eng/cost-optimizer,
ai-eng/infrastructure-builder, ai-eng/backend-architect, ai-eng/java-pro,
ai-eng/ai-engineer
```

**If components are missing**, the system will show installation errors. Re-run the installation command for your chosen method.
  ./setup-global.sh
```

The verification checks:
- Project-local locations first (`.opencode/command/`, `.opencode/agent/`, `skills/`)
- Falls back to global locations (`~/.config/opencode/`)
- Ensures all required commands, agents, and skills are available

## Unified Workflow

Both Claude Code and OpenCode share the same command and agent definitions:

### Core Commands

**`/ai-eng/plan [feature description]`**
- Creates detailed implementation plans with atomic task decomposition
- Researches codebase for patterns and existing implementations
- Outputs acceptance criteria, risk assessment, and technical approach
- Saves to `plans/[date]-[feature].md`

**`/ai-eng/work [plan or task]`**
- Executes plans with systematic tracking and quality gates
- Creates feature branches and worktrees for large changes
- Breaks tasks into todos with progress tracking
- Runs 6 quality gates: Lint → Types → Tests → Build → Integration → Deploy

**`/ai-eng/review`**
- Multi-perspective code review with 24 specialized agents
- Evaluates: code quality, performance, SEO, security, architecture, testing
- Output: severity, location, issue, recommendation with fix suggestions

**`/ai-eng/research [query]`**
- Multi-phase research orchestration with parallel discovery
- Searches codebase, documentation, and external sources
- Provides evidence-based findings with file:line references
- Supports scope filtering and depth control

**`/ai-eng/seo [page or site URL]`**
- Comprehensive SEO audit with Core Web Vitals analysis
- Checks: meta tags, structured data, accessibility, performance, mobile-friendliness
- Invokes seo-specialist agent with prioritized recommendations

**`/ai-eng/deploy`**
- Pre-deployment checklist for Coolify and other platforms
- Validates tests, types, lint, build, env vars, migrations
- Provides deployment instructions and post-deploy health checks

**`/ai-eng/optimize [prompt]`**
- Enhances prompts using research-backed incentive techniques
- Applies expert personas, step-by-step reasoning, and stakes language
- +45% quality improvement based on MBZUAI, DeepMind, ICLR 2024 research

### Specialized Agents (24 Total)

**Architecture & Planning**
- `ai-eng/architect-advisor` - System architecture decisions and trade-off analysis
- `ai-eng/backend-architect` - Backend system design and scalability
- `ai-eng/infrastructure-builder` - Cloud infrastructure design and IaC

**Development & Coding**
- `ai-eng/frontend-reviewer` - Frontend code review (React, TypeScript, accessibility)
- `ai-eng/full-stack-developer` - End-to-end application development
- `ai-eng/api-builder-enhanced` - REST/GraphQL API development with documentation
- `ai-eng/database-optimizer` - Database performance and query optimization
- `ai-eng/java-pro` - Java development with modern features and patterns

**Quality & Testing**
- `ai-eng/code-reviewer` - Comprehensive code quality assessment
- `ai-eng/test-generator` - Automated test suite generation
- `ai-eng/security-scanner` - Security vulnerability detection and fixes
- `ai-eng/performance-engineer` - Application performance optimization

**DevOps & Deployment**
- `ai-eng/deployment-engineer` - CI/CD pipeline design and deployment automation
- `ai-eng/monitoring-expert` - Observability, alerting, and system monitoring
- `ai-eng/cost-optimizer` - Cloud cost optimization and resource efficiency

**AI & Machine Learning**
- `ai-eng/ai-engineer` - AI integration and LLM application development
- `ai-eng/ml-engineer` - Machine learning model development and deployment

**Content & SEO**
- `ai-eng/seo-specialist` - Technical and on-page SEO expertise
- `ai-eng/prompt-optimizer` - Prompt enhancement using research-backed techniques

**Plugin Development**
- `ai-eng/agent-creator` - AI-assisted agent generation
- `ai-eng/command-creator` - AI-assisted command generation
- `ai-eng/skill-creator` - AI-assisted skill creation
- `ai-eng/tool-creator` - AI-assisted custom tool creation
- `ai-eng/plugin-validator` - Plugin structure validation and best practices

## Configuration

### Claude Code

- **Plugin Location**: `~/.claude/plugins/ai-eng-system/`
- **Commands**: Available as slash commands (`/plan`, `/review`, etc.)
- **Agents**: Available through agent system
- **Skills**: Available through skill system

### OpenCode

- **Global Installation**: `~/.config/opencode/` (ai-eng/ namespace)
  - Commands: `~/.config/opencode/command/ai-eng/`
  - Agents: `~/.config/opencode/agent/ai-eng/`
  - Skills: `~/.config/opencode/skills/`
- **Project-Local**: `.opencode/` directory in project root
- **Configuration**: `~/.config/opencode/opencode.jsonc`

## File Structure

```
ai-eng-system/
├── content/                  # ✏️ Single source of truth for commands & agents
│   ├── commands/             # Command definitions (15 total)
│   └── agents/               # Agent definitions (24 total)
├── skills/                   # Reusable skills (DevOps, prompting, research)
│   ├── devops/
│   │   ├── coolify-deploy/
│   │   └── git-worktree/
│   ├── prompting/
│   │   └── incentive-prompting/
│   └── research/
│       └── comprehensive-research/
├── dist/                     # 🚫 Auto-generated platform outputs
│   ├── .claude-plugin/       # Claude Code format
│   │   ├── commands/         # 15 commands
│   │   ├── agents/           # 24 agents
│   │   ├── skills/           # All skills
│   │   ├── plugin.json       # Plugin metadata
│   │   └── marketplace.json  # Marketplace configuration
│   └── .opencode/            # OpenCode format (ai-eng/ namespace)
│       ├── command/ai-eng/   # 15 commands
│       └── agent/ai-eng/     # 24 agents
├── scripts/                  # Build and installation utilities
│   ├── install.js            # Global/local installation
│   └── build.ts              # Build system
├── package.json              # Package configuration with OIDC publishing
├── bun.lock                  # Bun lockfile
├── build.ts                  # Build script (transforms content → dist)
├── setup-global.sh           # Global OpenCode installation
├── setup.sh                  # Project-local Claude setup
└── docs/                     # Comprehensive documentation
    ├── INSTALLATION.md       # Installation guide
    ├── PHASE-3-USAGE.md      # Research system guide
    └── research-command-guide.md # Research command reference
```

## Compounding Engineering Philosophy

Each unit of work should make future work easier:

1. **Plan** → Research + planning (no edits)
2. **Build** → Implement changes (edit permission)
3. **Review** → Code review (read-only)
4. **Compound** → Document learnings for team

Both Claude Code and OpenCode enforce this through:
- Specialized agents with focused prompts
- Permission-based role enforcement
- Shared workflow patterns
- Centralized documentation

## Troubleshooting

### Claude Code

**Plugin not appearing in command list?**
```bash
# Check plugin status
/plugin list

# Reinstall the plugin
/plugin uninstall ai-eng-system@v1truv1us
/plugin install ai-eng-system@v1truv1us
```

**Marketplace not available?**
```bash
# Add marketplace manually
/plugin marketplace add v1truv1us/ai-eng-marketplace

# Then install
/plugin install ai-eng-system@v1truv1us
```

### OpenCode

**Plugin not loading?**
```bash
# Check installation
ls -la ~/.config/opencode/command/ai-eng/
ls -la ~/.config/opencode/agent/ai-eng/

# Reinstall globally
npm install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
```

**Command not found?**
```bash
# Test with namespace
/ai-eng/plan "test command"

# Check if namespace is required
# Commands are available as /ai-eng/[command]
```

**Permission issues with npm?**
```bash
# Use bun instead
bun install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com

# Or use local build
git clone https://github.com/v1truv1us/ai-eng-system.git
cd ai-eng-system
bun run install:global
```

## Contributing

The system uses a single-source-of-truth architecture. When updating:

1. **Edit source files** in `content/commands/` and `content/agents/`
2. **Run build** with `bun run build` to generate platform outputs
3. **Test both platforms** - Claude Code and OpenCode
4. **Update documentation** if needed
5. **Commit changes** including both source and generated files

### Development Workflow

```bash
# Make changes to source
edit content/commands/plan.md
edit content/agents/architect-advisor.md

# Build for both platforms
bun run build

# Test installations
bun run install:global  # Test OpenCode
# Test Claude Code manually

# Commit everything
git add .
git commit -m "feat: enhance plan command with new features"
```

## License

MIT License - See LICENSE file for details.
