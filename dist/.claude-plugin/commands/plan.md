---
name: ai-eng/plan
description: Create a detailed implementation plan for a feature with spec-driven support
agent: plan
---

# Plan Command

Create a structured, atomic implementation plan for: $ARGUMENTS

## Usage

```bash
/ai-eng/plan [description] [options]
/ai-eng/plan --from-spec=<path> [options]
```

### Options

- `--from-spec <path>`: Load specification from file (e.g., `specs/auth/spec.md`)
- `--swarm`: Use Swarms multi-agent orchestration instead of legacy coordinator
- `-s, --scope <scope>`: Plan scope (architecture|implementation|review|full) [default: full]
- `-r, --requirements <reqs...>`: List of specific requirements
- `-c, --constraints <constraints...>`: List of constraints to consider
- `-o, --output <file>`: Output plan file [default: `specs/[feature]/plan.md`]
- `-v, --verbose`: Enable verbose output

## Planning Philosophy

**Atomic Plans**: Every plan should be decomposed into small, independently completable chunks that:
- Can be implemented in a single focused session (15-60 minutes)
- Have clear start and end states
- Are testable in isolation
- Don't require context from unfinished sibling tasks

**Spec-Driven**: When specification exists, plan is derived from spec requirements:
- Each user story maps to one or more tasks
- All spec acceptance criteria must be covered by plan
- Non-functional requirements become technical constraints

## Process

### Phase 0: Prompt Refinement
Use skill: `prompt-refinement`
Phase: `plan`

[The prompt-refinement skill will transform your input into a structured TCRO format by asking clarifying questions about task, context, requirements, and output format.]

### Phase 1: Load Specification (if exists)

If `--from-spec` flag is provided:
1. **Read specification** from `specs/[feature]/spec.md`
2. **Extract user stories** and their acceptance criteria
3. **Extract non-functional requirements** (security, performance, etc.)
4. **Identify open questions** marked with `[NEEDS CLARIFICATION]`
5. **Use as foundation** for technical planning

If no spec is found:
- Warn user: "No specification found. Consider running `/ai-eng/specify` first to create a detailed specification."
- Offer: "Proceed with inline requirements gathering? (y/n)"
- If yes, gather requirements through clarifying questions
- If no, exit and prompt user to run `/ai-eng/specify`

### Phase 2: Discovery (Research Mode)

#### Subagent Communication Protocol (Minimal)

If you delegate discovery to subagents (recommended for large codebases), include a small Context Handoff Envelope in each Task prompt.

Use:

```text
<CONTEXT_HANDOFF_V1>
Goal: (1 sentence)
Scope: (codebase|docs|external|all)
Known constraints: (bullets; optional)
What I already checked: (bullets; optional)
Files/paths to prioritize: (bullets; optional)
Deliverable: (what you must return)
Output format: RESULT_V1
</CONTEXT_HANDOFF_V1>
```

And require:

```text
<RESULT_V1>
RESULT:
EVIDENCE:
OPEN_QUESTIONS:
NEXT_STEPS:
CONFIDENCE: 0.0-1.0
</RESULT_V1>
```

1. **Codebase Analysis**
   - Search for similar patterns and implementations
   - Identify existing conventions and styles
   - Map related files and dependencies
   - Document findings with file paths and line numbers

2. **Tech Stack Detection**
   - Identify frameworks, libraries, and tools in use
   - Check package.json/requirements/go.mod for dependencies
   - Note version constraints and compatibility requirements

3. **Scope Definition**
   - List all files that will be modified
   - List all new files to be created
   - Identify integration points with existing code
   - Flag potential breaking changes

### Phase 3: Technical Planning

#### From Specification (if exists)

For each user story in spec:
1. **Map to technical tasks**: Break user story into implementation tasks
2. **Define acceptance criteria**: Derive from spec acceptance criteria
3. **Apply technical constraints**: From spec's non-functional requirements

Example mapping:
```markdown
**User Story**: US-001 User Registration
→ Task REG-001: Create User database model
→ Task REG-002: Implement registration API endpoint
→ Task REG-003: Add email validation
→ Task REG-004: Implement password hashing
```

#### Inline Requirements (if no spec)

