#!/bin/bash
# import-codeflow-agents.sh
# Import curated CodeFlow agents into Ferg Engineering System

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CODEFLOW_ENHANCED_DIR="/home/vitruvius/git/codeflow/enhanced-agents"
FERG_CONTENT_DIR="$SCRIPT_DIR/content/agents"

# Selected high-quality agents from CodeFlow
SELECTED_AGENTS=(
  "development/backend_architect.md"
  "development/database_optimizer.md"
  "development/security_scanner.md"
  "development/api_builder_enhanced.md"
  "development/full_stack_developer.md"
  "quality-testing/code_reviewer.md"
  "operations/infrastructure_builder.md"
  "operations/deployment_engineer.md"
  "operations/monitoring_expert.md"
  "operations/cost_optimizer.md"
  "quality-testing/test_generator.md"
  "quality-testing/performance_engineer.md"
  "ai-innovation/ai_engineer.md"
  "ai-innovation/ml_engineer.md"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Validate prerequisites
validate_prerequisites() {
  log_info "Validating prerequisites..."

  if [ ! -d "$CODEFLOW_ENHANCED_DIR" ]; then
    log_error "CodeFlow enhanced agents directory not found: $CODEFLOW_ENHANCED_DIR"
    log_error "Run 'codeflow enhance ./agent --level maximum --output ./enhanced-agents' first"
    exit 1
  fi

  if [ ! -d "$FERG_CONTENT_DIR" ]; then
    log_error "Ferg content directory not found: $FERG_CONTENT_DIR"
    exit 1
  fi

  log_success "Prerequisites validated"
}

# Transform frontmatter for Ferg compatibility
transform_frontmatter() {
  local file="$1"
  local temp_file="${file}.tmp"

  # Read the file
  local content=$(cat "$file")

  # Transform frontmatter (basic transformation - can be enhanced)
  # Change any CodeFlow-specific references to Ferg-compatible ones
  echo "$content" | sed 's/codeflow/ferg/g' > "$temp_file"

  # Replace the original file
  mv "$temp_file" "$file"
}

# Import single agent
import_agent() {
  local source_path="$1"
  local full_source_path="$CODEFLOW_ENHANCED_DIR/$source_path"
  local agent_name=$(basename "$source_path" .md)

  log_info "Importing $agent_name..."

  # Check if source exists
  if [ ! -f "$full_source_path" ]; then
    log_error "Source file not found: $full_source_path"
    return 1
  fi

  # Copy to Ferg content directory
  cp "$full_source_path" "$FERG_CONTENT_DIR/"

  # Transform for Ferg compatibility
  local ferg_file="$FERG_CONTENT_DIR/$(basename "$source_path")"
  transform_frontmatter "$ferg_file"

  log_success "Imported $agent_name"
}

# Update AGENTS.md documentation
update_documentation() {
  log_info "Updating AGENTS.md documentation..."

  local agents_md="$SCRIPT_DIR/content/AGENTS.md"

  # Add section for imported CodeFlow agents
  cat >> "$agents_md" << 'EOF'

## Imported CodeFlow Agents

The following agents have been imported from CodeFlow and enhanced with research-backed prompting techniques:

### Development & Architecture
- **backend-architect**: System design and architecture decisions
- **database-optimizer**: Database performance and optimization
- **security-scanner**: Security vulnerability detection
- **api-builder-enhanced**: API development and documentation
- **full-stack-developer**: End-to-end application development

### Quality & Testing
- **code-reviewer**: Comprehensive code quality assessment
- **test-generator**: Automated test suite generation
- **performance-engineer**: Application performance optimization

### Operations & Infrastructure
- **infrastructure-builder**: Cloud infrastructure design
- **deployment-engineer**: Deployment automation and CI/CD
- **monitoring-expert**: Observability and alerting
- **cost-optimizer**: Cloud cost optimization

### AI & Machine Learning
- **ai-engineer**: AI integration and development
- **ml-engineer**: Machine learning model development

*All imported agents use maximum-level research-backed prompting techniques for optimal quality.*
EOF

  log_success "Documentation updated"
}

# Main import process
main() {
  echo "🚀 CodeFlow Agent Import to Ferg Engineering System"
  echo "=================================================="
  echo "Source: $CODEFLOW_ENHANCED_DIR"
  echo "Target: $FERG_CONTENT_DIR"
  echo "Agents to import: ${#SELECTED_AGENTS[@]}"
  echo ""

  validate_prerequisites

  echo ""
  log_info "Starting import process..."

  local imported=0
  local failed=0

  for agent in "${SELECTED_AGENTS[@]}"; do
    if import_agent "$agent"; then
      ((imported++))
    else
      ((failed++))
    fi
  done

  echo ""
  log_info "Import Summary:"
  echo "  ✅ Successfully imported: $imported"
  if [ $failed -gt 0 ]; then
    echo "  ❌ Failed to import: $failed"
  fi

  update_documentation

  echo ""
  log_success "Import complete!"
  echo ""
  log_info "Next steps:"
  echo "  1. Run 'npm run build' to update the system"
  echo "  2. Test the imported agents"
  echo "  3. Update marketplace.json if needed"
  echo "  4. Commit and deploy changes"
}

# Run main function
main "$@"