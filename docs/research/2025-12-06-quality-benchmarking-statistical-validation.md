---
date: 2025-12-06
researcher: Assistant
topic: Quality Benchmarking & Statistical Validation Framework
tags: [research, validation, benchmarking, statistics, LLM-evaluation, A/B-testing]
status: complete
confidence: 0.87
sources: [arxiv, scipy, scikit-learn, statsmodels, MT-Bench, HELM, G-Eval]
predecessor: 2025-12-06-validation-framework-research.md
---

## Synopsis

This document provides a comprehensive, actionable framework for validating the claimed benefits of the ferg-engineering-system's incentive-based prompting techniques. It synthesizes industry best practices for LLM quality benchmarking with statistical validation methodologies.

## Executive Summary

To validate claims like "+45% quality improvement" and "+115% on hard tasks," we need:

1. **Multi-prompt evaluation** (single-prompt is demonstrably brittle)
2. **30-50 samples per condition** (for detecting large effects with 80% power)
3. **LLM-as-judge with G-Eval** (achieves 0.514 Spearman correlation with humans)
4. **BCa bootstrap confidence intervals** (9999 resamples, 95% CI)
5. **Effect size reporting** (Cohen's d alongside p-values)
6. **Paired statistical tests** (McNemar's or Wilcoxon signed-rank)

---

## Part 1: Quality Benchmarking Methodology

### 1.1 Evaluation Approaches (Ranked by Reliability)

| Approach | Best For | Correlation w/ Human | Cost |
|----------|----------|----------------------|------|
| **G-Eval (LLM-as-judge)** | Creative/subjective tasks | 0.514 Spearman | Low |
| **Human Evaluation** | High-stakes decisions | 1.0 (baseline) | High |
| **Code-based rules** | Deterministic checks | Varies | Very Low |
| **Pairwise comparison** | A/B preference tests | ~0.80 agreement | Medium |

### 1.2 Recommended Framework: G-Eval + Chain-of-Thought

G-Eval (Liu et al., 2023) achieves best-in-class correlation with human judgment:

```python
# G-Eval Prompt Structure
GEVAL_TEMPLATE = """
You are evaluating an AI assistant's response quality.

**Task:** {task_description}
**Baseline Response:** {baseline_response}
**Enhanced Response:** {enhanced_response}

Evaluate on these dimensions (1-5 scale each):

1. **Accuracy**: Factual correctness and precision
2. **Completeness**: Coverage of required elements
3. **Clarity**: Readability, organization, structure
4. **Actionability**: Practical usefulness of recommendations
5. **Relevance**: Focus on user's actual needs

For each dimension:
1. Think step-by-step about strengths and weaknesses
2. Provide specific evidence from the response
3. Assign a score with justification

Output JSON:
{
  "accuracy": {"score": N, "reasoning": "..."},
  "completeness": {"score": N, "reasoning": "..."},
  "clarity": {"score": N, "reasoning": "..."},
  "actionability": {"score": N, "reasoning": "..."},
  "relevance": {"score": N, "reasoning": "..."},
  "overall": {"baseline_score": N, "enhanced_score": N, "winner": "baseline|enhanced|tie"}
}
"""
```

### 1.3 Multi-Prompt Evaluation Requirement

**Critical finding**: Single-prompt evaluation is brittle (validated on 6.5M instances across 20 LLMs).

**Recommendation**: Use 3-5 prompt variants per evaluation task:
- Original phrasing
- Rephrased with different vocabulary
- Formal vs informal tone
- Different output format requests
- Varying context levels

### 1.4 Benchmark Task Categories

For validating ferg-engineering-system claims, create benchmark tasks in these categories:

| Category | Task Examples | Validates |
|----------|---------------|-----------|
| **Code Review** | Find bugs, suggest improvements | Expert persona, stakes language |
| **Architecture** | Design decisions, trade-off analysis | Step-by-step reasoning |
| **Hard Problems** | Complex refactoring, edge cases | Challenge framing (+115%) |
| **Creative Tasks** | API design, documentation | All techniques combined |

**Recommended**: 10-15 curated benchmark tasks (minimum 10 for statistical validity)

---

## Part 2: Statistical Validation Framework

### 2.1 Sample Size Requirements

For detecting the claimed effect sizes:

| Claimed Improvement | Cohen's d (approx.) | Required n per group | Total samples |
|---------------------|---------------------|----------------------|---------------|
| +45% quality | d ≈ 1.5 (very large) | ~20 | 40 |
| +115% on hard tasks | d ≈ 3.8 (extremely large) | ~8 | 16 |
| Conservative estimate | d = 0.8 (large) | ~26 | 52 |

**Python calculation:**
```python
from statsmodels.stats.power import TTestIndPower

analysis = TTestIndPower()

# For +45% improvement (d ≈ 1.5)
n_45 = analysis.solve_power(effect_size=1.5, power=0.8, alpha=0.05)
print(f"+45% effect: n = {n_45:.0f} per group")  # ~8

# Conservative large effect (d = 0.8)
n_conservative = analysis.solve_power(effect_size=0.8, power=0.8, alpha=0.05)
print(f"Conservative: n = {n_conservative:.0f} per group")  # ~26
```

**Recommendation**: Use **30-50 samples per condition** for robust validation.

### 2.2 Statistical Test Selection

| Scenario | Test | When to Use |
|----------|------|-------------|
| **Same test set, binary** | McNemar's test | Pass/fail comparisons |
| **Same test set, continuous** | Wilcoxon signed-rank | Quality scores (non-parametric) |
| **Cross-validation** | 5×2 CV paired t-test | Model comparison with CV |
| **Multiple comparisons** | Holm-Bonferroni | Testing 4+ prompting techniques |

**Primary recommendation**: Wilcoxon signed-rank (robust to non-normal LLM output distributions)

```python
from scipy.stats import wilcoxon

# Paired comparison: baseline vs enhanced scores
baseline_scores = [3.2, 4.1, 3.8, ...]  # Quality scores per task
enhanced_scores = [4.5, 4.8, 4.2, ...]

stat, p_value = wilcoxon(enhanced_scores, baseline_scores, alternative='greater')
print(f"Wilcoxon test: statistic={stat}, p={p_value:.4f}")
```

### 2.3 Confidence Interval Calculation

Use BCa (bias-corrected and accelerated) bootstrap:

```python
from scipy.stats import bootstrap
import numpy as np

def quality_improvement(baseline, enhanced):
    """Calculate mean improvement."""
    return np.mean(enhanced - baseline)

baseline = np.array([3.2, 4.1, 3.8, 2.9, 4.0])
enhanced = np.array([4.5, 4.8, 4.2, 4.1, 4.7])

# Bootstrap CI for improvement
result = bootstrap(
    (enhanced - baseline,),
    np.mean,
    method='BCa',
    n_resamples=9999,
    confidence_level=0.95
)

print(f"Mean improvement: {np.mean(enhanced - baseline):.2f}")
print(f"95% CI: [{result.confidence_interval.low:.2f}, {result.confidence_interval.high:.2f}]")
```

### 2.4 Effect Size Reporting

Always report effect sizes alongside p-values:

| Cohen's d | Interpretation | Example Claim |
|-----------|----------------|---------------|
| 0.2 | Small | Marginal improvement |
| 0.5 | Medium | Noticeable improvement |
| 0.8 | Large | Substantial improvement |
| ≥1.0 | Very large | Claimed +45% likely here |
| ≥2.0 | Extremely large | Claimed +115% likely here |

```python
def cohens_d(group1, group2):
    """Calculate Cohen's d for paired samples."""
    diff = group1 - group2
    return np.mean(diff) / np.std(diff, ddof=1)

d = cohens_d(enhanced, baseline)
print(f"Cohen's d: {d:.2f}")

# For small samples (n < 30), use Hedges' g
def hedges_g(group1, group2):
    """Bias-corrected Cohen's d."""
    n = len(group1)
    d = cohens_d(group1, group2)
    correction = 1 - (3 / (4 * (2*n - 2) - 1))
    return d * correction
```

### 2.5 Multiple Comparison Corrections

When testing all 4 prompting techniques:

```python
from statsmodels.stats.multitest import multipletests

# p-values from testing each technique
p_values = [0.02, 0.04, 0.01, 0.08]  # Expert, Step-by-step, Stakes, Challenge
techniques = ['Expert Persona', 'Step-by-Step', 'Stakes Language', 'Challenge Framing']

# Holm-Bonferroni correction (more powerful than Bonferroni)
reject, corrected_p, _, _ = multipletests(p_values, method='holm')

for tech, p, p_corr, sig in zip(techniques, p_values, corrected_p, reject):
    print(f"{tech}: p={p:.3f} → corrected p={p_corr:.3f} {'✓' if sig else '✗'}")
```

---

## Part 3: Inter-Rater Reliability (LLM-as-Judge Validation)

### 3.1 Agreement Thresholds

| Cohen's Kappa | Interpretation | Accept for Evaluation? |
|---------------|----------------|------------------------|
| < 0.20 | Slight | No |
| 0.21 - 0.40 | Fair | Caution |
| 0.41 - 0.60 | Moderate | Acceptable |
| 0.61 - 0.80 | Substantial | Good |
| 0.81 - 1.00 | Near-perfect | Excellent |

**Target**: κ ≥ 0.60 for LLM-as-judge to be valid.

**Industry benchmark**: GPT-4 achieves >80% agreement with human preferences (MT-Bench), matching human-human agreement levels.

### 3.2 Validation Protocol

Before using LLM-as-judge in production:

1. **Create gold standard**: Have humans rate 20-30 samples
2. **Calculate agreement**: Measure Cohen's Kappa between LLM and humans
3. **Check positional bias**: Swap response order, verify consistency
4. **Self-consistency**: Run same evaluation 3× with temperature>0

```python
from sklearn.metrics import cohen_kappa_score

# Human ratings (1-5 scale, discretized)
human_ratings = [4, 3, 5, 4, 2, 3, 4, 5, 4, 3]
# LLM ratings for same samples
llm_ratings = [4, 3, 4, 4, 3, 3, 5, 5, 4, 3]

kappa = cohen_kappa_score(human_ratings, llm_ratings, weights='linear')
print(f"Cohen's Kappa (weighted): {kappa:.3f}")

# Interpretation
if kappa >= 0.8:
    print("Near-perfect agreement - LLM judge validated")
elif kappa >= 0.6:
    print("Substantial agreement - LLM judge acceptable")
else:
    print("Insufficient agreement - need human evaluation")
```

---

## Part 4: Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

```bash
# Create benchmark directory structure
mkdir -p benchmarks/{tasks,baselines,enhanced,results}

# Task format
# benchmarks/tasks/001-code-review.json
{
  "id": "001",
  "category": "code_review",
  "task": "Review this authentication middleware for security issues...",
  "code": "...",
  "expected_elements": ["SQL injection check", "rate limiting", "token validation"],
  "difficulty": "medium"
}
```

**Deliverables:**
- [ ] 10-15 curated benchmark tasks across 4 categories
- [ ] Baseline prompt templates (no enhancements)
- [ ] Enhanced prompt templates (with all techniques)
- [ ] G-Eval evaluation prompt
- [ ] Python evaluation harness

### Phase 2: Baseline Collection (Week 2)

```python
# Collect baseline and enhanced responses
async def collect_responses(tasks, prompt_type='baseline'):
    responses = []
    for task in tasks:
        # Use 3-5 prompt variants per task
        for variant in generate_prompt_variants(task, prompt_type):
            response = await call_llm(variant)
            responses.append({
                'task_id': task['id'],
                'prompt_type': prompt_type,
                'variant': variant['id'],
                'response': response
            })
    return responses

baseline_responses = await collect_responses(tasks, 'baseline')
enhanced_responses = await collect_responses(tasks, 'enhanced')
```

**Deliverables:**
- [ ] 30-50 baseline responses collected
- [ ] 30-50 enhanced responses collected
- [ ] Response storage with metadata

### Phase 3: Evaluation & Analysis (Week 3)

```python
# Evaluate with G-Eval
async def evaluate_pair(baseline, enhanced, task):
    eval_prompt = GEVAL_TEMPLATE.format(
        task_description=task['task'],
        baseline_response=baseline['response'],
        enhanced_response=enhanced['response']
    )
    return await call_llm(eval_prompt)

# Run evaluation
evaluations = []
for task in tasks:
    baseline = get_response(task, 'baseline')
    enhanced = get_response(task, 'enhanced')
    eval_result = await evaluate_pair(baseline, enhanced, task)
    evaluations.append(eval_result)

# Statistical analysis
from scipy.stats import wilcoxon, bootstrap

baseline_scores = [e['overall']['baseline_score'] for e in evaluations]
enhanced_scores = [e['overall']['enhanced_score'] for e in evaluations]

# Wilcoxon test
stat, p = wilcoxon(enhanced_scores, baseline_scores, alternative='greater')

# Effect size
d = cohens_d(np.array(enhanced_scores), np.array(baseline_scores))

# Confidence interval
improvement = np.array(enhanced_scores) - np.array(baseline_scores)
ci = bootstrap((improvement,), np.mean, method='BCa', n_resamples=9999)

print(f"""
=== Validation Results ===
Mean baseline: {np.mean(baseline_scores):.2f}
Mean enhanced: {np.mean(enhanced_scores):.2f}
Improvement: {np.mean(improvement):.2f} ({100*np.mean(improvement)/np.mean(baseline_scores):.1f}%)
95% CI: [{ci.confidence_interval.low:.2f}, {ci.confidence_interval.high:.2f}]
Cohen's d: {d:.2f}
Wilcoxon p-value: {p:.4f}
Statistically significant: {'Yes' if p < 0.05 else 'No'}
""")
```

**Deliverables:**
- [ ] G-Eval results for all pairs
- [ ] Statistical analysis report
- [ ] Measured vs. claimed improvements

### Phase 4: Continuous Validation (Ongoing)

```yaml
# .github/workflows/quality-validation.yml
name: Quality Validation
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run benchmark suite
        run: python benchmarks/run_validation.py
      - name: Check quality gates
        run: |
          python -c "
          import json
          with open('benchmarks/results/latest.json') as f:
            results = json.load(f)
          assert results['cohens_d'] >= 0.5, 'Effect size too small'
          assert results['p_value'] < 0.05, 'Not statistically significant'
          print('Quality gates passed!')
          "
```

---

## Part 5: Reporting Standards

### 5.1 Required Metrics

Every validation report should include:

| Metric | Formula/Method | Threshold |
|--------|----------------|-----------|
| Sample size (n) | Count per condition | ≥30 |
| Mean improvement | (enhanced - baseline) / baseline | Document % |
| Cohen's d | (M₁-M₂) / SD_pooled | ≥0.5 for "meaningful" |
| 95% CI | BCa bootstrap | Must not cross 0 |
| p-value | Wilcoxon signed-rank | <0.05 |
| Kappa (if LLM judge) | Cohen's Kappa | ≥0.60 |

### 5.2 Report Template

```markdown
## Validation Report: [Date]

### Summary
| Technique | Claimed | Measured | Cohen's d | p-value | Validated? |
|-----------|---------|----------|-----------|---------|------------|
| Expert Persona | +60% | +X% | X.XX | 0.XXX | Yes/No |
| Step-by-Step | +46% | +X% | X.XX | 0.XXX | Yes/No |
| Stakes Language | +45% | +X% | X.XX | 0.XXX | Yes/No |
| Challenge Framing | +115% | +X% | X.XX | 0.XXX | Yes/No |

### Statistical Details
- Sample size: N baseline, N enhanced
- Test used: Wilcoxon signed-rank
- Multiple comparison correction: Holm-Bonferroni
- LLM-as-judge Kappa: X.XX

### Confidence Intervals (95%)
- Expert Persona: [X.X, X.X]
- Step-by-Step: [X.X, X.X]
- Stakes Language: [X.X, X.X]
- Challenge Framing: [X.X, X.X]

### Recommendations
[Based on measured vs claimed, adjust documentation accordingly]
```

---

## Risks & Limitations

| Risk | Mitigation |
|------|------------|
| **LLM output variability** | Run multiple evaluations, use temperature=0 |
| **Judge bias** | Validate with human subset, check positional bias |
| **Task selection bias** | Use diverse categories, blind task selection |
| **Model version changes** | Re-validate quarterly, document model versions |
| **Single-prompt brittleness** | Use 3-5 prompt variants per task |

---

## Open Questions Addressed

From the previous research document:

| Question | Answer |
|----------|--------|
| What metrics define "quality improvement"? | G-Eval 5-dimension scoring (accuracy, completeness, clarity, actionability, relevance) |
| How many benchmark tasks needed? | 10-15 curated tasks; 30-50 total samples |
| What baseline to use? | Minimal prompts without any enhancement techniques |
| How often to re-validate? | Quarterly minimum, or on model version changes |
| Should claims be adjusted? | Yes, report measured values; add caveats if <50% of claimed |

---

## Appendix: Tool Reference

### Python Packages Required

```bash
pip install scipy statsmodels scikit-learn numpy
```

### Key Functions

| Function | Package | Use Case |
|----------|---------|----------|
| `wilcoxon()` | scipy.stats | Paired non-parametric test |
| `bootstrap()` | scipy.stats | Confidence intervals |
| `cohen_kappa_score()` | sklearn.metrics | Inter-rater agreement |
| `multipletests()` | statsmodels | Multiple comparison correction |
| `TTestIndPower()` | statsmodels | Sample size calculation |

### External Resources

- [G-Eval Paper (arxiv:2303.16634)](https://arxiv.org/abs/2303.16634)
- [MT-Bench (arxiv:2306.05685)](https://arxiv.org/abs/2306.05685)
- [HELM Framework (arxiv:2211.09110)](https://arxiv.org/abs/2211.09110)
- [Multi-Prompt Evaluation (arxiv:2401.00595)](https://arxiv.org/abs/2401.00595)

---

## Confidence Assessment

| Finding | Confidence | Rationale |
|---------|------------|-----------|
| G-Eval is appropriate for quality scoring | 0.90 | Peer-reviewed, 0.514 correlation with humans |
| 30-50 samples sufficient for large effects | 0.85 | Standard power analysis, conservative estimate |
| Wilcoxon appropriate for LLM output | 0.85 | Non-parametric, handles non-normal distributions |
| LLM-as-judge viable with validation | 0.80 | GPT-4 matches human agreement (>80%) |
| BCa bootstrap preferred | 0.90 | SciPy documentation, standard practice |

**Overall Confidence: 0.87**

---

*Research completed: December 6, 2025*
*Predecessor: 2025-12-06-validation-framework-research.md*
*Purpose: Actionable framework for validating ferg-engineering-system claims*
