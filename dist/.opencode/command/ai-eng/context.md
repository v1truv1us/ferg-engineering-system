---
name: ai-eng/context
description: Manage session state, memories, and context engineering
agent: build
---

# Context Command

Manage the context engineering system including sessions, memories, and context assembly.

## Overview

The context system provides persistent session state, intelligent memory management, and optimized context retrieval across conversations.

## Subcommands

### `context status`
Show current session state and memory statistics.

```bash
/context status
```

**Output:**
- Current session ID and metadata
- Active files and pending tasks
- Recent decisions
- Memory statistics (total, by type, confidence)

### `context remember`
Manually save a memory entry.

```bash
/context remember "User prefers Bun over Node.js" --type=declarative --tags=preference,build
```

**Options:**
- `--type` - Memory type: `declarative`, `procedural`, or `episodic` (default: declarative)
- `--tags` - Comma-separated tags for categorization
- `--context` - Additional context about where this was learned

### `context search`
Search memories by content or tags.

```bash
/context search "database optimization" --type=procedural
/context search --tags=decision,architecture
```

**Options:**
- `--type` - Filter by memory type
- `--tags` - Filter by tags (comma-separated)
- `--confidence` - Minimum confidence threshold (0-1)

### `context task`
Manage pending tasks in the current session.

```bash
/context task add "Implement authentication" --priority=high
/context task list
/context task complete <task-id>
```

**Subcommands:**
- `add <content>` - Add a new task
- `list` - Show all pending tasks
- `complete <id>` - Mark task as completed
- `status <id>` - Show task details

**Options:**
- `--priority` - Task priority: `low`, `medium`, `high` (default: medium)

### `context decision`
Record architectural or design decisions.

```bash
/context decision "Use microservices architecture" \
  --rationale="Allows independent scaling and deployment" \
  --alternatives="Monolith,Modular monolith" \
  --tags=architecture,scalability
```

**Options:**
- `--rationale` - Why this decision was made
- `--alternatives` - Comma-separated list of alternatives considered
- `--tags` - Decision tags for categorization

### `context export`
Export session or memories for backup or sharing.

```bash
/context export session --format=json
/context export memories --type=declarative --format=json
```

**Options:**
- `--format` - Export format: `json` or `markdown` (default: json)
- `--type` - Memory type to export (optional)
- `--output` - Output file path (default: stdout)

### `context archive`
Archive the current session and start fresh.

```bash
/context archive
```

This moves the current session to the archive and creates a new session.

### `context summary`
Get a context summary for inclusion in prompts.

```bash
/context summary --max-memories=5
```

**Options:**
- `--max-memories` - Maximum memories to include (default: 5)
- `--include-session` - Include session state (default: true)

## Session Lifecycle

### Starting a Session
Sessions are automatically created when you first use the context system. The session persists across conversations.

### Tracking Work
As you work, the system automatically:
- Tracks active files you're editing
- Records pending tasks
- Captures architectural decisions
- Learns preferences and patterns

### Archiving
When you're done with a project or want to start fresh:
```bash
/context archive
```

This preserves all session data for future reference while starting a clean slate.

## Memory Types

### Declarative Memory
Facts, patterns, and preferences learned from the user or inferred from behavior.

**Examples:**
- "User prefers TypeScript over JavaScript"
- "Project uses Bun as the runtime"
- "API endpoints follow REST conventions"

### Procedural Memory
Workflows, habits, and procedures that guide how work is done.

**Examples:**
- "Always run tests before committing"
- "Create feature branches for new work"
- "Update CHANGELOG.md with breaking changes"

### Episodic Memory
Summaries of past conversations, sessions, and events.

**Examples:**
- "Yesterday: Fixed authentication bug in session.ts"
- "Last week: Refactored database layer"
- "Previous session: Implemented caching strategy"

## Context Assembly

The system intelligently assembles context based on what you're doing:

### Push Context (Proactive)
Automatically loaded when:
- Starting a new session
- Opening a file
- Running a command