If proceeding without specification:
- Use clarifying questions to gather requirements
- Define technical approach
- Document assumptions and constraints

### Phase 4: Task Decomposition

Break the feature into **atomic tasks** using this hierarchy:

```
Epic (the full feature)
└── Phase (logical grouping, ~1 day)
    └── Task (atomic unit, ~30 min)
        └── Subtask (if task is still too large)
```

**Each atomic task MUST include:**

| Field | Description | Example |
|-------|-------------|---------|
| ID | Unique identifier | `FEAT-001-A` |
| Title | Action-oriented name | "Create SessionManager class" |
| Depends On | Blocking task IDs | `FEAT-001-B` (or "None") |
| Files | Exact files to modify/create | `src/context/session.ts` |
| Acceptance Criteria | Checkboxes that define "done" | `[ ] Class exports correctly` |
| Spec Reference | Links to user story/acceptance criteria | `US-001: AC-2` |
| Estimated Time | Time box | `30 min` |
| Complexity | Low / Medium / High | `Medium` |

### Phase 5: Generate Supporting Artifacts

Based on feature type and technical approach, generate:

#### data-model.md (if database involved)

```markdown
# Data Model

## Entities

### User
```typescript
{
  id: string (UUID, primary key)
  email: string (unique, indexed)
  password_hash: string (bcrypt)
  created_at: timestamp
  updated_at: timestamp
}
```

## Relationships

- User has many Sessions
- Session belongs to User

## Indexes

- `users_email_unique` on (email) for uniqueness
- `users_created_at` for sorting
```

#### contracts/ (if API involved)

```markdown
# API Contracts

## POST /api/auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user_id": "uuid-here"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid email format"
}
```
```

#### research.md (if technical decisions needed)

Document decisions made during planning:
- Technology choices with rationale
- Trade-offs considered
- Alternatives evaluated

### Phase 6: Risk Assessment

For each phase, identify:

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| (risk description) | High/Med/Low | High/Med/Low | (strategy) |

### Phase 7: Testing Strategy

Define testing approach for each phase:

- **Unit Tests**: What functions/classes need tests?
- **Integration Tests**: What interactions need verification?
- **Manual Testing**: What scenarios to validate?
- **Regression Checks**: What existing functionality could break?

**Spec-driven validation**: Ensure all spec acceptance criteria have corresponding tests

## Output Format

### Directory: `specs/[feature-name]/`

```
specs/[feature-name]/
├── spec.md              # From /ai-eng/specify (if exists)
├── plan.md              # Implementation plan (this file)
├── tasks.md             # Task breakdown (optional separate file)
├── data-model.md         # Data schemas (if applicable)
├── research.md           # Technical research (if applicable)
└── contracts/            # API contracts (if applicable)
    ├── api-spec.json
    └── signalr-spec.md
```

### File: `specs/[feature-name]/plan.md`

```markdown
# [Feature Name] Implementation Plan

**Status**: Draft | In Progress | Complete
**Created**: [date]
**Specification**: specs/[feature-name]/spec.md (if exists)
**Estimated Effort**: [hours/days]
**Complexity**: Low | Medium | High

## Overview
[2-3 sentence summary of technical approach]

## Specification Reference

[If spec exists, summarize user stories and their technical mapping]

### User Stories → Tasks Mapping

| User Story | Tasks | Status |
|-------------|--------|--------|
| US-001 | TASK-001, TASK-002 | Pending |
| US-002 | TASK-003 | Pending |

## Architecture
[Diagram or description of component relationships]

## Phase 1: [Phase Name]

**Goal**: [What this phase accomplishes]
**Duration**: [Estimated time]

### Task 1.1: [Task Title]
- **ID**: FEAT-001-A
- **Depends On**: None
- **User Story**: US-001 (if from spec)
- **Files**:
  - `path/to/file.ts` (modify)
  - `path/to/new-file.ts` (create)
- **Acceptance Criteria**:
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] Spec AC: [Link to spec acceptance criteria]
  - [ ] Tests pass
- **Time**: 30 min
- **Complexity**: Low

### Task 1.2: [Task Title]
[...]

## Phase 2: [Phase Name]
[...]

