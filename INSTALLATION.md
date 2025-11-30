# Installation Guide

This guide covers all installation methods for the Ferg Engineering System across Claude Code and OpenCode platforms.

## 🚀 Quick Start

| Platform | Recommended Method | Commands |
|----------|-------------------|----------|
| **Claude Code** | Marketplace | `/plugin marketplace add ferg-cod3s/ferg-marketplace`<br>`/plugin install ferg-engineering@ferg-cod3s` |
| **OpenCode** | npm Package | `npm install -g @ferg-cod3s/engineering-system` |

## 📋 Detailed Installation Methods

### Claude Code

#### Option 1: Marketplace (Recommended)
```bash
/plugin marketplace add ferg-cod3s/ferg-marketplace
/plugin install ferg-engineering@ferg-cod3s
```

**Benefits:**
- ✅ Automatic updates
- ✅ Centralized discovery
- ✅ Version management
- ✅ Team distribution support

#### Option 2: Direct Repository
```bash
claude plugin add https://github.com/ferg-cod3s/ferg-engineering-system
```

**Benefits:**
- ✅ Simple one-liner
- ✅ No marketplace setup
- ❌ Manual updates required

### OpenCode

#### Option 1: npm Package (Recommended)
```bash
npm install -g @ferg-cod3s/engineering-system
```

**Benefits:**
- ✅ Global installation
- ✅ Version management
- ✅ Easy updates with `npm update -g`
- ✅ Works across projects

#### Option 2: Shell Script
```bash
git clone https://github.com/ferg-cod3s/ferg-engineering-system
cd ferg-engineering-system
./setup-global.sh
```

**Benefits:**
- ✅ No npm required
- ✅ Full control over installation
- ✅ Can modify source
- ❌ Manual updates

#### Option 3: Project-Local
```bash
git clone https://github.com/ferg-cod3s/ferg-engineering-system
cd ferg-engineering-system
./setup.sh
```

**Benefits:**
- ✅ Project-specific installation
- ✅ No global changes
- ✅ Version per project
- ❌ Must repeat for each project

## 🔧 Installation Comparison

| Method | Platform | Setup Complexity | Update Process | Version Management | Global/Local |
|--------|----------|------------------|----------------|-------------------|---------------|
| **Marketplace** | Claude Code | Medium (2 steps) | Automatic | ✅ | Global |
| **Direct Repo** | Claude Code | Low (1 step) | Manual | ❌ | Global |
| **npm Package** | OpenCode | Low (1 command) | `npm update` | ✅ | Global |
| **Shell Script** | OpenCode | Medium (clone+run) | Re-run script | ❌ | Global |
| **Project-Local** | OpenCode | Medium (clone+run) | Re-run script | ❌ | Local |

## 📦 What Gets Installed

### Claude Code
- **Commands:** 8 slash commands (`/plan`, `/review`, `/optimize`, etc.)
- **Location:** `~/.claude/plugins/ferg-engineering-system/`
- **Format:** Markdown files with YAML frontmatter

### OpenCode
- **Commands:** 8 namespaced commands (`/ferg/plan`, `/ferg/review`, etc.)
- **Agents:** 4 specialized agents (`ferg/architect-advisor`, etc.)
- **Skills:** 2 skill packages (prompting, devops)
- **Location:** `~/.config/opencode/` (global) or `.opencode/` (local)

## 🛠️ Troubleshooting

### Common Issues

**"Plugin not found" in Claude Code**
```bash
# Check plugin is installed
/plugin list

# Reinstall if needed
/plugin uninstall ferg-engineering@ferg-cod3s
/plugin install ferg-engineering@ferg-cod3s
```

**"Command not found" in OpenCode**
```bash
# Verify installation
ls ~/.config/opencode/command/ferg/
ls ~/.config/opencode/agent/ferg/

# Reinstall if needed
npm run install:global
# or
./setup-global.sh
```

**Permission errors**
```bash
# For npm global installs
npm install -g @ferg-cod3s/engineering-system --unsafe-perm

# For shell scripts
chmod +x setup*.sh
```

**Bun not found**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Or use npm instead
npm install -g @ferg-cod3s/engineering-system
```

### Verification

After installation, verify everything works:

**Claude Code:**
```bash
# Test a command
/plan "test installation"

# List plugins
/plugin list
```

**OpenCode:**
```bash
# Test a command
/ferg/plan "test installation"

# Use verification script
./verify-install.sh
```

## 🔄 Updates

### Claude Code (Marketplace)
```bash
/plugin update ferg-engineering@ferg-cod3s
```

### OpenCode (npm)
```bash
npm update -g @ferg-cod3s/engineering-system
```

### Manual Updates
```bash
git pull origin main
./setup-global.sh  # or ./setup.sh for local
```

## 🏢 Enterprise Distribution

### Team Setup

**Claude Code:**
1. Add marketplace to team config
2. Require plugin installation in team guidelines
3. Use `/plugin update` for maintenance

**OpenCode:**
1. Add npm install to onboarding scripts
2. Include in development environment setup
3. Use `npm update` in CI/CD for updates

### CI/CD Integration

```bash
# .github/workflows/setup.yml
- name: Install Ferg Engineering
  run: |
    if command -v claude &> /dev/null; then
      claude plugin add https://github.com/ferg-cod3s/ferg-engineering-system
    else
      npm install -g @ferg-cod3s/engineering-system
    fi
```

## 📚 Additional Resources

- [Main README](../README.md) - Overview and quick reference
- [Architecture Guide](../README.md#architecture-v20) - System design
- [Development Guide](../README.md#development) - Contributing and building
- [Plugin Documentation](PLUGIN.md) - Technical details
- [Agent Coordination](AGENTS.md) - Agent usage patterns