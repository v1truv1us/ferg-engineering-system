/**
 * Plan parser for the Ferg Engineering System.
 * Handles YAML parsing, validation, and dependency resolution for execution plans.
 */

import { parse as parseYaml, Document } from 'yaml';
import { readFileSync } from 'fs';
import { 
  Plan, 
  Task, 
  PlanMetadata, 
  TaskType, 
  QualityGateConfig, 
  QualityGateType,
  ValidationError,
  ValidationErrorType 
} from './types.js';
import { 
  AgentTask,
  AgentType as AgentTaskType,
  ExecutionStrategy,
  ConfidenceLevel
} from '../agents/types.js';

export class PlanParser {
  private errors: ValidationError[] = [];
  private warnings: string[] = [];

  /**
   * Parse a plan file from the filesystem
   */
  public parseFile(filePath: string): Plan {
    try {
      const content = readFileSync(filePath, 'utf8');
      return this.parseContent(content, filePath);
    } catch (error) {
      throw new Error(`Failed to read plan file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse plan content from string
   */
  public parseContent(content: string, source?: string): Plan {
    this.errors = [];
    this.warnings = [];

    let rawPlan: any;
    try {
      rawPlan = parseYaml(content);
    } catch (error) {
      throw new Error(`Invalid YAML syntax: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Validate top-level structure
    this.validateTopLevelStructure(rawPlan);
    
    if (this.errors.length > 0) {
      throw new Error(`Plan validation failed:\n${this.errors.map(e => `  - ${e.message}`).join('\n')}`);
    }

    // Parse and validate metadata
    const metadata = this.parseMetadata(rawPlan.metadata);
    
    // Parse and validate tasks
    const tasks = this.parseTasks(rawPlan.tasks || []);
    
    // Parse and validate quality gates
    const qualityGates = this.parseQualityGates(rawPlan.qualityGates || []);

    // Validate task dependencies
    this.validateTaskDependencies(tasks);

    if (this.errors.length > 0) {
      throw new Error(`Plan validation failed:\n${this.errors.map(e => `  - ${e.message}`).join('\n')}`);
    }

    return {
      metadata,
      tasks,
      qualityGates,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Get validation errors from the last parse
   */
  public getErrors(): ValidationError[] {
    return [...this.errors];
  }

  /**
   * Get validation warnings from the last parse
   */
  public getWarnings(): string[] {
    return [...this.warnings];
  }

  private validateTopLevelStructure(plan: any): void {
    if (!plan || typeof plan !== 'object') {
      this.errors.push({
        type: ValidationErrorType.TYPE,
        message: 'Plan must be an object',
        value: plan
      });
      return;
    }

    if (!plan.metadata) {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: 'metadata section is required',
        path: 'metadata'
      });
    }

    if (plan.tasks && !Array.isArray(plan.tasks)) {
      this.errors.push({
        type: ValidationErrorType.TYPE,
        message: 'tasks must be an array',
        path: 'tasks',
        value: plan.tasks
      });
    }

    if (plan.qualityGates && !Array.isArray(plan.qualityGates)) {
      this.errors.push({
        type: ValidationErrorType.TYPE,
        message: 'qualityGates must be an array',
        path: 'qualityGates',
        value: plan.qualityGates
      });
    }
  }

  private parseMetadata(metadata: any): PlanMetadata {
    if (!metadata || typeof metadata !== 'object') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: 'metadata is required and must be an object',
        path: 'metadata'
      });
      throw new Error('Invalid metadata');
    }

