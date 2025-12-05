# /research Command Guide

## Overview

The `/research` command is a powerful multi-agent orchestration tool that conducts comprehensive investigations across your codebase, documentation, and external sources. It uses a systematic 3-phase approach to deliver thorough, evidence-based research findings.

## Quick Start

```bash
# Basic research
/research "How does authentication work in this codebase?"

# Research with specific scope
/research "Analyze payment processing" --scope=codebase --depth=deep

# Research from ticket
/research --ticket="docs/tickets/AUTH-123.md"
```

## Command Syntax

```bash
/research [query] [options]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No* | Direct research question or topic |
| `--ticket` | string | No* | Path to ticket file |
| `--scope` | string | No | Research scope: `codebase`, `documentation`, `external`, `all` (default: `all`) |
| `--depth` | string | No | Research depth: `shallow`, `medium`, `deep` (default: `medium`) |

*Either `query` or `--ticket` must be provided

## Research Methodology

The command follows a disciplined 3-phase approach:

### Phase 1: Context & Scope Definition

1. **Parse Research Request**
   - Identifies primary research question
   - Decomposes into 3-5 sub-questions
   - Defines clear scope boundaries
   - Determines depth level required

2. **Read Primary Sources**
   - Reads referenced tickets/documents completely
   - Identifies existing information
   - **Never spawns agents before understanding context**

### Phase 2: Parallel Discovery

Multiple agents run concurrently for maximum efficiency:

| Agent | Purpose | Timeout |
|-------|---------|---------|
| `codebase-locator` | Find relevant files, components, directories | 5 min |
| `research-locator` | Discover existing docs, decisions, notes | 3 min |
| `codebase-pattern-finder` | Identify recurring implementation patterns | 4 min |

### Phase 3: Sequential Analysis

Based on discovery results, analyzers run sequentially:

1. **`codebase-analyzer`** - Implementation details with file:line evidence
2. **`research-analyzer`** - Decisions, constraints, insights from docs

For complex research, additional agents may be added:
- `web-search-researcher` - External best practices
- `system-architect` - Architectural implications
- `database-expert` - Data layer concerns
- `security-scanner` - Security assessment

### Phase 4: Synthesis & Documentation

All findings are consolidated into a structured research document.

## Output Structure

Research documents are saved to `docs/research/[date]-[topic-slug].md` with this format:

```markdown
---
date: 2025-01-05
researcher: Assistant
topic: 'Research Topic'
tags: [research, relevant, tags]
status: complete
confidence: high|medium|low
agents_used: [list of agents]
---

## Synopsis
[1-2 sentence summary]

## Summary
- Key finding 1
- Key finding 2
- Key finding 3

## Detailed Findings

### Codebase Analysis
[Implementation details with file:line references]

### Documentation Insights
[Past decisions, rationale, constraints]

### External Research
[Best practices, standards, alternatives]

## Code References
- `path/file.ext:12-45` - Description
- `path/other.ext:78` - Description

## Architecture Insights
[Patterns, design decisions, relationships]

## Recommendations
### Immediate Actions
1. [Priority action]

### Long-term Considerations
- [Strategic recommendation]

## Risks & Limitations
- [Identified risks]

