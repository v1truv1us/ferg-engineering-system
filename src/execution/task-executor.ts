/**
 * Task executor for the Ferg Engineering System.
 * Handles task execution, dependency resolution, and result tracking.
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { 
  Task, 
  TaskResult, 
  TaskStatus, 
  ExecutionOptions, 
  Plan 
} from './types.js';
import { AgentCoordinator } from '../agents/coordinator.js';
import { 
  AgentTask, 
  AgentTaskResult, 
  AgentTaskStatus,
  AgentType,
  AggregationStrategy
} from '../agents/types.js';

export class TaskExecutor {
  private options: ExecutionOptions;
  private taskResults: Map<string, TaskResult> = new Map();
  private runningTasks: Set<string> = new Set();
  private agentCoordinator?: AgentCoordinator;

  constructor(options: ExecutionOptions = {}) {
    this.options = {
      dryRun: false,
      continueOnError: false,
      maxConcurrency: 1,
      verbose: false,
      ...options
    };
  }

  /**
   * Set agent coordinator for executing agent tasks
   */
  public setAgentCoordinator(coordinator: AgentCoordinator): void {
    this.agentCoordinator = coordinator;
  }

  /**
   * Execute all tasks in a plan with dependency resolution
   */
  public async executePlan(plan: Plan): Promise<TaskResult[]> {
    this.taskResults.clear();
    this.runningTasks.clear();

    const executionOrder = this.resolveExecutionOrder(plan.tasks);
    const results: TaskResult[] = [];

    for (const task of executionOrder) {
      const result = await this.executeTask(task);
      this.taskResults.set(task.id, result);
      results.push(result);

      // Stop execution if task failed and continueOnError is false
      if (result.status === TaskStatus.FAILED && !this.options.continueOnError) {
        this.log(`Stopping execution due to task failure: ${task.id}`);
        break;
      }
    }

    return results;
  }

  /**
   * Execute a single task
   */
  public async executeTask(task: Task): Promise<TaskResult> {
    if (this.runningTasks.has(task.id)) {
      throw new Error(`Task ${task.id} is already running`);
    }

    this.runningTasks.add(task.id);
    const startTime = new Date();

    try {
      this.log(`Executing task: ${task.id} (${task.name})`);

      // Check dependencies
      const dependencyResult = this.checkDependencies(task);
      if (!dependencyResult.success) {
        const result: TaskResult = {
          id: task.id,
          status: TaskStatus.SKIPPED,
          exitCode: -1,
          stdout: '',
          stderr: dependencyResult.error,
          duration: 0,
          startTime,
          endTime: new Date(),
          error: dependencyResult.error
        };
        this.taskResults.set(task.id, result);
        return result;
      }

      // Handle dry run mode
      if (this.options.dryRun) {
        this.log(`[DRY RUN] Would execute: ${task.command}`);
        const result: TaskResult = {
          id: task.id,
          status: TaskStatus.COMPLETED,
          exitCode: 0,
          stdout: `[DRY RUN] Command: ${task.command}`,
          stderr: '',
          duration: 0,
          startTime,
          endTime: new Date()
        };
        this.taskResults.set(task.id, result);
        return result;
      }

      // Check if this is an agent task
      if (this.isAgentTask(task)) {
        return await this.executeAgentTask(task as AgentTask, startTime);
      }

      // Execute the task with retry logic
const result = await this.executeWithRetry(task);
      this.taskResults.set(task.id, result);
      this.log(`Task ${task.id} completed with status: ${result.status}`);
       
      return result;
    } catch (error) {
      const endTime = new Date();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.log(`Task ${task.id} failed: ${errorMessage}`);
      
const result: TaskResult = {
          id: task.id,
          status: TaskStatus.FAILED,
          exitCode: -1,
          stdout: '',
          stderr: errorMessage,
          duration: endTime.getTime() - startTime.getTime(),
          startTime,
          endTime,
          error: errorMessage
        };
      
      return result;
    } finally {
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * Get the result of a previously executed task
   */
  public getTaskResult(taskId: string): TaskResult | undefined {
    return this.taskResults.get(taskId);
  }

  /**
   * Get all task results
   */
  public getAllResults(): TaskResult[] {
    return Array.from(this.taskResults.values());
  }

  /**
   * Clear all task results
   */
  public clearResults(): void {
    this.taskResults.clear();
  }

  private resolveExecutionOrder(tasks: Task[]): Task[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: Task[] = [];
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

  private checkDependencies(task: Task): { success: boolean; error?: string } {
    if (!task.dependsOn || task.dependsOn.length === 0) {
      return { success: true };
    }

    for (const depId of task.dependsOn) {
      const depResult = this.taskResults.get(depId);
      
      if (!depResult) {
        return { 
          success: false, 
          error: `Dependency ${depId} has not been executed` 
        };
      }

      if (depResult.status === TaskStatus.FAILED) {
        return { 
          success: false, 
          error: `Dependency ${depId} failed with exit code ${depResult.exitCode}` 
        };
      }

      if (depResult.status !== TaskStatus.COMPLETED) {
        return { 
          success: false, 
          error: `Dependency ${depId} has not completed (status: ${depResult.status})` 
        };
      }
    }

    return { success: true };
  }

  private async executeWithRetry(task: Task): Promise<TaskResult> {
    const maxAttempts = task.retry?.maxAttempts || 1;
    const baseDelay = task.retry?.delay || 0;
    const backoffMultiplier = task.retry?.backoffMultiplier || 1;

    let lastResult: TaskResult | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 2);
        this.log(`Retrying task ${task.id} in ${delay}s (attempt ${attempt}/${maxAttempts})`);
        await this.sleep(delay * 1000);
      }

      const result = await this.executeCommand(task);
      
      if (result.status === TaskStatus.COMPLETED) {
        return result;
      }

      lastResult = result;
      
      if (attempt < maxAttempts) {
        this.log(`Task ${task.id} failed (attempt ${attempt}/${maxAttempts}): ${result.stderr || result.error}`);
      }
    }

    return lastResult!;
  }

  private async executeCommand(task: Task): Promise<TaskResult> {
    return new Promise((resolve) => {
      const startTime = new Date();
      const timeout = task.timeout ? task.timeout * 1000 : 300000; // Default 5 minutes

      this.log(`Executing command: ${task.command}`);

      const child = spawn(task.command, [], {
        shell: true,
        cwd: task.workingDirectory || this.options.workingDirectory,
        env: { ...process.env, ...this.options.environment, ...task.environment }
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (this.options.verbose) {
          process.stdout.write(chunk);
        }
      });

      child.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (this.options.verbose) {
          process.stderr.write(chunk);
        }
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        this.log(`Task ${task.id} timed out after ${task.timeout}s`);
      }, timeout);

      child.on('close', (code, signal) => {
        clearTimeout(timeoutId);
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        const result: TaskResult = {
          id: task.id,
          status: code === 0 ? TaskStatus.COMPLETED : TaskStatus.FAILED,
          exitCode: code || (signal ? -1 : 0),
          stdout,
          stderr,
          duration,
          startTime,
          endTime,
          error: signal ? `Process terminated by signal: ${signal}` : undefined
        };

        resolve(result);
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        const result: TaskResult = {
          id: task.id,
          status: TaskStatus.FAILED,
          exitCode: -1,
          stdout,
          stderr,
          duration,
          startTime,
          endTime,
          error: error.message
        };

        resolve(result);
      });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if a task is an agent task
   */
  private isAgentTask(task: Task): task is AgentTask {
    return 'type' in task && 'input' in task && 'strategy' in task;
  }

  /**
   * Execute an agent task using the agent coordinator
   */
  private async executeAgentTask(task: AgentTask, startTime: Date): Promise<TaskResult> {
    if (!this.agentCoordinator) {
      throw new Error(`Agent coordinator not set. Cannot execute agent task: ${task.id}`);
    }

    try {
      this.log(`Executing agent task: ${task.id} (${task.type})`);
      
      // Execute the agent task
      const agentResult = await this.agentCoordinator.executeTask(task);
      
      // Convert agent result to task result
      const result: TaskResult = {
        id: task.id,
        status: this.convertAgentStatus(agentResult.status),
        exitCode: agentResult.status === AgentTaskStatus.COMPLETED ? 0 : 1,
        stdout: agentResult.output ? JSON.stringify(agentResult.output, null, 2) : '',
        stderr: agentResult.error || '',
        duration: agentResult.executionTime,
        startTime,
        endTime: agentResult.endTime,
        error: agentResult.error
      };

      this.taskResults.set(task.id, result);
      this.log(`Agent task ${task.id} completed with status: ${result.status}`);
      
      return result;

    } catch (error) {
      const endTime = new Date();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.log(`Agent task ${task.id} failed: ${errorMessage}`);
      
      const result: TaskResult = {
        id: task.id,
        status: TaskStatus.FAILED,
        exitCode: -1,
        stdout: '',
        stderr: errorMessage,
        duration: endTime.getTime() - startTime.getTime(),
        startTime,
        endTime,
        error: errorMessage
      };
      
      return result;
    }
  }

  /**
   * Convert agent task status to regular task status
   */
  private convertAgentStatus(agentStatus: AgentTaskStatus): TaskStatus {
    switch (agentStatus) {
      case AgentTaskStatus.COMPLETED:
        return TaskStatus.COMPLETED;
      case AgentTaskStatus.FAILED:
      case AgentTaskStatus.TIMEOUT:
        return TaskStatus.FAILED;
      case AgentTaskStatus.SKIPPED:
        return TaskStatus.SKIPPED;
      case AgentTaskStatus.RUNNING:
      case AgentTaskStatus.PENDING:
      default:
        return TaskStatus.FAILED; // Should not happen in final result
    }
  }

  /**
   * Execute multiple agent tasks with coordination
   */
  public async executeAgentTasks(
    tasks: AgentTask[], 
    strategy: AggregationStrategy = { type: 'sequential' }
  ): Promise<TaskResult[]> {
    if (!this.agentCoordinator) {
      throw new Error('Agent coordinator not set');
    }

    this.log(`Executing ${tasks.length} agent tasks with strategy: ${strategy.type}`);
    
    try {
      // Execute agent tasks using coordinator
      const agentResults = await this.agentCoordinator.executeTasks(tasks, strategy);
      
      // Convert to task results
      const taskResults: TaskResult[] = agentResults.map(agentResult => ({
        id: agentResult.id,
        status: this.convertAgentStatus(agentResult.status),
        exitCode: agentResult.status === AgentTaskStatus.COMPLETED ? 0 : 1,
        stdout: agentResult.output ? JSON.stringify(agentResult.output, null, 2) : '',
        stderr: agentResult.error || '',
        duration: agentResult.executionTime,
        startTime: agentResult.startTime,
        endTime: agentResult.endTime,
        error: agentResult.error
      }));

      // Store results
      for (const result of taskResults) {
        this.taskResults.set(result.id, result);
      }

      return taskResults;

    } catch (error) {
      this.log(`Agent task execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get agent execution progress
   */
  public getAgentProgress(): any {
    if (!this.agentCoordinator) {
      return null;
    }
    
    return this.agentCoordinator.getProgress();
  }

  /**
   * Get agent execution metrics
   */
  public getAgentMetrics(): Map<AgentType, any> | null {
    if (!this.agentCoordinator) {
      return null;
    }
    
    return this.agentCoordinator.getMetrics();
  }

  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[TaskExecutor] ${message}`);
    }
  }
}