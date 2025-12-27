---
name: ai-eng/specify
description: Create a feature specification using structured requirements gathering
agent: plan
---

# Specify Command

Create a comprehensive feature specification by gathering requirements
through structured clarification using the TCRO framework.

## Usage

```bash
/ai-eng/specify [feature-description]
/ai-eng/specify [feature] --from-research=<path>
/ai-eng/specify [feature] --template=<template-name>
```

## Options

- `--from-research <path>`: Use existing research document as context
- `--template <name>`: Use a specific specification template
- `--output <path>`: Custom output path (default: `specs/[feature]/spec.md`)
- `--no-confirmation`: Skip confirmation prompts
- `--verbose`: Show detailed process

## Process

### Step 0: Prompt Refinement
Use skill: `prompt-refinement`
Phase: `specify`

[The prompt-refinement skill will transform your input into a structured TCRO format by asking clarifying questions about: task, context, requirements, and output format.]

### Step 1: Read Project Context

Load `CLAUDE.md` from project root to understand:
- Project philosophy and core principles
- Tech stack preferences
- Quality standards and conventions
- Naming conventions
- Architectural patterns

If `CLAUDE.md` doesn't exist:
- Proceed with generic defaults
- Note in output: "No project constitution found, using generic defaults"

### Step 2: Load Research (if specified)

If `--from-research` flag is provided:
1. Read the research document
2. Extract key findings and recommendations
3. Use findings to inform specification requirements
4. Reference research in specification's "Context" section

### Step 3: Gather Requirements

Using the refined TCRO prompt from Step 0:

#### Define User Stories

Create user stories using the format:

```markdown
### US-001: [Story Title]
**As a** [user type/role]
**I want** [specific capability]
**So that** [tangible benefit]

#### Acceptance Criteria
- [ ] [Specific, measurable criterion]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
```

#### Define Non-Functional Requirements

Document constraints for:
- **Security**: Authentication, authorization, data privacy
- **Performance**: Response times, throughput, latency targets
- **Availability**: Uptime requirements, degradation handling
- **Maintainability**: Logging, monitoring, documentation
- **Compliance**: Regulatory requirements (GDPR, SOC2, HIPAA, etc.)
- **Accessibility**: WCAG levels, screen reader support

#### Mark Ambiguities

Use `[NEEDS CLARIFICATION: question]` for any unclear requirements:

```markdown
## [NEEDS CLARIFICATION: Which OAuth providers?]
The system should support social login integration.

Options to clarify later:
- Google OAuth
- GitHub OAuth
- Apple Sign in
- Multiple providers
```

### Step 4: Generate Specification

Output: `specs/[feature-name]/spec.md`

#### Specification Structure

```markdown
# [Feature Name]

## Overview
[2-3 sentence summary of what this feature provides]

## Context
### User Personas
- [Persona 1]: Description
- [Persona 2]: Description

### System Context
- What system/module this is part of
- Integration points with other systems
- Existing patterns to follow

### Research Context
[If `--from-research` was used, summarize key findings]
- Key finding 1
- Key finding 2
- Recommendation: [from research]

## User Stories

### US-001: [Story Title]
**As a** [user type]
**I want** [capability]
**So that** [benefit]

#### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### US-002: [Story Title]
[... more user stories ...]

## Non-Functional Requirements

### Security
- [Requirement 1]
- [Requirement 2]

### Performance
- [Requirement 1]
- [Requirement 2]

### Availability & Reliability
- [Requirement 1]

### Maintainability
- [Requirement 1]

### Compliance
[If applicable]
- [Requirement 1]

### Accessibility
[If applicable]
- [Requirement 1]

## Open Questions
[NEEDS CLARIFICATION markers and unresolved questions]

## Success Criteria
- [ ] All [NEEDS CLARIFICATION] markers resolved
- [ ] All user stories have acceptance criteria
- [ ] All non-functional requirements defined
- [ ] Success criteria are measurable
- [ ] Specification validated by user
```

### Step 5: Validate Specification

Run validation checklist:

```markdown
## Specification Validation

### Completeness
- [ ] All user stories have acceptance criteria
- [ ] Non-functional requirements are defined for:
  - [ ] Security
  - [ ] Performance
  - [ ] Maintainability
- [ ] Compliance requirements identified (if applicable)

### Clarity
- [ ] No unresolved [NEEDS CLARIFICATION] markers remain
- [ ] All requirements are testable
- [ ] All requirements are unambiguous

### Alignment
- [ ] Aligned with CLAUDE.md philosophy
- [ ] Aligned with tech stack preferences
- [ ] Aligned with quality standards

### Measurability
- [ ] Success criteria are specific and measurable
- [ ] Acceptance criteria can be verified through testing
- [ ] Performance requirements have concrete targets
```

If validation fails:
- Ask clarifying questions to address gaps
- Update specification with new information
- Re-validate until all checks pass

### Step 6: Confirm with User

Display summary and ask for confirmation:

```markdown
## Specification Ready

**Feature**: [Feature Name]
**Location**: specs/[feature-name]/spec.md

**User Stories**: N
**Acceptance Criteria**: M total
**Non-Functional Requirements**: N total
**Open Questions**: N [NEEDS CLARIFICATION] markers

## Summary
[Brief overview of specification content]

Proceed with creating this specification? (y/n/edit)
```

