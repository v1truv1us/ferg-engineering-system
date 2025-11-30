#!/bin/bash
# Setup script for Ferg Engineering System - Namespaced Global Installation
# Builds from content/ and installs to ~/.config/opencode under ferg/ namespace

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
GLOBAL_DIR="${HOME}/.config/opencode"

echo "🔧 Ferg Engineering System - Namespaced Global Install"
echo "========================================================"
echo ""
echo "All components will be installed under the 'ferg/' namespace:"
echo "  Commands: /ferg/plan, /ferg/review, /ferg/optimize, etc."
echo "  Agents:   ferg/architect-advisor, ferg/prompt-optimizer, etc."
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

# Create namespaced directories
mkdir -p "$GLOBAL_DIR/agent/ferg"
mkdir -p "$GLOBAL_DIR/command/ferg"
mkdir -p "$GLOBAL_DIR/skills/prompting/incentive-prompting"
mkdir -p "$GLOBAL_DIR/skills/devops"

# Install ferg agents (namespaced)
echo "📦 Installing ferg/ agents..."
for agent in "$DIST_DIR/.opencode/agent/ferg"/*.md; do
  if [ -f "$agent" ]; then
    cp "$agent" "$GLOBAL_DIR/agent/ferg/"
    echo "   ✅ ferg/$(basename "$agent" .md)"
  fi
done

# Install ferg commands (namespaced)
echo ""
echo "📦 Installing ferg/ commands..."
for cmd in "$DIST_DIR/.opencode/command/ferg"/*.md; do
  if [ -f "$cmd" ]; then
    cp "$cmd" "$GLOBAL_DIR/command/ferg/"
    echo "   ✅ /ferg/$(basename "$cmd" .md)"
  fi
done

# Install skills
echo ""
echo "📦 Installing skills..."
if [ -d "$DIST_DIR/skills" ]; then
  cp -r "$DIST_DIR/skills"/* "$GLOBAL_DIR/skills/" 2>/dev/null || true
  echo "   ✅ prompting/incentive-prompting"
  echo "   ✅ devops skills"
fi

# Summary
echo ""
echo "========================================================"
echo "✅ Namespaced install complete!"
echo ""
echo "Available commands (use with /ferg/ prefix):"
echo "  /ferg/plan           - Create implementation plans"
echo "  /ferg/review         - Multi-perspective code review"
echo "  /ferg/deploy         - Deployment checklist + Coolify"
echo "  /ferg/optimize       - Enhance prompts with research techniques"
echo "  /ferg/seo            - SEO audit"
echo "  /ferg/recursive-init - Recursive AGENTS.md initialization"
echo ""
echo "Available agents (use with ferg/ prefix):"
echo "  ferg/architect-advisor   - Architecture decisions"
echo "  ferg/frontend-reviewer   - Frontend code review"
echo "  ferg/seo-specialist      - SEO analysis"
echo "  ferg/prompt-optimizer    - Prompt enhancement"
echo ""
echo "Example usage in OpenCode:"
echo "  /ferg/optimize 'Help me fix this database query'"
echo "  'Use ferg/architect-advisor to evaluate microservices vs monolith'"
echo ""
