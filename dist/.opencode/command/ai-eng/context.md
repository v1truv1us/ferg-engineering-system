| description | agent |
|---|---|
| Manage session state, memories, and context engineering | build |

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

## Token Efficiency

The context system uses Progressive Disclosure Architecture to minimize token usage:

- **Tier 1**: Metadata only (~50 tokens per skill)
- **Tier 2**: Instructions (~500 tokens per skill)
- **Tier 3**: Full resources (~2000+ tokens per skill)

This achieves ~90% token reduction compared to loading all resources upfront.

## Examples

### Track a Feature Implementation
```bash
/context task add "Implement user authentication" --priority=high
/context decision "Use JWT tokens for stateless auth" \
  --rationale="Scales better than session-based auth" \
  --tags=security,authentication
/context remember "JWT tokens stored in httpOnly cookies" \
  --type=procedural --tags=security,authentication
```

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

The context system integrates with other ferg-engineering commands:

- **`/plan`** - Saves decisions and context for the plan
- **`/work`** - Tracks tasks and progress in the session
- **`/review`** - References past decisions and patterns
- **Agents** - Access memories via the context API

## Performance

Context operations are optimized for speed:
- Session load: <100ms
- Memory search: <50ms
- Context assembly: <200ms

## Privacy & Storage

All context data is stored locally in `.ferg-context/` directory:
- Not uploaded to any service
- Not shared with Claude or other services
- Fully under your control

Add `.ferg-context/` to `.gitignore` to keep it out of version control.