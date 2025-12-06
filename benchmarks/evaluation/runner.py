"""
Evaluation runner for the validation framework.
Orchestrates the complete workflow from task loading through statistical analysis.
"""

import json
import asyncio
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path

from .types import (
    BenchmarkTask, 
    EvaluationResult, 
    CollectionConfig,
    GEvalResult
    OverallScore,
    ComparisonResult
    TechniqueResult
    ValidationReport
)

from .scoring import GEvalScorer
from .collector import ResponseCollector
from .analyzer import StatisticalAnalyzer
from .variants import PromptVariantGenerator

class EvaluationRunner:
    """Main evaluation runner for validation framework."""
    
    def __init__(self, config: CollectionConfig):
        self.config = config
        self.scorer = GEvalScorer()
        self.collector = ResponseCollector(config)
        self.analyzer = StatisticalAnalyzer()
        self.variant_generator = PromptVariantGenerator(config)
    
    async def run_validation(
        self, 
        tasks: List[BenchmarkTask],
        templates: Dict[str, str],
        dry_run: bool = False,
        categories: Optional[List[str]] = None,
        output_dir: str = "benchmarks/results"
    ) -> List[ValidationReport]:
        """Run complete validation workflow."""
        print(f"🚀 Starting validation for {len(tasks)} tasks...")
        
        if dry_run:
            print("🔍 DRY RUN MODE - No API calls will be made")
        
        # Generate prompt variants for each task
        task_variants = []
        for task in tasks:
            baseline_variants = self.variant_generator.generate_variants(task, templates['baseline'])
            enhanced_variants = self.variant_generator.generate_variants(task, templates['enhanced'])
            task_variants.append({
                'task_id': task.id,
                'variants': {
                    'baseline': baseline_variants,
                    'enhanced': enhanced_variants
                }
            })
        
        # Collect responses (skip if dry_run)
        if not dry_run:
            print("📥 Collecting responses...")
            for task_variant in task_variants:
                await self._collect_responses(task_variant, output_dir)
        
        # Run evaluations (skip if dry_run)
        if not dry_run:
            print("📊 Running evaluations...")
            for task_variant in task_variants:
                await self._evaluate_responses(task_variant, output_dir)
        
        # Generate reports
        print("📈 Generating reports...")
        reports = []
        for task_variant in task_variants:
            report = await self._generate_report(task_variant, output_dir)
            reports.append(report)
        
        print(f"✅ Validation complete! Generated {len(reports)} reports")
        return reports
    
    async def _collect_responses(
        self, 
        task_variant: Dict[str, List[PromptVariant]],
        output_dir: str
    ) -> None:
        """Collect responses for a task variant."""
        task_id = task_variant['task_id']
        variant_type = task_variant['type']
        
        for variant in task_variant['variants']:
            # Generate prompt
            prompt = self._generate_prompt(task, variant)
            
            # Call LLM (in real implementation, this would be an API call)
            response = f"Mock response for {task_id} - {variant_type} variant"
            
            # Save response
            response_file = Path(output_dir) / f"{task_id}_{variant_type}_{variant['id']}.json"
            response_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(response_file, 'w') as f:
                json.dump({
                    'task_id': task_id,
                    'variant_type': variant_type,
                    'variant_id': variant['id'],
                    'prompt': prompt,
                    'response': response,
                    'timestamp': datetime.now().isoformat(),
                    'metadata': variant['metadata']
                }, f, indent=2)
            
            print(f"  ✓ Saved response: {response_file}")
    
    async def _evaluate_responses(
        self, 
        task_variant: Dict[str, List[PromptVariant]],
        output_dir: str
    ) -> None:
        """Evaluate responses for a task variant."""
        task_id = task_variant['task_id']
        variant_type = task_variant['type']
        
        for variant in task_variant['variants']:
            # Load saved response
            response_file = Path(output_dir) / f"{task_id}_{variant_type}_{variant['id']}.json"
            
            if not response_file.exists():
                print(f"⚠  No response file found for {task_id}_{variant_type}_{variant['id']}")
                continue
            
            with open(response_file, 'r') as f:
                data = json.load(f)
            
            # Evaluate using G-Eval
            result = self.scorer.evaluate_responses(
                baseline_response=data.get('baseline_response', ''),
                enhanced_response=data.get('enhanced_response', ''),
                task_id=task_id
            )
            
            # Save evaluation result
            eval_file = Path(output_dir) / f"{task_id}_{variant_type}_{variant['id']}_eval.json"
            eval_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(eval_file, 'w') as f:
                json.dump(result.model_dump(), f, indent=2)
            
            print(f"  ✓ Evaluated: {task_id}_{variant_type}_{variant['id']}")
    
    async def _generate_prompt(
        self, 
        task: BenchmarkTask,
        variant: PromptVariant
    ) -> str:
        """Generate a prompt from template and variant."""
        template = self._get_template(task, variant.type)
        return self._apply_modifications(template, variant.modifications)
    
    def _get_template(self, task: BenchmarkTask, template_type: str) -> str:
        """Get the appropriate template for a task and variant type."""
        templates = {
            'baseline': self.config.templates.get('baseline', ''),
            'enhanced': self.config.templates.get('enhanced', '')
        }
        return templates[template_type]
    
    def _apply_modifications(self, template: str, modifications: List[str]) -> str:
        """Apply modifications to a template."""
        result = template
        for modification in modifications:
            result = result.replace(modification[0], modification[1])
        return result
    
    async def _generate_report(
        self, 
        task_variant: Dict[str, List[PromptVariant]],
        output_dir: str
    ) -> Dict[str, Any]:
        """Generate a validation report for a task variant."""
        task_id = task_variant['task_id']
        variant_type = task_variant['type']
        
        # Load evaluation results
        eval_results = []
        for variant in task_variant['variants']:
            eval_file = Path(output_dir) / f"{task_id}_{variant_type}_{variant['id']}_eval.json"
            
            if eval_file.exists():
                with open(eval_file, 'r') as f:
                    data = json.load(f)
                    eval_results.append(data)
            else:
                print(f"⚠  No evaluation found for {task_id}_{variant_type}_{variant['id']}")
        
        if not eval_results:
            print(f"⚠ No evaluations found for {task_id}_{variant_type}")
            return {}
        
        # Generate report
        return {
            'task_id': task_id,
            'variant_type': variant_type,
            'report': self._generate_markdown_report(task_id, variant_type, eval_results)
        }
    
    def _generate_markdown_report(
        self, 
        task_id: str,
        variant_type: str,
        eval_results: List[Dict[str, Any]]
    ) -> str:
        """Generate a markdown report for evaluation results."""
        lines = []
        lines.append(f"# Validation Report: {task_id} ({variant_type})")
        lines.append(f"Generated: {datetime.now().isoformat()}")
        lines.append("")
        
        # Overall summary
        if eval_results:
            avg_baseline = sum(r['evaluation']['overall']['baseline_score'] for r in eval_results) / len(eval_results)
            avg_enhanced = sum(r['evaluation']['overall']['enhanced_score'] for r in eval_results) / len(eval_results)
            improvement = ((avg_enhanced - avg_baseline) / avg_baseline) * 100 if avg_baseline > 0 else 0
            
            lines.append(f"## Overall Summary")
            lines.append(f"- Baseline Average Score: {avg_baseline:.2f}")
            lines.append(f"- Enhanced Average Score: {avg_enhanced:.2f}")
            lines.append(f"- Average Improvement: {improvement:.1f}%")
            lines.append("")
        
        # Individual variant results
        for i, result in enumerate(eval_results):
            lines.append(f"### Variant {i+1} ({result['evaluation']['overall']['winner']})")
            lines.append(f"**Score:** {result['evaluation']['overall']['enhanced_score']:.2f}")
            lines.append(f"**Improvement:** {((result['evaluation']['overall']['enhanced_score'] - result['evaluation']['overall']['baseline_score']) / result['evaluation']['overall']['baseline_score'] * 100):.1f}%")
            lines.append("")
            
            # Dimension breakdown
            for dimension in ['accuracy', 'completeness', 'clarity', 'actionability', 'relevance']:
                baseline_score = result['evaluation'][dimension]['score']
                enhanced_score = result['evaluation'][dimension]['score']
                lines.append(f"- **{dimension.title()}**")
                lines.append(f"  - Baseline: {baseline_score:.2f} ({result['evaluation'][dimension]['reasoning'][:50]}...)")
                lines.append(f"  - Enhanced: {enhanced_score:.2f} ({result['evaluation'][dimension]['reasoning'][:50]}...)")
                lines.append(f"  - Improvement: {((enhanced_score - baseline_score) / baseline_score) * 100 if baseline_score > 0 else 0):.1f}%")
                lines.append("")
        
        lines.append("")
        lines.append("## Detailed Results")
        lines.append("| Variant | Winner | Baseline | Enhanced | Improvement |")
        lines.append("|--------|--------|----------|------------|------------|")
        
        for i, result in enumerate(eval_results):
            winner = "✓" if result['evaluation']['overall']['winner'] == 'enhanced' else "✗"
            baseline = result['evaluation']['overall']['baseline_score']
            enhanced = result['evaluation']['overall']['enhanced_score']
            improvement = ((enhanced - baseline) / baseline * 100) if baseline > 0 else 0)
            
            lines.append(f"| {i+1:2} | {winner} | {baseline:.2f} | {enhanced:.2f} | {improvement:.1f}% |")
        
        lines.append("")
        
        return "\n".join(lines)

# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def main():
        # Example task
        task = {
            'id': 'EXAMPLE-001',
            'title': 'Example Task',
            'task': 'Example task description',
            'expected_elements': ['Element 1', 'Element 2']
            'difficulty': 'medium',
            'validates_techniques': ['expert-persona']
        }
        
        # Generate variants and run validation
        variants = generatePromptVariants([task], {
            'baseline': '# Baseline prompt\n\n{{task}}',
            'enhanced': '# Enhanced prompt\n\n{{task}}'
        })
        
        reports = await run_validation(variants, dry_run=True)
        
        # Print summary
        for report in reports:
            print(report)
        
        print(f"\n📊 Generated {len(reports)} reports for {len(variants)} variants")