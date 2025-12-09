# Code Review Baseline Prompt

## Task

{{task}}

{{#if context}}
## Context

{{context}}
{{/if}}

{{#if code}}
## Code

```{{language}}
{{code}}
```
{{/if}}

## Instructions

Please review this code for security issues, performance problems, and code quality concerns. Provide specific recommendations for any issues you find.

Focus on:
- Security vulnerabilities
- Performance bottlenecks  
- Code maintainability
- Best practices violations

Return your analysis in a clear, structured format.