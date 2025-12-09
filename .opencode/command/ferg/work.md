| description | agent |
|---|---|
| Execute a plan or task with systematic tracking | build |

# Work Command

Execute a plan or task with systematic tracking, quality gates, and comprehensive validation.

## Usage

```bash
/work [plan-file-or-task-id]
/work --continue              # Resume interrupted work
/work --validate-only         # Run validation without implementation
/work --dry-run               # Show what would be done
```

## Execution Philosophy

**Quality-First Development**: Every implementation must pass quality gates before moving to the next task. No shortcuts, no technical debt accumulation.

## Phase 1: Setup & Planning

### 1.1 Load Plan or Task
- If argument is a file path: Load from `plans/[filename].md`
- If argument is a task ID: Find in current plan or recent plans
- If `--continue`: Resume from last incomplete task
- Extract all tasks with dependencies and time estimates

### 1.2 Create Feature Branch
```bash
git checkout -b feat/[feature-slug]
```

### 1.3 Optional: Create Git Worktree (for large features)
```bash
git worktree add --detach .worktrees/[feature-slug]
```
Use skill: `skills_devops_git_worktree`

### 1.4 Initialize Todo Tracking
Create a todo list from plan tasks:
- Map each task to a todo item
- Set status to `pending`
- Link to task ID and acceptance criteria
- Estimate total effort

**Example todo structure:**
```
[FEAT-001-A] Create SessionManager class
  Status: pending
  Priority: high
  Time: 30 min
  Depends: None
  Files: src/context/session.ts
```

---

## Phase 2: Task Execution Loop

For each task in dependency order:

### 2.1 Mark Task In Progress
```bash
# Update todo status
todo --mark-in-progress [TASK-ID]
```

### 2.2 Implement Changes
- Read existing code patterns from discovery phase
- Follow project conventions (naming, structure, style)
- Add inline comments for complex logic
- Keep changes focused on task scope

**Quality Checkpoints During Implementation:**
- [ ] Code follows project style guide
- [ ] No console.log or debug statements
- [ ] Error handling is comprehensive
- [ ] Types are explicit (no `any`)
- [ ] Comments explain "why", not "what"

### 2.3 Write/Update Tests
For each file modified:

**Unit Tests** (if applicable):
```typescript
// tests/[module].test.ts
describe('[Component]', () => {
  it('should [behavior]', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

**Integration Tests** (if applicable):
- Test interactions with other modules
- Mock external dependencies
- Verify error scenarios

**Test Coverage Requirements:**
- Minimum 80% line coverage for new code
- 100% coverage for critical paths
- All acceptance criteria have corresponding tests

### 2.4 Run Quality Gates (In Order)

#### Gate 1: Linting
```bash
bun run lint
```
**Must Pass**: No warnings or errors

#### Gate 2: Type Checking
```bash
bun run type-check
```
**Must Pass**: No TypeScript errors

#### Gate 3: Unit Tests
```bash
bun run test:unit
```
**Must Pass**: All tests pass, coverage ≥80%

#### Gate 4: Build
```bash
bun run build
```
**Must Pass**: No build errors or warnings

#### Gate 5: Integration Tests (if applicable)
```bash
bun run test:integration
```
**Must Pass**: All integration tests pass

### 2.5 Commit Changes
```bash
git add [files]
git commit -m "[TASK-ID] Brief description

- Detailed change 1
- Detailed change 2

Acceptance Criteria:
- [x] Criterion 1
- [x] Criterion 2
"
```

**Commit Message Format:**
- First line: `[TASK-ID] Action-oriented summary (50 chars max)`
- Blank line
- Body: Bullet points of what changed
- Blank line
- Acceptance Criteria: Checkboxes showing what's complete

### 2.6 Mark Task Complete
```bash
todo --mark-complete [TASK-ID]
```

---

## Phase 3: Validation & Quality Assurance

### 3.1 Run Full Test Suite
```bash
bun run test
```
- All unit tests pass
- All integration tests pass
- Coverage meets thresholds

### 3.2 Run Full Build
```bash
bun run build
```
- No errors
- No warnings
- Output size acceptable

### 3.3 Type Safety Check
```bash
bun run type-check
```
- No implicit `any`
- All types explicit
- No unused variables

### 3.4 Lint Full Codebase
```bash
bun run lint
```
- No style violations
- Consistent formatting
- No unused imports

### 3.5 Performance Check (if applicable)
```bash
bun run benchmark
```
- No performance regressions
- Bundle size within limits
- Load times acceptable

### 3.6 Security Check (if applicable)
```bash
bun run audit
```
- No known vulnerabilities
- Dependencies up to date
- No security warnings

---

## Phase 4: Documentation & Review

### 4.1 Update Documentation
- [ ] Update README if needed
- [ ] Update CHANGELOG
- [ ] Add JSDoc comments to public APIs
- [ ] Update type definitions if changed

### 4.2 Create Pull Request
```bash
git push origin feat/[feature-slug]
gh pr create --title "[Feature] Brief description" \
  --body "$(cat <<'EOF'
