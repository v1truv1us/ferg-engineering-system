#!/bin/bash
# Setup script for ferg-engineering-system
# Creates symlinks for Claude Code and OpenCode from shared content.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 Setting up Ferg Engineering System..."

# Claude
mkdir -p .claude/commands
# Link shared commands into .claude/commands
find "$SCRIPT_DIR/commands" -type f -name '*.md' -print0 | while IFS= read -r -d '' cmd; do
  name="$(basename "$cmd")"
  ln -sf "$cmd" ".claude/commands/$name"
  echo "  → Claude command: $name"
done

# OpenCode
mkdir -p .opencode/command .opencode/agent
# Link .opencode commands
if [ -d "$SCRIPT_DIR/.opencode/command" ]; then
  find "$SCRIPT_DIR/.opencode/command" -type f -name '*.md' -print0 | while IFS= read -r -d '' cmd; do
    name="$(basename "$cmd")"
    ln -sf "$cmd" ".opencode/command/$name"
    echo "  → OpenCode command: $name"
  done
fi

# Link shared agents into .opencode/agent/
if [ -d "$SCRIPT_DIR/.opencode/agent" ]; then
  find "$SCRIPT_DIR/.opencode/agent" -type f -name '*.md' -print0 | while IFS= read -r -d '' agent; do
    name="$(basename "$agent")"
    ln -sf "$agent" ".opencode/agent/$name"
    echo "  → OpenCode agent: $name"
  done
fi

# Link AGENTS.md & CLAUDE.md into repo root if not present
ln -sf "$SCRIPT_DIR/AGENTS.md" "$SCRIPT_DIR/AGENTS.md"
ln -sf "$SCRIPT_DIR/CLAUDE.md" "$SCRIPT_DIR/CLAUDE.md"

echo "✅ Setup complete!"