### Pull Context (On-Demand)
Retrieved when you:
- Ask a question
- Start a new task
- Request context summary

## Automatic Context Inference

**Enabled by default** - the system automatically learns from your conversations and actions:

### From Conversations
- **Preferences**: "I prefer TypeScript" → remembers preference
- **Decisions**: "Let's use React" → records technology choice
- **Problems**: Error discussions → tracks debugging patterns

### From Code Changes
- **Frameworks**: Detects React/Vue/Angular imports
- **Patterns**: Identifies middleware, routing, authentication patterns
- **Architecture**: Learns project structure and conventions

### From Queries
- **Technology choices**: Questions about frameworks/tools
- **Workflow preferences**: How you like to work

**All inferred memories have lower confidence (0.7) and decay over time**, allowing the system to learn while avoiding false assumptions.

## Token Efficiency

The context system uses Progressive Disclosure Architecture to minimize token usage:

- **Tier 1**: Metadata only (~50 tokens per skill)
- **Tier 2**: Instructions (~500 tokens per skill)
- **Tier 3**: Full resources (~2000+ tokens per skill)

This achieves ~90% token reduction compared to loading all resources upfront.

## Examples

### Manual Context Recording (Always Available)
```bash
/context task add "Implement authentication" --priority=high
/context decision "Use JWT tokens for stateless auth" \
  --rationale="Scales better than session-based auth" \
  --tags=security,authentication
/context remember "JWT tokens stored in httpOnly cookies" \
  --type=procedural --tags=security,authentication
```

### Automatic Inference (Happens in Background)
The system automatically learns from natural conversation:

**You say:** "I prefer using TypeScript over JavaScript for type safety"
**System learns:** `User preference: TypeScript for type safety` (declarative memory)

**You say:** "Let's implement this using React hooks"
**System learns:** `Using React hooks for implementation` (procedural memory)

**You ask:** "Should I use Express or Fastify for the API?"
**System learns:** `Considering Express or Fastify for API` (episodic memory)

**You edit code with:** `import React from 'react'`
**System learns:** `Project uses React` (declarative memory)

### Search for Past Decisions
```bash
/context search --tags=architecture
/context search "database" --type=procedural
```

### Export Session for Handoff
```bash
/context export session --format=json --output=session-backup.json
/context export memories --format=markdown --output=memories.md
```

## Integration with Other Commands

The context system integrates with other ai-eng-system commands:

- **`/plan`** - Saves decisions and context for the plan
- **`/work`** - Tracks tasks and progress in the session
- **`/review`** - References past decisions and patterns
- **Agents** - Access memories via the context API

## Performance

Context operations are optimized for speed:
- Session load: <100ms
- Memory search: <50ms
- Context assembly: <200ms

## Configuration

## Per-Project Configuration

**Configuration is per-project** - each project can have its own settings in `.ai-context/config.json`.

### Disable Automatic Inference
If you prefer explicit control over context learning:

```bash
# Create project-specific config
mkdir -p .ai-context
echo '{
  "enableAutoInference": false
}' > .ai-context/config.json
```

### Custom Storage Path
```bash
# Use a different storage directory
echo '{
  "storagePath": ".my-context"
}' > .ai-context/config.json
```

### Full Configuration Options
```json
{
  "storagePath": ".ai-context",
  "maxMemoriesPerType": 100,
  "sessionArchiveDays": 30,
  "confidenceDecayRate": 0.05,
  "enableEmbeddings": false,
  "defaultSkillTier": 1,
  "enableAutoInference": true
}
```

**Note**: Configuration is loaded hierarchically:
1. **Defaults** (built-in)
2. **Project config** (`.ai-context/config.json`)
3. **Runtime overrides** (passed to functions)

## Privacy & Storage

All context data is stored locally in `.ai-context/` directory:
- Not uploaded to any service
- Not shared with Claude or other services
- Fully under your control

Add `.ai-context/` to `.gitignore` to keep it out of version control.
