# Research Phase Template

## Purpose

Clarify research requests to ensure focused, actionable investigation that delivers
maximum value to the specification or planning process.

## TCRO for Research

### Task Questions

Ask to clarify what knowledge is being sought:

- **What specific knowledge are you seeking?**
  - Is this about a technology, pattern, best practice, or implementation detail?
  - What's the core question you're trying to answer?

- **Is this exploratory or targeted research?**
  - Exploratory: "What are my options for X?"
  - Targeted: "How should I implement X using Y?"

- **What decision will this research inform?**
  - Will this inform a technical choice?
  - Is this for a specification or implementation plan?
  - What's the deadline for making the decision?

### Context Questions

Ask to understand the environment and existing knowledge:

- **What's the scope of research?**
  - Codebase only (internal patterns and decisions)
  - External sources (GitHub projects, documentation, blogs)
  - Both (understand internal context, research external options)

- **What do you already know about this topic?**
  - What have you already researched or implemented?
  - What assumptions or constraints are you starting with?

- **What's the broader system this fits into?**
  - Is this for a new feature, enhancement, or fix?
  - What are the architectural constraints?

### Requirements Questions

Define research depth and constraints:

- **How deep should this research go?**
  - **Shallow**: Quick overview, 1-2 hours
  - **Medium**: Balanced depth, 3-5 hours
  - **Deep**: Comprehensive investigation, 5+ hours

- **Are there specific sources to prioritize or avoid?**
  - Specific frameworks/libraries to research?
  - Sources to exclude (outdated, not applicable)?
  - Specific documentation or blog posts to include?

- **What are the focus areas?**
  - Performance considerations?
  - Security implications?
  - Maintenance and operational concerns?
  - Developer experience and ergonomics?

- **What's the time constraint?**
  - When is this research needed by?
  - Is this blocking other work?

### Output Questions

Define deliverable format:

- **What format do you need?**
  - Executive summary (key findings only)
  - Detailed report (comprehensive with examples)
  - Recommendations with pros/cons
  - Code samples and patterns

- **Where should this research be saved?**
  - `docs/research/[date]-[topic].md`
  - `specs/[feature]/research.md` (part of feature spec)
  - Console output only

- **How will this research be used?**
  - Feed into a specification via `/ai-eng/specify`
  - Inform an implementation plan via `/ai-eng/plan`
  - Standalone for reference

## Research-Specific TCRO Format

Use this format for refined research prompts:

```text
Task: Research [specific topic/question]
Context:
  - Decision to inform: [what decision this enables]
  - Existing knowledge: [what's already known]
  - Scope: [codebase|external|both]
  - Architectural constraints: [if applicable]
Requirements:
  - Depth: [shallow|medium|deep]
  - Sources: [specific sources or "all"]
  - Focus areas: [performance, security, maintenance, DX, etc.]
  - Time constraint: [if any]
Output:
  - Format: [summary|detailed|recommendations|examples]
  - Location: [path to save research]
  - Feed into: [specify|plan|standalone]
```

## Example Transformations

### Example 1: Vague Input

**Input:** "look into how other projects do caching"

**Phase:** research

**Clarifying Questions:**

1. **Task**: What type of caching are you interested in?
   - [ ] HTTP response caching
   - [ ] Database query caching
   - [ ] In-memory caching (Redis, Memcached)
   - [ ] CDN caching
   - [ ] Application-level caching strategies

2. **Context**: What's prompting this research?
   - Performance issue you're experiencing?
   - Planning a new feature that needs caching?
   - Evaluating caching options for a new project?
   - What's your current stack? (Next.js, Django, etc.)

3. **Requirements**: How deep should this go?
   - [ ] Shallow: Quick overview of options (1-2 hours)
   - [ ] Medium: Detailed analysis of 2-3 approaches (3-5 hours)
   - [ ] Deep: Comprehensive investigation with benchmarks (5+ hours)

   **Focus areas:**
   - [ ] Performance considerations
   - [ ] Cache invalidation strategies
   - [ ] Implementation complexity
   - [ ] Operational overhead

