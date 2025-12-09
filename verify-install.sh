#!/bin/bash
# Verification script for ferg-engineering-system installation

set -euo pipefail

echo "🔍 Verifying Ferg Engineering System Installation"
echo "=================================================="
echo ""

# Check Claude Code setup
echo "📋 Claude Code Setup:"
if [ -d ".claude/commands" ]; then
  cmd_count=$(ls .claude/commands/*.md 2>/dev/null | wc -l)
  if [ "$cmd_count" -gt 0 ]; then
    echo "   ✅ Commands found: $cmd_count commands"
    echo "   ✅ Available: $(ls .claude/commands/*.md | xargs -n1 basename | sed 's/.md$//' | tr '\n' ' ')"
  else
    echo "   ❌ No commands found"
  fi
else
  echo "   ⚠️  .claude/commands not found (run ./setup.sh)"
fi

echo ""

# Check OpenCode setup (project-local)
echo "📋 OpenCode Setup (Project-Local):"
if [ -d ".opencode/command/ferg" ]; then
  cmd_count=$(ls .opencode/command/ferg/*.md 2>/dev/null | wc -l)
  agent_count=$(ls .opencode/agent/ferg/*.md 2>/dev/null | wc -l)
  if [ "$cmd_count" -gt 0 ]; then
    echo "   ✅ Commands found: $cmd_count commands"
    echo "   ✅ Agents found: $agent_count agents"
  else
    echo "   ❌ No commands/agents found"
  fi
else
  echo "   ⚠️  .opencode/command/ferg not found (run ./setup.sh)"
fi

echo ""

# Check OpenCode setup (global)
echo "📋 OpenCode Setup (Global):"
GLOBAL_DIR="$HOME/.config/opencode"
if [ -d "$GLOBAL_DIR/command/ferg" ]; then
  cmd_count=$(ls "$GLOBAL_DIR/command/ferg"/*.md 2>/dev/null | wc -l)
  agent_count=$(ls "$GLOBAL_DIR/agent/ferg"/*.md 2>/dev/null | wc -l)
  if [ "$cmd_count" -gt 0 ]; then
    echo "   ✅ Commands found: $cmd_count commands"
    echo "   ✅ Agents found: $agent_count agents"
    echo "   ✅ Use with /ai-eng/ prefix (e.g., /ai-eng/plan)"
  else
    echo "   ❌ No commands/agents found"
  fi
else
  echo "   ⚠️  Global ai-eng/ not found (run ./setup-global.sh)"
fi

echo ""
echo "=================================================="
echo "✅ Verification complete!"
echo ""
echo "Usage Examples:"
echo "  Claude Code: /plan, /review, /optimize"
echo "  OpenCode:    /ai-eng/plan, /ai-eng/review, /ai-eng/optimize"
echo "  OpenCode Agents: 'Use ai-eng/architect-advisor to evaluate...'"
echo ""