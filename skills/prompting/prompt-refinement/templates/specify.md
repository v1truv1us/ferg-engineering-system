# Specify Phase Template

## Purpose

Clarify feature requests to produce complete, unambiguous specifications that
can drive implementation with minimal ambiguity.

## TCRO for Specification

### Task Questions

Ask to define what's being built:

- **What problem are you solving?**
  - What pain point or opportunity is this addressing?
  - Is this a new feature, enhancement, or fix?

- **What capability should users have when this is done?**
  - What can users do that they couldn't do before?
  - What's the primary user journey?

- **Is this part of a larger initiative?**
  - Is this a standalone feature or one of several related features?
  - Are there dependencies on other features?

### Context Questions

Ask to understand environment and constraints:

- **Who are the users of this feature?**
  - End users, internal users, admins, or multiple personas?
  - What's their skill level and context?

- **What's the broader system this fits into?**
  - New greenfield project or adding to existing codebase?
  - Which modules/services does this interact with?

- **What triggered this need?**
  - User feedback or requests?
  - Business requirement?
  - Technical debt or limitation?
  - Competitive pressure?

- **Are there existing patterns to follow?**
  - Similar features already implemented?
  - Design system or UI patterns to match?
  - Architectural patterns in the codebase?

### Requirements Questions

Define what's needed and constraints:

- **What are must-have requirements?**
  - What's absolutely required for launch?
  - What defines "done" for this feature?

- **What are nice-to-have requirements?**
  - What would be great but isn't critical?
  - What could be deferred to a later iteration?

- **Are there security/compliance requirements?**
  - GDPR, SOC2, HIPAA, or other regulations?
  - Authentication/authorization requirements?
  - Data privacy considerations?

- **Are there performance requirements?**
  - Response time targets?
  - Scalability requirements?
  - Resource usage limits?

- **What are the acceptance criteria for "done"?**
  - How do we know this feature is complete and working?
  - What tests or validation are needed?

### Output Questions

Define specification format and depth:

- **Do you need user stories?**
  - [ ] Full user stories with format "As a [persona], I want [capability], so that [benefit]"
  - [ ] Requirements list only
  - [ ] Use cases without user story format

- **Should this include non-functional requirements (NFRs)?**
  - Security requirements
  - Performance requirements
  - Availability/reliability requirements
  - Maintainability requirements
  - Accessibility requirements

- **What level of detail is needed?**
  - High-level (user stories and basic requirements)
  - Detailed (acceptance criteria, edge cases, error handling)
  - Technical (includes data model, API contracts)

- **Should this include UI/UX considerations?**
  - [ ] Yes, include wireframes or flow descriptions
  - [ ] Yes, high-level UX flows only
  - [ ] No, backend-only specification

## Specify-Specific TCRO Format

Use this format for refined specification prompts:

```text
Task: Specify [feature/capability name]
Context:
  - Users: [who will use this - personas, roles]
  - System: [what system/module this is part of]
  - Trigger: [why this is needed now - business driver or user feedback]
  - Existing patterns: [patterns to follow from codebase - UI, architecture, API]
Requirements:
  Must-have:
  1. [Core requirement]
  2. [Core requirement]
  ...
  Nice-to-have:
  1. [Enhancement]
  2. [Enhancement]
  ...
  Non-functional:
  - Security: [authentication, authorization, data privacy requirements]
  - Performance: [response times, throughput, latency targets]
  - Availability: [uptime requirements, degradation handling]
  - Maintainability: [logging, monitoring, documentation]
  - Compliance: [regulatory requirements if applicable]
  Acceptance criteria:
  1. [Measurable criteria]
  2. [Measurable criteria]
  ...
Output:
  - Location: specs/[feature-name]/spec.md
  - Include: [user stories, acceptance criteria, NFRs, UI/UX]
  - Format: Spec Kit compatible markdown structure
  - Mark ambiguities with [NEEDS CLARIFICATION: question]
```

## Markers for Ambiguity

**CRITICAL**: When a requirement is unclear, explicitly mark it rather than guessing:

```markdown
### [NEEDS CLARIFICATION: Which authentication method?]
The system should support user login.

Options to clarify with user:
- Email/password
- OAuth (Google, GitHub, etc.)
- API keys
- Multi-factor authentication (MFA)
```

Do NOT assume or make default choices. Mark it and let user clarify before implementation.

## Example Transformations

### Example 1: Very Vague Input

**Input:** "need some auth stuff"

**Phase:** specify

**Clarifying Questions:**

1. **Task**: What authentication capability do you need?
   - [ ] User login/logout with email/password
   - [ ] OAuth/SSO integration (Google, GitHub, etc.)
   - [ ] API key management for service-to-service auth
   - [ ] Multi-factor authentication (MFA)
   - [ ] Password reset and account recovery
   - Other: _________

2. **Context**: What's prompting this?
   - [ ] New project, starting from scratch
   - [ ] Adding auth to existing application
   - [ ] Replacing existing auth system
   - What's your tech stack?

3. **Requirements**: What are must-haves?
   - [ ] User registration
   - [ ] Email/password login
   - [ ] Session management (JWT, cookies, sessions)
   - [ ] Password reset via email
   - [ ] Rate limiting (brute force protection)
   - [ ] Two-factor authentication (2FA)

   **Nice-to-haves:**
   - [ ] Social login (Google, GitHub)
   - [ ] Remember me functionality
   - [ ] Account email verification
   - [ ] User profile management

   **Non-functional:**
   - Security: [ ] GDPR compliance for EU users
   - Security: [ ] Password strength requirements
   - Performance: [ ] Login completes within 500ms (p95)
   - Performance: [ ] Supports 1000 login requests/second

