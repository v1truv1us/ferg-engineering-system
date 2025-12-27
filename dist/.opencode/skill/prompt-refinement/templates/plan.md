# Plan Phase Template

## Purpose

Clarify implementation approach to produce actionable, atomic technical plans
that can be executed systematically with clear success criteria.

## TCRO for Planning

### Task Questions

Ask to define what's being implemented:

- **What are you implementing?**
  - Reference specification if exists: "per specs/[feature]/spec.md"
  - Is this greenfield development or modifying existing code?
  - What's the scope of changes? (new module, enhancement, refactor)

- **What's the high-level architecture?**
  - Monolith, microservices, serverless?
  - New system or modification to existing architecture?
  - Integration points with other systems?

### Context Questions

Ask to understand technical environment:

- **What's the tech stack?**
  - Languages and frameworks?
  - Database(s) and ORMs?
  - API patterns (REST, GraphQL, WebSocket)?
  - Frontend frameworks if applicable?

- **Are there architectural constraints?**
  - Scalability requirements?
  - Deployment environment (cloud, on-prem)?
  - Infrastructure limits (memory, CPU, storage)?

- **What existing patterns should be followed?**
  - Error handling patterns?
  - Logging and monitoring patterns?
  - Database transaction patterns?
  - API design patterns?

- **What's the timeline and priority?**
  - Is this urgent/critical or standard priority?
  - Deadline or release target?
  - Are there dependencies on other work?

### Requirements Questions

Define technical constraints and quality standards:

- **What are the technical constraints?**
  - Framework/library versions to use?
  - Dependencies on existing code or services?
  - Database schema constraints?
  - External API limitations?

- **Are there performance requirements?**
  - Response time targets?
  - Throughput/throughput requirements?
  - Resource usage limits?

- **What testing approach is needed?**
  - Unit test coverage requirement? (e.g., 80% minimum)
  - Integration tests scope?
  - End-to-end tests needed?
  - Performance tests needed?

- **Are there deployment considerations?**
  - Which environments? (dev, staging, production)
  - Deployment strategy? (blue-green, rolling, feature flags)
  - Database migrations needed?
  - Configuration changes needed?

### Output Questions

Define plan format and task granularity:

- **How granular should tasks be?**
  - Fine-grained (15-30 minute chunks)
  - Medium-grained (1-2 hour chunks)
  - Coarse-grained (day-long chunks)

- **Should this include detailed artifacts?**
  - [ ] Data models/schemas (data-model.md)
  - [ ] API contracts/definitions (contracts/)
  - [ ] Technical research (research.md)

- **What's the task format?**
  - [ ] Simple checklist
  - [ ] Detailed breakdown with acceptance criteria per task
  - [ ] Phased approach (Phase 1, Phase 2, etc.)

## Plan-Specific TCRO Format

Use this format for refined planning prompts:

```text
Task: Create implementation plan for [feature] based on [spec reference]
Context:
  - Tech stack: [languages, frameworks, databases, ORMs]
  - Architecture: [monolith, microservices, serverless, integration points]
  - Existing patterns: [patterns from codebase - error handling, logging, API design]
  - Timeline: [deadline, priority level, dependencies]
Requirements:
  Technical constraints:
  1. [Framework/library requirements]
  2. [Database schema constraints]
  3. [API/protocol requirements]
  Performance requirements:
  - Response time targets: [p50, p95, p99]
  - Throughput requirements: [requests/second, users/second]
  - Resource limits: [memory, CPU, storage]
  Testing approach:
  - Unit tests: [coverage requirement, libraries]
  - Integration tests: [scope, tools]
  - E2E tests: [critical flows to test]
  - Performance tests: [if needed]
  Deployment:
  - Environments: [dev, staging, production]
  - Strategy: [blue-green, rolling, feature flags]
  - Migrations: [database migrations, config changes]
Output:
  - Location: specs/[feature-name]/plan.md
  - Include: [tasks with acceptance criteria, data-model.md, contracts/, research.md]
  - Task granularity: [15-30 min chunks with clear dependencies]
  - Task format: [detailed with acceptance criteria per task]
```

## Task Decomposition Guidelines

### Atomic Tasks

Each task should be:
- **Independently completable**: Can be done without touching unfinished sibling tasks
- **Testable in isolation**: Can be validated without other tasks
- **Has clear start/end state**: Know when task is complete
- **Timeboxed**: 15-60 minutes maximum

### Task Dependencies

