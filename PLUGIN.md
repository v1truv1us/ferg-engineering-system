# Ferg Engineering System - Plugin Installation & Usage

The Ferg Engineering System is available as plugins for both **Claude Code** and **OpenCode**, providing a unified engineering workflow across both platforms.

## Claude Code Installation

### Option 1: Install from Repository

```bash
# Add this repository as a plugin source
claude plugin add https://github.com/ferg-cod3s/ferg-engineering-system

# Or install directly via NPX
npx @ferg-cod3s/ferg-engineering-system
```

### Option 2: Local Development

Clone and link the repository:
```bash
git clone https://github.com/ferg-cod3s/ferg-engineering-system.git
cd ferg-engineering-system
claude plugin link .
```

### Verification

After installation, verify in Claude Code:
- Commands available: `/plan`, `/review`, `/seo`, `/work`, `/compound`, `/deploy`
- Agents: plan, build, review
- Subagents: frontend-reviewer, seo-specialist, architect-advisor

## OpenCode Installation

### Option 1: Project-Local (Recommended)

OpenCode automatically loads plugins from `.opencode/plugin/`. The scaffold includes the plugin structure:

```bash
# In your project using this scaffold
# The plugin is pre-configured in .opencode/plugin/
opencode  # Plugin loads automatically on startup
```

### Option 2: Global Plugin

Copy the plugin to your global OpenCode config:

```bash
cp -r .opencode/plugin ~/.config/opencode/plugin/ferg-engineering
```

### Verification

After startup, you'll see:
```
[ferg-engineering] Session started. Ferg Engineering System ready.
[ferg-engineering] Available agents: plan, review, build
[ferg-engineering] Available commands: plan, review, seo, work, compound, deploy
```

## Unified Workflow

Both Claude Code and OpenCode share the same command and agent definitions:

### Core Commands

**`/plan [feature description]`** (or `plan [feature]` in OpenCode)
- Creates detailed implementation plans
- Researches codebase for patterns
- Outputs acceptance criteria and technical approach
- Saves to `plans/[date]-[feature].md`

**`/review`**
- Multi-perspective code review
- Evaluates: code quality, performance, SEO, security, architecture
- Output: severity, location, issue, recommendation

**`/seo [page or site URL]`**
- SEO audit with prioritized recommendations
- Checks: meta tags, structured data, Core Web Vitals, accessibility, images
- Invokes seo-specialist agent

**`/work [plan or task]`**
- Executes plans with systematic tracking
- Creates feature branches and worktrees
- Breaks tasks into todos
- Commits, tests, and validates on each step

**`/compound [problem or solution]`**
- Documents solved problems for team knowledge
- Saves to `docs/solutions/[category]/[topic].md`
- Updates documentation index

**`/deploy`** (Claude) or `deploy` (OpenCode, subtask)
- Pre-deployment checklist for Coolify
- Validates tests, types, lint, build, env vars, migrations
- Provides deployment instructions and post-deploy checks

### Specialized Agents

**Frontend Reviewer** (subagent)
- Reviews frontend code for best practices
- Standards: small components, TypeScript strict, Tailwind, WCAG AA, performance

**SEO Specialist** (subagent)
- Technical and on-page SEO guidance
- Focus: schema, Core Web Vitals, accessibility, user experience signals

**Architect Advisor** (subagent)
- Technical strategy and design guidance
- Provides decision framework, trade-offs, risks, and implementation path

## Configuration

### Claude Code

Plugin metadata: `.claude-plugin/plugin.json`
Hooks: `.claude-plugin/hooks.json`

### OpenCode

Project commands: `.opencode/command/`
Project agents: `.opencode/agent/`
Plugin code: `.opencode/plugin/`

Global config: `~/.config/opencode/opencode.jsonc`

## File Structure

```
ferg-engineering-system/
├── .claude-plugin/
│   ├── plugin.json           # Claude plugin metadata
│   └── hooks.json            # Session lifecycle hooks
├── .opencode/
│   ├── command/              # OpenCode-specific commands
│   │   ├── plan.md
│   │   ├── review.md
│   │   ├── seo.md
│   │   └── deploy.md
│   ├── agent/                # OpenCode-specific agents
│   │   ├── frontend-reviewer.md
│   │   ├── seo-specialist.md
│   │   └── architect-advisor.md
│   └── plugin/               # OpenCode plugin implementation
│       ├── ferg-engineering.ts
│       ├── index.ts
│       └── package.json
├── .claude/
│   └── commands/             # Claude-specific commands (symlinked)
├── commands/                 # Shared workflow definitions
│   ├── workflows/
│   │   ├── plan.md
│   │   ├── review.md
│   │   ├── seo.md
│   │   ├── work.md
│   │   └── compound.md
│   └── utilities/
│       └── deploy.md
├── agents/                   # Shared agent definitions (currently empty)
└── skills/                   # Shared skills
    └── devops/
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
# Reinstall the plugin
claude plugin uninstall ferg-engineering
claude plugin add https://github.com/ferg-cod3s/ferg-engineering-system
```

### OpenCode

**Plugin not loading?**
```bash
# Check if .opencode/plugin/ exists
ls -la .opencode/plugin/

# Restart OpenCode
opencode --reload
```

**Missing dependencies?**
```bash
cd .opencode/plugin
npm install
```

## Contributing

Both Claude Code and OpenCode configurations are in this repository. When updating:

1. Test commands in Claude Code
2. Test commands in OpenCode
3. Update shared definitions in `/commands/` and `/agents/`
4. Update platform-specific configs (`.claude/` or `.opencode/`)
5. Commit with clear message about which platform is affected

## License

MIT License - See LICENSE file for details.
