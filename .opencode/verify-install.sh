#!/bin/bash

echo "🔍 Verifying OpenCode Plugin Installation..."
echo ""

# Check directory structure
if [ ! -d ".opencode/command/ai-eng" ]; then
    echo "❌ Commands directory missing"
    exit 1
fi
echo "✅ Commands directory exists"

if [ ! -d ".opencode/agent/ai-eng" ]; then
    echo "❌ Agents directory missing"
    exit 1
fi
echo "✅ Agents directory exists"

# Count files
cmd_count=$(find .opencode/command/ai-eng -name "*.md" | wc -l)
agent_count=$(find .opencode/agent/ai-eng -name "*.md" | wc -l)

echo "✅ Found $cmd_count commands"
echo "✅ Found $agent_count agents"

# Check package.json
if [ ! -f ".opencode/package.json" ]; then
    echo "❌ package.json missing"
    exit 1
fi
echo "✅ package.json exists"

# Check node_modules
if [ ! -d ".opencode/node_modules" ]; then
    echo "❌ node_modules missing"
    exit 1
fi
echo "✅ node_modules installed"

# Check specific command
if [ ! -f ".opencode/command/ai-eng/plan.md" ]; then
    echo "❌ plan.md command missing"
    exit 1
fi
echo "✅ plan.md command exists"

# Check specific agent
if [ ! -f ".opencode/agent/ai-eng/development/api_builder_enhanced.md" ]; then
    echo "❌ api_builder_enhanced.md agent missing"
    exit 1
fi
echo "✅ api_builder_enhanced.md agent exists"

echo ""
echo "🎉 All checks passed! Plugin is ready for testing."
echo ""
echo "Available commands:"
ls -1 .opencode/command/ai-eng/ | sed 's/^/  - /'
echo ""
echo "Available agent categories:"
ls -1 .opencode/agent/ai-eng/ | sed 's/^/  - /'