- **y**: Write specification to file
- **n**: Ask more clarifying questions, refine specification
- **edit**: Allow manual edits before finalizing

## Output Structure

```
specs/[feature-name]/
└── spec.md
```

## Integration

### Feeds Into
- `/ai-eng/plan` - Reads spec.md to create implementation plan
- `/ai-eng/work` - Validates task completion against spec acceptance criteria

### Reads From
- `CLAUDE.md` - Project context and philosophy
- `docs/research/*.md` - Optional research context via `--from-research`

## Example Usage

### Example 1: Simple Feature Specification

```bash
# User provides vague input
/ai-eng/specify "user authentication"

# Step 0: Prompt refinement skill asks clarifying questions
# (see examples in prompt-refinement/templates/specify.md)

# After clarification, generates spec
```

**Output:**
```
specs/auth/spec.md

# User Authentication System

## Overview
Provides secure user account creation, login, and password reset functionality
for the application.

## User Stories

### US-001: User Registration
**As a** new user
**I want** to create an account
**So that** I can access the application

#### Acceptance Criteria
- [ ] User can register with email and password
- [ ] Email format is validated
- [ ] Password must be at least 8 characters
- [ ] User account is created in database
- [ ] User receives confirmation email

### US-002: User Login
**As a** registered user
**I want** to log in with email and password
**So that** I can access my account

#### Acceptance Criteria
- [ ] User can login with correct credentials
- [ ] Invalid credentials show error message
- [ ] Login rate limited to 5 attempts per minute

## Non-Functional Requirements

### Security
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens signed with RS256
- GDPR-compliant data handling

### Performance
- Login completes within 200ms (p95)
- Supports 500 login requests per second

## Success Criteria
- [ ] All user stories have acceptance criteria
- [ ] All non-functional requirements defined
- [ ] Ready for planning phase
```

### Example 2: Spec with Research Context

```bash
# User specifies research to use
/ai-eng/specify "API caching layer" --from-research=docs/research/2025-12-26-caching-patterns.md

# Specification incorporates research findings
```

**Output includes:**
```markdown
## Context

### Research Context
Key findings from docs/research/2025-12-26-caching-patterns.md:

1. **Recommended Cache Strategy**: Redis for in-memory caching
   - Pros: Fast sub-millisecond response times
   - Cons: Additional infrastructure complexity
2. **Cache Invalidation**: Time-to-live (TTL) + explicit invalidation
   - TTL: 5 minutes for user data, 30 minutes for static content
3. **Implementation Pattern**: Middleware-based cache interceptor
   - Place before route handlers
   - Check cache before hitting database
   - Set cache after successful database query

Recommendation: Use Redis with middleware pattern and 5-minute TTL for dynamic data
```

## Best Practices

### Writing User Stories

Use the "As a... I want... So that..." format consistently:

**Bad:**
```markdown
Users should be able to reset passwords
```

**Good:**
```markdown
**As a** registered user who forgot their password
**I want** to reset my password via email
**So that** I can regain access to my account
```

### Writing Acceptance Criteria

Make criteria specific, measurable, and testable:

**Bad:**
```markdown
- [ ] Login works
- [ ] Fast performance
```

**Good:**
```markdown
- [ ] POST /api/auth/login accepts email and password
- [ ] Returns 200 with JWT token for valid credentials
- [ ] Returns 401 for invalid credentials
- [ ] Login completes within 200ms (p95)
```

### Marking Ambiguities

Never guess or make assumptions. Always mark unclear requirements:

```markdown
## [NEEDS CLARIFICATION: What OAuth providers?]
The system should support social login.
```

When implementing, if ambiguity is discovered:
1. Add `[NEEDS CLARIFICATION]` marker
2. Don't implement ambiguous requirement
3. Ask user to clarify before proceeding

### Non-Functional Requirements

Always consider these categories:

| Category | Questions to Answer |
|-----------|---------------------|
| Security | Authentication, authorization, encryption, data privacy? |
| Performance | Response times, throughput, concurrency, latency? |
| Availability | Uptime targets, degradation handling, backup/recovery? |
| Maintainability | Logging, monitoring, documentation, debuggability? |
| Compliance | GDPR, SOC2, HIPAA, PCI-DSS, industry regulations? |
| Accessibility | WCAG 2.1 AA, screen readers, keyboard navigation? |

## Troubleshooting

### "Specification too vague"

1. Use `--verbose` flag to see prompt-refinement questions
2. Answer clarifying questions thoroughly
3. Provide concrete examples of desired behavior
4. Reference existing similar features or systems

### "Don't know what to include"

1. Start with core user stories (happy path)
2. Add edge cases and error scenarios
3. Consider non-functional requirements systematically
4. Review CLAUDE.md for project patterns

### "Too many [NEEDS CLARIFICATION] markers"

1. Prioritize high-value questions
2. Make reasonable assumptions and note them
3. Proceed with assumptions, validate later
4. Document assumptions in specification

## Success Criteria

Successful specification achieves:
- ✅ Well-structured user stories with acceptance criteria
- ✅ All non-functional requirements defined
- ✅ Ambiguities marked with [NEEDS CLARIFICATION]
- ✅ Aligned with project philosophy (CLAUDE.md)
- ✅ Ready to feed into `/ai-eng/plan`
- ✅ User reviewed and approved
