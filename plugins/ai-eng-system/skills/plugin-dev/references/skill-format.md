# Skill Format Guide

## Overview

Skills follow Anthropic's Agent Skills Specification and work identically in both Claude Code and OpenCode. The opencode-skills plugin provides automatic discovery and registration of skills as tools.

## Universal Skill Structure

Both platforms use the same skill format:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          # Executable code
    ├── references/       # Documentation
    └── assets/           # Files used in output
```

## SKILL.md Format

### Required Frontmatter

```yaml
---
name: skill-name
description: This skill should be used when...
version: 1.0.0
---
```

**Name Requirements:**
- Lowercase alphanumeric with hyphens only
- Must match directory name
- 3-50 characters

**Description Requirements:**
- Minimum 20 characters for discoverability
- Third-person: "This skill should be used when..."
- Include specific trigger phrases
- Concrete examples of user queries

### Content Guidelines

**Word Count**: 1,000-3,000 words (ideally 1,500-2,000)
**Writing Style**: Imperative/infinitive form
**Organization**: Clear sections, logical flow

## Progressive Disclosure

### Three-Level Loading

1. **Metadata** (always loaded): Name + description (~100 words)
2. **SKILL.md body** (when triggered): Core instructions (<5k words)
3. **Bundled Resources** (as needed): Scripts, references, assets

### Benefits

- **Context Efficiency**: Lean core content
- **Detailed Knowledge**: Comprehensive references
- **Executable Code**: Deterministic scripts
- **Output Assets**: Templates and examples

## Skill Types by Platform

| Platform | Skill Discovery | Skill Loading |
|----------|----------------|---------------|
| **Claude Code** | Built-in | Built-in |
| **OpenCode** | opencode-skills plugin | opencode-skills plugin |

## OpenCode Skill Integration

### Auto-Discovery

The opencode-skills plugin automatically:
1. Scans `.opencode/skills/`, `~/.opencode/skills/`, `~/.config/opencode/skills/`
2. Validates YAML frontmatter
3. Registers tools as `skills_{{skill_name}}`
4. Loads skill content via silent message insertion

### Skill Usage

Skills become available as tools:

```bash
# Use skill
skills_git_worktree

# Skill with arguments
skills_incentive_prompting "how to improve prompts"
```

### Skill Loading Process

1. **Tool Registration**: `skills_git_worktree` tool appears
2. **Content Delivery**: Skill content inserted into session
3. **No Context Pollution**: Uses `noReply` pattern
4. **Base Directory**: Skill knows its location

## Best Practices

### Description Writing

**Good Examples:**
```yaml
description: This skill should be used when the user asks to "create a hook", "add a PreToolUse hook", "validate tool use", or mentions hook events (PreToolUse, PostToolUse, Stop).
```

**Bad Examples:**
```yaml
description: Use this skill for hooks.  # Too vague
description: Load when user needs hooks.  # Second person
description: Helps with hook development.  # No trigger phrases
```

### Content Organization

#### SKILL.md Body

**Include:**
- Core concepts and procedures
- Quick reference tables
- Pointers to detailed resources

**Exclude:**
- Detailed API documentation (>2k words)
- Extensive examples
- Reference material

#### References Directory

**Use for:**
- Detailed documentation (>2k words)
- API specifications
- Comprehensive examples
- Background knowledge

**File Naming:**
- `patterns.md` - Common patterns
- `advanced.md` - Advanced techniques
- `examples.md` - Working examples
- `troubleshooting.md` - Issue resolution

#### Scripts Directory

**Use for:**
- Repeatedly executed code
- Deterministic operations
- Complex calculations
- External tool integration

**Examples:**
- `validate-skill.py` - Skill validation
- `generate-template.sh` - Template generation
- `install-dependencies.sh` - Setup automation

#### Assets Directory

**Use for:**
- Template files
- Configuration examples
- Code snippets
- Documentation templates

**Examples:**
- `template.md` - Document template
- `config.yaml` - Configuration example
- `boilerplate.py` - Code starter

## Validation

### Frontmatter Validation

The opencode-skills plugin validates:
- Name format (regex: `^[a-z0-9-]+$`)
- Description length (min 20 chars)
- Required fields present

### Content Quality

- **Triggering**: Description includes specific user phrases
- **Progressive Disclosure**: Core content lean, details in references
- **Writing Style**: Imperative form throughout
- **References**: All referenced files exist

## Integration with Ferg System

### Existing Skills

- `skills/prompting/incentive-prompting` - Research-backed techniques
- `skills/devops/git-worktree` - Git worktree management
- `skills/devops/coolify-deploy` - Coolify deployment

### Plugin-Dev Skill

- `skills/plugin-dev/SKILL.md` - Extension development knowledge
- References for both platforms
- Comprehensive documentation

## Development Workflow

### 1. Create Skill Structure

```bash
mkdir -p skills/my-skill/{references,scripts,assets}
touch skills/my-skill/SKILL.md
```

### 2. Write Core Content

Focus on essential procedures in SKILL.md (1,500-2,000 words)

### 3. Add Detailed Resources

Move comprehensive content to references/ files

### 4. Test Discovery

```bash
# Test skill loading
opencode  # Restart to reload skills

# Check tool availability
skills_my_skill
```

### 5. Validate Quality

Use skill-reviewer agent for quality assessment

## Security Considerations

### Input Validation

- Validate user inputs in skill logic
- Sanitize file paths
- Check permissions before access

### Safe Operations

- Avoid dangerous shell commands in scripts
- Use environment variables for secrets
- Follow principle of least privilege

### Code Quality

- Validate external dependencies
- Use secure coding practices
- Handle errors gracefully

## Troubleshooting

### Common Issues

**Skill Not Loading:**
- Check YAML frontmatter syntax
- Verify directory structure
- Restart OpenCode to reload

**Tool Not Available:**
- Check opencode-skills plugin is installed
- Verify skill discovery path
- Review skill validation logs

**Content Not Inserting:**
- Check skill content length
- Verify message insertion format
- Test with simple skill first

### Debug Mode

Run OpenCode with debug flag to see skill loading:

```bash
opencode --debug
```

## Advanced Features

### Conditional Logic

Skills can include conditional logic based on context:

```markdown
## Context Detection

First, detect the project type:
- If svelte.config.js exists → Svelte project
- If package.json with "express" → Node.js API
- If go.mod present → Go application

## Project-Specific Actions

Based on detected project type:
```

### Dynamic Content

Skills can generate content dynamically:

```markdown
## Template Generation

Generate a [component] with the following structure:
!`generate-template.sh $ARGUMENTS`
```

### External Integration

Skills can integrate with external services:

```markdown
## API Integration

Connect to external API:
!`curl -s "$API_URL/api/data"`

## Database Queries

Execute database query:
!`psql "$DATABASE_URL" -c "SELECT * FROM users LIMIT 10"`
```

Skills provide a powerful way to package domain expertise and make it available across both platforms with consistent behavior and quality standards.