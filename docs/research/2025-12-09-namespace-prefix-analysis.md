---
date: 2025-12-09
researcher: Assistant
topic: namespace-prefix-analysis
tags: [research, namespace, prefix, standardization, ai-eng, ferg]
status: complete
confidence: high
agents_used: [general, explore]
---

## Synopsis

The ferg-engineering-system codebase has inconsistent namespace prefixes (`ferg/` vs `ai-eng/`) across installation scripts and documentation, leading to potential user confusion and installation conflicts when multiple methods are used.

## Summary

- **Primary Issue**: Two different prefixes used inconsistently across the codebase
- **Root Cause**: No single source of truth for namespace configuration
- **Impact**: Users may have duplicate agents/commands installed under different prefixes
- **Solution**: Standardize on one prefix and update all references

## Detailed Findings

### Codebase Analysis

#### Build System (`build.ts`)
- **Lines 245-246**: Hardcodes `ai-eng` prefix for OpenCode output directories
- **No configuration variable**: Prefix is embedded in string literals
- **Impact**: Build always produces `ai-eng/` namespace regardless of other settings

#### Installation Scripts
- **`scripts/install.js` (lines 50-51)**: Uses `ai-eng` prefix for global installation
- **`setup-global.sh` (line 16)**: Uses `ai-eng` prefix in documentation and installation
- **`setup-selective.sh` (lines 31-32)**: Uses `ferg` prefix - **INCONSISTENT**
- **`verify-install.sh` (lines 28, 46)**: Checks for `ferg` prefix - **INCONSISTENT**

#### Documentation
- **`skills/plugin-dev/SKILL.md`**: Multiple references to `ferg/` prefix (lines 33-35, 245-248, 340-354)
- **`INSTALLATION.md` (line 106-107)**: Documents `ferg/` namespace
- **`README.md`**: Mixed references depending on context

#### Plugin Configuration
- **`.claude-plugin/plugin.json`**: No prefix field - Claude Code uses unprefixed commands
- **OpenCode output**: Uses `ai-eng/` prefix from build system
- **No overlap prevention**: Different platforms use different mechanisms

### External Research

#### Platform Differences
- **Claude Code**: Plugin system with JSON manifest, no prefix concept
- **OpenCode**: Directory-based with namespace prefixes for isolation
- **No standardization**: Each platform handles namespacing differently

#### Installation Methods
- **npm/bun**: Uses `ai-eng` prefix (from package name)
- **Shell scripts**: Mixed usage depending on script
- **Marketplace**: Uses `ferg-engineering` name but installs with `ai-eng` prefix

### Architecture Insights

```
Namespace Usage Matrix:
┌─────────────────┬─────────────┬─────────────┐
│ Component       │ ai-eng/     │ ferg/       │
├─────────────────┼─────────────┼─────────────┤
│ build.ts        │ ✅          │ ❌          │
│ install.js      │ ✅          │ ❌          │
│ setup-global.sh │ ✅          │ ❌          │
│ setup-selective │ ❌          │ ✅          │
│ verify-install  │ ❌          │ ✅          │
│ docs/examples   │ ❌          │ ✅          │
└─────────────────┴─────────────┴─────────────┘
```

**Key Insight**: The build system and primary installation methods use `ai-eng/`, while some secondary scripts and documentation use `ferg/`.

## Code References

- `build.ts:245-246` - Hardcoded ai-eng prefix in OpenCode output
- `scripts/install.js:50-51` - ai-eng prefix in installation directories
- `setup-selective.sh:31-32` - ferg prefix (inconsistent)
- `verify-install.sh:28,46` - ferg prefix checks (inconsistent)
- `skills/plugin-dev/SKILL.md:33-35,245-248,340-354` - ferg prefix documentation
- `.claude-plugin/plugin.json:1-39` - No prefix configuration for Claude

## Architecture Insights

### Current State
```
ferg-engineering-system/
├── build.ts                    # → dist/.opencode/command/ai-eng/
├── scripts/install.js          # → ~/.config/opencode/command/ai-eng/
├── setup-global.sh             # → ~/.config/opencode/command/ai-eng/
├── setup-selective.sh          # → ~/.config/opencode/command/ferg/  ← INCONSISTENT
├── verify-install.sh           # Checks ~/.config/opencode/command/ferg/  ← INCONSISTENT
└── docs/                       # References ferg/ namespace  ← INCONSISTENT
```

### Recommended State
```
ferg-engineering-system/
├── build.ts                    # NAMESPACE_PREFIX = "ai-eng"
├── scripts/install.js          # Uses NAMESPACE_PREFIX
├── setup-global.sh             # Uses NAMESPACE_PREFIX
├── setup-selective.sh          # Uses NAMESPACE_PREFIX
├── verify-install.sh           # Checks NAMESPACE_PREFIX
└── docs/                       # References NAMESPACE_PREFIX
```

## Recommendations

### Immediate Actions

1. **Choose canonical prefix**: `ai-eng` (aligns with npm package name and build system)
2. **Add configuration variable**: `NAMESPACE_PREFIX` in `build.ts`
3. **Update inconsistent files**: `setup-selective.sh`, `verify-install.sh`, documentation
4. **Test migration path**: Ensure existing users can migrate safely

### Long-term Considerations

1. **Configurable prefix**: Allow users to choose namespace at build/install time
2. **Platform abstraction**: Hide platform differences behind unified configuration
3. **Automated validation**: Build-time checks for prefix consistency

## Risks & Limitations

- **Breaking changes**: Users with `ferg/` installations may need migration
- **Documentation drift**: Multiple docs need synchronization
- **Platform complexity**: Claude vs OpenCode have different namespacing approaches

## Open Questions

- [ ] Should prefix be configurable via environment variable?
- [ ] Is `ai-eng` the right canonical choice, or should it be `ferg`?
- [ ] How to handle existing installations during transition?
- [ ] Should platform-specific prefixes be allowed?