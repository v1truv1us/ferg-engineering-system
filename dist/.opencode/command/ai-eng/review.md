| description | agent |
|---|---|
| Run comprehensive code review with multiple perspectives | review |

# Review Command

Review current changes or a PR with multiple expert perspectives.

## Perspectives

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