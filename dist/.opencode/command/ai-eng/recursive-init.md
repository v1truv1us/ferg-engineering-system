| description | agent |
|---|---|
| Recursively initialize AGENTS.md in all important subdirectories with smart detection | build |

# Recursive Init Command

## Expert Context

You are a senior DevOps architect and codebase analyst with 12+ years of experience at companies like Vercel, Stripe, and Netflix. You specialize in monorepo architecture, developer experience optimization, and creating intelligent tooling that maximizes AI agent effectiveness.

## Stakes

This recursive initialization is critical. Each AGENTS.md file created will guide AI coding agents for months or years across potentially thousands of interactions. Incomplete context files cause repeated confusion, wasted tokens, and suboptimal suggestions. I'll tip you $200 for comprehensive initialization that maximizes long-term value.

## Approach

Take a deep breath. Execute this multi-phase operation systematically.

---

## Usage

```
/recursive-init [path] [options]
```

## Phase 1: File System Scan (No LLM Cost)

First, gather intelligence before any analysis:

```bash
# Detect project types and score directories
find . -maxdepth 3 -name "package.json" -o -name "go.mod" -o -name "Cargo.toml" -o -name "pyproject.toml" -o -name "pom.xml" 2>/dev/null | grep -v node_modules | head -30

# Identify monorepo patterns
ls -d */packages 2>/dev/null || ls -d */apps 2>/dev/null || ls -d */services 2>/dev/null || echo "No standard monorepo structure detected"
```

### Directory Scoring Heuristic

| Indicator | Score |
|-----------|-------|
| package.json, go.mod, Cargo.toml, pyproject.toml, pom.xml | +10 |
| src/, lib/, components/ directory | +5 |
| .cursorrules, .github/copilot-instructions.md | +3 |
| >10 source files (.ts, .js, .py, .go, .rs) | +3 |
| README.md or docs/ present | +2 |

Only analyze directories scoring > 5 (configurable via --min-score).

## Phase 2: Systematic Execution

### Step 1: Root Analysis
Run standard init at project root. Create comprehensive overview AGENTS.md.

### Step 2: Directory Discovery  
Scan and score all subdirectories. Report findings before proceeding.

### Step 3: Batch Processing
Process directories in groups of 3. For EACH directory:
1. cd into the directory
2. Analyze local code structure, framework, and patterns
3. Create localized AGENTS.md (~20 lines) containing:
   - **Hierarchy Metadata** (new requirement per Anthropic docs):
     - `**Hierarchy Level:**` — Role in system (e.g., "Frontend components", "API services", "Build utilities")
     - `**Parent:**` — Link to parent AGENTS.md with path (e.g., `[../AGENTS.md](../AGENTS.md)`)
     - `**Philosophy:**` — Link to CLAUDE.md (e.g., `[CLAUDE.md](../../CLAUDE.md)`)
   - Build/lint/test commands (especially single test execution)
   - Code style guidelines (imports, formatting, types, naming)
   - Framework-specific patterns and conventions
   - Integration points with other packages
4. Include existing .cursorrules or .github/copilot-instructions.md content

### Step 4: Context Linking in AGENTS.md
Update root AGENTS.md with:
1. **Directory Context Index** — Table with links to all created AGENTS.md files
2. **Hierarchy Reference** — Explain the linking structure to CLAUDE.md
3. **Integration Summary** — How subdirectories connect to parent agents and philosophy

Example section:
```markdown
## Directory Context Index

| Directory | Hierarchy Level | Purpose | Key Files |
|-----------|-----------------|---------|-----------|
| `packages/api` | API Services | REST API backend | `src/routes/`, `src/models/` |
| `packages/web` | Frontend Components | React UI | `src/components/`, `src/pages/` |

Each subdirectory's AGENTS.md includes hierarchy metadata linking to:
- **Parent:** This AGENTS.md for agent coordination
- **Philosophy:** CLAUDE.md for project guiding principles
```

### Step 5: Update/Create Root CLAUDE.md
Ensure root CLAUDE.md is properly linked to AGENTS.md structure:

1. **If CLAUDE.md exists:** Add or update an "Agent Contexts" section listing all AGENTS.md files
2. **If CLAUDE.md doesn't exist:** Create a new CLAUDE.md with:
   - Project philosophy and guidelines
   - "Agent Coordination" section linking to root AGENTS.md
   - "Agent Contexts" section listing subdirectory AGENTS.md files

