/**
 * Core agent coordination engine for the Ferg Engineering System.
 * Handles agent orchestration, execution strategies, and result aggregation.
 */

import { EventEmitter } from 'events';
import { 
  AgentType, 
  AgentTask, 
  AgentTaskResult, 
  AgentTaskStatus, 
  AgentCoordinatorConfig, 
  AggregationStrategy,
  AgentEvent,
  AgentProgress,
  AgentError,
  AgentMetrics,
  AgentInput,
  AgentOutput,
  ConfidenceLevel,
  ExecutionStrategy
} from './types.js';

export class AgentCoordinator extends EventEmitter {
  private config: AgentCoordinatorConfig;
  private runningTasks: Map<string, AgentTask> = new Map();
  private completedTasks: Map<string, AgentTaskResult> = new Map();
  private metrics: Map<AgentType, AgentMetrics> = new Map();
  private cache: Map<string, AgentOutput> = new Map();

  constructor(config: AgentCoordinatorConfig) {
    super();
    this.config = config;
    this.initializeMetrics();
  }

  /**
   * Execute a collection of agent tasks with the specified strategy
   */
  public async executeTasks(tasks: AgentTask[], strategy: AggregationStrategy): Promise<AgentTaskResult[]> {
    this.emit('execution_started', { taskCount: tasks.length });
    
    try {
      // Sort tasks by dependencies
      const sortedTasks = this.resolveDependencies(tasks);
      const results: AgentTaskResult[] = [];

      // Execute tasks based on strategy
      if (strategy.type === 'parallel') {
        const parallelResults = await this.executeParallel(sortedTasks);
        results.push(...parallelResults);
      } else if (strategy.type === 'sequential') {
        const sequentialResults = await this.executeSequential(sortedTasks);
        results.push(...sequentialResults);
      } else {
        // Conditional execution - evaluate conditions first
        const conditionalResults = await this.executeConditional(sortedTasks, strategy);
        results.push(...conditionalResults);
      }

      // Aggregate results
      const aggregatedResults = this.aggregateResults(results, strategy);
      
      // Clear completed tasks after execution
      this.completedTasks.clear();
      
      this.emit('execution_completed', { results: aggregatedResults });
      return aggregatedResults;
      
    } catch (error) {
      this.emit('execution_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Execute a single agent task
   */
  public async executeTask(task: AgentTask): Promise<AgentTaskResult> {
    const startTime = new Date();
    
    // Check if already running
    if (this.runningTasks.has(task.id)) {
      throw new Error(`Task ${task.id} is already running`);
    }

    // Check cache if enabled
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(task);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const result: AgentTaskResult = {
          id: task.id,
          type: task.type,
          status: AgentTaskStatus.COMPLETED,
          output: cached,
          executionTime: 0,
          startTime,
          endTime: new Date()
        };
        this.emit('task_cached', { taskId: task.id, agentType: task.type });
        return result;
      }
    }

    this.runningTasks.set(task.id, task);
    this.emitEvent('task_started', task.id, task.type);

    try {
      // Check dependencies
      await this.checkTaskDependencies(task);
      
      // Execute the agent
      const output = await this.executeAgent(task);
      
      // Update metrics
      this.updateMetrics(task.type, output, true);
      
      const result: AgentTaskResult = {
        id: task.id,
        type: task.type,
        status: AgentTaskStatus.COMPLETED,
        output,
        executionTime: new Date().getTime() - startTime.getTime(),
        startTime,
        endTime: new Date()
      };

      // Cache result if enabled
      if (this.config.enableCaching && output.success) {
        const cacheKey = this.generateCacheKey(task);
        this.cache.set(cacheKey, output);
      }

      this.completedTasks.set(task.id, result);
      this.runningTasks.delete(task.id);
      this.emitEvent('task_completed', task.id, task.type, { output });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update metrics
      this.updateMetrics(task.type, undefined, false);
      
      // Handle retry logic
      if (task.retry && this.shouldRetry(task, errorMessage)) {
        this.log(`Retrying task ${task.id} after error: ${errorMessage}`);
        await this.sleep(task.retry.delay * 1000);
        return this.executeTask(task);
      }

      const result: AgentTaskResult = {
        id: task.id,
        type: task.type,
        status: AgentTaskStatus.FAILED,
        executionTime: new Date().getTime() - startTime.getTime(),
        startTime,
        endTime: new Date(),
        error: errorMessage
      };

      this.completedTasks.set(task.id, result);
      this.runningTasks.delete(task.id);
      this.emitEvent('task_failed', task.id, task.type, { error: errorMessage });

      return result;
    }
  }

  /**
   * Get current execution progress
   */
  public getProgress(): AgentProgress {
    const totalTasks = this.runningTasks.size + this.completedTasks.size;
    const completedTasks = Array.from(this.completedTasks.values())
      .filter(r => r.status === AgentTaskStatus.COMPLETED).length;
    const failedTasks = Array.from(this.completedTasks.values())
      .filter(r => r.status === AgentTaskStatus.FAILED).length;
    const runningTasks = this.runningTasks.size;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      runningTasks,
      percentageComplete: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    };
  }

