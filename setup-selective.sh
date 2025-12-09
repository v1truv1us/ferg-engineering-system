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
mkdir -p "$GLOBAL_DIR/agent/ai-eng"
mkdir -p "$GLOBAL_DIR/command/ai-eng"
mkdir -p "$GLOBAL_DIR/skills/prompting/incentive-prompting"
mkdir -p "$GLOBAL_DIR/skills/devops"

# Install NEW agents only (won't overwrite existing)
echo "📦 Installing new ai-eng/ agents..."

for agent in "$DIST_DIR/.opencode/agent/ai-eng/"*.md; do
  if [ -f "$agent" ]; then
    name="$(basename "$agent")"
    if [ -f "$GLOBAL_DIR/agent/ai-eng/$name" ]; then
      echo "   ⏭️  Skipping ai-eng/$name (already exists)"
    else
      cp "$agent" "$GLOBAL_DIR/agent/ai-eng/"
      echo "   ✅ Installed ferg/$name"
    fi
  fi
done

# Install NEW commands only
echo ""
echo "📦 Installing new ai-eng/ commands..."

for cmd in "$DIST_DIR/.opencode/command/ai-eng/"*.md; do
  if [ -f "$cmd" ]; then
    name="$(basename "$cmd")"
    if [ -f "$GLOBAL_DIR/command/ai-eng/$name" ]; then
      echo "   ⏭️  Skipping /ai-eng/$name (already exists)"
    else
      cp "$cmd" "$GLOBAL_DIR/command/ai-eng/"
      echo "   ✅ Installed /ai-eng/$name"
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
echo "New components available (ai-eng/ namespace):"
echo "  Agents:   ai-eng/architect-advisor, ai-eng/frontend-reviewer, ai-eng/seo-specialist, ai-eng/prompt-optimizer"
echo "  Commands: /ai-eng/plan, /ai-eng/review, /ai-eng/optimize, /ai-eng/seo, etc."
echo "  Skills:   incentive-prompting, devops"
echo ""
echo "Your existing non-ai-eng commands were NOT modified."
echo ""
echo "To use the prompt optimizer:"
echo "  opencode"
echo "  > /ai-eng/optimize 'your prompt here'"
echo ""
