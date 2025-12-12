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
import { AgentRegistry } from './registry.js';
import { ExecutorBridge } from './executor-bridge.js';

export class AgentCoordinator extends EventEmitter {
  private config: AgentCoordinatorConfig;
  private runningTasks: Map<string, AgentTask> = new Map();
  private completedTasks: Map<string, AgentTaskResult> = new Map();
  private metrics: Map<AgentType, AgentMetrics> = new Map();
  private cache: Map<string, AgentOutput> = new Map();
  private registry: AgentRegistry;
  private executorBridge: ExecutorBridge;

  constructor(config: AgentCoordinatorConfig, registry?: AgentRegistry) {
    super();
    this.config = config;
    this.registry = registry || new AgentRegistry();
    this.executorBridge = new ExecutorBridge(this.registry);
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
    // Use the executor bridge for actual agent execution
    return this.executorBridge.execute(task);
  }



  private aggregateResults(results: AgentTaskResult[], strategy: AggregationStrategy): AgentTaskResult[] {
    if (results.length === 0) return results;
    if (results.length === 1) return results;

    switch (strategy.type) {
      case 'merge':
        return [this.mergeResults(results)];
      case 'vote':
        return [this.voteResults(results)];
      case 'weighted':
        return [this.weightedResults(results, strategy.weights)];
      case 'priority':
        return this.priorityResults(results, strategy.priority);
      default:
        return results;
    }
  }

  private mergeResults(results: AgentTaskResult[]): AgentTaskResult {
    // Combine all successful results into a single merged result
    const successfulResults = results.filter(r => r.status === AgentTaskStatus.COMPLETED && r.output?.success);

    if (successfulResults.length === 0) {
      // Return the first failed result
      return results[0];
    }

    // Merge outputs
    const mergedOutput: any = {};
    const allFindings: any[] = [];
    const allRecommendations: string[] = [];
    let totalConfidence = 0;

    for (const result of successfulResults) {
      if (result.output?.result) {
        Object.assign(mergedOutput, result.output.result);
      }

      // Collect findings if they exist
      if (result.output?.result?.findings) {
        allFindings.push(...result.output.result.findings);
      }

      // Collect recommendations if they exist
      if (result.output?.result?.recommendations) {
        allRecommendations.push(...result.output.result.recommendations);
      }

      totalConfidence += this.getConfidenceValue(result.output?.confidence || 'low');
    }

    const avgConfidence = totalConfidence / successfulResults.length;

    return {
      id: `merged-${results[0].id}`,
      type: results[0].type, // Use the first agent's type
      status: AgentTaskStatus.COMPLETED,
      output: {
        type: results[0].type,
        success: true,
        result: {
          ...mergedOutput,
          findings: allFindings,
          recommendations: [...new Set(allRecommendations)], // Remove duplicates
          mergedFrom: successfulResults.length,
          sources: successfulResults.map(r => r.type)
        },
        confidence: this.getConfidenceFromValue(avgConfidence),
        reasoning: `Merged results from ${successfulResults.length} agents`,
        executionTime: results.reduce((sum, r) => sum + r.executionTime, 0)
      },
      executionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
      startTime: results[0].startTime,
      endTime: results[results.length - 1].endTime
    };
  }

  private voteResults(results: AgentTaskResult[]): AgentTaskResult {
    // Simple voting - return the result with highest confidence
    const completedResults = results.filter(r => r.status === AgentTaskStatus.COMPLETED);

    if (completedResults.length === 0) {
      return results[0];
    }

    // Sort by confidence (highest first)
    completedResults.sort((a, b) => {
      const confA = this.getConfidenceValue(a.output?.confidence || 'low');
      const confB = this.getConfidenceValue(b.output?.confidence || 'low');
      return confB - confA;
    });

    return completedResults[0];
  }

  private weightedResults(results: AgentTaskResult[], weights?: Record<AgentType, number>): AgentTaskResult {
    // Weighted aggregation based on agent type weights
    const completedResults = results.filter(r => r.status === AgentTaskStatus.COMPLETED);

    if (completedResults.length === 0) {
      return results[0];
    }

    // Calculate weighted scores
    let bestResult = completedResults[0];
    let bestScore = 0;

    for (const result of completedResults) {
      const weight = weights?.[result.type] || 1.0;
      const confidence = this.getConfidenceValue(result.output?.confidence || 'low');
      const score = weight * confidence;

      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
      }
    }

    return bestResult;
  }

  private priorityResults(results: AgentTaskResult[], priority?: AgentType[]): AgentTaskResult[] {
    if (!priority || priority.length === 0) {
      return results;
    }

    // Sort results by priority order
    return results.sort((a, b) => {
      const aIndex = priority.indexOf(a.type);
      const bIndex = priority.indexOf(b.type);

      // Items not in priority list go to the end
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
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





  private getConfidenceValue(confidence: ConfidenceLevel): number {
    const values = {
      [ConfidenceLevel.LOW]: 0.25,
      [ConfidenceLevel.MEDIUM]: 0.5,
      [ConfidenceLevel.HIGH]: 0.75,
      [ConfidenceLevel.VERY_HIGH]: 1.0
    };
    return values[confidence];
  }

  private getConfidenceFromValue(value: number): ConfidenceLevel {
    if (value >= 0.8) return ConfidenceLevel.VERY_HIGH;
    if (value >= 0.6) return ConfidenceLevel.HIGH;
    if (value >= 0.4) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
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