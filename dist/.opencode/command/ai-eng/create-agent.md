| description | agent | subtask |
|---|---|---|
| Create a new OpenCode agent with AI assistance. Uses agent-creator for intelligent agent generation. | agent-creator | true |

# Create Agent Command

Create a new OpenCode agent using AI assistance.

## Process
1. **Understand Requirements**: What should the agent do?
2. **Generate Agent**: Use @agent-creator to create properly formatted agent
3. **Save Agent**: Write to appropriate location
4. **Validate**: Run basic validation checks

## Usage

```bash
/ferg/create-agent "code reviewer that checks for security issues"
```

## Output Location

Agent will be saved to:
- Project-local: `.opencode/agent/[name].md`
- Global: `~/.config/opencode/agent/[name].md`
- Ferg content: `content/agents/[name].md`

## Examples

### Security Review Agent
```bash
/ferg/create-agent "security scanner that finds vulnerabilities"
```

### Documentation Agent
```bash
/ferg/create-agent "technical writer for API documentation"
```

### Data Analysis Agent
```bash
/ferg/create-agent "data analyst for database queries"
```

The agent-creator will handle platform-specific formatting and ensure the agent follows best practices for triggering, expertise, and integration.