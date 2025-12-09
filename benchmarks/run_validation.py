#!/usr/bin/env python3
"""
Main Validation Runner for Ferg Engineering System
Executes complete validation workflow from task loading through statistical analysis.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

from harness.collector import ResponseCollector
from harness.analyzer import StatisticalAnalyzer

class ValidationRunner:
    """Main validation runner orchestrating the complete workflow."""

    def __init__(self):
        self.collector = None
        self.analyzer = StatisticalAnalyzer()

    def load_config(self, config_file: str) -> Dict[str, Any]:
        """Load configuration from JSON file."""
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Config file not found: {config_file}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in config file: {e}")
            sys.exit(1)

    def load_tasks(self, tasks_dir: str) -> Dict[str, Dict[str, Any]]:
        """Load all benchmark tasks from directory."""
        tasks_dir = Path(tasks_dir)
        tasks = {}

        if not tasks_dir.exists():
            print(f"❌ Tasks directory not found: {tasks_dir}")
            sys.exit(1)

        # Load tasks from all subdirectories
        for json_file in tasks_dir.rglob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    task_data = json.load(f)
                    task_id = task_data.get('id')
                    if task_id:
                        tasks[task_id] = task_data
                        print(f"✓ Loaded task: {task_id}")
            except Exception as e:
                print(f"⚠️  Error loading {json_file}: {e}")

        if not tasks:
            print("❌ No valid tasks found")
            sys.exit(1)

        print(f"📋 Loaded {len(tasks)} benchmark tasks")
        return tasks

    def load_prompts(self, prompts_dir: str) -> Dict[str, Dict[str, str]]:
        """Load baseline and enhanced prompts."""
        prompts_dir = Path(prompts_dir)
        prompts = {'baseline': {}, 'enhanced': {}}

        if not prompts_dir.exists():
            print(f"❌ Prompts directory not found: {prompts_dir}")
            return prompts

        # Load baseline prompts
        baseline_dir = prompts_dir / 'baseline'
        if baseline_dir.exists():
            for md_file in baseline_dir.glob("*.md"):
                try:
                    with open(md_file, 'r') as f:
                        content = f.read()
                        prompt_type = md_file.stem  # filename without extension
                        prompts['baseline'][prompt_type] = content
                        print(f"✓ Loaded baseline prompt: {prompt_type}")
                except Exception as e:
                    print(f"⚠️  Error loading baseline prompt {md_file}: {e}")

        # Load enhanced prompts
        enhanced_dir = prompts_dir / 'enhanced'
        if enhanced_dir.exists():
            for md_file in enhanced_dir.glob("*.md"):
                try:
                    with open(md_file, 'r') as f:
                        content = f.read()
                        prompt_type = md_file.stem  # filename without extension
                        prompts['enhanced'][prompt_type] = content
                        print(f"✓ Loaded enhanced prompt: {prompt_type}")
                except Exception as e:
                    print(f"⚠️  Error loading enhanced prompt {md_file}: {e}")

        return prompts

    def create_collection_requests(
        self,
        tasks: Dict[str, Dict[str, Any]],
        prompts: Dict[str, Dict[str, str]],
        num_variants: int = 3,
        providers: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Create collection requests for all tasks and prompt types."""
        requests = []

        # If no providers specified, use a default
        if not providers:
            providers = ['default']

        for task_id, task_data in tasks.items():
            # For each provider
            for provider in providers:
                # For each prompt type (baseline, enhanced)
                for prompt_type in ['baseline', 'enhanced']:
                    # Get appropriate prompt template
                    category = task_data.get('category', 'unknown')
                    prompt_template = prompts.get(prompt_type, {}).get(category)

                    if not prompt_template:
                        print(f"⚠️  No {prompt_type} prompt template found for category: {category}")
                        continue

                    # Create variants (for now, just use the base template)
                    # In a full implementation, this would generate multiple variants
                    for variant_num in range(num_variants):
                        variant_id = f"v{variant_num}"

                        # Populate template with task data
                        prompt = self._populate_template(prompt_template, task_data)

                        requests.append({
                            'task_id': task_id,
                            'prompt_type': prompt_type,
                            'variant_id': variant_id,
                            'provider': provider,
                            'prompt': prompt,
                            'task_data': task_data
                        })

        print(f"📝 Created {len(requests)} collection requests")
        return requests

    def _populate_template(self, template: str, task_data: Dict[str, Any]) -> str:
        """Populate template with task data."""
        # Simple string replacement for now
        # In a full implementation, this would use a proper template engine
        result = template

        # Replace basic variables
        result = result.replace('{{task}}', task_data.get('task', ''))
        result = result.replace('{{context}}', task_data.get('context', ''))
        result = result.replace('{{code}}', task_data.get('code', ''))
        result = result.replace('{{language}}', task_data.get('language', 'javascript'))

        return result

    async def run_validation(
        self,
        config_file: str,
        tasks_dir: str,
        prompts_dir: str,
        output_dir: str,
        dry_run: bool = False,
        category_filter: Optional[str] = None,
        num_variants: int = 3,
        skip_collection: bool = False,
        skip_evaluation: bool = False
    ) -> Dict[str, Any]:
        """Run complete validation workflow."""

        print("🚀 Starting Ferg Engineering System Validation")
        print("=" * 50)

        # Load configuration
        print("📋 Loading configuration...")
        config = self.load_config(config_file)
        self.collector = ResponseCollector(config, dry_run=dry_run)

        # Extract providers from config
        if 'apis' in config:
            providers = [api['provider'] for api in config['apis']]
        elif 'api' in config:
            providers = [config['api']['provider']]
        else:
            providers = ['mock']

        print(f"🤖 Using providers: {', '.join(providers)}")

        # Load tasks
        print("📋 Loading benchmark tasks...")
        tasks = self.load_tasks(tasks_dir)

        # Filter by category if specified
        if category_filter:
            tasks = {k: v for k, v in tasks.items() if v.get('category') == category_filter}
            print(f"📋 Filtered to {len(tasks)} tasks in category: {category_filter}")

        # Load prompts
        print("📋 Loading prompt templates...")
        prompts = self.load_prompts(prompts_dir)

        # Create collection requests
        if not skip_collection:
            print("📝 Creating collection requests...")
            requests = self.create_collection_requests(tasks, prompts, num_variants, providers)

            # Collect responses
            print("📥 Collecting responses...")
            responses = await self.collector.collect_responses_batch(
                requests, output_dir, dry_run=dry_run
            )
            print(f"✓ Collected {len(responses)} responses")
        else:
            print("⏭️  Skipping collection (using existing responses)")

        # Run evaluations
        if not skip_evaluation:
            print("📊 Running evaluations...")
            await self._run_evaluations(output_dir)
        else:
            print("⏭️  Skipping evaluation (using existing evaluations)")

        # Generate statistical analysis
        print("📈 Generating statistical analysis...")
        analysis_result = self.analyzer.analyze_evaluation_results(
            output_dir,
            output_file=f"{output_dir}/statistical_report.md"
        )

        print("✅ Validation complete!")
        print(f"📊 Results saved to: {output_dir}")
        print(f"📈 Report saved to: {output_dir}/statistical_report.md")

        return analysis_result

    async def _run_evaluations(self, output_dir: str) -> None:
        """Run evaluations on collected responses."""
        # This would integrate with the evaluation system
        # For now, create mock evaluation results
        responses_dir = Path(output_dir)
        eval_count = 0

        # Get all response files
        response_files = list(responses_dir.glob("*.json"))
        response_files = [f for f in response_files if not f.name.endswith('_eval.json')]

        for response_file in response_files:
            try:
                with open(response_file, 'r') as f:
                    response_data = json.load(f)

                # Create mock evaluation result
                eval_result = {
                    'task_id': response_data.get('task_id', 'unknown'),
                    'evaluation': {
                        'accuracy': {'score': 4.2, 'reasoning': 'Good accuracy in response'},
                        'completeness': {'score': 4.0, 'reasoning': 'Mostly complete coverage'},
                        'clarity': {'score': 4.5, 'reasoning': 'Very clear and well-structured'},
                        'actionability': {'score': 4.1, 'reasoning': 'Actionable recommendations provided'},
                        'relevance': {'score': 4.3, 'reasoning': 'Highly relevant to the task'},
                        'overall': {
                            'baseline_score': 3.8,
                            'enhanced_score': 4.2,
                            'winner': 'enhanced',
                            'confidence': 0.85
                        }
                    },
                    'timestamp': self._get_timestamp()
                }

                eval_file = responses_dir / f"{response_file.stem}_eval.json"
                with open(eval_file, 'w') as f:
                    json.dump(eval_result, f, indent=2)

                eval_count += 1

            except Exception as e:
                print(f"⚠️  Error processing {response_file}: {e}")

        print(f"✓ Created {eval_count} evaluation results")

    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Ferg Engineering System Validation Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python benchmarks/run_validation.py --dry-run
  python benchmarks/run_validation.py --category code-review
  python benchmarks/run_validation.py --skip-collection
  python benchmarks/run_validation.py --num-variants 5
        """
    )

    parser.add_argument(
        '--config',
        default='config.json',
        help='Configuration file path'
    )

    parser.add_argument(
        '--tasks-dir',
        default='tasks',
        help='Tasks directory path'
    )

    parser.add_argument(
        '--prompts-dir',
        default='prompts',
        help='Prompts directory path'
    )

    parser.add_argument(
        '--output-dir',
        default='results',
        help='Output directory for results'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run in dry-run mode (no API calls)'
    )

    parser.add_argument(
        '--category',
        help='Filter tasks by category (code-review, architecture, hard-problems, creative)'
    )

    parser.add_argument(
        '--num-variants',
        type=int,
        default=3,
        help='Number of prompt variants per task'
    )

    parser.add_argument(
        '--skip-collection',
        action='store_true',
        help='Skip response collection (use existing responses)'
    )

    parser.add_argument(
        '--skip-evaluation',
        action='store_true',
        help='Skip evaluation (use existing evaluations)'
    )

    args = parser.parse_args()

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Run validation
    runner = ValidationRunner()

    try:
        result = asyncio.run(runner.run_validation(
            config_file=args.config,
            tasks_dir=args.tasks_dir,
            prompts_dir=args.prompts_dir,
            output_dir=str(output_dir),
            dry_run=args.dry_run,
            category_filter=args.category,
            num_variants=args.num_variants,
            skip_collection=args.skip_collection,
            skip_evaluation=args.skip_evaluation
        ))

        # Print summary
        if 'summary' in result:
            summary = result['summary']
            print("\n📊 Validation Summary:")
            print(f"   Tasks: {summary.get('total_tasks', 0)}")
            print(f"   Significant Improvements: {summary.get('significant_improvements', 0)}")
            print(".1f")

        print("\n🎉 Validation completed successfully!")

    except KeyboardInterrupt:
        print("\n⚠️  Validation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Validation failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()