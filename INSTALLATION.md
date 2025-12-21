# Installation Guide

This guide covers installation methods for the AI Engineering System across Claude Code and OpenCode platforms.

## 🚀 Quick Start

| Platform | Recommended Method | Commands |
|----------|-------------------|----------|
| **Claude Code** | Marketplace | `/plugin marketplace add v1truv1us/ai-eng-system`<br>`/plugin install ai-eng-system@ai-eng-marketplace` |
| **OpenCode** | Shell Script | `bun scripts/install.js` |

## 📋 Detailed Installation Methods

### Claude Code

#### Option 1: Marketplace (Recommended)
```bash
/plugin marketplace add v1truv1us/ai-eng-system
/plugin install ai-eng-system@ai-eng-marketplace
```

**Benefits:**
- ✅ Automatic updates
- ✅ Centralized discovery
- ✅ Version management
- ✅ Team distribution support

#### Option 2: Direct Plugin Install (Testing)
```bash
/plugin install ./plugins/ai-eng-system
```

**Benefits:**
- ✅ Simple one-liner for development
- ✅ Test embedded plugin directly
- ❌ Manual updates required

### OpenCode

#### Option 1: Shell Script (Recommended)
```bash
# Clone the repository
git clone https://github.com/v1truv1us/ai-eng-system
cd ai-eng-system

# Global install (recommended)
bun scripts/install.js

# Or local install
bun scripts/install.js --local
```

**Benefits:**
- ✅ No npm required
- ✅ Full control over installation
- ✅ Can modify source if needed
- ✅ Works offline after initial clone

#### Option 2: GitHub Packages (Alternative)
```bash
npm install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
```

**Benefits:**
- ✅ Integrated with GitHub authentication
- ✅ Automatic provenance and security
- ✅ Version management
- ❌ Requires npm setup

## 🔧 Installation Comparison

| Method | Platform | Setup Complexity | Update Process | Version Management | Global/Local |
|--------|----------|------------------|----------------|-------------------|---------------|
| **Marketplace** | Claude Code | Medium (2 steps) | Automatic | ✅ | Global |
| **Direct Plugin** | Claude Code | Low (1 step) | Manual | ❌ | Global |
| **Shell Script** | OpenCode | Medium (clone+run) | Re-run script | ❌ | Global/Local |
| **GitHub Packages** | OpenCode | Low (1 command) | `npm update` | ✅ | Global |

## 📦 What Gets Installed

### Claude Code
- **Commands:** 15 namespaced slash commands (`/ai-eng/plan`, `/ai-eng/review`, `/ai-eng/optimize`, `/ai-eng/research`, etc.)
- **Agents:** 29 specialized agents
- **Skills:** 4 skill packages (devops, prompting, research, plugin-dev)
- **Location:** `~/.claude/plugins/ai-eng-system/`
- **Format:** Markdown files with YAML frontmatter

### OpenCode
- **Commands:** 15 namespaced commands (`/ai-eng/plan`, `/ai-eng/review`, etc.)
- **Agents:** 29 specialized agents (`ai-eng/architect-advisor`, etc.)
- **Skills:** 4 skill packages (devops, prompting, research, plugin-dev)
- **Location:** `~/.config/opencode/` (global) or `.opencode/` (local)
- **Namespace:** `ai-eng/`

## 🛠️ Troubleshooting

### Common Issues

**"Plugin not found" in Claude Code**
```bash
# Check plugin is installed
/plugin list

# Reinstall if needed
/plugin uninstall ai-eng-system
/plugin install ai-eng-system@ai-eng-marketplace
```

**"Command not found" in OpenCode**
```bash
# Verify installation
ls ~/.config/opencode/command/ai-eng/
ls ~/.config/opencode/agent/ai-eng/

# Test a command
/ai-eng/plan "test installation"

# Reinstall if needed
cd /path/to/ai-eng-system
bun scripts/install.js
```

**Permission errors**
```bash
# For npm global installs
npm install -g @v1truv1us/ai-eng-system --unsafe-perm --registry https://npm.pkg.github.com

# For shell scripts
chmod +x scripts/install.js
```

**Bun not found**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Or use npm instead
npm install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
```

### Verification

After installation, verify everything works:

**Claude Code:**
```bash
# Test a command
/ai-eng/plan "test installation"

# List plugins
/plugin list
```

**OpenCode:**
```bash
# Test a command
/ai-eng/plan "test installation"
```

## 🔄 Updates

### Claude Code (Marketplace)
```bash
/plugin update ai-eng-system@ai-eng-marketplace
```

### OpenCode (Shell Script)
```bash
cd /path/to/ai-eng-system
git pull origin main
bun scripts/install.js
```

### OpenCode (GitHub Packages)
```bash
npm update -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
```

## 🏢 Enterprise Distribution

### Team Setup

**Claude Code:**
1. Add marketplace to team config
2. Require plugin installation in team guidelines
3. Use `/plugin update` for maintenance

**OpenCode:**
1. Add shell script to onboarding scripts
2. Include in development environment setup
3. Use git pull + reinstall in CI/CD for updates

### CI/CD Integration

```bash
# .github/workflows/setup.yml
- name: Install AI Engineering System
  run: |
    if command -v claude &> /dev/null; then
      claude plugin marketplace add v1truv1us/ai-eng-system
      claude plugin install ai-eng-system@ai-eng-marketplace
    else
      git clone https://github.com/v1truv1us/ai-eng-system /tmp/ai-eng-system
      cd /tmp/ai-eng-system
      bun scripts/install.js
    fi
```

## 📚 Additional Resources

- [Main README](../README.md) - Overview and quick reference
- [Architecture Guide](../README.md#architecture) - System design
- [Development Guide](../README.md#development) - Contributing and building
- [Plugin Documentation](PLUGIN.md) - Technical plugin details
- [Agent Coordination](AGENTS.md) - Agent usage patterns