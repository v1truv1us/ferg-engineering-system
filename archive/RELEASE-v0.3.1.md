# Release v0.3.1

**Date**: 2025-12-12
**Version**: 0.3.1
**Status**: Patch Release

## 🎯 Overview

The ai-eng-system v0.3.1 is a patch release that adds the docs-writer agent to complement the documentation workflow. This agent specializes in writing individual documentation pages with specific formatting rules and style guidelines, working alongside the documentation-specialist for comprehensive documentation creation.

## ✨ New Features

### docs-writer Agent
- **Specialized Documentation Writer**: Expert technical documentation writer with 15+ years experience
- **Precise Formatting Rules**:
  - Titles: 1-3 words only
  - Descriptions: 5-10 words, no "The" prefix, no title repetition
  - Text chunks: Maximum 2 sentences each
  - Section separation: Exactly 3 dashes (---)
  - Section titles: Imperative mood, first letter capitalized only
- **Code Formatting**: Removes trailing semicolons and unnecessary commas in JS/TS examples
- **Workflow Integration**: Complements documentation-specialist for individual page writing
- **Commit Standards**: Uses "docs:" prefix for all documentation commits

## 🏗️ Architecture

### Documentation Workflow
```
Analysis (documentation-specialist) → Writing (docs-writer) → Review → Publish
```

### Agent Configuration
- **Mode**: subagent
- **Model**: sonnet
- **Tools**: read, write, edit, grep, glob, list
- **Permissions**: bash: deny (documentation-only focus)

## 📊 Performance

- **Documentation Generation**: < 30s for typical documentation pages
- **Code Formatting**: Automatic JS/TS code cleanup
- **Integration**: Seamless workflow with existing documentation-specialist

## 🔧 Technical Improvements

- **Agent Ecosystem**: Expanded to 25 total agents (24 specialized + docs-writer)
- **Documentation Standards**: Consistent formatting across all generated docs
- **Code Quality**: Enhanced JS/TS code examples with proper formatting

## 🧪 Testing

- **Agent Validation**: Verified docs-writer triggers correctly for documentation requests
- **Formatting Rules**: Tested all formatting constraints and style guidelines
- **Integration Testing**: Confirmed compatibility with documentation-specialist workflow

## 📚 Documentation

- **Agent Documentation**: Complete docs-writer agent specification in `content/agents/docs-writer.md`
- **Usage Examples**: Comprehensive triggering examples and use cases
- **Integration Guide**: How docs-writer complements documentation-specialist

## 🚀 Migration Guide

### For Users
1. **Update**: Run `git pull` to get the latest version
2. **Install**: Run `bun install` to update dependencies
3. **Global Install**: Run `bun run install:global` to update your OpenCode commands

### For Developers
- The new docs-writer agent is available in `content/agents/docs-writer.md`
- Agent count updated to 25 in all documentation references
- Documentation workflow now supports both analysis and writing phases

## 🔗 Links

- **Repository**: [GitHub](https://github.com/v1truv1us/ai-eng-system)
- **Issues**: [Issue Tracker](https://github.com/v1truv1us/ai-eng-system/issues)

---

**Note**: This is a patch release focused on documentation capabilities. The core execution engine and research orchestration systems remain unchanged.</content>
<parameter name="filePath">RELEASE-v0.3.1.md