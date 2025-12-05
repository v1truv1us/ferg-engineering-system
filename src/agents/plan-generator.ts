/**
 * Plan generation from descriptions using agent collaboration.
 * Coordinates multiple agents to create comprehensive implementation plans.
 */

import { AgentCoordinator } from './coordinator.js';
import { 
  AgentType, 
  AgentTask, 
  AggregationStrategy,
  PlanGenerationInput,
  PlanGenerationOutput,
  AgentTaskStatus,
  ConfidenceLevel,
  ExecutionStrategy
} from './types.js';

export class PlanGenerator {
  private coordinator: AgentCoordinator;

  constructor(coordinator: AgentCoordinator) {
    this.coordinator = coordinator;
  }

  /**
   * Generate a comprehensive plan from a natural language description
   */
  public async generatePlan(input: PlanGenerationInput): Promise<PlanGenerationOutput> {
    const startTime = Date.now();

    try {
      // Create agent tasks for plan generation
      const tasks = this.createPlanGenerationTasks(input);
      
      // Execute tasks with parallel strategy for efficiency
      const results = await this.coordinator.executeTasks(tasks, {
        type: 'parallel',
        weights: {
          [AgentType.ARCHITECT_ADVISOR]: 0.4,
          [AgentType.BACKEND_ARCHITECT]: 0.3,
          [AgentType.FRONTEND_REVIEWER]: 0.3
        },
        conflictResolution: 'highest_confidence'
      });

      // Aggregate results into a comprehensive plan
      const plan = this.aggregatePlanResults(results, input);
      
      const executionTime = Date.now() - startTime;

      return {
        plan,
        confidence: this.calculateOverallConfidence(results),
        reasoning: this.generateReasoning(results, input),
        suggestions: this.generateSuggestions(results)
      };

    } catch (error) {
      throw new Error(`Plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a plan with specific scope constraints
   */
  public async generateScopedPlan(
    input: PlanGenerationInput, 
    scope: 'architecture' | 'implementation' | 'review' | 'full'
  ): Promise<PlanGenerationOutput> {
    const scopedInput = {
      ...input,
      scope: scope === 'full' ? input.scope : scope
    };

    return this.generatePlan(scopedInput);
  }

  /**
   * Validate and enhance an existing plan
   */
  public async validatePlan(plan: any): Promise<{
    isValid: boolean;
    issues: string[];
    enhancements: string[];
    confidence: ConfidenceLevel;
  }> {
    const validationTasks: AgentTask[] = [
      {
        id: 'validate-architecture',
        type: AgentType.ARCHITECT_ADVISOR,
        name: 'Architecture Validation',
        description: 'Validate architectural aspects of the plan',
        input: {
          type: AgentType.ARCHITECT_ADVISOR,
          context: { plan, validationType: 'architecture' },
          parameters: { strictMode: true }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      },
      {
        id: 'validate-security',
        type: AgentType.SECURITY_SCANNER,
        name: 'Security Validation',
        description: 'Validate security aspects of the plan',
        input: {
          type: AgentType.SECURITY_SCANNER,
          context: { plan, validationType: 'security' },
          parameters: { severity: 'high' }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      },
      {
        id: 'validate-performance',
        type: AgentType.PERFORMANCE_ENGINEER,
        name: 'Performance Validation',
        description: 'Validate performance aspects of the plan',
        input: {
          type: AgentType.PERFORMANCE_ENGINEER,
          context: { plan, validationType: 'performance' },
          parameters: { threshold: 'medium' }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      }
    ];

    const results = await this.coordinator.executeTasks(validationTasks, {
      type: 'parallel',
      conflictResolution: 'highest_confidence'
    });

    return this.aggregateValidationResults(results);
  }

  /**
   * Create agent tasks for plan generation
   */
  private createPlanGenerationTasks(input: PlanGenerationInput): AgentTask[] {
    const baseContext = {
      description: input.description,
      scope: input.scope,
      requirements: input.requirements,
      constraints: input.constraints,
      context: input.context
    };

    const tasks: AgentTask[] = [];

    // Architecture analysis task
    tasks.push({
      id: 'plan-architecture',
      type: AgentType.ARCHITECT_ADVISOR,
      name: 'Architecture Planning',
      description: 'Analyze requirements and create architectural plan',
      input: {
        type: AgentType.ARCHITECT_ADVISOR,
        context: {
          ...baseContext,
          focus: 'architecture',
          deliverables: ['system-design', 'component-structure', 'data-flow']
        },
        parameters: {
          detailLevel: 'high',
          includeDiagrams: true
        }
      },
      strategy: ExecutionStrategy.SEQUENTIAL,
      timeout: 15000
    });

    // Backend planning task
    tasks.push({
      id: 'plan-backend',
      type: AgentType.BACKEND_ARCHITECT,
      name: 'Backend Planning',
      description: 'Create backend implementation plan',
      input: {
        type: AgentType.BACKEND_ARCHITECT,
        context: {
          ...baseContext,
          focus: 'backend',
          deliverables: ['api-design', 'database-schema', 'business-logic']
        },
        parameters: {
          includeTesting: true,
          includeDeployment: true
        }
      },
      strategy: ExecutionStrategy.SEQUENTIAL,
      timeout: 12000
    });

    // Frontend planning task
    tasks.push({
      id: 'plan-frontend',
      type: AgentType.FRONTEND_REVIEWER,
      name: 'Frontend Planning',
      description: 'Create frontend implementation plan',
      input: {
        type: AgentType.FRONTEND_REVIEWER,
        context: {
          ...baseContext,
          focus: 'frontend',
          deliverables: ['ui-components', 'user-flows', 'state-management']
        },
        parameters: {
          includeAccessibility: true,
          includeResponsive: true
        }
      },
      strategy: ExecutionStrategy.SEQUENTIAL,
      timeout: 12000
    });

    // Add SEO planning if relevant
    if (this.isSEORelevant(input)) {
      tasks.push({
        id: 'plan-seo',
        type: AgentType.SEO_SPECIALIST,
        name: 'SEO Planning',
        description: 'Create SEO optimization plan',
        input: {
          type: AgentType.SEO_SPECIALIST,
          context: {
            ...baseContext,
            focus: 'seo',
            deliverables: ['meta-tags', 'structured-data', 'performance-optimization']
          },
          parameters: {
            targetAudience: 'general',
            priority: 'medium'
          }
        },
        strategy: ExecutionStrategy.SEQUENTIAL,
        timeout: 8000
      });
    }

    return tasks;
  }

  /**
   * Aggregate results from multiple agents into a comprehensive plan
   */
  private aggregatePlanResults(results: any[], input: PlanGenerationInput): any {
    const successfulResults = results.filter(r => r.status === AgentTaskStatus.COMPLETED && r.output?.success);
    
    if (successfulResults.length === 0) {
      throw new Error('No successful agent results to aggregate');
    }

    // Extract tasks from each agent result
    const allTasks: any[] = [];
    const dependencies: string[][] = [];
    
    for (const result of successfulResults) {
      if (result.output?.result?.tasks) {
        allTasks.push(...result.output.result.tasks);
      }
      if (result.output?.result?.dependencies) {
        dependencies.push(...result.output.result.dependencies);
      }
    }

    // Create a comprehensive plan
    const planName = this.generatePlanName(input.description);
    const planDescription = this.generatePlanDescription(input, successfulResults);

    return {
      name: planName,
      description: planDescription,
      tasks: this.deduplicateAndOrganizeTasks(allTasks),
      dependencies: this.resolveDependencies(dependencies),
      metadata: {
        generatedBy: 'PlanGenerator',
        generatedAt: new Date().toISOString(),
        agentCount: successfulResults.length,
        inputScope: input.scope
      }
    };
  }

  /**
   * Calculate overall confidence from multiple agent results
   */
  private calculateOverallConfidence(results: any[]): ConfidenceLevel {
    const successfulResults = results.filter(r => r.status === AgentTaskStatus.COMPLETED && r.output?.success);
    
    if (successfulResults.length === 0) {
      return ConfidenceLevel.LOW;
    }

    const confidenceValues = successfulResults.map(r => {
      const confidence = r.output?.confidence;
      switch (confidence) {
        case ConfidenceLevel.VERY_HIGH: return 1.0;
        case ConfidenceLevel.HIGH: return 0.75;
        case ConfidenceLevel.MEDIUM: return 0.5;
        case ConfidenceLevel.LOW: return 0.25;
        default: return 0.5;
      }
    });

    const averageConfidence = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;

    if (averageConfidence >= 0.9) return ConfidenceLevel.VERY_HIGH;
    if (averageConfidence >= 0.7) return ConfidenceLevel.HIGH;
    if (averageConfidence >= 0.5) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }

  /**
   * Generate reasoning for the plan
   */
  private generateReasoning(results: any[], input: PlanGenerationInput): string {
    const successfulResults = results.filter(r => r.status === AgentTaskStatus.COMPLETED && r.output?.success);
    const reasonings = successfulResults.map(r => r.output?.reasoning || '').filter(Boolean);
    
    return `Generated comprehensive plan based on: ${input.description}. ` +
           `Analyzed by ${successfulResults.length} specialized agents. ` +
           `Key considerations: ${reasonings.join('; ')}`;
  }

  /**
   * Generate suggestions for plan improvement
   */
  private generateSuggestions(results: any[]): string[] {
    const suggestions: string[] = [];
    const successfulResults = results.filter(r => r.status === AgentTaskStatus.COMPLETED && r.output?.success);
    
    for (const result of successfulResults) {
      if (result.output?.result?.suggestions) {
        suggestions.push(...result.output.result.suggestions);
      }
    }

    // Add general suggestions
    suggestions.push('Review generated tasks for completeness and accuracy');
    suggestions.push('Consider adding testing tasks if not already included');
    suggestions.push('Validate dependencies before execution');
    
    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Aggregate validation results
   */
  private aggregateValidationResults(results: any[]): {
    isValid: boolean;
    issues: string[];
    enhancements: string[];
    confidence: ConfidenceLevel;
  } {
    const issues: string[] = [];
    const enhancements: string[] = [];
    let isValid = true;

    for (const result of results) {
      if (result.status === AgentTaskStatus.COMPLETED && result.output?.success) {
        if (result.output?.result?.issues) {
          issues.push(...result.output.result.issues);
          if (result.output.result.issues.some((issue: any) => issue.severity === 'critical')) {
            isValid = false;
          }
        }
        if (result.output?.result?.enhancements) {
          enhancements.push(...result.output.result.enhancements);
        }
      } else {
        isValid = false;
        issues.push(`Validation failed for ${result.type}`);
      }
    }

    return {
      isValid,
      issues: [...new Set(issues)],
      enhancements: [...new Set(enhancements)],
      confidence: isValid ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM
    };
  }

  /**
   * Check if SEO planning is relevant for this input
   */
  private isSEORelevant(input: PlanGenerationInput): boolean {
    const seoKeywords = ['website', 'web app', 'frontend', 'user-facing', 'public', 'marketing'];
    const description = input.description.toLowerCase();
    return seoKeywords.some(keyword => description.includes(keyword));
  }

  /**
   * Generate a descriptive plan name
   */
  private generatePlanName(description: string): string {
    const words = description.split(' ').slice(0, 5).join('-');
    return `${words}-implementation-plan`;
  }

  /**
   * Generate a comprehensive plan description
   */
  private generatePlanDescription(input: PlanGenerationInput, results: any[]): string {
    const agentTypes = results.map(r => r.type).join(', ');
    return `Implementation plan for: ${input.description}. ` +
           `Generated by: ${agentTypes}. ` +
           `Scope: ${input.scope || 'full'}.`;
  }

  /**
   * Deduplicate and organize tasks from multiple agents
   */
  private deduplicateAndOrganizeTasks(tasks: any[]): any[] {
    const seen = new Set<string>();
    const organized: any[] = [];

    for (const task of tasks) {
      const key = `${task.name}-${task.command || task.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        organized.push({
          id: task.id || `task-${organized.length + 1}`,
          name: task.name || 'Unnamed Task',
          description: task.description || '',
          command: task.command || '',
          dependsOn: task.dependsOn || [],
          ...task
        });
      }
    }

    return organized;
  }

  /**
   * Resolve and organize dependencies
   */
  private resolveDependencies(dependencies: string[][]): string[][] {
    // Simple deduplication of dependencies
    const unique = new Set<string>();
    const resolved: string[][] = [];

    for (const dep of dependencies) {
      const key = dep.join('-');
      if (!unique.has(key)) {
        unique.add(key);
        resolved.push(dep);
      }
    }

    return resolved;
  }
}