    // Required fields
    if (!metadata.id || typeof metadata.id !== 'string') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: 'metadata.id is required and must be a string',
        path: 'metadata.id'
      });
    }

    if (!metadata.name || typeof metadata.name !== 'string') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: 'metadata.name is required and must be a string',
        path: 'metadata.name'
      });
    }

    if (!metadata.version || typeof metadata.version !== 'string') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: 'metadata.version is required and must be a string',
        path: 'metadata.version'
      });
    }

    // Validate version format (semver-like)
    if (metadata.version && !/^\d+\.\d+\.\d+/.test(metadata.version)) {
      this.warnings.push(`metadata.version "${metadata.version}" should follow semantic versioning (x.y.z)`);
    }

    return {
      id: metadata.id || '',
      name: metadata.name || '',
      description: metadata.description,
      version: metadata.version || '1.0.0',
      author: metadata.author,
      created: metadata.created,
      modified: metadata.modified,
      tags: Array.isArray(metadata.tags) ? metadata.tags : []
    };
  }

  private parseTasks(tasks: any[]): Task[] {
    const parsedTasks: Task[] = [];
    const taskIds = new Set<string>();

    for (let i = 0; i < tasks.length; i++) {
      const taskData = tasks[i];
      
      if (!taskData || typeof taskData !== 'object') {
        this.errors.push({
          type: ValidationErrorType.TYPE,
          message: `Task at index ${i} must be an object`,
          path: `tasks[${i}]`,
          value: taskData
        });
        continue;
      }

      const task = this.parseTask(taskData, i);
      
      if (task) {
        // Check for duplicate IDs
        if (taskIds.has(task.id)) {
          this.errors.push({
            type: ValidationErrorType.DUPLICATE_ID,
            message: `Duplicate task ID: ${task.id}`,
            path: `tasks[${i}].id`,
            value: task.id
          });
        } else {
          taskIds.add(task.id);
          parsedTasks.push(task);
        }
      }
    }

    return parsedTasks;
  }

  private parseTask(taskData: any, index: number): Task | null {
    // Required fields
    if (!taskData.id || typeof taskData.id !== 'string') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: `Task at index ${index} requires a valid id`,
        path: `tasks[${index}].id`
      });
      return null;
    }

    if (!taskData.name || typeof taskData.name !== 'string') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: `Task "${taskData.id}" requires a valid name`,
        path: `tasks[${index}].name`
      });
      return null;
    }

    // Agent tasks don't require commands
    if (!this.isAgentTaskType(taskData.type)) {
      if (!taskData.command || typeof taskData.command !== 'string') {
        this.errors.push({
          type: ValidationErrorType.REQUIRED,
          message: `Task "${taskData.id}" requires a valid command`,
          path: `tasks[${index}].command`
        });
        return null;
      }
    }

    // Parse task type
    let taskType: TaskType = TaskType.SHELL;
    if (taskData.type) {
      if (!Object.values(TaskType).includes(taskData.type)) {
        // Check if it's an agent task type
        if (this.isAgentTaskType(taskData.type)) {
          return this.parseAgentTask(taskData, index);
        }
        
        this.errors.push({
          type: ValidationErrorType.TYPE,
          message: `Invalid task type "${taskData.type}" for task "${taskData.id}"`,
          path: `tasks[${index}].type`,
          value: taskData.type
        });
        return null;
      }
      taskType = taskData.type as TaskType;
    }

    // Validate timeout
    if (taskData.timeout !== undefined) {
      if (typeof taskData.timeout !== 'number' || taskData.timeout <= 0) {
        this.errors.push({
          type: ValidationErrorType.RANGE,
          message: `Task "${taskData.id}" timeout must be a positive number`,
          path: `tasks[${index}].timeout`,
          value: taskData.timeout
        });
      }
    }

    // Validate retry configuration
    if (taskData.retry) {
      if (!taskData.retry.maxAttempts || typeof taskData.retry.maxAttempts !== 'number' || taskData.retry.maxAttempts < 1) {
        this.errors.push({
          type: ValidationErrorType.RANGE,
          message: `Task "${taskData.id}" retry.maxAttempts must be a positive number`,
          path: `tasks[${index}].retry.maxAttempts`,
          value: taskData.retry?.maxAttempts
        });
      }

      if (!taskData.retry.delay || typeof taskData.retry.delay !== 'number' || taskData.retry.delay < 0) {
        this.errors.push({
          type: ValidationErrorType.RANGE,
          message: `Task "${taskData.id}" retry.delay must be a non-negative number`,
          path: `tasks[${index}].retry.delay`,
          value: taskData.retry?.delay
        });
      }
    }

    return {
      id: taskData.id,
      name: taskData.name,
      description: taskData.description,
      type: taskType,
      command: taskData.command, // Will be undefined for agent tasks
      workingDirectory: taskData.workingDirectory,
      environment: taskData.environment || {},
      dependsOn: Array.isArray(taskData.dependsOn) ? taskData.dependsOn : [],
      timeout: taskData.timeout,
      retry: taskData.retry
    };
  }

  private parseQualityGates(gates: any[]): QualityGateConfig[] {
    const parsedGates: QualityGateConfig[] = [];
    const gateIds = new Set<string>();

    for (let i = 0; i < gates.length; i++) {
      const gateData = gates[i];
      
      if (!gateData || typeof gateData !== 'object') {
        this.errors.push({
          type: ValidationErrorType.TYPE,
          message: `Quality gate at index ${i} must be an object`,
          path: `qualityGates[${i}]`,
          value: gateData
        });
        continue;
      }

      const gate = this.parseQualityGate(gateData, i);
      
      if (gate) {
        // Check for duplicate IDs
        if (gateIds.has(gate.id)) {
          this.errors.push({
            type: ValidationErrorType.DUPLICATE_ID,
            message: `Duplicate quality gate ID: ${gate.id}`,
            path: `qualityGates[${i}].id`,
            value: gate.id
          });
        } else {
          gateIds.add(gate.id);
          parsedGates.push(gate);
        }
      }
    }

    return parsedGates;
  }

  private parseQualityGate(gateData: any, index: number): QualityGateConfig | null {
    // Required fields
    if (!gateData.id || typeof gateData.id !== 'string') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: `Quality gate at index ${index} requires a valid id`,
        path: `qualityGates[${index}].id`
      });
      return null;
    }

    if (!gateData.name || typeof gateData.name !== 'string') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: `Quality gate "${gateData.id}" requires a valid name`,
        path: `qualityGates[${index}].name`
      });
      return null;
    }

    // Parse gate type
    let gateType: QualityGateType = QualityGateType.LINT;
    if (gateData.type) {
      if (!Object.values(QualityGateType).includes(gateData.type)) {
        this.errors.push({
          type: ValidationErrorType.TYPE,
          message: `Invalid quality gate type "${gateData.type}" for gate "${gateData.id}"`,
          path: `qualityGates[${index}].type`,
          value: gateData.type
        });
        return null;
      }
      gateType = gateData.type as QualityGateType;
    }

    return {
      id: gateData.id,
      name: gateData.name,
      description: gateData.description,
      type: gateType,
      required: gateData.required !== false, // Default to true
      config: gateData.config || {},
      taskId: gateData.taskId
    };
  }

  private validateTaskDependencies(tasks: Task[]): void {
    const taskIds = new Set(tasks.map(t => t.id));

    for (const task of tasks) {
      if (task.dependsOn) {
        for (const depId of task.dependsOn) {
          if (!taskIds.has(depId)) {
            this.errors.push({
              type: ValidationErrorType.UNKNOWN_DEPENDENCY,
              message: `Task "${task.id}" depends on unknown task "${depId}"`,
              path: `tasks.${task.id}.dependsOn`,
              value: depId
            });
          }
        }
      }
    }

    // Check for circular dependencies
    this.detectCircularDependencies(tasks);
  }

  private detectCircularDependencies(tasks: Task[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const visit = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        // Found a cycle
        const cycle = Array.from(recursionStack).concat(taskId).join(' -> ');
        this.errors.push({
          type: ValidationErrorType.CIRCULAR_DEPENDENCY,
          message: `Circular dependency detected: ${cycle}`,
          path: 'tasks'
        });
        return true;
      }

      if (visited.has(taskId)) {
        return false;
      }

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = taskMap.get(taskId);
      if (task && task.dependsOn) {
        for (const depId of task.dependsOn) {
          if (visit(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task.id);
      }
    }
  }

  /**
   * Check if a task type is an agent task type
   */
  private isAgentTaskType(type: string): boolean {
    return Object.values(AgentTaskType).includes(type as AgentTaskType);
  }

  /**
   * Parse and validate an agent task
   */
  private parseAgentTask(taskData: any, index: number): AgentTask | null {
    // Validate agent type
    if (!taskData.type || !Object.values(AgentTaskType).includes(taskData.type)) {
      this.errors.push({
        type: ValidationErrorType.TYPE,
        message: `Invalid agent type "${taskData.type}" for task "${taskData.id}"`,
        path: `tasks[${index}].type`,
        value: taskData.type
      });
      return null;
    }

    // Validate agent input
    if (!taskData.input || typeof taskData.input !== 'object') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: `Agent task "${taskData.id}" requires valid input`,
        path: `tasks[${index}].input`
      });
      return null;
    }

    // Validate execution strategy
    if (!taskData.strategy || !Object.values(ExecutionStrategy).includes(taskData.strategy)) {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: `Agent task "${taskData.id}" requires valid execution strategy`,
        path: `tasks[${index}].strategy`,
        value: taskData.strategy
      });
      return null;
    }

    // Validate agent input structure
    const agentInput = taskData.input;
    if (!agentInput.type || !Object.values(AgentTaskType).includes(agentInput.type)) {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: `Agent task "${taskData.id}" input requires valid type`,
        path: `tasks[${index}].input.type`,
        value: agentInput.type
      });
      return null;
    }

    if (!agentInput.context || typeof agentInput.context !== 'object') {
      this.errors.push({
        type: ValidationErrorType.REQUIRED,
        message: `Agent task "${taskData.id}" input requires valid context`,
        path: `tasks[${index}].input.context`
      });
      return null;
    }

    // Validate timeout for agent tasks
    if (taskData.timeout !== undefined) {
      if (typeof taskData.timeout !== 'number' || taskData.timeout <= 0) {
        this.errors.push({
          type: ValidationErrorType.RANGE,
          message: `Agent task "${taskData.id}" timeout must be a positive number`,
          path: `tasks[${index}].timeout`,
          value: taskData.timeout
        });
      }
    } else {
      // Set default timeout for agent tasks
      taskData.timeout = 30000; // 30 seconds default
    }

    // Validate retry configuration for agent tasks
    if (taskData.retry) {
      if (!taskData.retry.maxAttempts || typeof taskData.retry.maxAttempts !== 'number' || taskData.retry.maxAttempts < 1) {
        this.errors.push({
          type: ValidationErrorType.RANGE,
          message: `Agent task "${taskData.id}" retry.maxAttempts must be a positive number`,
          path: `tasks[${index}].retry.maxAttempts`,
          value: taskData.retry?.maxAttempts
        });
      }

      if (!taskData.retry.delay || typeof taskData.retry.delay !== 'number' || taskData.retry.delay < 0) {
        this.errors.push({
          type: ValidationErrorType.RANGE,
          message: `Agent task "${taskData.id}" retry.delay must be a non-negative number`,
          path: `tasks[${index}].retry.delay`,
          value: taskData.retry?.delay
        });
      }
    }

    return {
      id: taskData.id,
      type: taskData.type as AgentTaskType,
      name: taskData.name,
      description: taskData.description,
      input: {
        type: agentInput.type as AgentTaskType,
        context: agentInput.context || {},
        parameters: agentInput.parameters || {},
        timeout: agentInput.timeout
      },
      strategy: taskData.strategy as ExecutionStrategy,
      dependsOn: Array.isArray(taskData.dependsOn) ? taskData.dependsOn : [],
      timeout: taskData.timeout,
      retry: taskData.retry
    };
  }

  /**
   * Validate agent task dependencies
   */
  private validateAgentTaskDependencies(tasks: (Task | AgentTask)[]): void {
    const taskIds = new Set(tasks.map(t => t.id));
    const agentTaskIds = new Set(
      tasks.filter(t => this.isAgentTask(t)).map(t => t.id)
    );

    for (const task of tasks) {
      if (this.isAgentTask(task) && task.dependsOn) {
        for (const depId of task.dependsOn) {
          // Check if dependency exists
          if (!taskIds.has(depId)) {
            this.errors.push({
              type: ValidationErrorType.UNKNOWN_DEPENDENCY,
              message: `Agent task "${task.id}" depends on unknown task "${depId}"`,
              path: `tasks.${task.id}.dependsOn`,
              value: depId
            });
          }

          // Check for agent task dependencies on shell tasks (warning)
          const depTask = tasks.find(t => t.id === depId);
          if (depTask && !this.isAgentTask(depTask)) {
            this.warnings.push(`Agent task "${task.id}" depends on shell task "${depId}". Consider using agent tasks for consistency.`);
          }
        }
      }
    }

    // Check for circular dependencies including agent tasks
    this.detectCircularDependencies(tasks);
  }

  /**
   * Check if a task is an agent task
   */
  private isAgentTask(task: Task | AgentTask): task is AgentTask {
    return 'type' in task && 'input' in task && 'strategy' in task;
  }

  /**
   * Get all agent tasks from a plan
   */
  public getAgentTasks(plan: Plan): AgentTask[] {
    return plan.tasks.filter(task => this.isAgentTask(task)) as AgentTask[];
  }

  /**
   * Get all shell tasks from a plan
   */
  public getShellTasks(plan: Plan): Task[] {
    return plan.tasks.filter(task => !this.isAgentTask(task));
  }

  /**
   * Validate agent task configuration
   */
  public validateAgentTaskConfiguration(plan: Plan): {
    isValid: boolean;
    errors: ValidationError[];
    warnings: string[];
  } {
    const agentTasks = this.getAgentTasks(plan);
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check if agent coordinator would be needed
    if (agentTasks.length > 0) {
      warnings.push(`Plan contains ${agentTasks.length} agent task(s). Agent coordinator must be configured.`);
    }

    // Check for agent task timeouts
    for (const task of agentTasks) {
      if (!task.timeout || task.timeout < 5000) {
        warnings.push(`Agent task "${task.id}" has short or missing timeout. Consider setting at least 5 seconds.`);
      }
    }

    // Check for agent task retry configuration
    for (const task of agentTasks) {
      if (!task.retry) {
        warnings.push(`Agent task "${task.id}" has no retry configuration. Consider adding retry logic for reliability.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}