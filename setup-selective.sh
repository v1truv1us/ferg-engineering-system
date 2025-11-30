#!/bin/bash
# Selective install script for ferg-engineering-system
# Only installs NEW components, preserves existing ones
# Uses ferg/ namespace for all components

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
GLOBAL_DIR="$HOME/.config/opencode"

echo "🔧 Ferg Engineering System - Selective Global Install"
echo "======================================================="
echo ""

# Build first if bun available
if command -v bun &> /dev/null; then
  echo "📦 Building from content/..."
  cd "$SCRIPT_DIR" && bun run build.ts
  echo ""
else
  echo "⚠️  Bun not found. Using pre-built dist/..."
  if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Error: dist/ not found and bun not available to build."
    echo "   Install bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
  fi
fi

# Create namespaced directories
mkdir -p "$GLOBAL_DIR/agent/ferg"
mkdir -p "$GLOBAL_DIR/command/ferg"
mkdir -p "$GLOBAL_DIR/skills/prompting/incentive-prompting"
mkdir -p "$GLOBAL_DIR/skills/devops"

# Install NEW agents only (won't overwrite existing)
echo "📦 Installing new ferg/ agents..."

for agent in "$DIST_DIR/.opencode/agent/ferg/"*.md; do
  if [ -f "$agent" ]; then
    name="$(basename "$agent")"
    if [ -f "$GLOBAL_DIR/agent/ferg/$name" ]; then
      echo "   ⏭️  Skipping ferg/$name (already exists)"
    else
      cp "$agent" "$GLOBAL_DIR/agent/ferg/"
      echo "   ✅ Installed ferg/$name"
    fi
  fi
done

# Install NEW commands only
echo ""
echo "📦 Installing new ferg/ commands..."

for cmd in "$DIST_DIR/.opencode/command/ferg/"*.md; do
  if [ -f "$cmd" ]; then
    name="$(basename "$cmd")"
    if [ -f "$GLOBAL_DIR/command/ferg/$name" ]; then
      echo "   ⏭️  Skipping /ferg/$name (already exists)"
    else
      cp "$cmd" "$GLOBAL_DIR/command/ferg/"
      echo "   ✅ Installed /ferg/$name"
    fi
  fi
done

# Install skills (safe to update)
echo ""
echo "📦 Installing skills..."

if [ -d "$DIST_DIR/skills" ]; then
  cp -r "$DIST_DIR/skills"/* "$GLOBAL_DIR/skills/" 2>/dev/null || true
  echo "   ✅ Skills updated"
fi

# Summary
echo ""
echo "======================================================="
echo "✅ Selective install complete!"
echo ""
echo "New components available (ferg/ namespace):"
echo "  Agents:   ferg/architect-advisor, ferg/frontend-reviewer, ferg/seo-specialist, ferg/prompt-optimizer"
echo "  Commands: /ferg/plan, /ferg/review, /ferg/optimize, /ferg/seo, etc."
echo "  Skills:   incentive-prompting, devops"
echo ""
echo "Your existing non-ferg commands were NOT modified."
echo ""
echo "To use the prompt optimizer:"
echo "  opencode"
echo "  > /ferg/optimize 'your prompt here'"
echo ""
