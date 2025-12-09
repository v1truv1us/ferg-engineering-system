# Skills Repository Context

**Hierarchy Level:** Reusable skill definitions
**Parent:** [../AGENTS.md](../AGENTS.md) — Agent coordination and skill registry
**Philosophy:** [../CLAUDE.md](../CLAUDE.md) — Compounding Engineering philosophy

Modular, reusable skill definitions that support the agents defined in the parent AGENTS.md.

## Project Overview
Modular skill definitions for DevOps and prompting capabilities.

## Directory Structure
- `devops/` - DevOps automation skills
  - `coolify-deploy/` - Coolify deployment best practices
  - `git-worktree/` - Git worktree workflows
- `prompting/` - Prompt enhancement techniques
  - `incentive-prompting/` - Research-backed prompting methods

## Code Style
- Each skill has dedicated `SKILL.md` with frontmatter
- Use YAML frontmatter for metadata (name, description)
- Keep skill descriptions concise and actionable
- Include practical examples and usage patterns

## Key Skills
**DevOps:**
- Coolify deployment automation
- Git worktree management

**Prompting:**
- Incentive-based prompting techniques
- Research-backed optimization methods

## Integration Notes
- Skills integrate with parent AGENTS.md coordination system
- Must maintain compatibility with command implementations
- Each skill should be self-contained and reusable