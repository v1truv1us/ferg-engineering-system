| description | agent |
|---|---|
| Optimize a prompt or task description using research-backed techniques | build |

# Optimize Command

Transforms any prompt into a more effective version using research-backed incentive prompting techniques from Bsharat et al. (MBZUAI), Google DeepMind, and ICLR 2024 research.

## Usage

```
/optimize [prompt or task description]
```

## Process

1. **Analyze** the original prompt for:
   - Task complexity (low/medium/high)
   - Domain (technical, creative, analytical, etc.)
   - Missing optimization elements

2. **Apply** appropriate techniques:
   - Expert persona assignment (24% → 84% accuracy gains)
   - Step-by-step reasoning priming (+46% accuracy)
   - Stakes/incentive language (+45% quality)
   - Challenge framing (+115% on hard tasks)
   - Self-evaluation request

3. **Output** the optimized prompt with:
   - Enhanced version ready to use
   - Techniques applied and why
   - Expected improvement estimate

## Example

**Input:**
```
/optimize Help me fix this database query that's slow
```

**Output:**
```
## Optimized Prompt

You are a senior database architect with 15 years of PostgreSQL optimization 
experience, having worked at companies like Stripe and Shopify where you 
optimized queries handling millions of transactions daily.

Take a deep breath and analyze this step by step. This query optimization 
is critical to our application's performance.

[Original query details]

Please:
1. Identify the performance bottleneck
2. Explain why it's slow
3. Provide the optimized query with explanation
4. Rate your confidence in this solution from 0-1

## Techniques Applied
- Expert Persona: Database architect with notable company experience
- Step-by-Step: "Take a deep breath and analyze step by step"
- Stakes: "Critical to our application's performance"
- Self-Evaluation: Confidence rating request

## Expected Improvement
~45-60% improvement for technical optimization tasks based on MBZUAI research.
```

## Research Basis

- **Bsharat et al. (2023)**: 26 principled prompting instructions
- **Yang et al. (2023)**: "Take a deep breath" optimization
- **Li et al. (2023)**: Challenge framing techniques
- **Kong et al. (2023)**: Persona prompting research

See `skills/prompting/incentive-prompting/SKILL.md` for full documentation.