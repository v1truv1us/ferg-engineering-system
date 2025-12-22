---
name: ai-eng/clean-comments
description: Optimize code comments by removing redundancy and improving conciseness
agent: build
---

# Clean Comments Command

Specialized command for optimizing code comments by removing redundancy, verbose explanations, and self-evident statements while preserving essential technical context, architectural decisions, and important markers.

## Usage

```bash
/clean comments <file-or-directory> [options]
```

## Targeted Comment Issues

### Category 1: Redundant Function Descriptions
Comments that repeat what the function name already states:
```typescript
// BEFORE: This function calculates the sum of two numbers
function calculateSum(a, b) {
// BEFORE: The following method returns the user by ID
function getUserById(id) {
// BEFORE: Helper function to format date as ISO string
function formatDate(date) {
```

### Category 2: Self-Evident Explanations
Comments explaining obvious code operations:
```typescript
// BEFORE: The following code initializes a counter variable
let count = 0;
// BEFORE: Loop through each element in the array
for (const item of items) {
// BEFORE: Return the calculated total
return total;
```

### Category 3: Verbose Implementation Details
Excessive detail about standard operations:
```typescript
// BEFORE: Declare a variable to store the current page number
let currentPage = 1;
// BEFORE: Check if the user has admin privileges
if (user.isAdmin) {
// BEFORE: Set the property to the new value
obj.property = newValue;
```

### Category 4: Conversational Filler
Non-technical, conversational language in code comments:
```typescript
// BEFORE: As you can see from the implementation above...
// BEFORE: This is where we handle the error case
// BEFORE: Now we will process the data
// BEFORE: This section contains the database queries
```

## Process

### Phase 1: Analysis
1. **Parse Code Structure**: Identify functions, classes, and code blocks
2. **Comment Classification**: Categorize each comment type
3. **Redundancy Detection**: Match comments against function names and signatures
4. **Context Assessment**: Determine if comment adds unique value

### Phase 2: Optimization Strategy
Based on comment type and context:

#### Redundant Function Comments
```typescript
// BEFORE: This function validates email format
function validateEmail(email: string): boolean {
// AFTER: // Validate email format with regex
```

#### Self-Evident Comments
```typescript
// BEFORE: // Initialize the counter to zero
let counter = 0;
// AFTER: // Counter for tracking iterations (no comment needed for obvious init)
```

#### Implementation Details
```typescript
// BEFORE: // Check if the condition is true and return early
if (condition) return;
// AFTER: // Early return for performance optimization
```

### Phase 3: Preservation Rules
Always preserve comments that:

#### Essential Technical Information
- **Algorithm explanations** (non-obvious choices)
- **Performance optimizations** with reasoning
- **Security considerations** and validation logic
- **Error handling** for edge cases
- **Complex business rules** implementation

#### Development Markers
- **TODO:** tasks and improvements needed
- **FIXME:** known issues requiring fixes  
- **HACK:** temporary workarounds
- **NOTE:** important implementation notes
- **WARNING:** critical warnings or limitations
- **PERF:** performance-critical sections
- **REVIEW:** code requiring review

#### Architectural Context
- **Design decisions** and rationale
- **Integration requirements** and dependencies
- **Version compatibility** notes
- **Refactoring considerations** and constraints

## Output Examples

### Preview Mode
```
## Comment Cleanup Preview: src/database.ts

### Analysis:
- Total comments: 24
- Redundant function descriptions: 5
- Self-evident explanations: 8
- Conversational filler: 3
- Essential comments to preserve: 8

### Changes Proposed:

#### Function: calculateTotal(items)
- BEFORE: // This function calculates the sum of all item prices
- AFTER: // Calculate total with tax calculation included

#### Function: validateUser(user)  
- BEFORE: // The following method checks if the user has valid email
- AFTER: // Validate email and check admin status

#### Line 45:
- BEFORE: // Initialize the user object
- AFTER: // (comment removed, initialization is obvious)

#### Line 89:
- BEFORE: // This is where we handle the error case
- AFTER: // Handle database connection errors

### Impact:
- Comments removed: 11 (46% reduction)
- Comments improved: 5 (21% enhancement)  
- Essential comments preserved: 8 (33% maintained)
- Code functionality: 100% preserved
```

