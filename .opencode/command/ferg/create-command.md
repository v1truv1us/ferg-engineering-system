| description | agent | subtask |
|---|---|---|
| Create a new OpenCode command with AI assistance. Uses command-creator for intelligent command generation. | command-creator | true |

# Create Command Command

Create a new OpenCode command using AI assistance.

## Process
1. **Understand Requirements**: What should the command do?
2. **Generate Command**: Use @command-creator to create properly formatted command
3. **Save Command**: Write to appropriate location
4. **Validate**: Run basic validation checks

## Usage

```bash
/ferg/create-command "deploy to staging with pre-checks"
```

## Output Location

Command will be saved to:
- Project-local: `.opencode/command/[name].md`
- Global: `~/.config/opencode/command/[name].md`
- Ferg content: `content/commands/[name].md`

## Examples

### Deployment Command
```bash
/ferg/create-command "deploy application with health checks"
```

### Testing Command
```bash
/ferg/create-command "run integration tests with coverage"
```

### Documentation Command
```bash
/ferg/create-command "generate API docs from code"
```

The command-creator will handle platform-specific formatting and ensure the command follows best practices for arguments, shell integration, and tool usage.