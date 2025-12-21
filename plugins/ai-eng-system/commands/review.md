---
name: ai-eng/review
description: Run comprehensive code review with multiple perspectives
agent: review
---

# Review Command

Review current changes or a PR with multiple expert perspectives.

## Usage

```bash
/ai-eng/review [files...] [options]
```

### Options

- `--swarm`: Use Swarms multi-agent orchestration instead of legacy coordinator
- `-t, --type <type>`: Review type (full|incremental|security|performance|frontend) [default: full]
- `-s, --severity <severity>`: Minimum severity level (low|medium|high|critical) [default: medium]
- `-f, --focus <focus>`: Focused review (security|performance|frontend|general)
- `-o, --output <file>`: Output report file [default: code-review-report.json]
- `-v, --verbose`: Enable verbose output

## Perspectives

#### Subagent Communication Protocol (Minimal)

If you spawn reviewer subagents in parallel, include:

```text
<CONTEXT_HANDOFF_V1>
Goal: Review changes for (focus area)
Files under review: (paths)
Constraints: (e.g., no code changes; read-only)
Deliverable: findings with file:line evidence
Output format: RESULT_V1
</CONTEXT_HANDOFF_V1>
```

Require:

```text
<RESULT_V1>
RESULT:
FINDINGS: (bullets with severity)
EVIDENCE: (file:line)
RECOMMENDATIONS:
CONFIDENCE: 0.0-1.0
</RESULT_V1>
```

- **Code Quality**: Clean code, SOLID principles, DRY
- **Performance**: Time/space complexity, caching opportunities
- **SEO**: Meta tags, structured data, Core Web Vitals impact
- **Security**: Input validation, authentication, data exposure
- **Architecture**: Component boundaries, coupling, scalability

## Output Format

For each finding provide:

| Field | Description |
|-------|-------------|
| Severity | critical, major, minor |
| Location | file:line |
| Issue | Description of the problem |
| Recommendation | Suggested fix |

## Summary

End with overall assessment: APPROVE, CHANGES_REQUESTED, or NEEDS_DISCUSSION.
