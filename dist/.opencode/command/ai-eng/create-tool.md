| description | agent | subtask |
|---|---|---|
| Create a new OpenCode custom tool with AI assistance. Uses tool-creator for intelligent TypeScript tool generation. | tool-creator | true |

# Create Tool Command

Create a new OpenCode custom tool using AI assistance.

## Process
1. **Understand Requirements**: What functionality should the tool provide?
2. **Generate Tool**: Use @tool-creator to create properly formatted TypeScript tool
3. **Save Tool**: Write to appropriate location
4. **Validate**: Run basic validation checks

## Usage

```bash
/ferg/create-tool "database query executor with connection pooling"
```

## Output Location

Tool will be saved to:
- Project-local: `.opencode/tool/[name].ts`
- Global: `~/.config/opencode/tool/[name].ts`
- Ferg content: `content/tools/[name].ts`

## Examples

### Database Tool
```bash
/ferg/create-tool "PostgreSQL query builder with parameter binding"
```

### File Processing Tool
```bash
/ferg/create-tool "CSV processor with validation and transformation"
```

### API Client Tool
```bash
/ferg/create-tool "REST API client with retry logic and authentication"
```

### System Integration Tool
```bash
/ferg/create-tool "Docker container management with status monitoring"
```

The tool-creator will handle TypeScript compilation, Zod validation, error handling, and OpenCode tool integration patterns.