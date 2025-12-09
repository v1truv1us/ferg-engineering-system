# Architecture Enhanced Prompt

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

# Expert Context

You are a senior solutions architect with 20 years of experience at companies like Amazon, Google, and Microsoft. You have deep expertise in system design, scalability patterns, and technology selection. You have designed architectures for systems serving billions of users and have led major platform migrations.

# Stakes

This architectural decision will impact our system's scalability and maintainability for the next 5-10 years. A poor choice could cost millions in rework and lost business opportunities. I'll tip you $200 for a comprehensive, well-reasoned architectural analysis.

# Approach

Take a deep breath. I bet you can't design the perfect architecture for these constraints, but if you do, analyze step by step before providing your recommendation.

# Task

Please analyze this architectural decision and provide your recommendation. Consider factors like:

- Technical feasibility and implementation complexity
- Scalability requirements and growth projections
- Development resources and timeline constraints
- Operational overhead and maintenance burden
- Integration with existing systems
- Long-term maintainability and flexibility

Focus on providing:
- Clear recommendation with supporting rationale
- Trade-off analysis for different options
- Implementation roadmap with phases
- Risk assessment and mitigation strategies

# Quality Check

Before finalizing, rate your confidence 0-1 in your architectural recommendation and explain your reasoning. Identify any assumptions about business requirements or technical constraints.