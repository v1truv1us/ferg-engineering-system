---
name: ai-eng/optimize
description: Interactive optimization for prompts, code, queries, and more using research-backed techniques and web best practices
agent: build
---

# Optimize Command

Interactive optimization tool that enhances content using research-backed techniques, web-researched best practices, and iterative refinement based on user feedback.

## Usage

```bash
/optimize <content> --type=<type> [options]
/optimize "Help me debug this slow query" --prompt
/optimize "SELECT * FROM users WHERE active = true" --query  
/optimize "function to calculate total" --code
/optimize "Fix authentication bug in production" --commit
```

## Types

| Type | Purpose | Examples |
|------|---------|-----------|
| `prompt` | Optimize AI prompts for better responses | User prompts to AI models |
| `query` | Enhance database/search queries | SQL, search, API queries |
| `code` | Improve code quality and performance | Functions, algorithms, scripts |
| `commit` | Optimize git commit messages | Commit text, PR descriptions |
| `docs` | Enhance documentation clarity | README files, API docs |
| `email` | Improve communication effectiveness | Professional emails, messages |

## Options

- `-t, --type <type>`: Content type (prompt|query|code|commit|docs|email) [default: auto-detect]
- `-s, --source <sources>`: Research sources (anthropic|openai|opencode|all) [default: all]
- `-i, --interactive`: Enable interactive refinement with questions
- `-p, --preview`: Show optimization preview before applying
- `-a, --apply`: Apply confirmed optimizations
- `-o, --output <file>`: Save optimized content to file
- `-f, --force`: Apply optimizations without confirmation
- `-v, --verbose`: Show detailed research and optimization process
- `--questions`: Ask clarifying questions before optimization
- `-m, --mode <mode>`: Optimization approach (conservative|moderate|aggressive) [default: moderate]

## Process

### Phase 1: Content Analysis
1. **Type Detection**: Auto-detect content type if not specified
2. **Context Assessment**: Analyze content's purpose, audience, and constraints
3. **Quality Evaluation**: Identify areas for improvement (clarity, performance, effectiveness)
4. **Research Planning**: Determine best sources and techniques to apply

### Phase 2: Research & Best Practices
Based on type and sources, research:

#### For Prompts
- **Anthropic Documentation**: Best practices for Claude interaction
- **OpenAI Guides**: Prompt engineering for GPT models
- **OpenCode/Crush**: Community-tested optimization patterns
- **Academic Research**: Latest papers on prompt optimization

#### For Code
- **Language-Specific**: Performance patterns for target language
- **Algorithm Optimization**: Time/space complexity improvements
- **Style Guides**: Community conventions and idiomatic code
- **Security Best Practices**: Input validation, error handling

#### For Queries
- **Database-Specific**: Index optimization, execution plans
- **Search Engine**: Relevant algorithms and indexing strategies
- **API Design**: REST patterns, GraphQL optimization

#### For Documentation
- **Technical Writing**: Clarity, structure, examples
- **API Documentation**: OpenAPI/Swagger best practices
- **User Experience**: Progressive disclosure, troubleshooting guides

### Phase 3: Interactive Enhancement (when enabled)

#### Clarifying Questions
Based on content type and context:

**For Prompts:**
- What specific AI model are you targeting?
- What level of technical detail is needed?
- Are there constraints (tokens, format, style)?

**For Code:**
- What are the performance requirements?
- Are there style guide constraints?
- What is the deployment environment?

**For Queries:**
- What is the data size and distribution?
- Are there index considerations?
- What are the latency requirements?

**For Documentation:**
- Who is the target audience?
- What is their technical level?
- Are there regulatory or compliance requirements?

#### User Feedback Loop
```markdown
## Optimization Proposal

### Analysis:
- **Type**: SQL Query Optimization
- **Issues**: Missing indexes, inefficient JOIN, no LIMIT clause
- **Performance Impact**: High (millions of rows)

### Proposed Changes:
1. **Add composite index** on (user_id, status, created_at)
2. **Refactor JOIN** to use indexed columns first
3. **Add pagination** with LIMIT and OFFSET for large results
4. **Add query monitoring** for performance tracking

### Research Sources:
- PostgreSQL Documentation: Query Planning and Optimization
- Database Performance Blog: Index Best Practices  
- OpenSource Community Solutions: Similar query patterns

### Questions for You:
1. **Index Size**: What's the approximate table size (rows, growth rate)?
2. **Write Frequency**: How often are INSERTs/UPDATEs vs SELECTs?
3. **Consistency Requirements**: Can we accept slightly stale data for performance?

Do you want to proceed with these optimizations? (y/n/suggest modifications)
```

### Phase 4: Optimization Application

#### Technique Application
Based on research and feedback:

**For Prompts:**
- Apply incentive-based prompting (stakes, expert persona, step-by-step reasoning)
- Add structured output requirements
- Include self-evaluation prompts
- Optimize for specific model's capabilities

**For Code:**
- Implement performance optimizations
- Improve error handling and validation
- Enhance readability and maintainability
- Add appropriate comments and documentation

**For Queries:**
- Restructure for better execution plans
- Add appropriate indexes
- Optimize JOIN order and predicates
- Add query result caching considerations

**For Documentation:**
- Improve structure and organization
- Add practical examples and troubleshooting
- Enhance navigation and searchability
- Ensure accuracy and completeness

#### Quality Assurance
- [ ] Technical accuracy preserved
- [ ] Performance requirements met
- [ ] Style conventions followed
- [ ] All edge cases considered
- [ ] Documentation remains coherent

## Output Examples

