# AI Engineering System

Advanced development tools with context engineering, research orchestration, and 29 specialized agents for Claude Code & OpenCode.

## 🚀 Quick Start

### Claude Code (Recommended)
```bash
/plugin marketplace add v1truv1us/ai-eng-system
/plugin install ai-eng-system@ai-eng-marketplace
```

### OpenCode
```bash
bun scripts/install.js  # Global install (default)
# or
bun scripts/install.js --local  # Local install
```

## 📋 What's Included

### Commands (15 total)
- `/ai-eng/plan` - Create detailed implementation plans
- `/ai-eng/review` - Multi-perspective code review (29 agents)
- `/ai-eng/seo` - SEO audits with Core Web Vitals
- `/ai-eng/work` - Execute plans with quality gates
- `/ai-eng/optimize` - Prompt enhancement (+45% quality)
- `/ai-eng/deploy` - Pre-deployment checklists
- `/ai-eng/compound` - Document solved problems
- `/ai-eng/recursive-init` - Initialize AGENTS.md across directories
- `/ai-eng/create-plugin` - AI-assisted plugin creation
- `/ai-eng/create-agent` - AI-assisted agent generation
- `/ai-eng/create-command` - AI-assisted command generation
- `/ai-eng/create-skill` - AI-assisted skill creation
- `/ai-eng/create-tool` - AI-assisted custom tool creation
- `/ai-eng/research` - Multi-phase research orchestration
- `/ai-eng/context` - Context management and retrieval

### Agents (29 total)
- **Architecture & Planning**: `architect-advisor`, `backend-architect`, `infrastructure-builder`
- **Development & Coding**: `frontend-reviewer`, `full-stack-developer`, `api-builder-enhanced`, `database-optimizer`, `java-pro`
- **Quality & Testing**: `code-reviewer`, `test-generator`, `security-scanner`, `performance-engineer`
- **DevOps & Deployment**: `deployment-engineer`, `monitoring-expert`, `cost-optimizer`
- **AI & Machine Learning**: `ai-engineer`, `ml-engineer`
- **Content & SEO**: `seo-specialist`, `prompt-optimizer`
- **Plugin Development**: `agent-creator`, `command-creator`, `skill-creator`, `tool-creator`, `plugin-validator`

### Skills (4 packs)
- `devops` - Coolify deployment, Git worktree workflows
- `prompting` - Research-backed incentive prompting techniques
- `research` - Comprehensive multi-phase research orchestration
- `plugin-dev` - Plugin development knowledge base and references

## 🏗️ Architecture

This repo follows Anthropic's official Claude Code marketplace pattern:

- **Marketplace root**: `.claude-plugin/marketplace.json` (only file at repo root)
- **Embedded plugin**: `plugins/ai-eng-system/` with standard plugin layout
- **Build system**: Transforms canonical `content/` sources into platform-specific outputs
- **OpenCode support**: Pre-built distributions in `dist/.opencode/`

## 🔧 Development

### Prerequisites
- Bun >= 1.0.0
- Node.js >= 18 (for compatibility)

### Build & Test
```bash
bun run build        # Build all platforms
bun run build:watch  # Watch mode
bun run validate     # Validate content without building
bun test             # Run test suite
```

### Repository Structure
```
├── content/          # Canonical markdown sources
│   ├── commands/     # Command definitions
│   └── agents/       # Agent definitions
├── skills/           # Skill packs
├── plugins/          # Embedded Claude plugin
├── dist/             # Built outputs (committed)
├── .claude-plugin/   # Marketplace manifest
└── .opencode/        # OpenCode config
```

## 📦 Distribution

### Claude Code Marketplace
- **Source**: `https://github.com/v1truv1us/ai-eng-system`
- **Marketplace**: `v1truv1us/ai-eng-marketplace`
- **Plugin**: `ai-eng-system`

### OpenCode
- **Global**: `~/.config/opencode/` (default)
- **Local**: `./.opencode/` (project-specific)
- **Namespace**: `ai-eng/`

## ✅ Validation Status
- Marketplace manifest: ✅ Valid
- Embedded plugin: ✅ Valid
- Build system: ✅ Working
- Tests: ✅ Passing (21/21)

## 📚 Documentation
- [Installation Guide](INSTALLATION.md) - Detailed setup instructions
- [Agent Coordination](AGENTS.md) - Agent usage patterns and coordination
- [Plugin Documentation](PLUGIN.md) - Technical plugin details
- [Research Guide](docs/research-command-guide.md) - Research orchestration usage

---

**Built with research-backed prompting techniques** (+45-115% quality improvement)