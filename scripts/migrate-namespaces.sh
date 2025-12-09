#!/bin/bash
# Migration script for namespace prefix standardization
# Migrates from ferg/ to ai-eng/ namespace for existing installations

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_DIR="$HOME/.config/opencode"

echo "🔄 Namespace Migration: ferg/ → ai-eng/"
echo "========================================"
echo ""

# Check for existing ferg installations
has_ferg_commands=false
has_ferg_agents=false

if [ -d "$GLOBAL_DIR/command/ferg" ]; then
    has_ferg_commands=true
    echo "📁 Found existing ferg/ commands"
fi

if [ -d "$GLOBAL_DIR/agent/ferg" ]; then
    has_ferg_agents=true
    echo "📁 Found existing ferg/ agents"
fi

if [ "$has_ferg_commands" = false ] && [ "$has_ferg_agents" = false ]; then
    echo "✅ No ferg/ installations found. You're already up to date!"
    exit 0
fi

echo ""
echo "This will migrate your existing ferg/ namespace to ai-eng/"
echo "Your existing components will be moved to the new namespace."
echo ""

read -p "Continue with migration? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Create ai-eng directories if they don't exist
mkdir -p "$GLOBAL_DIR/command/ai-eng"
mkdir -p "$GLOBAL_DIR/agent/ai-eng"

# Migrate commands
if [ "$has_ferg_commands" = true ]; then
    echo "📦 Migrating commands..."
    for cmd in "$GLOBAL_DIR/command/ferg/"*.md; do
        if [ -f "$cmd" ]; then
            name="$(basename "$cmd")"
            dest="$GLOBAL_DIR/command/ai-eng/$name"
            if [ -f "$dest" ]; then
                echo "   ⚠️  Skipping $name (already exists in ai-eng/)"
            else
                mv "$cmd" "$dest"
                echo "   ✅ Migrated /ferg/$name → /ai-eng/$name"
            fi
        fi
    done
    # Remove old directory if empty
    if [ -z "$(ls -A "$GLOBAL_DIR/command/ferg")" ]; then
        rmdir "$GLOBAL_DIR/command/ferg"
        echo "   🗑️  Removed empty ferg/ command directory"
    fi
fi

# Migrate agents
if [ "$has_ferg_agents" = true ]; then
    echo ""
    echo "📦 Migrating agents..."
    for agent in "$GLOBAL_DIR/agent/ferg/"*.md; do
        if [ -f "$agent" ]; then
            name="$(basename "$agent")"
            dest="$GLOBAL_DIR/agent/ai-eng/$name"
            if [ -f "$dest" ]; then
                echo "   ⚠️  Skipping $name (already exists in ai-eng/)"
            else
                mv "$agent" "$dest"
                echo "   ✅ Migrated ferg/$name → ai-eng/$name"
            fi
        fi
    done
    # Remove old directory if empty
    if [ -z "$(ls -A "$GLOBAL_DIR/agent/ferg")" ]; then
        rmdir "$GLOBAL_DIR/agent/ferg"
        echo "   🗑️  Removed empty ferg/ agent directory"
    fi
fi

echo ""
echo "========================================"
echo "✅ Migration complete!"
echo ""
echo "Your components are now available under the ai-eng/ namespace:"
echo "  Commands: /ai-eng/plan, /ai-eng/review, etc."
echo "  Agents:   ai-eng/architect-advisor, ai-eng/frontend-reviewer, etc."
echo ""
echo "Old ferg/ references in your shell history may no longer work."
echo "Update any scripts or documentation that reference the old namespace."