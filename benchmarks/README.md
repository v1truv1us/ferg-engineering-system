# Validation Framework for Ferg Engineering System

This directory contains the validation framework for empirically testing the claimed benefits of incentive-based prompting techniques.

## Purpose

To validate research-backed claims like:
- +45% quality improvement from stakes language
- +115% improvement on hard tasks from challenge framing
- 24% → 84% accuracy from expert persona assignment
- 34% → 80% accuracy from step-by-step reasoning

## Directory Structure

```
benchmarks/
├── tasks/                    # Benchmark task definitions
│   ├── code-review/         # 3 tasks validating expert persona & stakes
│   ├── architecture/        # 3 tasks validating step-by-step reasoning
│   ├── hard-problems/       # 3 tasks validating challenge framing
│   └── creative/            # 3 tasks validating combined techniques
├── prompts/                  # Prompt templates
│   ├── baseline/            # Minimal prompts (control group)
│   └── enhanced/            # All 5 prompting techniques
├── evaluation/               # G-Eval LLM-as-judge system
│   ├── geval_template.md    # Evaluation prompt template
│   ├── scoring.py           # Score extraction and validation
│   └── runner.py            # Batch evaluation runner
├── harness/                  # Python evaluation harness
│   ├── collector.py         # Response collection system
│   ├── analyzer.py          # Statistical analysis
│   └── runner.py            # Main validation runner
└── results/                  # Output storage
    └── .gitkeep
```

## Quick Start

```bash
# Run full validation suite
python benchmarks/run_validation.py

# Dry run (no API calls)
python benchmarks/run_validation.py --dry-run

# Run specific category
python benchmarks/run_validation.py --category code-review

# Skip collection (use existing responses)
python benchmarks/run_validation.py --skip-collection
```

## Task Categories

### Code Review Tasks
- **Validates**: Expert persona, stakes language
- **Focus**: Security analysis, bug detection, code quality
- **Expected**: Specific security issues and improvement suggestions

### Architecture Tasks  
- **Validates**: Step-by-step reasoning
- **Focus**: Design decisions, trade-off analysis
- **Expected**: Systematic analysis with pros/cons

### Hard Problems Tasks
- **Validates**: Challenge framing (+115% claim)
- **Focus**: Complex debugging, optimization, edge cases
- **Expected**: Deep analysis that benefits from challenge framing

### Creative Tasks
- **Validates**: All techniques combined
- **Focus**: API design, documentation, system architecture
- **Expected**: High-quality, comprehensive solutions

## Evaluation Methodology

### G-Eval Scoring (1-5 scale)
1. **Accuracy**: Factual correctness and precision
2. **Completeness**: Coverage of required elements  
3. **Clarity**: Readability, organization, structure
4. **Actionability**: Practical usefulness of recommendations
5. **Relevance**: Focus on user's actual needs

### Statistical Analysis
- **Test**: Wilcoxon signed-rank (paired, non-parametric)
- **Confidence Intervals**: BCa bootstrap (9999 resamples)
- **Effect Size**: Cohen's d (with Hedges' g for small samples)
- **Multiple Comparisons**: Holm-Bonferroni correction

## Sample Size Requirements

- **Target**: 30-50 samples per condition
- **Power**: 80% to detect large effects (d ≥ 0.8)
- **Significance**: α = 0.05

## Adding New Tasks

1. Create JSON file in appropriate category directory
2. Follow schema in `task-schema.json`
3. Include expected elements for validation
4. Test with both baseline and enhanced prompts

## Interpreting Results

- **Statistically Significant**: p < 0.05
- **Practically Significant**: Cohen's d ≥ 0.5
- **Validated Claim**: Measured improvement ≥ 50% of claimed

## References

- Research: `docs/research/2025-12-06-validation-framework-research.md`
- Statistical Methods: `docs/research/2025-12-06-quality-benchmarking-statistical-validation.md`
- Prompting Techniques: `skills/prompting/incentive-prompting/SKILL.md`