| description | agent |
|---|---|
| Execute a plan or task with systematic tracking | build |

# Work Command

Execute a plan or task with systematic tracking and quality gates.

## Process

1. **Create feature branch** and optional git worktree for isolation
2. **Break plan into tasks** and create todos for tracking
3. **For each task:**
   - Implement the change
   - Write/update tests
   - Run lint checks
   - Commit with descriptive message
4. **Run full validation:**
   - All tests pass
   - Type checks pass
   - Lint passes
   - Build succeeds
5. **Create PR** with summary of changes
6. **Request review** using `/review` command