Example CLAUDE.md structure:
```markdown
# Project Philosophy

[Project mission and guiding principles...]

## Agent Coordination

See **[AGENTS.md](./AGENTS.md)** for:
- Available agents and their modes
- Specialized subagents and capabilities
- Commands and skills available

This CLAUDE.md defines the **philosophy**. AGENTS.md documents the **agents and tools**.

## Agent Contexts

Specialized agent contexts are defined in subdirectories:

| Directory | AGENTS.md | Purpose |
|-----------|-----------|---------|
| `.claude/` | [.claude/AGENTS.md](./.claude/AGENTS.md) | Command implementation details |
| `skills/` | [skills/AGENTS.md](./skills/AGENTS.md) | Reusable skill definitions |
| `packages/api` | [packages/api/AGENTS.md](./packages/api/AGENTS.md) | API services context |
| `packages/web` | [packages/web/AGENTS.md](./packages/web/AGENTS.md) | Frontend context |

Each subdirectory maintains its own AGENTS.md with hierarchy metadata linking back to this CLAUDE.md philosophy.
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--depth N` | Maximum recursion depth | 2 |
| `--dry-run` | Preview without changes | false |
| `--preserve` | Keep existing AGENTS.md | false |
| `--batch-size N` | Directories per batch | 3 |
| `--min-score N` | Minimum importance score | 5 |
| `--include <pattern>` | Additional patterns to include | - |
| `--exclude <pattern>` | Patterns to skip | node_modules,.git,dist |
| `--estimate-cost` | Show cost estimate first | false |

## Skip Patterns

node_modules, .git, dist, build, __pycache__, .venv, target, coverage, .next, .nuxt

## Output Format

```
🔍 Scanning directory structure...
📊 Found X directories above threshold (score > 5)

📁 Root (/)
   ✓ AGENTS.md created (monorepo overview, 8 packages detected)

📦 Batch 1/N: [packages/api, packages/web, packages/shared]
   ✓ packages/api: AGENTS.md (Express REST API, TypeScript, Prisma)
   ✓ packages/web: AGENTS.md (Next.js 14, App Router, Tailwind)
   ✓ packages/shared: AGENTS.md (TypeScript utilities, Zod schemas)

📋 Root AGENTS.md updated with directory index

✅ Summary: 1 root + X directories initialized
   💰 Estimated cost: ~$X.XX
   🕐 Time saved: ~X minutes vs manual setup
```

## Quality Verification

Before completing, verify:
- [ ] Each AGENTS.md is ~20 lines, focused, and actionable
- [ ] Build/test commands are correct and tested where possible
- [ ] Cross-package dependencies are noted
- [ ] No duplicate or conflicting information
- [ ] Root index accurately reflects all initialized directories

### Hierarchy Linking Verification (Required per Anthropic Docs)

**For each created AGENTS.md file:**
- [ ] **Hierarchy Level** field present and describes role (e.g., "Backend services", "UI components")
- [ ] **Parent** field links to appropriate parent AGENTS.md with correct relative path
- [ ] **Philosophy** field links to CLAUDE.md with correct relative path (uses `@` import syntax if in .claude/)
- [ ] Links are validated as correct paths (no broken references)

**For Root AGENTS.md:**
- [ ] Directory Context Index table showing all subdirectories with links
- [ ] Explains hierarchy linking structure for downstream agents

**For Root CLAUDE.md (Bidirectional Linking):**
- [ ] "Agent Coordination" section links to AGENTS.md
- [ ] "Agent Contexts" section lists all subdirectory AGENTS.md files with links
- [ ] Each listed AGENTS.md is validated and accessible
- [ ] CLAUDE.md clearly explains the relationship: philosophy (CLAUDE.md) → agents (AGENTS.md) → subdirectories
- [ ] All links use correct relative paths

Rate your confidence in the completeness of this initialization (0-1) and note any directories that may need manual review.

## Cost Considerations

| Scenario | Directories | Estimated Cost | Time Saved |
|----------|-------------|----------------|------------|
| Standard /init | 1 | $0.01-0.02 | 2-3 min |
| Small monorepo | 3-5 | $0.06-0.15 | 10-15 min |
| Medium monorepo | 5-10 | $0.10-0.40 | 20-30 min |
| Large monorepo | 10-20 | $0.20-0.80 | 45-60 min |

## Research-Backed Enhancements

This command uses incentive-based prompting techniques:
- **Expert Persona**: DevOps architect framing (Kong et al., +60% accuracy)
- **Stakes Language**: Critical importance framing (Bsharat et al., +45% quality)
- **Step-by-Step**: Systematic phase execution (Yang et al., +46% accuracy)
- **Self-Evaluation**: Confidence rating for quality assurance