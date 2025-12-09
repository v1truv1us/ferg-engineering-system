/**
 * Prompt Variants Generator
 * 
 * Generates multiple prompt variants to address single-prompt brittleness.
 * Based on research showing single-prompt evaluation is unreliable across 6.5M instances.
 */

import { BenchmarkTask, PromptVariant, VariantType, CollectionConfig } from '../types';

/**
 * Generates multiple variants of a prompt template
 */
export class PromptVariantGenerator {
  private config: CollectionConfig;

  constructor(config: CollectionConfig = { num_variants: 3, ...config }) {
    this.config = config;
  }

  /**
   * Generate variants for a given task and prompt template
   */
  generateVariants(task: BenchmarkTask, template: string): PromptVariant[] {
    const variants: PromptVariant[] = [];
    
    // 1. Original (always included)
    variants.push(this.createVariant('original', template, []));
    
    // 2. Rephrased with different vocabulary
    variants.push(this.createRephrasedVariant(template, task));
    
    // 3. Formal vs informal tone
    if (this.shouldGenerateToneVariant(task)) {
      variants.push(this.createToneVariant(template, task));
    }
    
    // 4. Different output format requests
    if (this.shouldGenerateFormatVariant(task)) {
      variants.push(this.createFormatVariant(template, task));
    }
    
    // 5. Varying context levels
    if (this.shouldGenerateContextVariant(task)) {
      variants.push(this.createContextVariant(template, task));
    }
    
    // Limit to requested number
    return variants.slice(0, this.config.num_variants);
  }

  /**
   * Create a variant with specific modifications
   */
  private createVariant(
    type: VariantType,
    template: string,
    modifications: string[]
  ): PromptVariant {
    return {
      id: `${type}-${Date.now().toString(36).substr(-8)}`,
      type,
      prompt: this.applyModifications(template, modifications),
      metadata: {
        original_template: template,
        modifications,
        generated_at: new Date().toISOString()
      }
    };
  }

  /**
   * Create rephrased variant with different vocabulary
   */
  private createRephrasedVariant(template: string, task: BenchmarkTask): PromptVariant {
    const rephrasings = [
      'Please analyze and provide',
      'Examine this and share your insights',
      'Review this carefully and respond with',
      'Consider this and offer your analysis',
      'Assess this situation and deliver'
    ];
    
    const originalTask = template.match(/{{task}}/)?.[1] || '';
    const rephrasedTask = rephrasings[Math.floor(Math.random() * rephrasings.length)];
    
    const modifications = [`Rephrased task: "${originalTask}" → "${rephrasedTask}"`];
    
    return this.createVariant('rephrased', template, modifications);
  }

  /**
   * Create tone variant (formal vs informal)
   */
  private createToneVariant(template: string, task: BenchmarkTask): PromptVariant {
    const isFormal = Math.random() > 0.5;
    const toneWord = isFormal ? 'formally' : 'casually';
    
    const modifications = [`Changed tone to ${toneWord}`];
    
    return this.createVariant('tone', template, modifications);
  }

  /**
   * Create output format variant
   */
  private createFormatVariant(template: string, task: BenchmarkTask): PromptVariant {
    const formats = ['JSON response', 'Markdown format', 'Bulleted list', 'Numbered steps'];
    const selectedFormat = formats[Math.floor(Math.random() * formats.length)];
    
    const formatInstruction = `Please respond in ${selectedFormat}`;
    const modifications = [formatInstruction];
    
    return this.createVariant('format', template, modifications);
  }

  /**
   * Create context variant (more/less detail)
   */
  private createContextVariant(template: string, task: BenchmarkTask): PromptVariant {
    const hasContext = template.includes('{{context}}');
    
    if (hasContext) {
      // Reduce context for minimal variant
      const minimalTemplate = template.replace(/\{\{#if context\}\}[^}]*\{\{\/if\}\}/g, '');
      const modifications = ['Reduced context detail'];
      return this.createVariant('minimal-context', minimalTemplate, modifications);
    } else {
      // Add more context for enhanced variant
      const enhancedContext = `
Additional context: This is part of a larger system with the following constraints:
- Production environment with high availability requirements
- Integration with existing authentication and authorization systems
- Compliance with industry standards (GDPR, SOC2, PCI-DSS)
- Performance requirements: <100ms response time for 95th percentile
- Scalability to handle 10x current load
      `;
      const modifications = ['Enhanced context detail'];
      return this.createVariant('enhanced-context', template + enhancedContext, modifications);
    }
  }

  /**
   * Apply modifications to template
   */
  private applyModifications(template: string, modifications: string[]): string {
    let result = template;
    
    for (const modification of modifications) {
      // Simple replacements for common modifications
      if (modification.includes('Rephrased task:')) {
        const match = modification.match(/"([^"]+)" → "([^"]+)"/);
        if (match) {
          result = result.replace(match[1], match[2]);
        }
      } else {
        result = result.replace('{{task}}', modification);
      }
    }
    
    return result;
  }

  /**
   * Check if tone variant is appropriate for task
   */
  private shouldGenerateToneVariant(task: BenchmarkTask): boolean {
    // Tone variants work well for creative and architecture tasks
    return ['creative', 'architecture'].includes(task.category);
  }

  /**
   * Check if format variant is appropriate for task
   */
  private shouldGenerateFormatVariant(task: BenchmarkTask): boolean {
    // Format variants work well for code review and technical tasks
    return ['code-review', 'hard-problems'].includes(task.category);
  }

  /**
   * Check if context variant is appropriate for task
   */
  private shouldGenerateContextVariant(task: BenchmarkTask): boolean {
    // Context variants work well for architecture and hard problems
    return ['architecture', 'hard-problems'].includes(task.category);
  }
}

/**
 * Utility function to generate variants for multiple tasks
 */
export function generatePromptVariants(
  tasks: BenchmarkTask[],
  templates: { baseline: string; enhanced: string },
  config: CollectionConfig = { num_variants: 3 }
): { task_id: string; variants: { baseline: PromptVariant[]; enhanced: PromptVariant[] } }[] {
  const results: { task_id: string; variants: { baseline: PromptVariant[]; enhanced: PromptVariant[] } }[] = [];
  
  for (const task of tasks) {
    const baselineVariants = new PromptVariantGenerator(config).generateVariants(task, templates.baseline);
    const enhancedVariants = new PromptVariantGenerator(config).generateVariants(task, templates.enhanced);
    
    results.push({
      task_id: task.id,
      variants: {
        baseline: baselineVariants,
        enhanced: enhancedVariants
      }
    });
  }
  
  return results;
}

/**
 * Example usage
 */
export function exampleUsage(): void {
  const task: BenchmarkTask = {
    id: 'EXAMPLE-001',
    category: 'code-review',
    title: 'Example Task',
    task: 'Review this code for security issues',
    expected_elements: ['Security vulnerabilities', 'Performance issues'],
    difficulty: 'medium',
    validates_techniques: ['expert-persona'],
    estimated_time: 15
  };
  
  const templates = {
    baseline: '# Task\n\n{{task}}',
    enhanced: '# Enhanced Prompt\n\n{{task}}'
  };
  
  const variants = generatePromptVariants([task], templates);
  
  console.log('Generated variants for task:', task.id);
  console.log('Baseline variants:', variants[0].variants.baseline);
  console.log('Enhanced variants:', variants[0].variants.enhanced);
}