  /**
   * Get metrics for all agent types
   */
  public getMetrics(): Map<AgentType, AgentMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Clear all caches and reset state
   */
  public reset(): void {
    this.runningTasks.clear();
    this.completedTasks.clear();
    this.cache.clear();
    this.initializeMetrics();
  }

  private async executeParallel(tasks: AgentTask[]): Promise<AgentTaskResult[]> {
    const maxConcurrency = this.config.maxConcurrency;
    const results: AgentTaskResult[] = [];
    
    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += maxConcurrency) {
      const batch = tasks.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(task => this.executeTask(task));
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled') {
          results.push(promiseResult.value);
        } else {
          this.log(`Batch execution failed: ${promiseResult.reason}`);
        }
      }
    }
    
    return results;
  }

  private async executeSequential(tasks: AgentTask[]): Promise<AgentTaskResult[]> {
    const results: AgentTaskResult[] = [];
    
    for (const task of tasks) {
      const result = await this.executeTask(task);
      results.push(result);
      
      // Stop on failure if not configured to continue
      if (result.status === AgentTaskStatus.FAILED && !this.config.retryAttempts) {
        break;
      }
    }
    
    return results;
  }

  private async executeConditional(tasks: AgentTask[], strategy: AggregationStrategy): Promise<AgentTaskResult[]> {
    // For conditional execution, we evaluate conditions and execute accordingly
    const results: AgentTaskResult[] = [];
    
    for (const task of tasks) {
      const shouldExecute = await this.evaluateCondition(task, strategy);
      
      if (shouldExecute) {
        const result = await this.executeTask(task);
        results.push(result);
      } else {
        // Create a skipped result
        const result: AgentTaskResult = {
          id: task.id,
          type: task.type,
          status: AgentTaskStatus.SKIPPED,
          executionTime: 0,
          startTime: new Date(),
          endTime: new Date()
        };
        results.push(result);
      }
    }
    
    return results;
  }

  private async executeAgent(task: AgentTask): Promise<AgentOutput> {
    const startTime = Date.now();
    
    // This is where the actual agent execution would happen
    // For now, we'll simulate agent execution with a timeout
    const timeout = task.timeout || this.config.defaultTimeout;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Agent ${task.type} timed out after ${timeout}ms`));
      }, timeout);

      // Simulate agent execution
      this.simulateAgentExecution(task)
        .then(result => {
          clearTimeout(timeoutId);
          resolve({
            ...result,
            executionTime: Date.now() - startTime
          });
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async simulateAgentExecution(task: AgentTask): Promise<Omit<AgentOutput, 'executionTime'>> {
    // Simulate different agent behaviors
    await this.sleep(Math.random() * 1000 + 500); // 500-1500ms
    
    const successRate = this.getAgentSuccessRate(task.type);
    const success = Math.random() < successRate;
    
    if (!success) {
      throw new Error(`Agent ${task.type} failed to process the request`);
    }

    return {
      type: task.type,
      success: true,
      result: this.generateMockResult(task),
      confidence: this.getRandomConfidence(),
      reasoning: `Agent ${task.type} processed the request successfully`
    };
  }

  private aggregateResults(results: AgentTaskResult[], strategy: AggregationStrategy): AgentTaskResult[] {
    // For now, return results as-is
    // In a real implementation, this would intelligently aggregate based on strategy
    return results;
  }

  private resolveDependencies(tasks: AgentTask[]): AgentTask[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: AgentTask[] = [];
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const visit = (taskId: string): void => {
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving task: ${taskId}`);
      }

      if (visited.has(taskId)) {
        return;
      }

      visiting.add(taskId);

      const task = taskMap.get(taskId);
      if (task && task.dependsOn) {
        for (const depId of task.dependsOn) {
          visit(depId);
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);

      if (task) {
        sorted.push(task);
      }
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task.id);
      }
    }

    return sorted;
  }

  private async checkTaskDependencies(task: AgentTask): Promise<void> {
    if (!task.dependsOn || task.dependsOn.length === 0) {
      return;
    }

    for (const depId of task.dependsOn) {
      const depResult = this.completedTasks.get(depId);
      
      if (!depResult) {
        throw new Error(`Dependency ${depId} has not been executed`);
      }

      if (depResult.status !== AgentTaskStatus.COMPLETED) {
        throw new Error(`Dependency ${depId} failed with status: ${depResult.status}`);
      }
    }
  }

  private shouldRetry(task: AgentTask, error: string): boolean {
    // Simple retry logic - in production, this would be more sophisticated
    return !error.includes('timeout') && !error.includes('circular dependency');
  }

  private async evaluateCondition(task: AgentTask, strategy: AggregationStrategy): Promise<boolean> {
    // Simple condition evaluation - in production, this would be more complex
    return true;
  }

  private generateCacheKey(task: AgentTask): string {
    return `${task.type}-${JSON.stringify(task.input)}`;
  }

  private initializeMetrics(): void {
    Object.values(AgentType).forEach(type => {
      this.metrics.set(type, {
        agentType: type,
        executionCount: 0,
        averageExecutionTime: 0,
        successRate: 1.0,
        averageConfidence: 0.8,
        lastExecutionTime: new Date()
      });
    });
  }

  private updateMetrics(agentType: AgentType, output: AgentOutput | undefined, success: boolean): void {
    const metrics = this.metrics.get(agentType);
    if (!metrics) return;

    metrics.executionCount++;
    metrics.lastExecutionTime = new Date();

    if (output) {
      metrics.averageConfidence = (metrics.averageConfidence + this.getConfidenceValue(output.confidence)) / 2;
    }

    if (success) {
      metrics.successRate = (metrics.successRate * (metrics.executionCount - 1) + 1) / metrics.executionCount;
    } else {
      metrics.successRate = (metrics.successRate * (metrics.executionCount - 1)) / metrics.executionCount;
    }
  }

  private getAgentSuccessRate(type: AgentType): number {
    // Different agents have different success rates
    const rates = {
      [AgentType.ARCHITECT_ADVISOR]: 0.95,
      [AgentType.FRONTEND_REVIEWER]: 0.90,
      [AgentType.SEO_SPECIALIST]: 0.85,
      [AgentType.PROMPT_OPTIMIZER]: 0.92,
      [AgentType.CODE_REVIEWER]: 0.88,
      [AgentType.BACKEND_ARCHITECT]: 0.93,
      [AgentType.SECURITY_SCANNER]: 0.87,
      [AgentType.PERFORMANCE_ENGINEER]: 0.89
    };
    return rates[type] || 0.9;
  }

  private generateMockResult(task: AgentTask): Record<string, any> {
    // Generate different results based on agent type and context
    const baseResult = {
      taskId: task.id,
      timestamp: new Date().toISOString(),
      data: `Mock result from ${task.type} agent`,
      recommendations: [`Recommendation 1 from ${task.type}`, `Recommendation 2 from ${task.type}`]
    };

    // Add specific results for plan generation
    if (task.input.context?.focus === 'architecture' || task.type === AgentType.ARCHITECT_ADVISOR) {
      return {
        ...baseResult,
        tasks: [
          {
            id: 'arch-design',
            name: 'Design system architecture',
            description: 'Create high-level system architecture',
            command: 'create-architecture-diagram'
          },
          {
            id: 'arch-review',
            name: 'Review architecture decisions',
            description: 'Review and validate architectural choices',
            command: 'review-architecture'
          }
        ],
        dependencies: [['arch-review', 'arch-design']],
        suggestions: ['Consider scalability requirements', 'Review security implications']
      };
    }

    if (task.input.context?.focus === 'backend' || task.type === AgentType.BACKEND_ARCHITECT) {
      return {
        ...baseResult,
        tasks: [
          {
            id: 'backend-api',
            name: 'Design API endpoints',
            description: 'Create RESTful API design',
            command: 'design-api'
          },
          {
            id: 'backend-db',
            name: 'Design database schema',
            description: 'Create database schema design',
            command: 'design-database'
          }
        ],
        dependencies: [['backend-db', 'backend-api']],
        suggestions: ['Consider data migration strategy', 'Plan for database indexing']
      };
    }

    if (task.input.context?.focus === 'frontend' || task.type === AgentType.FRONTEND_REVIEWER) {
      return {
        ...baseResult,
        tasks: [
          {
            id: 'frontend-ui',
            name: 'Design UI components',
            description: 'Create reusable UI components',
            command: 'design-components'
          },
          {
            id: 'frontend-state',
            name: 'Implement state management',
            description: 'Setup application state management',
            command: 'setup-state-management'
          }
        ],
        dependencies: [['frontend-state', 'frontend-ui']],
        suggestions: ['Consider accessibility requirements', 'Plan responsive design']
      };
    }

    if (task.input.context?.focus === 'seo' || task.type === AgentType.SEO_SPECIALIST) {
      return {
        ...baseResult,
        tasks: [
          {
            id: 'seo-meta',
            name: 'Implement meta tags',
            description: 'Add SEO meta tags to pages',
            command: 'add-meta-tags'
          },
          {
            id: 'seo-sitemap',
            name: 'Generate sitemap',
            description: 'Create XML sitemap for search engines',
            command: 'generate-sitemap'
          }
        ],
        dependencies: [],
        suggestions: ['Optimize page load speed', 'Add structured data markup']
      };
    }

    // Code review specific results
    if (task.type === AgentType.CODE_REVIEWER || task.type === AgentType.SECURITY_SCANNER || 
        task.type === AgentType.PERFORMANCE_ENGINEER || task.type === AgentType.FRONTEND_REVIEWER) {
      return {
        ...baseResult,
        findings: this.generateMockFindings(task),
        recommendations: [`Recommendation 1 from ${task.type}`, `Recommendation 2 from ${task.type}`]
      };
    }

    // Default result for validation or other tasks
    if (task.input.context?.validationType) {
      return {
        ...baseResult,
        issues: task.input.context.validationType === 'architecture' ? [] : ['Minor issue found'],
        enhancements: ['Consider adding more tests', 'Improve documentation'],
        suggestions: ['Review security best practices']
      };
    }

    return baseResult;
  }

  private getRandomConfidence(): ConfidenceLevel {
    const confidences = [ConfidenceLevel.LOW, ConfidenceLevel.MEDIUM, ConfidenceLevel.HIGH, ConfidenceLevel.VERY_HIGH];
    return confidences[Math.floor(Math.random() * confidences.length)];
  }

  private generateMockFindings(task: AgentTask): any[] {
    const findings: any[] = [];
    const files = task.input.context?.files || [];
    const severity = task.input.context?.severity || 'medium';

    // Return empty findings if no files
    if (files.length === 0) {
      return [];
    }
    
    // Generate different findings based on agent type
    if (task.type === AgentType.CODE_REVIEWER) {
      findings.push({
        file: files[0] || 'test.js',
        line: 10,
        severity: severity === 'critical' ? 'high' : 'medium',
        category: 'style',
        message: 'Code style issue found',
        suggestion: 'Fix code formatting',
        confidence: ConfidenceLevel.HIGH
      });
    }

    if (task.type === AgentType.SECURITY_SCANNER) {
      findings.push({
        file: files[0] || 'test.js',
        line: 20,
        severity: severity === 'critical' ? 'critical' : 'medium',
        category: 'security',
        message: 'Potential security vulnerability',
        suggestion: 'Add input validation',
        confidence: ConfidenceLevel.HIGH
      });
    }

    if (task.type === AgentType.PERFORMANCE_ENGINEER) {
      findings.push({
        file: files[0] || 'test.js',
        line: 30,
        severity: 'medium',
        category: 'performance',
        message: 'Performance bottleneck detected',
        suggestion: 'Optimize algorithm',
        confidence: ConfidenceLevel.MEDIUM
      });
    }

    if (task.type === AgentType.FRONTEND_REVIEWER) {
      findings.push({
        file: files[0] || 'test.js',
        line: 40,
        severity: 'low',
        category: 'accessibility',
        message: 'Accessibility issue found',
        suggestion: 'Add ARIA labels',
        confidence: ConfidenceLevel.MEDIUM
      });
    }

    return findings;
  }

  private getConfidenceValue(confidence: ConfidenceLevel): number {
    const values = {
      [ConfidenceLevel.LOW]: 0.25,
      [ConfidenceLevel.MEDIUM]: 0.5,
      [ConfidenceLevel.HIGH]: 0.75,
      [ConfidenceLevel.VERY_HIGH]: 1.0
    };
    return values[confidence];
  }

  private emitEvent(type: AgentEvent['type'], taskId: string, agentType: AgentType, data?: Record<string, any>): void {
    const event: AgentEvent = {
      type,
      taskId,
      agentType,
      timestamp: new Date(),
      data
    };
    this.emit('agent_event', event);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(message: string): void {
    if (this.config.logLevel === 'debug' || this.config.logLevel === 'info') {
      console.log(`[AgentCoordinator] ${message}`);
    }
  }
}