## Dependencies
- [External dependency 1]
- [Internal dependency 1]

## Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|

## Testing Plan
### Unit Tests
- [ ] Test for [component]

### Integration Tests
- [ ] Test [interaction]

### Spec Validation
- [ ] All user stories have corresponding tasks
- [ ] All spec acceptance criteria are covered by task acceptance criteria
- [ ] Non-functional requirements are implemented

## Rollback Plan
[How to revert if something goes wrong]

## References
- [Link to specification] (if exists)
- [Link to research findings]
- [Link to similar implementations]
```

### Optional: Separate tasks.md

If tasks.md is generated separately:

```markdown
# [Feature Name] Tasks

## Task List

### PRIORITY TRACK - Can execute in parallel
- [ ] TASK-001
- [ ] TASK-002

### TRACK - After PRIORITY TRACK completes
- [ ] TASK-003
- [ ] TASK-004

## Task Details

### TASK-001: [Task Title]
**ID**: TASK-001
**User Story**: US-001
**Depends On**: None
**Estimated**: 30 min
**Status**: Pending | In Progress | Complete

#### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

#### Files
- `file1.ts` (create)
- `file2.ts` (modify)
```

## Post-Planning Actions

After generating the plan:

1. **Review with user** - Confirm scope and priorities
2. **Create GitHub issue** (optional) - Link to plan file
3. **Estimate total effort** - Sum of all task estimates
4. **Identify parallel tracks** - Tasks without dependencies that can run concurrently
5. **Validate spec coverage** (if spec exists) - Ensure all spec requirements are covered

## Tips for Effective Plans

- **Timeboxing**: If a task exceeds 60 minutes, break it down further
- **Dependencies**: Minimize cross-task dependencies to enable parallel work
- **Checkpoints**: Each phase should end with a working (possibly incomplete) state
- **Escape hatches**: Note where you could stop and still have value
- **Evidence-based**: Include file paths and code snippets from discovery
- **Spec-driven**: Ensure all spec acceptance criteria have corresponding task acceptance criteria

## Integration

### Feeds Into
- `/ai-eng/work` - Reads plan.md for task execution
- Validates task completion against spec.md acceptance criteria

### Reads From
- `specs/[feature]/spec.md` - User stories, acceptance criteria, NFRs
- `CLAUDE.md` - Project philosophy and constraints
- `docs/research/*.md` - Optional research context

## Example Usage

### Example 1: Plan from Existing Spec

```bash
# User provides feature name (spec already exists)
/ai-eng/plan --from-spec=specs/auth

# Step 0: Prompt refinement skill asks planning-specific questions
# Step 1: Loads spec from specs/auth/spec.md
# Step 2: Maps user stories to technical tasks
# Step 3: Generates plan.md, data-model.md, contracts/
# Step 4: Validates spec coverage
```

### Example 2: Plan Without Spec (Inline)

```bash
# User provides description without spec
/ai-eng/plan "implement JWT-based authentication"

# Step 0: Prompt refinement asks planning questions
# Step 1: Warns about missing spec, offers to proceed
# Step 2: Gathers requirements through clarification
# Step 3: Generates plan.md
```

## Best Practices

### Spec-Driven Planning

When specification exists:
1. **Map each user story to tasks**: Don't miss any requirements
2. **Trace acceptance criteria**: Each spec AC should have task AC
3. **Document decisions**: Why specific tech choices were made
4. **Mark dependencies**: Which tasks must come before others

### Cross-Reference

Always cross-reference between artifacts:
- Tasks reference user stories (US-001)
- Acceptance criteria reference spec acceptance criteria (AC-2)
- Data models reference user story requirements

### Task Independence

Ensure tasks are truly atomic:
- Can you complete it without touching unfinished sibling tasks?
- Is it testable in isolation?
- Does it have clear start and end states?

## Success Criteria

Successful planning achieves:
- ✅ All tasks are atomic and independently completable
- ✅ Dependencies are clearly documented
- ✅ All spec acceptance criteria are covered (if spec exists)
- ✅ Supporting artifacts generated (data-model, contracts)
- ✅ Risk assessment completed
- ✅ Testing strategy defined
- ✅ Ready to feed into `/ai-eng/work`
