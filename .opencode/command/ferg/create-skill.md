| description | agent | subtask |
|---|---|---|
| Create a new OpenCode skill with AI assistance. Uses skill-creator for intelligent skill generation. | skill-creator | true |

# Create Skill Command

Create a new OpenCode skill using AI assistance.

## Process
1. **Understand Requirements**: What domain knowledge should the skill provide?
2. **Generate Skill**: Use @skill-creator to create properly formatted skill
3. **Save Skill**: Write to appropriate location
4. **Validate**: Run basic validation checks

## Usage

```bash
/ferg/create-skill "database optimization for PostgreSQL"
```

## Output Location

Skill will be saved to:
- Project-local: `.opencode/skills/[skill-name]/SKILL.md`
- Global: `~/.config/opencode/skills/[skill-name]/SKILL.md`
- Ferg content: `content/skills/[skill-name]/SKILL.md`

## Examples

### Database Skill
```bash
/ferg/create-skill "database query optimization"
```

### API Integration Skill
```bash
/ferg/create-skill "REST API client for external service"
```

### Security Skill
```bash
/ferg/create-skill "security vulnerability scanning"
```

The skill-creator will handle progressive disclosure, proper frontmatter, and ensure compatibility with opencode-skills plugin.