# Statistical Analysis Report
Generated: 2025-12-06T11:08:58.392861

## Executive Summary

- **Techniques Analyzed**: 1
- **Significant Improvements**: 1
.1f
- **Average Improvement**: 10.5%

## Technique Results

| Technique | Sample Size | Improvement | Cohen's d | p-value | Significant |
|-----------|-------------|-------------|-----------|---------|-------------|
| combined | 73 | 10.5% | -inf | 0.0000 | ✓ |

## Detailed Analysis

### combined

#### Statistics
- **Sample Size**: 73
.2f
.2f
.2f
.1f

#### Effect Sizes
.2f
.2f

#### Statistical Tests
.2f
.4f
- **Significant**: Yes (α = 0.05)

#### Confidence Interval (95%)
.2f

#### Power Analysis
.2f
- **Current Power**: nan
- **Required Sample Size**: 10
- **Sufficient Power**: No

## Methodology

### Statistical Tests
- **Wilcoxon Signed-Rank Test**: Paired, non-parametric test for related samples
- **Holm-Bonferroni Correction**: Multiple comparison correction for family-wise error
- **BCa Bootstrap**: Bias-corrected and accelerated confidence intervals

### Effect Size Measures
- **Cohen's d**: Standardized mean difference
- **Hedges' g**: Bias-corrected Cohen's d for small samples

### Significance Thresholds
- **α (Type I Error)**: 0.05
- **Power**: 0.8
- **Bootstrap Resamples**: {self.bootstrap_resamples}