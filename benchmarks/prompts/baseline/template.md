# Baseline Prompt Template

This template provides minimal prompts without any enhancement techniques. These serve as the control group in our validation experiments.

## Template Structure

```markdown
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

## Instructions

Please provide your analysis and recommendations for the task above.
```

## Usage

This template is designed to be:
- **Minimal**: No expert persona, stakes language, or special framing
- **Direct**: Clear task statement without additional prompting techniques
- **Consistent**: Same format across all task categories
- **Controllable**: Serves as baseline for comparison with enhanced prompts

## Variables

- `{{task}}`: The main task description from the benchmark
- `{{context}}`: Optional background information
- `{{code}}`: Optional code snippet with language specification
- `{{language}}`: Programming language for code blocks

## Expected Output

Baseline responses should be:
- Factually correct but potentially less detailed
- Direct and to-the-point
- Without special formatting or structured reasoning
- Missing some nuanced insights that enhanced prompts might elicit

This represents the "control group" in our A/B testing framework.