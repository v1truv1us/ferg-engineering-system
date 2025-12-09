#!/bin/bash
# Setup script for AI Engineering System - Namespaced Global Installation
# Builds from content/ and installs to ~/.config/opencode under ai-eng/ namespace

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
GLOBAL_DIR="${HOME}/.config/opencode"

echo "🔧 AI Engineering System - Namespaced Global Install"
echo "========================================================"
echo ""
echo "All components will be installed under the 'ai-eng/' namespace:"
echo "  Commands: /ai-eng/plan, /ai-eng/review, /ai-eng/optimize, etc."
echo "  Agents:   ai-eng/architect-advisor, ai-eng/prompt-optimizer, etc."
echo ""

# Check for npm installation option
if command -v npm &> /dev/null && npm list -g @v1truv1us/ai-eng-system &> /dev/null; then
  echo "📦 Found npm installation. Using npm installer..."
  cd "$SCRIPT_DIR" && npm run install:global
  exit 0
fi

# Offer npm option if available
if command -v npm &> /dev/null; then
  echo "💡 Option: Install via npm for easier updates?"
   echo "   npm install -g @v1truv1us/ai-eng-system"
  echo ""
  read -p "Use npm installation? (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing via npm..."
   npm install -g @v1truv1us/ai-eng-system
    echo "✅ npm installation complete!"
    exit 0
  fi
  echo ""
fi

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
    echo "   Or use npm: npm install -g @v1truv1us/ai-eng-system"
    exit 1
  fi
fi

# Create namespaced directories
mkdir -p "$GLOBAL_DIR/agent/ai-eng"
mkdir -p "$GLOBAL_DIR/command/ai-eng"
mkdir -p "$GLOBAL_DIR/skills/prompting/incentive-prompting"
mkdir -p "$GLOBAL_DIR/skills/devops"

# Install ai-eng agents (namespaced)
echo "📦 Installing ai-eng/ agents..."
for agent in "$DIST_DIR/.opencode/agent/ai-eng"/*.md; do
    [ -f "$agent" ] || continue
    cp "$agent" "$GLOBAL_DIR/agent/ai-eng/"
    echo "   ✅ ai-eng/$(basename "$agent" .md)"
done

# Install ai-eng commands (namespaced)
echo "📦 Installing ai-eng/ commands..."
for cmd in "$DIST_DIR/.opencode/command/ai-eng"/*.md; do
    [ -f "$cmd" ] || continue
    cp "$cmd" "$GLOBAL_DIR/command/ai-eng/"
    echo "   ✅ /ai-eng/$(basename "$cmd" .md)"
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
echo "Available commands (use with /ai-eng/ prefix):"
echo "  /ai-eng/plan           - Create implementation plans"
echo "  /ai-eng/review         - Multi-perspective code review"
echo "  /ai-eng/deploy         - Deployment checklist + Coolify"
echo "  /ai-eng/optimize       - Enhance prompts with research techniques"
echo "  /ai-eng/seo            - SEO audit"
echo "  /ai-eng/recursive-init - Recursive AGENTS.md initialization"

echo "Available agents (use with ai-eng/ prefix):"
echo "  ai-eng/architect-advisor   - Architecture decisions"
echo "  ai-eng/frontend-reviewer   - Frontend code review"
echo "  ai-eng/seo-specialist      - SEO analysis"
echo "  ai-eng/prompt-optimizer    - Prompt enhancement"

echo ""
echo "Example usage:"
echo "  /ai-eng/optimize 'Help me fix this database query'"
echo "  'Use ai-eng/architect-advisor to evaluate microservices vs monolith'"
echo ""