4. **Output**: What do you need?
   - [ ] Summary of options with pros/cons
   - [ ] Detailed research with code examples
   - [ ] Specific recommendation for your stack
   - Where should this be saved? `docs/research/2025-12-26-caching-patterns.md`

**User Responses:**
- Task: Application-level caching for API responses
- Context: Building REST API with Node.js, seeing 500ms response times
- Requirements: Medium depth, focus on performance and invalidation
- Output: Detailed research with recommendations

**Refined TCRO:**

```text
Task: Research caching patterns and implementations for REST API response optimization
Context:
  - Decision to inform: Choosing caching strategy to reduce API response times
  - Existing knowledge: Currently no caching, experiencing ~500ms response times on high-traffic endpoints
  - Scope: External (open source projects, best practices, documentation)
  - Stack: Node.js with Express, PostgreSQL database
Requirements:
  - Depth: Medium (3-5 hours)
  - Sources: GitHub projects, Redis documentation, performance blogs, Express middleware patterns
  - Focus areas: Performance benchmarks, cache invalidation strategies, implementation complexity, operational overhead
  - Time constraint: Needed for planning phase by end of week
Output:
  - Format: Detailed research with code examples, pros/cons of each approach, specific recommendation for Node.js/Express stack
  - Location: docs/research/2025-12-26-caching-patterns.md
  - Feed into: /ai-eng/specify for caching feature specification
```

### Example 2: More Specific Input

**Input:** "research Prisma ORM vs TypeORM for PostgreSQL"

**Phase:** research

**Clarifying Questions:**

1. **Context**: What's your use case?
   - [ ] New greenfield project
   - [ ] Migrating from existing ORM
   - [ ] Adding database layer to existing codebase
   - What type of application? (API, web app, mobile backend)

2. **Requirements**: What's most important?
   - [ ] Type safety and TypeScript integration
   - [ ] Performance for complex queries
   - [ ] Migration support and schema management
   - [ ] Developer experience and learning curve

3. **Output**: What level of detail?
   - [ ] Feature comparison table
   - [ ] Code examples for common patterns
   - [ ] Specific recommendation

**User Responses:**
- Context: New API project with Node.js/TypeScript
- Requirements: Type safety critical, migration support needed
- Output: Detailed comparison with recommendation

**Refined TCRO:**

```text
Task: Research and compare Prisma ORM vs TypeORM for PostgreSQL in TypeScript API project
Context:
  - Decision to inform: Selecting ORM for new REST API backend
  - Existing knowledge: Familiar with basic SQL concepts, evaluating ORMs for first time
  - Scope: External (documentation, GitHub issues, comparison blogs, benchmarks)
  - Stack: Node.js, TypeScript, PostgreSQL, Express API framework
Requirements:
  - Depth: Medium (thorough comparison focused on key criteria)
  - Sources: Official documentation, GitHub repositories, community discussions, performance benchmarks
  - Focus areas: Type safety and TypeScript integration, migration and schema management support, performance for common query patterns, developer experience and learning curve, ecosystem and plugin support
Output:
  - Format: Detailed comparison with feature table, code examples for common patterns (CRUD, relationships, migrations), specific recommendation based on criteria
  - Location: docs/research/2025-12-26-orm-comparison.md
  - Feed into: /ai-eng/specify for data access layer specification
```

## Special Considerations

### Research That Feeds Into Specification

When research will inform `/ai-eng/specify`, ensure:

- Focus on functional requirements (what capabilities are needed)
- Consider user experience implications
- Note constraints that affect specification scope
- Identify edge cases or ambiguities that should be marked `[NEEDS CLARIFICATION]`

### Research That Feeds Into Planning

When research will inform `/ai-eng/plan`, ensure:

- Focus on technical implementation details
- Consider architectural trade-offs
- Evaluate maintenance and operational concerns
- Provide concrete implementation patterns or code examples

### Multi-Agent Research

For complex research topics, the `/ai-eng/research` command uses multi-agent orchestration:

- **Discovery phase**: Parallel agents find sources, patterns, documentation
- **Analysis phase**: Sequential agents synthesize findings
- **Synthesis phase**: Consolidated recommendations

Clarifying questions should set expectations for this process.