## Summary
[2-3 sentence summary of changes]

## Changes
- [Change 1]
- [Change 2]

## Testing
- [x] Unit tests added
- [x] Integration tests pass
- [x] Manual testing completed

## Checklist
- [x] Code follows style guide
- [x] Tests pass
- [x] Build succeeds
- [x] Documentation updated
EOF
)"
```

### 4.3 Request Review
```bash
/review [pr-url]
```

---

## Quality Gates Summary

| Gate | Command | Must Pass | Failure Action |
|------|---------|-----------|-----------------|
| Lint | `bun run lint` | Yes | Fix violations, re-commit |
| Types | `bun run type-check` | Yes | Fix type errors, re-commit |
| Unit Tests | `bun run test:unit` | Yes | Fix tests or code, re-commit |
| Build | `bun run build` | Yes | Fix build errors, re-commit |
| Integration | `bun run test:integration` | Yes | Fix integration issues, re-commit |
| Full Suite | `bun run test` | Yes | Fix all failures, re-commit |

**No task is complete until ALL gates pass.**

---

## Handling Failures

### If Linting Fails
1. Review lint output
2. Fix violations (auto-fix where possible: `bun run lint --fix`)
3. Re-run lint
4. Commit fixes

### If Tests Fail
1. Review test output
2. Determine if code or test is wrong
3. Fix the issue
4. Re-run tests
5. Commit fixes

### If Build Fails
1. Review build output
2. Fix compilation errors
3. Re-run build
4. Commit fixes

### If Task Becomes Too Large
1. Stop and commit what's working
2. Break remaining work into new tasks
3. Update plan with new tasks
4. Continue with next task

---

## Tracking & Metrics

### During Execution
- Track actual time vs. estimated time
- Note any blockers or issues
- Record decisions made

### After Completion
- Calculate total effort (sum of task times)
- Identify tasks that took longer than estimated
- Note patterns for future planning

### Metrics to Track
| Metric | Purpose |
|--------|---------|
| Estimated vs. Actual Time | Improve future estimates |
| Test Coverage | Ensure quality |
| Build Time | Identify bottlenecks |
| Commit Count | Measure granularity |
| Review Feedback | Improve code quality |

---

## Resuming Interrupted Work

If work is interrupted:

```bash
/work --continue
```

This will:
1. Find the last incomplete task
2. Show its status and acceptance criteria
3. Resume from where you left off
4. Maintain all previous progress

---

## Validation-Only Mode

To validate without implementing:

```bash
/work [plan-file] --validate-only
```

This will:
1. Check all files exist
2. Verify dependencies are resolvable
3. Run type checking on existing code
4. Identify potential issues
5. Report without making changes

---

## Dry-Run Mode

To see what would be done:

```bash
/work [plan-file] --dry-run
```

This will:
1. Show all tasks in order
2. Show dependencies
3. Show files to be modified
4. Show estimated total time
5. Ask for confirmation before proceeding

---

## Best Practices

### During Implementation
- ✅ Commit frequently (after each task)
- ✅ Keep commits focused and atomic
- ✅ Write descriptive commit messages
- ✅ Test as you go
- ✅ Ask for help early if stuck

### Quality Gates
- ✅ Never skip a quality gate
- ✅ Fix issues immediately
- ✅ Don't accumulate technical debt
- ✅ Maintain test coverage
- ✅ Keep build times reasonable

### Communication
- ✅ Update todos regularly
- ✅ Note blockers immediately
- ✅ Ask clarifying questions
- ✅ Request review early
- ✅ Respond to feedback promptly

### Avoiding Common Pitfalls
- ❌ Don't skip tests
- ❌ Don't ignore lint warnings
- ❌ Don't commit broken code
- ❌ Don't make unrelated changes
- ❌ Don't ignore type errors

---

## Integration with Other Commands

| Command | Integration |
|---------|-------------|
| `/plan` | Load plan file as input |
| `/review` | Request code review on PR |
| `/optimize` | Run performance optimization |
| `git worktree` | Use for large features |
| `gh pr create` | Create PR automatically |

---

## Troubleshooting

### "Tests are failing"
1. Run tests with verbose output: `bun run test -- --verbose`
2. Check test output for specific failures
3. Fix code or test as appropriate
4. Re-run tests

### "Build is slow"
1. Check build output: `bun run build --verbose`
2. Identify slow steps
3. Consider code splitting or optimization
4. Use `/optimize` command if needed

### "Too many files to modify"
1. Stop and commit current progress
2. Break remaining work into smaller tasks
3. Update plan with new tasks
4. Continue with next task

### "Unclear acceptance criteria"
1. Stop and ask for clarification
2. Don't guess or assume
3. Update plan with clarified criteria
4. Resume implementation

---

## Success Criteria

A work session is successful when:
- ✅ All tasks completed
- ✅ All quality gates passed
- ✅ All tests passing
- ✅ Build succeeds
- ✅ PR created and reviewed
- ✅ Code merged to main