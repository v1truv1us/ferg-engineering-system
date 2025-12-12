# Ferg Engineering Agents

Context: UnFergettable-Designs (client web dev) and ferg-cod3s (personal projects).

**See also:** [CLAUDE.md](./CLAUDE.md) — Project philosophy and core guidelines that guide all agent behavior.

This document defines the **agents and tools** available in this system. For the guiding **philosophy**, refer to CLAUDE.md.

## Agent Coordination

| Agent | Mode | Purpose |
|-------|------|---------|
| plan | read-only | Research + planning (no edits) |
| build | edit | Implements changes |
| review | read-only | Code review |

## Specialized Agents (24 Total)

### Architecture & Planning
- `architect-advisor` - System architecture decisions and trade-off analysis
- `backend-architect` - Backend system design and scalability
- `infrastructure-builder` - Cloud infrastructure design and IaC

### Development & Coding
- `frontend-reviewer` - Frontend code review (React, TypeScript, accessibility)
- `full-stack-developer` - End-to-end application development
- `api-builder-enhanced` - REST/GraphQL API development with documentation
- `database-optimizer` - Database performance and query optimization
- `java-pro` - Java development with modern features and patterns

### Quality & Testing
- `code-reviewer` - Comprehensive code quality assessment
- `test-generator` - Automated test suite generation
- `security-scanner` - Security vulnerability detection and fixes
- `performance-engineer` - Application performance optimization

### DevOps & Deployment
- `deployment-engineer` - CI/CD pipeline design and deployment automation
- `monitoring-expert` - Observability, alerting, and system monitoring
- `cost-optimizer` - Cloud cost optimization and resource efficiency

### AI & Machine Learning
- `ai-engineer` - AI integration and LLM application development
- `ml-engineer` - Machine learning model development and deployment

### Content & SEO
- `seo-specialist` - Technical and on-page SEO expertise
- `prompt-optimizer` - Prompt enhancement using research-backed techniques

### Plugin Development
- `agent-creator` - AI-assisted agent generation
- `command-creator` - AI-assisted command generation
- `skill-creator` - AI-assisted skill creation
- `tool-creator` - AI-assisted custom tool creation
- `plugin-validator` - Plugin structure validation and best practices

**All agents enhanced with research-backed prompting techniques** (+45-115% quality improvement)

## Incentive-Based Prompting Integration

All subagents are enhanced with research-backed techniques:

1. **Expert Persona Assignment** — Detailed role with years of experience and notable companies (Kong et al., 2023: 24% → 84% accuracy)

2. **Step-by-Step Reasoning** — "Take a deep breath and analyze systematically" (Yang et al., 2023: 34% → 80% accuracy)

3. **Stakes Language** — "This is critical", "direct impact on production" (Bsharat et al., 2023: +45% quality)

4. **Challenge Framing** — "I bet you can't find the perfect balance" (Li et al., 2023: +115% on hard tasks)

5. **Self-Evaluation** — Confidence ratings and uncertainty identification

## Usage Examples

### Using prompt-optimizer
```
Ask the prompt-optimizer to enhance: "Help me fix this slow database query"
```

### Using recursive-init
```
Run recursive-init on a monorepo: /recursive-init --dry-run --estimate-cost
```

### Using enhanced agents
```
Use the architect-advisor to evaluate: Should we use microservices or a monolith?
```

## Skills Available

| Skill | Location | Purpose |
|-------|----------|---------|
| coolify-deploy | skills/devops/ | Coolify deployment best practices |
| git-worktree | skills/devops/ | Git worktree workflow |
| incentive-prompting | skills/prompting/ | Research-backed prompting techniques |
| comprehensive-research | skills/research/ | Multi-phase research orchestration |
| plugin-dev | skills/plugin-dev/ | Plugin development knowledge base |

## Commands Available

| Command | Description | Agent Mode |
|---------|-------------|------------|
| /plan | Create detailed implementation plans | read-only |
| /work | Execute plans with quality gates and tracking | build |
| /review | Multi-perspective code review (26 agents) | read-only |
| /research | Multi-phase research orchestration | read-only |
| /seo | SEO audit with Core Web Vitals | read-only |
| /deploy | Pre-deployment checklist for Coolify | build |
| /optimize | Prompt enhancement (+45% quality) | build |
| /recursive-init | Initialize AGENTS.md across directories | read-only |
| /context | Context management and retrieval | read-only |
| /create-plugin | Guided plugin creation workflow | build |
| /create-agent | AI-assisted agent generation | build |
| /create-command | AI-assisted command generation | build |
| /create-skill | AI-assisted skill creation | build |
| /create-tool | AI-assisted tool creation | build |
| /compound | Document solved problems for team | build |

### Using /research

The research command orchestrates multiple agents for thorough investigation:

```bash
# Basic research
/research "How does authentication work in this codebase?"

# Research with specific scope
/research "Analyze payment processing" --scope=codebase --depth=deep

# Research from ticket
/research --ticket="docs/tickets/AUTH-123.md"
```

**Research Phases:**
1. **Discovery** (Parallel): codebase-locator, research-locator, codebase-pattern-finder
2. **Analysis** (Sequential): codebase-analyzer, research-analyzer
3. **Synthesis**: Consolidated findings with evidence and recommendations

## Directory Context Index

| Directory | Hierarchy Level | Purpose | Key Files |
|-----------|-----------------|---------|-----------|
| `src/` | Core Implementation | TypeScript source code | `agents/`, `cli/`, `context/`, `execution/`, `research/` |
| `tests/` | Quality Assurance | Comprehensive test suite | `unit.test.ts`, `integration.test.ts`, `performance.test.ts` |
| `docs/` | Knowledge Base | Documentation and research | `PHASE-3-USAGE.md`, `research-command-guide.md` |
| `.claude/` | Command Implementation | Claude Code command definitions | `commands/*.md` |
| `content/` | Agent Documentation | Agent & command documentation | `agents/`, `commands/` |
| `skills/` | Skill Definitions | Modular skill definitions | `devops/`, `prompting/`, `research/` |
| `scripts/` | Build Utilities | Build & installation utilities | `install.js` |

## Build Commands

```bash
# Main build process
bun run build

# Development with watch mode  
bun run build:watch

# Clean build artifacts
bun run clean

# Validate build
bun run validate

# Installation
bun run install:global  # Global OpenCode install
bun run install:local    # Local OpenCode install
```

## Research References

- Bsharat et al. (2023) — "Principled Instructions Are All You Need" — MBZUAI
- Yang et al. (2023) — "Large Language Models as Optimizers" (OPRO) — Google DeepMind  
- Li et al. (2023) — Challenge framing research — ICLR 2024
- Kong et al. (2023) — Persona prompting research
