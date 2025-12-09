| description | agent |
|---|---|
| Create a detailed implementation plan for a feature | plan |

# Plan Command

Create a structured, atomic implementation plan for: $ARGUMENTS

## Planning Philosophy

**Atomic Plans**: Every plan should be decomposed into small, independently completable chunks that:
- Can be implemented in a single focused session (15-60 minutes)
- Have clear start and end states
- Are testable in isolation
- Don't require context from unfinished sibling tasks

## Process

### Phase 1: Discovery (Research Mode)

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

### Phase 2: Task Decomposition

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
| Estimated Time | Time box | `30 min` |
| Complexity | Low / Medium / High | `Medium` |

### Phase 3: Risk Assessment

For each phase, identify:

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| (risk description) | High/Med/Low | High/Med/Low | (strategy) |

### Phase 4: Testing Strategy

Define testing approach for each phase:

- **Unit Tests**: What functions/classes need tests?
- **Integration Tests**: What interactions need verification?
- **Manual Testing**: What scenarios to validate?
- **Regression Checks**: What existing functionality could break?

### Phase 5: SEO & Performance Considerations

If applicable:
- Core Web Vitals impact
- Bundle size changes
- API response times
- Caching strategies

## Output Format

### File: `plans/[YYYY-MM-DD]-[feature-slug].md`

```markdown
# [Feature Name] Implementation Plan

**Status**: Draft | In Progress | Complete
**Created**: [date]
**Estimated Effort**: [hours/days]
**Complexity**: Low | Medium | High

## Overview
[2-3 sentence summary]

## Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

## Architecture
[Diagram or description of component relationships]

## Phase 1: [Phase Name]

**Goal**: [What this phase accomplishes]
**Duration**: [Estimated time]

### Task 1.1: [Task Title]
- **ID**: FEAT-001-A
- **Depends On**: None
- **Files**: 
  - `path/to/file.ts` (modify)
  - `path/to/new-file.ts` (create)
- **Acceptance Criteria**:
  - [ ] Criterion 1
  - [ ] Criterion 2
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

## Rollback Plan
[How to revert if something goes wrong]

## References
- [Link to relevant docs]
- [Link to similar implementations]
```

## Post-Planning Actions

After generating the plan:

1. **Review with user** - Confirm scope and priorities
2. **Create GitHub issue** (optional) - Link to plan file
3. **Estimate total effort** - Sum of all task estimates
4. **Identify parallel tracks** - Tasks without dependencies that can run concurrently

## Tips for Effective Plans

- **Timeboxing**: If a task exceeds 60 minutes, break it down further
- **Dependencies**: Minimize cross-task dependencies to enable parallel work
- **Checkpoints**: Each phase should end with a working (possibly incomplete) state
- **Escape hatches**: Note where you could stop and still have value
- **Evidence-based**: Include file paths and code snippets from discovery