#!/bin/bash
# Setup script for ferg-engineering-system
# Builds from content/ and creates symlinks from dist/ for project-local use.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"

echo "🔧 Setting up Ferg Engineering System..."
echo ""

# Build first
if command -v bun &> /dev/null; then
  echo "📦 Building from content/..."
  cd "$SCRIPT_DIR" && bun run build.ts
  echo ""
else
  echo "⚠️  Bun not found. Checking for pre-built dist/..."
  if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Error: dist/ not found and bun not available to build."
    echo "   Install bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
  fi
fi

# Claude Code setup
echo "🔗 Setting up Claude Code..."
mkdir -p .claude/commands

for cmd in "$DIST_DIR/.claude-plugin/commands/"*.md; do
  if [ -f "$cmd" ]; then
    name="$(basename "$cmd")"
    ln -sf "$cmd" ".claude/commands/$name"
    echo "   ✓ $name"
  fi
done

# Copy plugin.json for Claude
if [ -f "$DIST_DIR/.claude-plugin/plugin.json" ]; then
  mkdir -p .claude-plugin
  cp "$DIST_DIR/.claude-plugin/plugin.json" .claude-plugin/
  echo "   ✓ plugin.json"
fi

# OpenCode setup  
echo ""
echo "🔗 Setting up OpenCode..."
mkdir -p .opencode/command/ferg .opencode/agent/ferg .opencode/plugin

# Link commands
for cmd in "$DIST_DIR/.opencode/command/ferg/"*.md; do
  if [ -f "$cmd" ]; then
    name="$(basename "$cmd")"
    ln -sf "$cmd" ".opencode/command/ferg/$name"
    echo "   ✓ command: $name"
  fi
done

# Link agents
for agent in "$DIST_DIR/.opencode/agent/ferg/"*.md; do
  if [ -f "$agent" ]; then
    name="$(basename "$agent")"
    ln -sf "$agent" ".opencode/agent/ferg/$name"
    echo "   ✓ agent: $name"
  fi
done

# Copy plugin
if [ -f "$DIST_DIR/.opencode/plugin/ferg-engineering.ts" ]; then
  cp "$DIST_DIR/.opencode/plugin/ferg-engineering.ts" .opencode/plugin/
  echo "   ✓ plugin script"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Usage:"
echo "  Claude Code: Commands available as /plan, /review, etc."
echo "  OpenCode:    Commands available as /ferg/plan, /ferg/review, etc."