### Apply Mode
```
Cleaning comments in src/database.ts... ✓
- Removed 8 redundant function descriptions
- Eliminated 6 self-evident explanations
- Improved 4 verbose comments
- Preserved all TODOs, FIXMEs, and architectural notes
- Total reduction: 45% comment volume

Cleaning comments in utils/helpers.ts... ✓
- Removed 5 redundant descriptions
- Enhanced 2 implementation detail comments
- Preserved all performance notes and security considerations

Summary:
✓ 2 files processed
✓ 18 comments optimized
✓ 47% comment volume reduction
✓ 100% code functionality preserved
✓ All essential technical information maintained
```

## Options

- `-m, --mode <mode>`: Optimization level (conservative|moderate|aggressive) [default: moderate]
- `-p, --preview`: Show preview without applying changes
- `-a, --apply`: Apply confirmed changes
- `-r, --recursive`: Process directory recursively
- `-o, --output <file>`: Save results to file
- `-f, --force`: Skip confirmation prompts
- `-v, --verbose`: Show detailed analysis
- `-k, --keep <list>`: Comma-separated comment types to preserve
- `--preserve-todos`: Always preserve TODO/FIXME markers [default: true]
- `--preserve-warnings`: Always preserve security/performance warnings [default: true]

## Mode Behaviors

### Conservative Mode
- Remove only obvious redundancy (>0.9 confidence)
- Keep most explanatory comments
- Preserve uncertain improvements
- Prioritize safety over optimization

### Moderate Mode
- Remove clear redundancy (>0.7 confidence)  
- Improve obvious verbose comments
- Keep technical explanations
- Balance optimization with clarity

### Aggressive Mode
- Remove most redundancy (>0.5 confidence)
- Maximize comment conciseness
- Keep only essential technical notes
- Prioritize brevity over detailed explanations

## Integration

### With Development Workflow
```bash
# Clean before commit
git add .
/clean comments src/ --apply
git commit -m "Optimize code comments"

# Clean during code review
/clean comments src/ --preview --mode aggressive

# Clean entire project
/clean comments . --recursive --apply
```

### With Other Commands
- `/work`: Apply comment optimization during implementation
- `/review`: Include comment quality in code review
- `/optimize`: Enhance cleaned code for better performance

## Quality Assurance

### Preservation Guarantees
- **Never** remove TODO, FIXME, HACK, NOTE, WARNING markers
- **Never** remove security or performance critical comments
- **Never** alter code functionality or logic
- **Never** remove architectural decision rationale
- **Always** preserve error handling explanations

### Validation Checks
- [ ] Code compiles and runs correctly
- [ ] All tests pass after comment changes
- [ ] No TODO/FIXME markers accidentally removed
- [ ] Essential technical information preserved
- [ ] Comment grammar and spelling maintained

## Advanced Features

### Comment Enhancement
Instead of just removing, enhance when possible:
```typescript
// BEFORE: // Function to check if user is admin
// AFTER: // Check admin status with role-based access control
```

### Pattern Learning
Learn project-specific comment patterns:
```json
{
  "projectPatterns": {
    "redundantPhrases": ["helper function for", "utility method that"],
    "preservePhrases": ["performance critical", "security check"],
    "contextSpecific": {
      "database": ["connection pool", "transaction handling"],
      "authentication": ["role validation", "permission check"]
    }
  }
}
```

## Success Metrics

Successful comment optimization achieves:
- **Reduction**: 30-60% fewer unnecessary comments
- **Clarity**: Improved code readability without losing context
- **Maintainability**: Better separation of essential vs. obvious information
- **Team Efficiency**: Faster code review and onboarding

Systematically optimize code comments while preserving all essential technical information and development context.