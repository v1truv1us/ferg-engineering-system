---
name: mcp-manager
description: This skill should be used when managing MCP server configurations, agent permissions, and tool access control in OpenCode. Handles creating, updating, and validating MCP permission matrices.
version: 1.0.0
---

# MCP Manager Skill

## Purpose

Manage Model Context Protocol (MCP) server configurations, agent permissions, and tool access control following OpenCode best practices.

## Capabilities

### MCP Configuration Management
- Create and update `opencode.json` configurations
- Add/remove MCP server definitions
- Set global tool permissions and per-agent overrides
- Validate configuration syntax and structure

### Permission Matrix Management
- Generate agent-to-MCP tool permission matrices
- Apply principle of least privilege (disable globally, enable per-agent)
- Create permission audit reports
- Validate role-based access patterns

### Security Best Practices
- Move hardcoded tokens to environment variables
- Create `.env.example` templates
- Validate token security and scopes
- Implement role-based access control

## Instructions

### 1. Configuration Analysis
```bash
# Analyze current MCP setup
skills_mcp-manager --analyze-current

# Show permission matrix
skills_mcp-manager --show-matrix
```

### 2. MCP Server Management
```bash
# Add new MCP server
skills_mcp-manager --add-server sentry --type local --command "npx @sentry/mcp-server"

# Remove MCP server
skills_mcp-manager --remove-server playwright

# Update server configuration
skills_mcp-manager --update-server context7 --url "https://new-url.com"
```

### 3. Agent Permission Updates
```bash
# Update agent permissions
skills_mcp-manager --update-agent ai-eng/deployment_engineer --add-tools "sentry*,github*"

# Remove agent tools
skills_mcp-manager --update-agent ai-eng/security_scanner --remove-tools "write*,edit*"

# Apply permission template
skills_mcp-manager --apply-template deployment --tools "Coolify*,github*,sentry*"
```

### 4. Security Operations
```bash
# Move tokens to environment
skills_mcp-manager --secure-tokens

# Create .env template
skills_mcp-manager --create-env-template

# Validate configuration
skills_mcp-manager --validate-security

# Generate audit report
skills_mcp-manager --audit-report
```

### 5. Bulk Operations
```bash
# Update all ferg agents with role-based permissions
skills_mcp-manager --bulk-update-ferg-agents

# Export configuration for backup
skills_mcp-manager --export-config

# Import configuration
skills_mcp-manager --import-config backup.json
```

## Integration Points

### With Ferg Commands
- `/ai-eng/create-agent` - Create new agents with MCP-aware templates
- `/ai-eng/plugin-validator` - Validate MCP configurations
- `/ai-eng/review` - Review MCP permission changes

### With Existing Skills
- `skills/devops/git-worktree` - Version control for config changes
- `skills/prompting/incentive-prompting` - Enhanced prompt management

### With Build System
- `bun run build` - Include MCP manager in ferg-engineering build
- Automated testing of MCP configurations

## Configuration Templates

### Agent Permission Templates

#### Deployment Engineer Template
```json
{
  "tools": {
    "Coolify*": true,
    "github*": true,
    "cloudflare*": true,
    "sentry*": true,
    "context7*": true
  },
  "permission": {
    "edit": "allow",
    "write": "allow",
    "bash": "allow"
  }
}
```

#### Security Scanner Template
```json
{
  "tools": {
    "Socket*": true,
    "sentry*": true,
    "github*": true,
    "context7*": true
  },
  "permission": {
    "edit": "deny",
    "write": "deny",
    "bash": "deny"
  }
}
```

#### Full Stack Developer Template
```json
{
  "tools": {
    "github*": true,
    "sentry*": true,
    "context7*": true,
    "Playwright*": true,
    "verbalized-sampling*": true
  },
  "permission": {
    "edit": "allow",
    "write": "allow",
    "bash": "allow"
  }
}
```

## Best Practices

### Security
- Always use environment variables for tokens
- Implement principle of least privilege
- Regular token rotation
- Audit permission changes

### Configuration Management
- Version control your `opencode.json` changes
- Test configurations in development environment
- Document permission rationale

### Agent Design
- Group related tools under permission patterns
- Use descriptive tool names and glob patterns
- Provide clear escalation paths

## Troubleshooting

### Common Issues
- MCP servers not starting: Check environment variables
- Permission not working: Verify glob pattern syntax
- Agent not getting tools: Check agent name matching

### Debug Commands
```bash
# Enable debug logging
opencode --log-level debug

# Test specific agent
skills_mcp-manager --test-agent ai-eng/deployment_engineer

# Validate configuration
skills_mcp-manager --validate-config
```

## File Structure

When using this skill, it expects to work with:

```
.ferg-engineering-system/
├── .opencode/
│   ├── plugin/
│   │   └── mcp-manager.ts          # Enhanced plugin with MCP management
│   ├── agent/
│   │   └── ai-eng/
│   │       ├── mcp-manager.md     # This skill
│   │       └── [other agents]
│   └── config/
│       ├── opencode.jsonc         # Main configuration
│       └── .env                   # Environment variables
└── skills/
    └── mcp-manager/
        ├── SKILL.md              # This file
        ├── templates/             # Permission templates
        └── scripts/               # Management utilities
```

## Integration with Build Process

To include MCP manager in ferg-engineering builds:

1. Add to `build.ts` to copy skill to distribution
2. Update `package.json` with MCP management dependencies
3. Create tests for MCP configuration validation
4. Update documentation with MCP management examples

## Examples

### Basic Usage
```bash
# Give deployment engineer access to deployment tools
skills_mcp-manager --update-agent ai-eng/deployment_engineer --template deployment

# Remove dangerous tools from learning agent
skills_mcp-manager --update-agent ai-eng/learning --remove-tools "sentry*,github*"

# Audit all permissions
skills_mcp-manager --audit-report > mcp-audit-$(date +%Y-%m-%d).json
```

### Advanced Configuration
```bash
# Set up complex multi-environment setup
skills_mcp-manager --setup-multi-env \
  --environments dev,staging,production \
  --base-config templates/multi-env.json \
  --token-sources env,vault,aws-secrets
```

This skill provides a comprehensive interface for managing MCP permissions while maintaining security best practices and operational excellence.