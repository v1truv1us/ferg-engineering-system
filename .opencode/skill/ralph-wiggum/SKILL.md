---
name: ralph-wiggum
description: Continuous iteration loop pattern for well-defined tasks with clear completion criteria. Use when getting tests to pass, implementing features with automatic verification, bug fixing with clear success conditions, or running automated development overnight.
version: 1.0.0
tags: [workflow, iteration, automation, continuous, looping]
---

# Ralph Wiggum Continuous Iteration

A while-loop pattern that keeps AI agents working on well-defined tasks until reaching a completion signal.

## Core Philosophy

1. **Iteration > Perfection** - Don't aim for perfect on first try. Let the loop handle refinement.
2. **Failures Are Data** - Feed failures back into the next iteration.
3. **Persistence Wins** - Let the loop handle retry logic automatically.

## When to Use ✅

- **TDD Implementation** - Write failing tests, loop until all tests pass
- **Bug Fixing** - Iteratively debug and fix until verification succeeds
- **Refactoring** - Incremental transformations with test safety
- **Feature Implementation** - Tasks with automatic verification
- **Quality Gate Passing** - Loop until code review, linting, or security scans pass

## When NOT to Use ❌

- Tasks requiring human judgment
- Ambiguous tasks without clear success criteria
- One-shot operations
- Tasks with external dependencies
- Critical production systems

## Safety Measures

### Required Parameters

1. **Max Iterations Cap** - Set 10-50 iterations. Never run unlimited.
2. **Completion Promise** - Unique phrase like `<promise>COMPLETE</promise>`
3. **Progress Monitoring** - Track iteration count
4. **Cancellation Mechanism** - Ability to stop active loop

## Prompt Template

```markdown
Good completion criteria:
Build a REST API for todos.
When complete:
- All CRUD endpoints working
- Input validation in place
- Tests passing (coverage > 80%)
- Output: <promise>COMPLETE</promise>

Bad:
Build a todo API and make it good.
```

## Example Usage

```bash
@full-stack-developer "Get all tests passing in src/auth.

Current Test Failures:
- ✗ auth.test.ts:45 - should validate JWT tokens
- ✗ auth.test.ts:78 - should reject expired tokens

Process:
1. Run failing test
2. Analyze error
3. Fix implementation
4. Re-run test
5. Repeat until all tests pass

Output <promise>ALL_TESTS_PASSING</promise> when done."
```

## Quality Checklist

Before starting a Ralph Wiggum loop:

- [ ] Task has clear, objective success criteria
- [ ] Max-iterations cap is set (recommended: 10-50)
- [ ] Completion promise is unique and verifiable
- [ ] Tests or verification mechanism exists
- [ ] Safety measures in place
