"""
Statistical Analysis Engine for Validation Framework
Implements research-backed statistical methods for LLM evaluation.
"""

import json
import numpy as np
from scipy import stats
from scipy.stats import bootstrap
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path

@dataclass
class StatisticalResult:
    """Result of statistical analysis."""
    sample_size: int
    mean_baseline: float
    mean_enhanced: float
    mean_improvement: float
    improvement_percentage: float
    cohens_d: float
    hedges_g: float
    wilcoxon_statistic: float
    wilcoxon_p_value: float
    significant: bool
    confidence_interval: Tuple[float, float]
    power_analysis: Dict[str, Any]

@dataclass
class TechniqueComparison:
    """Comparison between baseline and enhanced for a specific technique."""
    technique: str
    baseline_scores: List[float]
    enhanced_scores: List[float]
    statistical_result: StatisticalResult

class StatisticalAnalyzer:
    """Statistical analysis engine for validation framework."""

    def __init__(self):
        self.alpha = 0.05  # Significance level
        self.power = 0.80  # Desired power
        self.bootstrap_resamples = 9999

    def analyze_technique_comparison(
        self,
        baseline_scores: List[float],
        enhanced_scores: List[float],
        technique_name: str = "unknown"
    ) -> TechniqueComparison:
        """Analyze comparison between baseline and enhanced scores for a technique."""

        if len(baseline_scores) != len(enhanced_scores):
            raise ValueError("Baseline and enhanced scores must have same length")

        if len(baseline_scores) < 3:
            raise ValueError("Need at least 3 samples for statistical analysis")

        # Calculate basic statistics
        baseline_array = np.array(baseline_scores)
        enhanced_array = np.array(enhanced_scores)

        mean_baseline = float(np.mean(baseline_array))
        mean_enhanced = float(np.mean(enhanced_array))
        mean_improvement = mean_enhanced - mean_baseline
        improvement_percentage = (mean_improvement / mean_baseline * 100) if mean_baseline > 0 else 0

        # Effect sizes
        cohens_d = self._calculate_cohens_d(baseline_array, enhanced_array)
        hedges_g = self._calculate_hedges_g(baseline_array, enhanced_array)

        # Wilcoxon signed-rank test (paired, non-parametric)
        wilcoxon_statistic, wilcoxon_p_value = stats.wilcoxon(
            enhanced_array, baseline_array, alternative='greater'
        )

        # Significance
        significant = wilcoxon_p_value < self.alpha

        # Bootstrap confidence interval for improvement
        improvement_data = enhanced_array - baseline_array
        ci_result = bootstrap(
            (improvement_data,),
            np.mean,
            method='BCa',
            n_resamples=self.bootstrap_resamples,
            confidence_level=0.95
        )
        confidence_interval = (
            float(ci_result.confidence_interval.low),
            float(ci_result.confidence_interval.high)
        )

        # Power analysis
        power_analysis = self._power_analysis(baseline_array, enhanced_array)

        statistical_result = StatisticalResult(
            sample_size=len(baseline_scores),
            mean_baseline=mean_baseline,
            mean_enhanced=mean_enhanced,
            mean_improvement=mean_improvement,
            improvement_percentage=improvement_percentage,
            cohens_d=cohens_d,
            hedges_g=hedges_g,
            wilcoxon_statistic=float(wilcoxon_statistic),
            wilcoxon_p_value=float(wilcoxon_p_value),
            significant=significant,
            confidence_interval=confidence_interval,
            power_analysis=power_analysis
        )

        return TechniqueComparison(
            technique=technique_name,
            baseline_scores=baseline_scores,
            enhanced_scores=enhanced_scores,
            statistical_result=statistical_result
        )

    def _calculate_cohens_d(self, group1: np.ndarray, group2: np.ndarray) -> float:
        """Calculate Cohen's d effect size for paired samples."""
        diff = group1 - group2
        return float(np.mean(diff) / np.std(diff, ddof=1))

    def _calculate_hedges_g(self, group1: np.ndarray, group2: np.ndarray) -> float:
        """Calculate Hedges' g (bias-corrected Cohen's d) for small samples."""
        d = self._calculate_cohens_d(group1, group2)
        n = len(group1)
        correction = 1 - (3 / (4 * (2 * n - 2) - 1))
        return float(d * correction)

    def _power_analysis(self, baseline: np.ndarray, enhanced: np.ndarray) -> Dict[str, Any]:
        """Perform power analysis for the comparison."""
        from statsmodels.stats.power import TTestIndPower

        # Calculate effect size
        effect_size = abs(self._calculate_cohens_d(baseline, enhanced))

        # Power analysis
        analysis = TTestIndPower()
        n_required = analysis.solve_power(
            effect_size=effect_size,
            power=self.power,
            alpha=self.alpha
        )

        # Current power
        current_power = analysis.solve_power(
            effect_size=effect_size,
            nobs1=len(baseline),
            ratio=1.0,
            alpha=self.alpha
        )

        return {
            'effect_size': effect_size,
            'current_sample_size': len(baseline),
            'current_power': float(current_power),
            'required_sample_size': float(n_required),
            'sufficient_power': current_power >= self.power
        }

    def analyze_multiple_techniques(
        self,
        technique_data: Dict[str, Dict[str, List[float]]]
    ) -> Dict[str, TechniqueComparison]:
        """Analyze multiple techniques simultaneously with multiple comparison correction."""

        results = {}
        p_values = []

        # First pass: calculate individual results
        for technique_name, data in technique_data.items():
            comparison = self.analyze_technique_comparison(
                data['baseline'],
                data['enhanced'],
                technique_name
            )
            results[technique_name] = comparison
            p_values.append(comparison.statistical_result.wilcoxon_p_value)

        # Apply Holm-Bonferroni correction for multiple comparisons
        if len(p_values) > 1:
            reject, corrected_p, _, _ = self._holm_bonferroni_correction(p_values)

            # Update significance based on corrected p-values
            for i, technique_name in enumerate(technique_data.keys()):
                results[technique_name].statistical_result.significant = reject[i]
                # Store corrected p-value for reference
                results[technique_name].statistical_result.corrected_p_value = corrected_p[i]

        return results

    def _holm_bonferroni_correction(self, p_values: List[float]) -> Tuple[List[bool], List[float]]:
        """Apply Holm-Bonferroni correction for multiple comparisons."""
        n = len(p_values)
        sorted_indices = np.argsort(p_values)
        sorted_p = np.array(p_values)[sorted_indices]

        corrected_p = np.zeros(n)
        reject = np.zeros(n, dtype=bool)

        for i in range(n):
            corrected_p[i] = sorted_p[i] * (n - i)
            if corrected_p[i] <= self.alpha:
                reject[i] = True
            else:
                break

        # Unsort results
        unsorted_reject = np.zeros(n, dtype=bool)
        unsorted_corrected_p = np.zeros(n)

        for i, original_idx in enumerate(sorted_indices):
            unsorted_reject[original_idx] = reject[i]
            unsorted_corrected_p[original_idx] = min(corrected_p[i], 1.0)

        return unsorted_reject.tolist(), unsorted_corrected_p.tolist()

    def generate_markdown_report(
        self,
        comparisons: Dict[str, TechniqueComparison],
        title: str = "Statistical Analysis Report"
    ) -> str:
        """Generate comprehensive markdown report."""

        lines = []
        lines.append(f"# {title}")
        lines.append(f"Generated: {self._get_timestamp()}")
        lines.append("")

        # Executive Summary
        lines.append("## Executive Summary")
        lines.append("")

        significant_improvements = [k for k, v in comparisons.items() if v.statistical_result.significant]
        avg_improvement = np.mean([v.statistical_result.improvement_percentage for v in comparisons.values()])

        lines.append(f"- **Techniques Analyzed**: {len(comparisons)}")
        lines.append(f"- **Significant Improvements**: {len(significant_improvements)}")
        lines.append(".1f")
        lines.append(f"- **Average Improvement**: {avg_improvement:.1f}%")
        lines.append("")

        # Technique-by-Technique Results
        lines.append("## Technique Results")
        lines.append("")

        lines.append("| Technique | Sample Size | Improvement | Cohen's d | p-value | Significant |")
        lines.append("|-----------|-------------|-------------|-----------|---------|-------------|")

        for technique_name, comparison in comparisons.items():
            stat = comparison.statistical_result
            sig_marker = "✓" if stat.significant else "✗"
            lines.append(
                f"| {technique_name} | {stat.sample_size} | {stat.improvement_percentage:.1f}% | "
                f"{stat.cohens_d:.2f} | {stat.wilcoxon_p_value:.4f} | {sig_marker} |"
            )

        lines.append("")

        # Detailed Analysis
        lines.append("## Detailed Analysis")
        lines.append("")

        for technique_name, comparison in comparisons.items():
            stat = comparison.statistical_result

            lines.append(f"### {technique_name}")
            lines.append("")
            lines.append("#### Statistics")
            lines.append(f"- **Sample Size**: {stat.sample_size}")
            lines.append(".2f")
            lines.append(".2f")
            lines.append(".2f")
            lines.append(".1f")
            lines.append("")
            lines.append("#### Effect Sizes")
            lines.append(".2f")
            lines.append(".2f")
            lines.append("")
            lines.append("#### Statistical Tests")
            lines.append(".2f")
            lines.append(".4f")
            lines.append(f"- **Significant**: {'Yes' if stat.significant else 'No'} (α = {self.alpha})")
            lines.append("")
            lines.append("#### Confidence Interval (95%)")
            lines.append(".2f")
            lines.append("")
            lines.append("#### Power Analysis")
            power = stat.power_analysis
            lines.append(".2f")
            lines.append(f"- **Current Power**: {power['current_power']:.2f}")
            lines.append(f"- **Required Sample Size**: {power['required_sample_size']:.0f}")
            lines.append(f"- **Sufficient Power**: {'Yes' if power['sufficient_power'] else 'No'}")
            lines.append("")

        # Methodology
        lines.append("## Methodology")
        lines.append("")
        lines.append("### Statistical Tests")
        lines.append("- **Wilcoxon Signed-Rank Test**: Paired, non-parametric test for related samples")
        lines.append("- **Holm-Bonferroni Correction**: Multiple comparison correction for family-wise error")
        lines.append("- **BCa Bootstrap**: Bias-corrected and accelerated confidence intervals")
        lines.append("")
        lines.append("### Effect Size Measures")
        lines.append("- **Cohen's d**: Standardized mean difference")
        lines.append("- **Hedges' g**: Bias-corrected Cohen's d for small samples")
        lines.append("")
        lines.append("### Significance Thresholds")
        lines.append(f"- **α (Type I Error)**: {self.alpha}")
        lines.append(f"- **Power**: {self.power}")
        lines.append("- **Bootstrap Resamples**: {self.bootstrap_resamples}")

        return "\n".join(lines)

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()

    def load_evaluation_results(self, results_dir: str) -> Dict[str, List[Dict[str, Any]]]:
        """Load evaluation results from directory."""
        results_dir = Path(results_dir)
        evaluation_data = {}

        if not results_dir.exists():
            return evaluation_data

        for json_file in results_dir.glob("*_eval.json"):
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)

                task_id = data.get('task_id', 'unknown')
                if task_id not in evaluation_data:
                    evaluation_data[task_id] = []

                evaluation_data[task_id].append(data)

            except Exception as e:
                print(f"Error loading {json_file}: {e}")

        return evaluation_data

    def analyze_evaluation_results(
        self,
        results_dir: str,
        output_file: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze complete evaluation results and generate report."""

        # Load all evaluation results
        evaluation_data = self.load_evaluation_results(results_dir)

        if not evaluation_data:
            return {"error": "No evaluation results found"}

        # Group by technique (this would need to be determined from the data)
        # For now, assume we have baseline vs enhanced comparisons
        technique_data = self._group_by_technique(evaluation_data)

        # Analyze each technique
        comparisons = self.analyze_multiple_techniques(technique_data)

        # Generate report
        report = self.generate_markdown_report(comparisons)

        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)

        return {
            'comparisons': {k: v.__dict__ for k, v in comparisons.items()},
            'report': report,
            'summary': {
                'total_tasks': len(evaluation_data),
                'significant_improvements': len([c for c in comparisons.values() if c.statistical_result.significant]),
                'average_improvement': float(np.mean([c.statistical_result.improvement_percentage for c in comparisons.values()]))
            }
        }

    def _group_by_technique(self, evaluation_data: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Dict[str, List[float]]]:
        """Group evaluation data by technique for analysis."""
        # This is a simplified implementation
        # In practice, you'd need to determine which evaluations belong to which techniques
        # based on the task metadata and prompting techniques used

        technique_data = {}

        for task_id, evaluations in evaluation_data.items():
            for eval_result in evaluations:
                # Extract baseline and enhanced scores
                baseline_score = eval_result.get('evaluation', {}).get('overall', {}).get('baseline_score', 0)
                enhanced_score = eval_result.get('evaluation', {}).get('overall', {}).get('enhanced_score', 0)

                # For now, assume all evaluations are for a single technique
                # In practice, you'd parse the task metadata to determine which techniques were used
                technique = "combined"  # This would be determined from task metadata

                if technique not in technique_data:
                    technique_data[technique] = {'baseline': [], 'enhanced': []}

                technique_data[technique]['baseline'].append(baseline_score)
                technique_data[technique]['enhanced'].append(enhanced_score)

        return technique_data