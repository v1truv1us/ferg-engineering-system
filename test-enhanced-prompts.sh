#!/bin/bash
# test-enhanced-prompts.sh

check_prompt_quality() {
  local file="$1"
  local agent_name=$(basename "$file" .md)

  echo "🔍 Testing $agent_name..."

  # Check for expert persona
  if grep -q "You are a.*with.*years.*experience" "$file"; then
    echo "  ✅ Expert persona found"
  else
    echo "  ❌ Expert persona missing"
  fi

  # Check for step-by-step reasoning
  if grep -q "Take a deep breath" "$file"; then
    echo "  ✅ Step-by-step reasoning found"
  else
    echo "  ❌ Step-by-step reasoning missing"
  fi

  # Check for stakes language (look for "Stakes:" section)
  if grep -q "^\\*\\*Stakes:\\*\\*" "$file"; then
    echo "  ✅ Stakes language found"
  else
    echo "  ❌ Stakes language missing"
  fi

  # Check for challenge framing (look for "I bet" or similar challenge language)
  if grep -q "I bet you can't" "$file"; then
    echo "  ✅ Challenge framing found"
  else
    echo "  ❌ Challenge framing missing"
  fi
}

echo "🧪 Testing Enhanced Prompt Quality"
echo "==================================="

for file in content/agents/*.md; do
  check_prompt_quality "$file"
  echo ""
done

echo "📊 Summary:"
echo "Total agents tested: $(ls -1 content/agents/*.md | wc -l)"
echo "Expected: All agents should pass all 4 quality checks"