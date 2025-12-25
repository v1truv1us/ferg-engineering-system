# Agent Format Guide

## Overview

Agents are specialized AI assistants that provide focused expertise for specific domains. Both Claude Code and OpenCode support agents, but with different frontmatter formats while sharing the same core concepts.

## Platform Comparison

| Aspect | Claude Code | OpenCode | Canonical (content/) |
|---------|-------------|----------|------------------|
| **Frontmatter** | YAML block | YAML block | YAML block |
| **File Extension** | `.md` | `.md` | `.md` |
| **Mode Specification** | `mode: subagent` | `mode: subagent` | `mode: subagent` |
| **Model Override** | `model: sonnet` | `model: sonnet` | `model: sonnet` |
| **Tool Control** | `tools: [...]` | `tools: { read: true }` | `tools: { read: true }` |
| **Color Coding** | Named colors OK | Hex format only (e.g., `#00FFFF`) | Named colors OK (auto-converted to hex) |
| **Temperature** | `temperature: 0.3` | `temperature: 0.3` | `temperature: 0.3` |
| **Permissions** | N/A | `permission: { bash: deny }` | `permission: { bash: deny }` |

## Canonical Format (content/)

Use this format in `content/agents/` for maximum compatibility:

```yaml
---
name: my-agent
description: Use this agent when user asks to "specific trigger phrases" or describes agent functionality. Examples: <example>...</example>
mode: subagent
model: sonnet
color: cyan
temperature: 0.3
tools:
  read: true
  write: true
permission:
  bash: deny
---
```

## Claude Code Output

Build.ts transforms canonical to Claude Code format (YAML frontmatter):

```markdown
---
name: my-agent
description: Use this agent when user asks to "specific trigger phrases" or describes agent functionality. Examples: <example>...</example>
mode: subagent
model: sonnet
color: cyan
temperature: 0.3
tools:
  - Read
  - Write
permission:
  bash: deny
---

# System Prompt

Agent system prompt here...
```

## OpenCode Output

Build.ts transforms canonical to OpenCode format (table frontmatter):

```markdown
| description | mode |
|---|---|
| Use this agent when user asks to "specific trigger phrases" or describes agent functionality. Examples: <example>...</example> | subagent |

# System Prompt

Agent system prompt here...
```

**Note on Color Format**: OpenCode requires hex color codes (e.g., `#00FFFF`) while Claude Code accepts named colors (e.g., `cyan`). The build.ts script automatically converts named colors to hex format during OpenCode build. Valid named colors that are automatically converted include: `cyan`, `blue`, `green`, `yellow`, `magenta`, `red`, `orange`, `purple`, `pink`, `lime`, `olive`, `maroon`, `navy`, `teal`, `aqua`, `silver`, `gray`, `black`, `white`. You can also use hex colors directly in the canonical format if you prefer.

## Agent Modes

### Primary Agents

- Handle main conversation flow
- Have access to full tool set
- Can invoke other agents
- Used for general-purpose tasks

### Subagents

- Specialized for specific domains
- Limited tool access (for safety/focus)
- Invoked by primary agents or directly
- Used for focused expertise

## Agent Design

### Expert Persona

Create a compelling expert identity:

```markdown
You are a senior [domain] expert with 12+ years of experience, having led major initiatives at [notable companies]. You've [key achievements] and your expertise is highly sought after in the industry.
```

### Core Components

1. **Role Definition**: Clear expertise domain
2. **Responsibilities**: Numbered list of capabilities
3. **Process**: Step-by-step methodology
4. **Quality Standards**: Output expectations
5. **Edge Cases**: Handling unusual situations

## Triggering Examples

Include 2-4 `<example>` blocks in description:

```yaml
description: Use this agent when user asks to "create an agent", "generate an agent", or describes agent functionality. Examples:

<example>
Context: User wants to create a code review agent
user: "Create an agent that reviews code for quality issues"
assistant: "I'll use the agent-creator to generate a code review agent."
<commentary>
User requesting new agent creation, trigger agent-creator.
</commentary>
</example>

<example>
Context: User describes needed functionality
user: "I need an agent that generates unit tests for my code"
assistant: "I'll use the agent-creator to create a test generation agent."
<commentary>
User describes agent need, trigger agent-creator.
</commentary>
</example>
</example>
```

## Tool Access Control

### Claude Code

```yaml
tools:
  - Read
  - Write
  - Grep
  - Glob
  - Bash
```

### OpenCode

```yaml
tools:
  read: true
  write: true
  bash: true
  grep: true
  glob: true
```

### Permission Overrides

OpenCode supports granular permissions:

```yaml
permission:
  bash: deny
  edit: deny
  write: deny
  read: allow
```

## Best Practices

### Agent Creation

1. **Clear Purpose**: Specific domain expertise
2. **Strong Triggers**: Concrete user phrases
3. **Focused Scope**: Not too broad or too narrow
4. **Quality Prompt**: Detailed instructions, examples
5. **Proper Mode**: Choose primary vs subagent appropriately

### System Prompt Writing

1. **Expert Persona**: Establish credibility
2. **Structured Approach**: Clear methodology
3. **Output Format**: Defined expectations
4. **Self-Correction**: Error handling
5. **Context Awareness**: Use project information

### Security

1. **Input Validation**: Check user inputs
2. **Safe Operations**: Avoid dangerous actions
3. **Data Protection**: No sensitive data exposure
4. **Permission Respect**: Honor tool restrictions

## Examples

### Code Review Agent

```yaml
---
name: code-reviewer
description: Use this agent when user asks to "review code", "check quality", "analyze for issues", or needs code quality assessment. Examples:

<example>
Context: User just wrote new code
user: "Review this function for security issues"
assistant: "I'll use the code-reviewer agent to analyze the code."
<commentary>
Code review request triggers code-reviewer agent.
</commentary>
</example>
</example>
mode: subagent
color: yellow
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
permission:
  bash: deny
  edit: deny
  write: deny
---

You are a senior code reviewer with 10+ years of experience...

## Integration with Ferg System

### Existing Agents

- `ai-eng/architect-advisor` - System architecture guidance
- `ai-eng/frontend-reviewer` - Frontend code review
- `ai-eng/seo-specialist` - SEO optimization
- `ai-eng/prompt-optimizer` - Prompt enhancement

### Plugin-Dev Agents

- `ai-eng/agent-creator` - AI-assisted agent generation
- `ai-eng/skill-creator` - Skill development guidance
- `ai-eng/plugin-validator` - Plugin structure validation

All agents follow the same quality standards and use the build.ts transformation system.

## Build Transformations

The `build.ts` script performs automatic transformations to ensure compatibility:

### Color Format Conversion
- **Canonical → Claude Code**: Preserves named colors (e.g., `color: cyan`)
- **Canonical → OpenCode**: Converts named colors to hex format (e.g., `color: cyan` → `color: "#00FFFF"`)

### Field Removal
- **OpenCode only**: Removes `name` and `category` fields from frontmatter
- **Permission cleaning**: Filters to valid OpenCode permission keys (edit, bash, webfetch, doom_loop, external_directory)

### Validation
The build script validates OpenCode output:
- Checks for hex color format (`^#[0-9a-fA-F]{6}$`)
- Ensures required fields are present (description, mode)
- Validates nested directory structure (ai-eng/<category>/<agent>.md)