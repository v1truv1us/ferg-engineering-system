# Ferg Engineering Agents

Context: UnFergettable-Designs (client web dev) and ferg-cod3s (personal projects).

## Agent Coordination

| Agent | Mode | Purpose |
|-------|------|---------|
| plan | read-only | Research + planning (no edits) |
| build | edit | Implements changes |
| review | read-only | Code review |

## Specialized Subagents

| Subagent | Description | Prompting Enhancements |
|----------|-------------|------------------------|
| frontend-reviewer | Frontend code review specialist | Expert persona (12+ years at Vercel/Netlify), stakes language, structured output |
| seo-specialist | Technical & on-page SEO expert | Expert persona (10+ years at HubSpot/Moz), comprehensive audit framework |
| architect-advisor | System architecture decisions | Expert persona (15+ years at Netflix/Stripe), decision framework, trade-off analysis |
| prompt-optimizer | **NEW** Prompt enhancement specialist | Applies research-backed techniques from MBZUAI, DeepMind, ICLR 2024 |

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
| incentive-prompting | skills/prompting/ | **NEW** Research-backed prompting techniques |

## Directory Context Index

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `.opencode/` | OpenCode plugin integration | `plugin/ferg-engineering.ts` |
| `.claude/` | Claude Code command definitions | `commands/*.md` |
| `content/` | Agent & command documentation | `agents/`, `commands/` |
| `skills/` | Modular skill definitions | `devops/`, `prompting/` |
| `scripts/` | Build & installation utilities | `install.js` |

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