### Prompt Optimization
```bash
User: /optimize "Help me fix my authentication" --prompt --interactive

## Optimization Preview

### Analysis:
- Current Prompt: Basic request without structure
- Target Model: Claude 3.5 Sonnet
- Missing Elements: Context, error scenarios, expected output format

### Research-Based Enhancements:
1. **Expert Persona**: "You are a senior security engineer with 10+ years..."
2. **Stakes Language**: "This authentication system is critical to production security..."
3. **Step-by-Step Reasoning**: "Take a deep breath and analyze systematically..."
4. **Self-Evaluation**: "Rate your confidence 0-1 and explain reasoning..."

### Questions:
1. What authentication methods are you using? (JWT, OAuth, session-based?)
2. Are there specific error messages you're seeing?
3. What's the tech stack (React/Node, Django/Python)?

### Interactive Refinement:
Based on your responses, tailored optimization applied...

**Enhanced Prompt Ready for Application**
```

### Query Optimization
```bash
User: /optimize "SELECT * FROM large_table WHERE category = 'active'" --query --preview

## Query Optimization Preview

### Analysis:
- **Query**: Full table scan with category filter
- **Table Size**: ~10M rows, growing at 50k/day
- **Performance Issues**: No index on category, full table scan

### Proposed Optimizations:
1. **Add Index**: CREATE INDEX idx_large_table_category ON large_table(category)
2. **Partial Results**: Add LIMIT clause with pagination for large result sets
3. **Query Rewrite**: Use covering index for better performance

### Expected Impact:
- **Before**: Full table scan (~500ms avg, 2s peak)
- **After**: Index seek (~5ms avg, 50ms peak)
- **Improvement**: 99% reduction in query time

### Research Sources:
- PostgreSQL Query Planning Guide
- Database Performance Best Practices
- Similar OpenSource Query Patterns

Apply optimizations? (y/n/modify)
```

### Code Optimization
```bash
User: /optimize "fix function in auth.js" --code --file src/auth.js --apply

## Code Optimization Process

### Analysis:
- **File**: src/auth.js (authentication logic)
- **Issues**: No input validation, synchronous processing, missing error handling
- **Performance Impact**: Medium (blocking I/O operations)

### Applied Optimizations:
✓ Added input validation and sanitization
✓ Implemented async/await patterns for non-blocking operations  
✓ Enhanced error handling with specific error types
✓ Added logging for debugging and monitoring
✓ Improved code organization and separation of concerns

### Quality Metrics:
- **Security**: Enhanced with proper validation and error handling
- **Performance**: Non-blocking operations, ~60% faster response times
- **Maintainability**: Better error messages and code structure
- **Reliability**: Comprehensive error recovery paths
```

## Advanced Features

### Multi-Source Research
Combine insights from multiple authoritative sources:
```json
{
  "sources": {
    "anthropic": {
      "priority": "high",
      "focus": ["prompt-structure", "model-specific-optimization"]
    },
    "openai": {
      "priority": "high", 
      "focus": ["prompt-engineering", "response-quality"]
    },
    "opencode": {
      "priority": "medium",
      "focus": ["community-patterns", "practical-examples"]
    }
  }
}
```

### Learning and Adaptation
- Track successful optimizations by type
- Learn from user feedback and acceptance rates
- Build database of effective patterns per project type
- Suggest optimizations based on historical success

### File Modification Support
```bash
# Optimize and modify file in place
/optimize --file README.md --type docs --apply

# Optimize and save to new file
/optimize --file config.json --type code --output config-optimized.json

# Optimize git staged files
/optimize --staged --type commit --interactive
```

## Integration

### With Other Commands
- `/clean`: Remove verbosity from optimized content if needed
- `/review`: Validate optimization quality and suggest improvements
- `/work`: Apply optimizations during implementation tasks

### Development Workflow
```bash
# During development
/optimize "implement user authentication" --prompt --interactive
# Generate optimized prompt
# Implement based on optimized prompt
/optimize ./src/auth.js --code --preview
# Review and apply code optimizations
```

## Quality Assurance

### Validation Checks
- [ ] Technical accuracy preserved 100%
- [ ] Performance requirements met or exceeded
- [ ] Style and conventions properly applied
- [ ] All edge cases and error scenarios handled
- [ ] User requirements fully addressed

### Success Metrics
- **Effectiveness**: Measurable improvement in performance/clarity/accuracy
- **Quality**: Maintained or enhanced technical correctness
- **User Satisfaction**: Interactive feedback incorporated and accepted
- **Learning**: New patterns added to optimization knowledge base

## Troubleshooting

### "Optimization makes content worse"
1. Use `--preview` mode to review changes
2. Switch to `--mode conservative`
3. Check if source constraints were correctly interpreted
4. Verify content type detection was accurate

### "Too aggressive optimization"
1. Use `--interactive` to approve each change
2. Adjust with user feedback from suggestions
3. Check that constraints and requirements were preserved
4. Use specific research sources instead of general best practices

### "Research sources conflicting"
1. Review source priority order in `--sources`
2. Check if content type matches source expertise
3. Use `--verbose` to see conflicting recommendations
4. Choose based on specific context rather than general advice

## Success Criteria

Successful optimization achieves:
- ✅ Measurable improvement in effectiveness (performance, clarity, accuracy)
- ✅ 100% technical accuracy preserved
- ✅ All constraints and requirements respected
- ✅ User feedback incorporated and approved
- ✅ Learning captured for future optimizations
- ✅ Integration with existing workflows maintained

The optimize command provides interactive, research-driven enhancement of any content type with user collaboration and quality assurance.