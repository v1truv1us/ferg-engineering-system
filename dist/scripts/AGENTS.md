# Scripts Context

**Hierarchy Level:** Build automation and deployment utilities
**Parent:** [../AGENTS.md](../AGENTS.md) — Agent coordination
**Philosophy:** [../CLAUDE.md](../CLAUDE.md) — Compounding Engineering philosophy

Build scripts and installation utilities that support the agent infrastructure defined in AGENTS.md.

## Project Overview
Build and installation utilities for the Ferg Engineering System.

## Technology Stack
- **Runtime**: Bun (ES modules)
- **Language**: JavaScript/TypeScript
- **Shebang**: `#!/usr/bin/env bun`

## Build Commands
```bash
# Main build process
bun run build

# Watch mode for development
bun run build:watch

# Clean build artifacts
bun run clean

# Validate build
bun run validate

# Installation scripts
bun scripts/install.js --global  # Global installation
bun scripts/install.js --local    # Local installation
```

## Code Style
- Use ES modules (`import`/`export`)
- Follow Bun best practices
- Include proper shebang for executable scripts
- Use JSDoc comments for documentation

## Key Files
- `install.js` - Main installation script (global/local support)
- `build.ts` - TypeScript build configuration (in root)

## Integration Notes
- Scripts integrate with package.json build pipeline
- Must support both global and local OpenCode installation
- Handle dependency resolution and file copying