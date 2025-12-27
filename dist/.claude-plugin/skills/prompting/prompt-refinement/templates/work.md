# Work Phase Template

## Purpose

Clarify execution context to ensure focused, quality implementation that
meets all acceptance criteria and quality gates.

## TCRO for Work/Execution

### Task Questions

Ask to define what's being worked on:

- **What specific task(s) are you working on?**
  - Task ID from plan (e.g., "AUTH-003")
  - Task description
  - Multiple tasks in sequence?

- **Is there a plan file to reference?**
  - Path to `specs/[feature]/plan.md`
  - Path to `specs/[feature]/tasks.md` (if separate)

- **Are you starting fresh or continuing?**
  - First time working on this feature?
  - Continuation from previous session?
  - Which tasks are already completed?

### Context Questions

Ask to understand current state:

- **What's already been completed?**
  - Which tasks from the plan are done?
  - What artifacts have been created? (database, APIs, tests)
  - Any decisions made during implementation?

- **Are there any blockers?**
  - Technical blockers (dependency issues, environment problems)
  - Knowledge blockers (don't know how to implement something)
  - External blockers (waiting on approvals, resources)

- **What's to current branch/state?**
  - Which git branch? (should be feature branch)
  - Any uncommitted changes?
  - Any merge conflicts?

### Requirements Questions

Define quality standards and acceptance criteria:

- **What quality gates must pass?**
  - Lint: `bun run lint`
  - Type check: `bun run type-check`
  - Unit tests: `bun run test:unit`
  - Build: `bun run build`
  - Integration tests: `bun run test:integration`

- **What are the specific acceptance criteria for this task?**
  - From the plan's task definition
  - From the spec's acceptance criteria (if spec exists)

- **What's the definition of done?**
  - Code complete?
  - Tests written?
  - Documentation updated?
  - Committed to git?
  - Ready for code review?

### Output Questions

Define execution approach:

- **Should changes be committed incrementally?**
  - Commit after each task completion
  - Batch commits at the end of phase
  - Commit after each sub-task

- **Is a PR needed at the end?**
  - Draft PR while in progress
  - Ready-for-review PR when all tasks complete
  - No PR (small change, direct merge)

- **Should documentation be updated?**
  - API documentation (e.g., API.md)
  - README files
  - Inline code documentation
  - Architecture documentation

## Work-Specific TCRO Format

Use this format for refined execution prompts:

```text
Task: Implement [task ID or description] from [plan reference]
Context:
  - Plan: [path to plan.md]
  - Spec: [path to spec.md if exists]
  - Branch: [current git branch]
  - Completed: [list of completed task IDs]
  - Blockers: [any known blockers or "None"]
  - Decisions made: [key architectural or technical decisions so far]
Requirements:
  Quality gates:
  1. [ ] Lint passes: `bun run lint`
  2. [ ] Type check passes: `bun run type-check`
  3. [ ] Unit tests pass: `bun run test:unit` (80%+ coverage on new code)
  4. [ ] Build succeeds: `bun run build`
  5. [ ] Integration tests pass: `bun run test:integration` (if applicable)
  Acceptance criteria (from task):
  - [ ] [Specific criterion 1]
  - [ ] [Specific criterion 2]
  - ...
  Definition of done:
  - [ ] Code implementation complete
  - [ ] Tests written and passing
  - [ ] Inline documentation added
  - [ ] Changes committed to git
  - [ ] PR created (if required)
Output:
  - Commits: [incremental per task | batch at end of phase]
  - PR: [draft | ready-for-review | not needed]
  - Documentation: [files to update]
  - Next steps: [what tasks remain in plan]
```

## Quality Gates Sequence

Follow this sequence for EVERY task:

```markdown
## Quality Gate 1: Lint
```bash
bun run lint
```
**Must Pass**: No warnings or errors
- If fails: Fix lint violations, re-commit

## Quality Gate 2: Type Check
```bash
bun run type-check
```
**Must Pass**: No TypeScript errors
- If fails: Fix type errors, re-commit

## Quality Gate 3: Unit Tests
```bash
bun run test:unit
```
**Must Pass**: All tests pass, coverage ≥80%
- If fails: Fix code or tests, re-commit

## Quality Gate 4: Build
```bash
bun run build
```
**Must Pass**: No build errors
- If fails: Fix compilation errors, re-commit

## Quality Gate 5: Integration Tests (if applicable)
```bash
bun run test:integration
```
**Must Pass**: All integration tests pass
- If fails: Fix integration issues, re-commit
```

**NO TASK IS COMPLETE UNTIL ALL GATES PASS**

## Example Transformations

### Example 1: Single Task from Plan

**Input:** "implement login endpoint"

**Phase:** work

**Context from Plan:**
- Plan: specs/auth/plan.md
- Task AUTH-003: Create Login API Endpoint
- Dependencies: AUTH-002 (User Model) is complete
- Branch: feat/auth-system

**Clarifying Questions:**

1. **Task**: Confirmed - implementing AUTH-003 only?
   - [ ] Yes, single task
   - [ ] Multiple tasks (list them)

2. **Context**: What's the current state?
   - [ ] Branch is clean, ready to start
   - [ ] Uncommitted changes from previous session
   - [ ] Any blockers or issues encountered?

3. **Requirements**: Quality gates standard?
   - [ ] Yes, use standard gates (lint, type-check, unit tests, build)
   - [ ] Customize gates for this task

4. **Output**: Commit strategy?
   - [ ] Commit after task completion
   - [ ] Incremental commits (sub-task by sub-task)

**User Responses:**
- Task: AUTH-003 only
- Context: Clean branch, no blockers
- Requirements: Standard quality gates
- Output: Commit after task completion

**Refined TCRO:**

```text
Task: Implement task AUTH-003 (Login API Endpoint) from specs/auth/plan.md
Context:
  - Plan: specs/auth/plan.md
  - Spec: specs/auth/spec.md
  - Branch: feat/auth-system
  - Completed: AUTH-001 (Database schema), AUTH-002 (User model and migrations)
  - Blockers: None
  - Decisions made: Using jose for JWT (from plan), bcrypt for passwords (from plan)
Requirements:
  Quality gates:
  1. [ ] Lint passes: `bun run lint`
  2. [ ] Type check passes: `bun run type-check`
  3. [ ] Unit tests pass: `bun run test:unit` (80%+ coverage on login endpoint)
  4. [ ] Build succeeds: `bun run build`
  5. [ ] Integration tests pass: `bun run test:integration` (login flow test)
  Acceptance criteria (from task AUTH-003):
  - [ ] Endpoint exists at POST /api/auth/login
  - [ ] Accepts email and password in JSON body
  - [ ] Validates email format before processing
  - [ ] Verifies password against bcrypt hash in database
  - [ ] Returns JWT token on successful login (200 status)
  - [ ] Returns 401 with error message on invalid credentials
  - [ ] Returns 400 with validation errors on malformed input
  - [ ] Rate limited to 5 attempts per minute per IP address
  Definition of done:
  - [ ] Login endpoint code implemented in /pages/api/auth/login.ts
  - [ ] Unit tests for success, invalid credentials, and validation errors
  - [ ] Integration test for full login flow
  - [ ] Inline comments explain JWT generation and password verification
  - [ ] Changes committed with message: "AUTH-003 Implement login API endpoint"
  - [ ] API.md updated with login endpoint documentation
Output:
  - Commits: Single commit after task completion
  - PR: Draft PR, will mark as ready-for-review after all auth tasks
  - Documentation: Update API.md with login endpoint details
  - Next steps: AUTH-004 (Password reset endpoint) depends on AUTH-003
```

### Example 2: Continuing Work Session

**Input:** "continue working on auth"

**Phase:** work

**Context from Previous Session:**
- Plan: specs/auth/plan.md
- Branch: feat/auth-system
- Completed: AUTH-001, AUTH-002
- In progress: AUTH-003 (partial implementation)

**Clarifying Questions:**

1. **Task**: What's the current state?
   - [ ] AUTH-003 is partially done (what's left?)
   - [ ] Multiple tasks in progress (which ones?)

2. **Context**: Any blockers?
   - [ ] Previous session encountered issues (describe)
   - [ ] Need to resolve merge conflicts?
   - [ ] Uncommitted changes need to be committed or discarded?

3. **Requirements**: Continue with standard quality gates?
   - [ ] Yes
   - [ ] No, need adjustments (what changes?)

**User Responses:**
- Task: AUTH-003 partially done - endpoint created, tests missing
- Context: No blockers, clean uncommitted changes
- Requirements: Standard gates

**Refined TCRO:**

```text
Task: Complete task AUTH-003 (Login API Endpoint) from specs/auth/plan.md
Context:
  - Plan: specs/auth/plan.md
  - Spec: specs/auth/spec.md
  - Branch: feat/auth-system
  - Completed: AUTH-001 (Database schema), AUTH-002 (User model and migrations)
  - In progress: AUTH-003 (endpoint code written, tests missing)
  - Blockers: None
  - Decisions made: Using jose for JWT, bcrypt for passwords, API route structure in /pages/api/
Requirements:
  Quality gates:
  1. [ ] Lint passes: `bun run lint`
  2. [ ] Type check passes: `bun run type-check`
  3. [ ] Unit tests pass: `bun run test:unit` (80%+ coverage on login endpoint)
  4. [ ] Build succeeds: `bun run build`
  5. [ ] Integration tests pass: `bun run test:integration`
  Acceptance criteria (from task AUTH-003, remaining):
  - [ ] Unit tests for successful login (valid credentials)
  - [ ] Unit tests for invalid credentials (wrong email, wrong password)
  - [ ] Unit tests for validation errors (invalid email format, missing fields)
  - [ ] Integration test for full login flow (call endpoint, receive JWT)
  - [ ] Rate limiting implementation tested
  Definition of done:
  - [ ] All unit tests pass
  - [ ] Integration test passes
  - [ ] Coverage on login endpoint ≥80%
  - [ ] All tests committed
  - [ ] Task marked as complete in plan
Output:
  - Commits: Commit tests with message: "AUTH-003 Add tests for login endpoint"
  - PR: Draft PR updated with test completion
  - Documentation: No additional docs needed (API.md already updated)
  - Next steps: AUTH-004 (Password reset endpoint)
```

### Example 3: Multiple Tasks

**Input:** "implement auth tasks for today"

**Phase:** work

**Context from Plan:**
- Plan: specs/auth/plan.md
- Ready to implement: AUTH-003, AUTH-004, AUTH-005 (no dependencies on each other)
- Branch: feat/auth-system

**Clarifying Questions:**

1. **Task**: Which tasks to implement?
   - [ ] AUTH-003, AUTH-004, AUTH-005 (all in parallel)
   - [ ] Specific subset (list them)

2. **Output**: Commit strategy for multiple tasks?
   - [ ] One commit per task
   - [ ] Single commit with all tasks
   - [ ] Incremental as each completes

**User Responses:**
- Task: AUTH-003, AUTH-004, AUTH-005
- Output: One commit per task

**Refined TCRO:**

```text
Task: Implement tasks AUTH-003 (Login API), AUTH-004 (Logout API), AUTH-005 (Session Validation) from specs/auth/plan.md
Context:
  - Plan: specs/auth/plan.md
  - Spec: specs/auth/spec.md
  - Branch: feat/auth-system
  - Completed: AUTH-001 (Database schema), AUTH-002 (User model and migrations)
  - In progress: None
  - Blockers: None
  - Decisions made: Using jose for JWT, bcrypt for passwords, API route structure in /pages/api/
Requirements:
  Quality gates for EACH task:
  1. [ ] Lint passes: `bun run lint`
  2. [ ] Type check passes: `bun run type-check`
  3. [ ] Unit tests pass: `bun run test:unit` (80%+ coverage per task)
  4. [ ] Build succeeds: `bun run build`
  Acceptance criteria per task:

  **Task AUTH-003: Login API**
  - [ ] POST /api/auth/login accepts email/password
  - [ ] Returns JWT on success (200)
  - [ ] Returns 401 on invalid credentials
  - [ ] Rate limited to 5 attempts/minute

  **Task AUTH-004: Logout API**
  - [ ] POST /api/auth/logout exists
  - [ ] Invalidates JWT token (adds to blacklist or removes from store)
  - [ ] Returns 200 on success

  **Task AUTH-005: Session Validation Middleware**
  - [ ] Middleware function validates JWT token
  - [ ] Attaches user data to request context
  - [ ] Returns 401 for invalid/expired tokens
  Definition of done:
  - [ ] All three endpoints implemented
  - [ ] All endpoints have unit tests (≥80% coverage)
  - [ ] Integration test for login→validate→logout flow
  - [ ] Each task committed separately
  - [ ] All tasks marked complete in plan
Output:
  - Commits: One commit per task in sequence AUTH-003 → AUTH-004 → AUTH-005
  - PR: Draft PR updated with all three task completions
  - Documentation: Update API.md with all three endpoints
  - Next steps: AUTH-006 (Password reset endpoint) - depends on AUTH-005 for user identification
```

## Special Considerations

### Cross-Referencing Spec and Plan

Always cross-reference acceptance criteria:

1. **Task acceptance criteria**: From the plan's task definition
2. **Spec acceptance criteria**: From the specification document
3. **Cross-validation**: Ensure task completion satisfies spec requirements

When a task is complete:
- Check off task criteria in the plan
- Note which spec user stories/acceptance criteria are satisfied
- Update spec.md with `[COMPLETED]` markers or status section

### Handling Failures

When a quality gate fails:

**Lint Failures:**
1. Review lint output
2. Fix violations (auto-fix where possible: `bun run lint --fix`)
3. Re-run lint
4. Commit fixes

**Test Failures:**
1. Review test output
2. Determine if code or test is wrong
3. Fix the issue
4. Re-run tests
5. Commit fixes

**Build Failures:**
1. Review build output
2. Fix compilation errors
3. Re-run build
4. Commit fixes

**Type Check Failures:**
1. Review TypeScript errors
2. Fix type errors
3. Re-run type-check
4. Commit fixes

### Blocked Tasks

If a task has blockers:

```markdown
## Blocked Task

**Task**: TASK-ID (Task Title)
**Blocker**: [Description of blocker]
**Type**: [Technical | Knowledge | External]
**Action Needed**: [What's required to unblock]
**Next Step**: [Continue with other tasks or await unblock]
```

Continue with other unblocked tasks in the plan while blockers are resolved.

### Quality Assurance Checklist

After completing a task, before marking done:

```markdown
## Task Completion Checklist - TASK-ID

- [ ] Code implemented according to plan
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (if applicable)
- [ ] Test coverage meets threshold (≥80%)
- [ ] Inline documentation added
- [ ] No console.log or debug statements
- [ ] Error handling is comprehensive
- [ ] Types are explicit (no `any`)
- [ ] Comments explain "why", not "what"
- [ ] All quality gates pass (lint, type-check, tests, build)
- [ ] Changes committed to git
- [ ] Plan updated with task marked complete
- [ ] Documentation updated (if applicable)
```

Only when ALL items are checked, task is complete.
