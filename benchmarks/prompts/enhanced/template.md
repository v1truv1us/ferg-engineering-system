# Enhanced Prompt Template

This template incorporates all research-backed prompting techniques from incentive-prompting research. These prompts serve as the "treatment group" in our validation experiments.

## Template Structure

```markdown
# Expert Context

You are a senior {{role}} with {{years}} years of experience at companies like {{companies}}. You have deep expertise in {{domain}} and have solved similar challenges hundreds of times.

# Stakes

This task is critical to a production system. Incomplete or incorrect results will cause significant issues. I'll tip you $200 for a comprehensive, perfect solution.

# Approach

Take a deep breath. I bet you can't solve this, but if you do, analyze step by step before providing your response.

# Task

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

# Quality Check

Before finalizing, rate your confidence 0-1 and explain your reasoning. Identify any assumptions or limitations in your response.
```

## Usage Instructions

1. **Replace Variables**:
   - `{{role}}`: Specific expert role (e.g., "security engineer", "database architect")
   - `{{years}}`: Years of experience (e.g., "15", "20")
   - `{{companies}}`: Notable companies (e.g., "Netflix, Stripe, Google")
   - `{{domain}}`: Area of expertise (e.g., "web security", "database optimization")
   - `{{task}}`: The actual task description
   - `{{context}}`: Optional background information
   - `{{code}}`: Optional code with language specification
   - `{{language}}`: Programming language for code blocks

2. **Category-Specific Customization**:
   - Use category-specific templates for role and domain expertise
   - Adjust stakes language based on task criticality
   - Emphasize techniques most relevant to each category

3. **Technique Integration**:
   - **Expert Persona**: Detailed role with specific experience
   - **Stakes Language**: Critical importance, financial incentive
   - **Step-by-Step**: Explicit reasoning instruction
   - **Challenge Framing**: "I bet you can't" for difficult tasks
   - **Self-Evaluation**: Confidence rating and explanation

4. **Quality Assurance**:
   - All techniques should feel natural when combined
   - Avoid contradictory instructions
   - Maintain consistent tone throughout

## Expected Enhanced Behavior

Compared to baseline prompts, enhanced prompts should produce:
- **More detailed analysis** with domain expertise
- **Step-by-step reasoning** with clear logic flow
- **Comprehensive coverage** of all expected elements
- **Risk awareness** and proactive issue identification
- **Confidence assessment** with justification
- **Professional tone** with appropriate technical depth

## Validation Notes

This enhanced template is designed to test the specific claims:
- **Expert Persona**: 24% → 84% accuracy improvement (Kong et al., 2023)
- **Step-by-Step**: 34% → 80% accuracy improvement (Yang et al., 2023)
- **Stakes Language**: +45% quality improvement (Bsharat et al., 2023)
- **Challenge Framing**: +115% improvement on hard tasks (Li et al., 2023)

When used with our benchmark tasks, these prompts should demonstrate measurable improvements over the baseline versions.