## Open Questions
- [ ] [Unresolved questions]
```

## Usage Examples

### Example 1: Basic Codebase Research

```bash
/research "How does user authentication work?"
```

**Expected Output:**
- Analysis of authentication flow
- File references for auth components
- Security considerations
- Related configuration files

### Example 2: Deep Technical Analysis

```bash
/research "Database architecture and performance patterns" --scope=codebase --depth=deep
```

**Expected Output:**
- Database schema analysis
- Performance bottlenecks
- Migration patterns
- Optimization recommendations

### Example 3: Ticket-Based Research

```bash
/research --ticket="docs/tickets/PAYMENT-456.md" --scope=all
```

**Expected Output:**
- Analysis of ticket requirements
- Current implementation status
- Impact assessment
- Implementation recommendations

## Research Scopes

### `codebase`
- Source code analysis
- Implementation patterns
- File structure and dependencies
- Code references with line numbers

### `documentation`
- Existing docs and decisions
- Historical context
- Requirements and specifications
- Meeting notes and discussions

### `external`
- Best practices and standards
- Industry benchmarks
- Alternative approaches
- Security advisories

### `all` (default)
- Comprehensive analysis across all sources
- Cross-referenced findings
- Complete context picture

## Research Depths

### `shallow`
- High-level overview
- Key components identification
- Basic file references
- Quick insights (2-5 minutes)

### `medium` (default)
- Detailed component analysis
- Pattern identification
- Historical context
- Actionable recommendations (5-15 minutes)

### `deep`
- Comprehensive investigation
- Cross-component relationships
- Performance and security analysis
- Strategic recommendations (15-30 minutes)

## Quality Assurance

Every research output includes:

- **Evidence-Based Claims**: All findings include file:line references
- **Historical Context**: Past decisions and rationale documented
- **Confidence Levels**: Clear assessment of reliability
- **Actionable Recommendations**: Specific next steps
- **Risk Assessment**: Potential issues identified
- **Open Questions**: Unresolved areas flagged

## Agent Coordination

The research command uses sophisticated agent orchestration:

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Discovery (PARALLEL)                               │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│ │codebase-     │ │research-     │ │codebase-pattern-     │  │
│ │locator       │ │locator       │ │finder                │  │
│ └──────┬───────┘ └──────┬───────┘ └──────────┬───────────┘  │
│        │                │                     │              │
│        └────────────────┼─────────────────────┘              │
│                         ▼                                    │
├─────────────────────────────────────────────────────────────┤
│ Phase 2: Analysis (SEQUENTIAL)                              │
│ ┌──────────────┐       ┌──────────────┐                     │
│ │codebase-     │──────▶│research-     │                     │
│ │analyzer      │       │analyzer      │                     │
│ └──────────────┘       └──────────────┘                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Phase 3: Domain Specialists (CONDITIONAL)                   │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│ │web-search- │ │database-   │ │security-   │               │
│ │researcher  │ │expert      │ │scanner     │               │
│ └────────────┘ └────────────┘ └────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Performance Features

### Caching
- Intelligent caching of research patterns
- 60% hit rate target
- 1-hour TTL with manual invalidation
- <30MB memory usage

### Error Handling
- Automatic retry with reduced scope
- Graceful degradation
- Clear error messages with suggested actions
- Progress tracking throughout

### Timeouts
- Discovery agents: 3-5 minutes each
- Analysis agents: 5-10 minutes each
- Overall research: 15-30 minutes max

## Best Practices

### DO ✅
- Start with focused research questions
- Read primary sources before running research
- Use appropriate scope and depth parameters
- Review confidence levels in findings
- Follow up on open questions

### DON'T ❌
- Run research without clear objectives
- Ignore historical context
- Skip the quality checklist
- Over-scope initial research requests
- Assume findings are 100% complete

## Integration with Other Commands

After research completes, typical workflow:

```bash
# 1. Conduct research
/research "Authentication system analysis"

# 2. Create implementation plan
/plan "Implement OAuth2 based on research findings"

# 3. Review the plan
/review "OAuth2 implementation plan"

# 4. Execute implementation
/work "OAuth2 implementation"
```

## Troubleshooting

### Common Issues

**Issue**: Research takes too long
**Solution**: Use `--scope=codebase` and `--depth=shallow` for faster results

**Issue**: Too many irrelevant files found
**Solution**: Refine your research question to be more specific

**Issue**: Insufficient findings
**Solution**: Increase depth to `deep` or expand scope to `all`

**Issue**: Agents timeout
**Solution**: Research question may be too broad - narrow the scope

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Query must have non-empty query string" | Empty research question | Provide a specific research question |
| "Invalid scope" | Unsupported scope value | Use: codebase, documentation, external, all |
| "Agent timeout" | Research too broad | Reduce scope or depth |
| "Insufficient findings" | Narrow research question | Expand scope or depth |

## Advanced Features

### Custom Agent Combinations

For specialized research, the command can automatically add domain-specific agents:

- **Security Research**: Adds `security-scanner`
- **Database Analysis**: Adds `database-expert`
- **Architecture Review**: Adds `system-architect`
- **External Context**: Adds `web-search-researcher`

### Progress Tracking

Monitor research progress with real-time updates:
- Current phase and step
- Percentage complete
- Agents completed
- Any errors encountered

### Confidence Scoring

Research outputs include confidence levels:
- **High** (0.8-1.0): Strong evidence, multiple sources
- **Medium** (0.5-0.8): Good evidence, some gaps
- **Low** (0.0-0.5): Limited evidence, many assumptions

## Research Templates

### Template 1: New Feature Investigation
```bash
/research "How to implement [feature] in existing codebase?" --scope=all --depth=medium
```

### Template 2: Bug Analysis
```bash
/research "Root cause analysis of [issue] in [component]" --scope=codebase --depth=deep
```

### Template 3: Architecture Review
```bash
/research "Current architecture patterns and improvement opportunities" --scope=all --depth=deep
```

### Template 4: Security Assessment
```bash
/research "Security vulnerabilities and best practices in [system]" --scope=all --depth=deep
```

## Metrics and Analytics

The research command tracks:
- Processing time per phase
- Agent success rates
- Cache hit rates
- Document quality scores
- Follow-up item identification

## Conclusion

The `/research` command provides a systematic, thorough approach to codebase investigation. By leveraging multi-agent orchestration and evidence-based analysis, it delivers comprehensive insights that support informed decision-making and effective implementation planning.

For complex projects requiring deep understanding, start with `/research` to establish a solid foundation before proceeding with planning and implementation.