Map dependencies clearly:
- Task B depends on Task A: `Depends On: TASK-A`
- Independent tasks can run in parallel: mark with `[P]` or state "No dependencies"
- Document why dependency exists (e.g., "needs API endpoint from TASK-A")

### Acceptance Criteria Per Task

Each task needs acceptance criteria:
- **Specific, measurable**: Not "improve UX" but "add loading indicator"
- **Testable**: Can write a test to verify
- **Complete**: Task isn't done until all criteria pass

Example:
```markdown
### Task AUTH-003: Create Login API Endpoint
- **ID**: AUTH-003
- **Depends On**: AUTH-002 (User Model)
- **Files**:
  - `src/api/auth/login.ts` (create)
- **Acceptance Criteria**:
  - [ ] Endpoint exists at POST /api/auth/login
  - [ ] Accepts email and password in JSON body
  - [ ] Validates email format
  - [ ] Verifies password against bcrypt hash
  - [ ] Returns JWT token on successful login (200 status)
  - [ ] Returns 401 with error message on invalid credentials
  - [ ] Returns 400 on validation errors
  - [ ] Rate limited to 5 attempts per minute
- **Time**: 45 min
- **Complexity**: Medium
```

## Example Transformations

### Example 1: Plan from Existing Spec

**Input:** "create auth implementation plan"

**Phase:** plan

**Context from Spec:**
- Spec exists at: specs/auth/spec.md
- Features: User registration, email/password login, password reset
- Tech stack from spec: Next.js, PostgreSQL, Prisma ORM

**Clarifying Questions:**

1. **Task**: Implementation scope confirmed?
   - [ ] Full authentication system (registration, login, reset)
   - [ ] Subset of features only
   - [ ] Which features first?

2. **Context**: Any additional technical constraints?
   - [ ] Must use specific libraries? (already have jose for JWT, bcrypt for passwords)
   - [ ] Email service integration? (using existing service or new?)
   - [ ] Database migrations approach?

3. **Requirements**: Testing requirements?
   - [ ] Unit test coverage target? (e.g., 80%)
   - [ ] Integration tests for all endpoints?
   - [ ] E2E tests for critical flows?
   - [ ] Security tests (OWASP Top 10)?

4. **Output**: Task granularity?
   - [ ] Fine-grained (15-30 min chunks)
   - [ ] Medium-grained (1-2 hr chunks)

**User Responses:**
- Task: All features in spec
- Context: Use existing email service, follow migration pattern
- Requirements: 80% unit coverage, integration tests for all endpoints
- Output: Fine-grained tasks

**Refined TCRO:**

```text
Task: Create implementation plan for user authentication system per specs/auth/spec.md
Context:
  - Tech stack: Next.js 14, PostgreSQL, Prisma ORM, jose for JWT, bcrypt for passwords
  - Architecture: Monolith with API routes, integrates with existing email service
  - Existing patterns: API route structure in /pages/api/, Prisma migrations in /prisma/migrations/, error handling from src/lib/errors.ts
  - Timeline: High priority, needed for next release in 2 weeks
Requirements:
  Technical constraints:
  1. Must use Next.js API routes (no Express)
  2. Must use Prisma ORM for database operations
  3. Must use jose library for JWT signing/verification (already in package.json)
  4. Must use bcrypt with cost factor 12 for password hashing
  5. Must integrate with existing email service in src/lib/email.ts
  Performance requirements:
  - Login request completes within 200ms (p95)
  - Supports 500 concurrent login requests
  - Password reset email sent within 30 seconds
  Testing approach:
  - Unit tests: Minimum 80% coverage on all new code
  - Integration tests: All API endpoints (register, login, reset)
  - E2E tests: Login flow and password reset flow
  - Security tests: Rate limiting, brute force resistance
  Deployment:
  - Environments: Staging for testing, production release with feature flag
  - Strategy: Database migrations first, then code deployment
  - Migrations: Create User table, indexes on email for uniqueness
Output:
  - Location: specs/auth/plan.md
  - Include: Atomic tasks with acceptance criteria, data-model.md, contracts/auth-api.json
  - Task granularity: 15-30 minute chunks with clear dependencies
  - Task format: Detailed breakdown with ID, dependencies, files, acceptance criteria, time estimate, complexity
```

### Example 2: Plan Without Existing Spec

**Input:** "plan caching implementation for API"

**Phase:** plan

**Clarifying Questions:**

