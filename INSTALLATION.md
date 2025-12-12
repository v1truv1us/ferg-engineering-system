# Installation Guide

This guide covers all installation methods for the Ferg Engineering System across Claude Code and OpenCode platforms.

## 🚀 Quick Start

| Platform | Recommended Method | Commands |
|----------|-------------------|----------|
| **Claude Code** | Marketplace | `/plugin marketplace add v1truv1us/ai-eng-marketplace`<br>`/plugin install ai-eng-system@v1truv1us` |
| **OpenCode** | GitHub Packages | `npm install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com` |

## 📋 Detailed Installation Methods

### Claude Code

#### Option 1: Marketplace (Recommended)
```bash
/plugin marketplace add v1truv1us/ai-eng-marketplace
/plugin install ai-eng-system@v1truv1us
```

**Benefits:**
- ✅ Automatic updates
- ✅ Centralized discovery
- ✅ Version management
- ✅ Team distribution support

#### Option 2: Direct Repository
```bash
claude plugin add https://github.com/v1truv1us/ai-eng-system
```

**Benefits:**
- ✅ Simple one-liner
- ✅ No marketplace setup
- ❌ Manual updates required

### OpenCode

#### Option 1: GitHub Packages (Recommended)
```bash
npm install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
```

**Benefits:**
- ✅ No npmjs.com account needed
- ✅ Integrated with GitHub authentication
- ✅ Private packages free for public repos
- ✅ Automatic provenance and security

#### Option 2: npm Package (Alternative)
```bash
npm install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
```

**Benefits:**
- ✅ Global installation
- ✅ Version management
- ✅ Easy updates with `npm update -g`
- ✅ Works across projects

#### Option 2: Shell Script
```bash
git clone https://github.com/v1truv1us/ai-eng-system
cd ai-eng-system
bun run install:global
```

**Benefits:**
- ✅ No npm required
- ✅ Full control over installation
- ✅ Can modify source
- ❌ Manual updates

#### Option 3: Project-Local
```bash
git clone https://github.com/v1truv1us/ai-eng-system
cd ai-eng-system
bun run install:local
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
| **GitHub Packages** | OpenCode | Low (1 command) | `npm update` | ✅ | Global |
| **Shell Script** | OpenCode | Medium (clone+run) | Re-run script | ❌ | Global |
| **Project-Local** | OpenCode | Medium (clone+run) | Re-run script | ❌ | Local |

## 📦 What Gets Installed

### Claude Code
- **Commands:** 15 namespaced slash commands (`/ai-eng/plan`, `/ai-eng/review`, `/ai-eng/optimize`, `/ai-eng/research`, etc.)
- **Agents:** 26 specialized agents
- **Skills:** 4 skill packages (devops, prompting, research, plugin-dev)
- **Location:** `~/.claude/plugins/ai-eng-system/`
- **Format:** Markdown files with YAML frontmatter

### OpenCode
- **Commands:** 15 namespaced commands (`/ai-eng/plan`, `/ai-eng/review`, etc.)
- **Agents:** 26 specialized agents (`ai-eng/architect-advisor`, etc.)
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
/plugin uninstall ai-eng-system@v1truv1us
/plugin install ai-eng-system@v1truv1us
```

**"Command not found" in OpenCode**
```bash
# Verify installation
ls ~/.config/opencode/command/ai-eng/
ls ~/.config/opencode/agent/ai-eng/

# Test a command
/ai-eng/plan "test installation"

# Reinstall if needed
npm install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
# or
./setup-global.sh
```

**Permission errors**
```bash
# For npm global installs
npm install -g @v1truv1us/ai-eng-system --unsafe-perm --registry https://npm.pkg.github.com

# For shell scripts
chmod +x setup*.sh
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
/plan "test installation"

# List plugins
/plugin list
```

**OpenCode:**
```bash
# Test a command
/ai-eng/plan "test installation"

# Use verification script
./verify-install.sh
```

## 🔄 Updates

### Claude Code (Marketplace)
```bash
/plugin update ai-eng-system@v1truv1us
```

### OpenCode (GitHub Packages)
```bash
npm update -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
```

### OpenCode (npm Alternative)
```bash
npm update -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
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
      claude plugin add https://github.com/v1truv1us/ai-eng-system
    else
      npm install -g @v1truv1us/ai-eng-system --registry https://npm.pkg.github.com
    fi
```

## 📚 Additional Resources

- [Main README](../README.md) - Overview and quick reference
- [Architecture Guide](../README.md#architecture-v20) - System design
- [Development Guide](../README.md#development) - Contributing and building
- [Plugin Documentation](PLUGIN.md) - Technical details
- [Agent Coordination](AGENTS.md) - Agent usage patterns