4. **Acceptance Criteria**: How do we know it's done?
   - [ ] Users can register new accounts
   - [ ] Users can login with valid credentials
   - [ ] Invalid credentials show error message
   - [ ] Password reset email is sent
   - [ ] Users can logout
   - [ ] All endpoints are rate limited

5. **Output**: What format?
   - [ ] Full spec with user stories and acceptance criteria
   - [ ] High-level requirements only
   - [ ] Include UI/UX flows

**User Responses:**
- Task: User login, password reset
- Context: Adding to existing Next.js app with PostgreSQL
- Requirements: Must-have: email/password, JWT sessions, password reset
- Acceptance: All core flows work and are tested
- Output: Full spec with NFRs

**Refined TCRO:**

```text
Task: Specify user authentication system with login and password reset capabilities
Context:
  - Users: End users accessing web application
  - System: Existing Next.js 14 application with PostgreSQL database
  - Trigger: User feedback and business requirement to secure application
  - Existing patterns: API routes in /pages/api/, Prisma ORM in /lib/db.ts
Requirements:
  Must-have:
  1. User registration with email and password
  2. Email/password login with secure password hashing
  3. JWT-based session management with 24-hour token expiry
  4. Password reset flow via email delivery
  5. Rate limiting on login endpoints (5 attempts/minute)
  6. Basic user profile accessible after login
  Nice-to-have:
  1. Email verification for new accounts
  2. "Remember me" functionality with longer-lived tokens
  3. Social login (Google, GitHub) integration
  Non-functional:
  - Security: Passwords hashed with bcrypt (cost factor 12), JWT tokens signed with RS256
  - Security: Rate limiting to prevent brute force attacks
  - Performance: Login request completes within 200ms (p95), supports 500 req/sec
  - Compliance: GDPR-compliant data handling for EU users, no passwords in logs
  Acceptance criteria:
  1. Users can successfully register new accounts with valid email/password
  2. Users can login with correct credentials and receive JWT token
  3. Invalid credentials show clear error message without revealing existence
  4. Password reset email is delivered within 30 seconds of request
  5. Password reset link is time-limited and single-use
  6. Rate limiting prevents more than 5 login attempts per minute
  7. User profile endpoint returns user data with valid JWT token
Output:
  - Location: specs/auth/spec.md
  - Include: User stories with "As a..." format, acceptance criteria per story, NFRs for security and performance
  - Format: Spec Kit compatible markdown structure
```

### Example 2: More Specific Input

**Input:** "users should be able to change their password while logged in"

**Phase:** specify

**Clarifying Questions:**

1. **Context**: Is this part of existing auth system?
   - [ ] Yes, extending existing authentication
   - [ ] No, standalone password change feature

2. **Requirements**: What are security considerations?
   - [ ] Require current password to confirm
   - [ ] Send email confirmation before change
   - [ ] Invalidate existing sessions after change
   - [ ] Password strength requirements

3. **UX**: What's the user experience?
   - [ ] Simple form (current password, new password, confirm)
   - [ ] Success message after change
   - [ ] Logout and re-login required?
   - [ ] Password strength indicator

**User Responses:**
- Context: Yes, adding to existing auth
- Requirements: Require current password, invalidate sessions
- UX: Simple form, success message, logout after change

**Refined TCRO:**

```text
Task: Specify password change functionality for logged-in users
Context:
  - Users: Already authenticated users managing their accounts
  - System: Existing JWT-based authentication system
  - Trigger: User self-service requirement to improve account security
  - Existing patterns: Follow API route patterns in /pages/api/auth/, use Prisma for database operations
Requirements:
  Must-have:
  1. Authenticated users can change their password while logged in
  2. Current password must be provided and validated before change
  3. New password must meet security requirements (minimum 8 chars, mix of letters/numbers/symbols)
  4. All existing sessions are invalidated after password change (forces re-login)
  5. Success message displayed after password change
  Nice-to-have:
  1. Password strength indicator during typing
  2. Confirmation email sent after password change
  Non-functional:
  - Security: Password comparison done securely (timing-attack resistant)
  - Security: All JWT tokens for user are blacklisted on password change
  Acceptance criteria:
  1. User can submit current password, new password, and confirmation
  2. Form validates that new password and confirmation match
  3. Form validates that new password meets strength requirements
  4. Current password is verified against stored hash before update
  5. New password is hashed with bcrypt (cost factor 12) and stored
  6. All existing JWT tokens for user are invalidated
  7. Success message is displayed: "Your password has been changed. Please log in again."
  8. User is redirected to login page
Output:
  - Location: specs/auth/password-change/spec.md
  - Include: User story, acceptance criteria, NFRs
  - Format: Spec Kit compatible markdown structure
```

## Special Considerations

### Spec Kit Compatibility

Specifications should be compatible with Spec Kit's template structure:

```markdown
# [Feature Name]

## Overview
[2-3 sentence description]

## User Stories

### US-001: [Story Title]
**As a** [user type]
**I want** [capability]
**So that** [benefit]

#### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Non-Functional Requirements

### Security
- [Requirement]

### Performance
- [Requirement]

## [NEEDS CLARIFICATION: question]
[Ambiguous requirement or detail]
```

### Integration with CLAUDE.md

When reading CLAUDE.md for context, extract:

- **Philosophy**: Simplicity, pragmatism, user-centric, etc.
- **Tech Stack Preferences**: Preferred libraries, frameworks
- **Architectural Principles**: Patterns to follow or avoid
- **Quality Standards**: Testing requirements, code review standards

Incorporate these into specification as constraints and considerations.

### Multiple Related Features

If specification covers multiple related features:
1. Create top-level spec for overall capability
2. Break down into individual user stories per feature
3. Show relationships and dependencies between stories
4. Provide roadmap or priority if appropriate
