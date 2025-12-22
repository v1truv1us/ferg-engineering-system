---
date: 2025-12-22
researcher: Assistant
topic: '/clean command family and /optimize refactor implementation plan'
tags: [implementation, commands, architecture, cli]
status: complete
confidence: high
agents_used: [plan]
---

## Synopsis

Comprehensive implementation plan for `/clean` command family (slop removal, text cleanup) and refactoring of `/optimize` command to be interactive, research-based, and file-modification capable with multiple optimization types.

## Summary

- Key finding 1: Current `/optimize` command is documentation rather than executable instructions
- Key finding 2: Two separate command families needed: `/optimize` (enhance) and `/clean` (remove verbosity)
- Key finding 3: Need one new `text-cleaner` agent and refactored `prompt-optimizer` agent
- Key finding 4: Commands should support file modification with confirmations, different types, and interactive workflows

## Detailed Findings

### Codebase Analysis

Current command structure issues found in `/home/vitruvius/git/ai-eng-system/.claude/commands/optimize.md:80`:
- Only 80 lines vs. 200+ lines for working commands like `/plan` and `/review`
- Contains mostly examples rather than executable instructions
- Missing subagent protocols and detailed process steps
- No file modification capabilities defined

Existing working command patterns identified:
- `/plan` command: 216 lines with detailed phases, acceptance criteria, structured output
- `/review` command: 74 lines with subagent protocols, output formats, options
- Both use structured markdown with clear sections and action-oriented instructions

### Documentation Insights

From `/home/vitruvius/git/ai-eng-system/skills/prompting/incentive-prompting/SKILL.md:163`:
- Existing research-backed techniques already documented
- 6 core techniques identified with specific improvements
- Implementation patterns available for OpenCode agents
- Research references included (Bsharat et al., Yang et al., Li et al., Kong et al.)

From `/home/vitruvius/git/ai-eng-system/src/command-swarms-integration.ts:181`:
- Command mapping system in place for `/optimize`
- MultiAgentRouter swarm type configured
- Task formatting basic: "Optimize prompts and AI interactions for: {baseTask}"

### External Research

"AI slop" patterns identified from developer experience:
- Preambles: "Certainly!", "I'd be happy to help!", "Great question!"
- Hedging: "It's worth noting that", "Keep in mind that", "Generally speaking"
- Excessive politeness: "Please let me know if you need anything else"
- Verbose transitions: "Now, let's move on to", "Having established that"
- Comment redundancy: "This function does X" when function name already states purpose

## Architecture Insights

### Command Separation Strategy

```
/optimize <content> --type     → ENHANCE content (make it better)
/clean <content> --type       → REMOVE from content (make it concise)

Types: prompt, query, code, commit, docs, comments, slop
```

### Agent Strategy

| Agent | Purpose | Integration |
|--------|---------|-------------|
| `prompt-optimizer` | Enhancement via research & interactive Q&A | `/optimize` commands |
| `text-cleaner` | Pattern removal & verbosity reduction | `/clean` commands |

### File Structure Plan

```
content/
├── commands/
│   ├── optimize.md              # Refactored interactive enhancer
│   ├── clean.md                # Router for all clean commands
│   ├── clean-slop.md          # Remove AI filler text
│   ├── clean-comments.md       # Clean verbose code comments
│   ├── clean-docs.md           # Clean documentation verbosity
│   └── clean-prompt.md        # (Optional) Clean prompt verbosity
│
├── agents/
│   ├── prompt-optimizer.md       # Refactored with research capabilities
│   └── text-cleaner.md         # New cleanup specialist
│
└── skills/
    ├── prompting/
    │   └── incentive-prompting/   # Existing, reuse
    └── text-cleanup/
        ├── SKILL.md              # Cleanup patterns & techniques
        └── patterns/
            ├── slop-patterns.json     # AI filler definitions
            ├── comment-patterns.json  # Verbose comment patterns
            └── custom-patterns.json   # User-defined patterns
```

## Code References

- `src/command-swarms-integration.ts:75-81` - Current optimize command mapping
- `src/command-swarms-integration.ts:179-181` - Task formatting needs enhancement
- `.claude/commands/optimize.md:80` - Documentation only, needs full rewrite
- `skills/prompting/incentive-prompting/SKILL.md:163` - Research foundation available

## Recommendations

### Immediate Actions

1. **Phase 1**: Refactor `/optimize` command with interactive research-based approach
   - Replace current 80-line documentation with 200+ line implementation
   - Add web research capabilities for best practices
   - Implement file modification with confirmations
   - Support multiple types: --prompt, --query, --code, --commit

2. **Phase 2**: Implement `/clean` command family
   - Create router command with subcommand delegation
   - Implement `text-cleaner` agent with pattern knowledge
   - Build pattern database for slop, comments, docs
   - Add preview/apply modes with diff generation

3. **Phase 3**: Integration & Testing
   - Update command mappings and task formatting
   - Add quality gates and validation
   - Create comprehensive test suites
   - Update documentation and examples

### Long-term Considerations

- Pattern learning: Allow `text-cleaner` to learn new slop patterns from usage
- Integration: `/optimize` → `/clean` workflow for complete content refinement
- User customization: Personal pattern databases and preference profiles
- Performance: Caching for research results and pattern matching

## Risks & Limitations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Research API rate limits | Medium | Medium | Implement caching and fallback to cached best practices |
| Pattern over-removal | High | Medium | Preview modes and user confirmation before changes |
| File modification safety | High | Low | Backup creation and rollback capabilities |
| Command complexity | Medium | Low | Progressive enhancement with clear migration path |

## Open Questions

- [ ] Should research sources be configurable (Anthropic, OpenAI, community docs)?
- [ ] How to handle conflicting best practices between sources?
- [ ] Should patterns be versioned for different AI model outputs?
- [ ] Integration with existing git workflow hooks for automatic cleanup?

## Implementation Complexity

- **Overall Complexity**: High (two major command families, new agent, research integration)
- **Estimated Effort**: 16-20 hours total
- **Key Dependencies**: Command system refactoring, agent creation, pattern database design
- **Testing Requirements**: Unit tests for pattern matching, integration tests for file operations, manual testing for research workflows