1. **Task**: What needs caching?
   - [ ] Entire API responses
   - [ ] Specific endpoints (which ones?)
   - [ ] Database query results

2. **Context**: What's the tech stack?
   - Frontend: [ ]
   - Backend: [ ]
   - Database: [ ]

3. **Requirements**: Caching strategy preference?
   - [ ] In-memory (Redis)
   - [ ] CDN (Cloudflare, AWS)
   - [ ] Application-level (LRU cache)

4. **Output**: What detail level?
   - [ ] Full plan with tasks
   - [ ] High-level architecture only

**User Responses:**
- Task: Cache frequently accessed endpoints
- Context: Next.js API with PostgreSQL
- Requirements: Use Redis for in-memory caching
- Output: Full implementation plan

**Refined TCRO:**

```text
Task: Create implementation plan for API response caching to reduce load on PostgreSQL
Context:
  - Tech stack: Next.js 14 API routes, PostgreSQL database, no caching currently
  - Architecture: Monolith API, looking to add caching layer
  - Existing patterns: API middleware pattern in src/lib/middleware.ts
  - Timeline: Performance improvement initiative, targeted for next month
Requirements:
  Technical constraints:
  1. Must add Redis to tech stack (currently not present)
  2. Must work with Next.js API routes (middleware pattern)
  3. Must integrate with existing database connection pool
  4. Must provide cache invalidation mechanism
  Performance requirements:
  - Cache hit ratio: Target 70%+ for cached endpoints
  - Response time reduction: 50% improvement on cached endpoints
  - Database load reduction: 60% reduction in queries for cached data
  Testing approach:
  - Unit tests: Cache get/set/delete operations
  - Integration tests: Middleware behavior with cache hit/miss
  - Performance tests: Measure cache hit ratio and response times
  Deployment:
  - Environments: Dev (local Redis), Staging (shared Redis), Production (Redis cluster)
  - Strategy: Deploy Redis infrastructure first, then add caching layer
  - Migrations: No database migrations (Redis is separate)
Output:
  - Location: specs/caching/plan.md
  - Include: Tasks for Redis setup, middleware integration, cache invalidation, monitoring
  - Task granularity: 30-minute chunks with dependencies
  - Task format: Detailed with acceptance criteria per task
```

## Special Considerations

### Spec-Driven Planning

When specification exists:
1. Read all user stories and acceptance criteria from spec
2. Each user story becomes one or more tasks in the plan
3. Ensure all spec acceptance criteria are covered by task acceptance criteria
4. Map spec requirements to technical implementation details

### Risk Assessment

Include risk assessment in plan:
```markdown
## Risks

| Risk | Impact | Likelihood | Mitigation |
|-------|---------|------------|------------|
| Email service rate limits | High | Medium | Implement queue with retry logic |
| JWT token theft | High | Low | Short expiry, refresh token rotation |
| Database migration failure | High | Low | Dry-run migrations first, rollback plan |
```

### Rollback Plan

For each deployment, define rollback procedure:
```markdown
## Rollback Plan

If deployment fails:
1. Rollback database migration: `bun run prisma migrate resolve --rolled-back [version]`
2. Revert code deployment: `git revert [commit-hash]`
3. Restart services: `bun run restart`
4. Verify system is operational: Run smoke tests
```

### Quality Gates

Define quality gates for the implementation:
```markdown
## Quality Gates

All tasks must pass these gates before moving to next task:
- [ ] Lint passes: `bun run lint`
- [ ] Type check passes: `bun run type-check`
- [ ] Unit tests pass: `bun run test:unit`
- [ ] Build succeeds: `bun run build`
- [ ] No console.log in production code
- [ ] Error handling implemented for all endpoints
```

### Task Organization Options

Choose organization based on complexity:

**Simple Features**: Linear task list
```markdown
### Task List
1. TASK-001: Setup
2. TASK-002: Core Implementation
3. TASK-003: Testing
```

**Medium Features**: Phased approach
```markdown
## Phase 1: Foundation
- TASK-001: Setup
- TASK-002: Configuration

## Phase 2: Core Features
- TASK-003: Feature A
- TASK-004: Feature B

## Phase 3: Polish
- TASK-005: Testing
- TASK-006: Documentation
```

**Complex Features**: Tracked by components
```markdown
## Component: Database
- TASK-001: Schema
- TASK-002: Migrations

## Component: API
- TASK-003: Endpoints
- TASK-004: Middleware

## Component: Frontend
- TASK-005: UI Components
- TASK-006: Integration
```
