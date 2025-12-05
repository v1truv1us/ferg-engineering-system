/**
 * Quality gates runner for the Ferg Engineering System.
 * Executes quality gates in sequence with proper error handling and reporting.
 */

import { TaskExecutor } from './task-executor.js';
import { 
  QualityGateConfig, 
  QualityGateResult, 
  QualityGateType, 
  TaskStatus, 
  Task, 
  TaskType,
  ExecutionOptions 
} from './types.js';

export class QualityGateRunner {
  private taskExecutor: TaskExecutor;
  private options: ExecutionOptions;

  constructor(options: ExecutionOptions = {}) {
    this.options = {
      dryRun: false,
      continueOnError: false,
      verbose: false,
      ...options
    };
    
    this.taskExecutor = new TaskExecutor(this.options);
  }

  /**
   * Execute all quality gates for a plan
   */
  public async executeQualityGates(
    gates: QualityGateConfig[]
  ): Promise<QualityGateResult[]> {
    const results: QualityGateResult[] = [];
    
    // Sort gates by type to ensure consistent execution order
    const sortedGates = this.sortGatesByPriority(gates);
    
    for (const gate of sortedGates) {
      const result = await this.executeQualityGate(gate);
      results.push(result);
      
      // Stop execution if a required gate fails
      if (gate.required && !result.passed) {
        this.log(`Stopping execution due to required quality gate failure: ${gate.id}`);
        break;
      }
    }
    
    return results;
  }

  /**
   * Execute a single quality gate
   */
  public async executeQualityGate(gate: QualityGateConfig): Promise<QualityGateResult> {
    const startTime = new Date();
    
    try {
      this.log(`Executing quality gate: ${gate.id} (${gate.name})`);
      
      const task = this.createTaskFromGate(gate);
      const taskResult = await this.taskExecutor.executeTask(task);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const passed = this.evaluateGateResult(gate, taskResult);
      
      const result: QualityGateResult = {
        gateId: gate.id,
        status: taskResult.status,
        passed,
        duration,
        message: this.createResultMessage(gate, taskResult, passed),
        details: {
          taskResult,
          gateConfig: gate
        },
        timestamp: new Date()
      };
      
      this.log(`Quality gate ${gate.id} ${passed ? 'passed' : 'failed'} in ${duration}ms`);
      
      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.log(`Quality gate ${gate.id} failed with error: ${errorMessage}`);
      
      return {
        gateId: gate.id,
        status: TaskStatus.FAILED,
        passed: false,
        duration,
        message: `Quality gate execution failed: ${errorMessage}`,
        details: { error: errorMessage },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get default quality gates configuration
   */
  public static getDefaultGates(): QualityGateConfig[] {
    return [
      {
        id: 'lint',
        name: 'Code Linting',
        description: 'Check code style and formatting',
        type: QualityGateType.LINT,
        required: true,
        config: {
          command: 'npm run lint',
          timeout: 60
        }
      },
      {
        id: 'types',
        name: 'Type Checking',
        description: 'TypeScript compilation check',
        type: QualityGateType.TYPES,
        required: true,
        config: {
          command: 'npm run build',
          timeout: 120
        }
      },
      {
        id: 'tests',
        name: 'Unit Tests',
        description: 'Run unit test suite',
        type: QualityGateType.TESTS,
        required: true,
        config: {
          command: 'npm test',
          timeout: 300
        }
      },
      {
        id: 'build',
        name: 'Build Process',
        description: 'Build the project',
        type: QualityGateType.BUILD,
        required: true,
        config: {
          command: 'npm run build',
          timeout: 180
        }
      },
      {
        id: 'integration',
        name: 'Integration Tests',
        description: 'Run integration test suite',
        type: QualityGateType.INTEGRATION,
        required: false,
        config: {
          command: 'npm run test:integration',
          timeout: 600
        }
      },
      {
        id: 'deploy',
        name: 'Deployment Validation',
        description: 'Validate deployment readiness',
        type: QualityGateType.DEPLOY,
        required: false,
        config: {
          command: 'npm run deploy:validate',
          timeout: 300
        }
      }
    ];
  }

  /**
   * Create quality gates from tasks in a plan
   */
  public static createGatesFromTasks(tasks: Task[]): QualityGateConfig[] {
    const gates: QualityGateConfig[] = [];
    
    for (const task of tasks) {
      if (this.isQualityGateTask(task)) {
        const gateType = this.mapTaskTypeToGateType(task.type);
        
        gates.push({
          id: task.id,
          name: task.name,
          description: task.description,
          type: gateType,
          required: true, // Default to required for explicit gate tasks
          config: {
            command: task.command,
            timeout: task.timeout,
            workingDirectory: task.workingDirectory,
            environment: task.environment
          },
          taskId: task.id
        });
      }
    }
    
    return gates;
  }

  private sortGatesByPriority(gates: QualityGateConfig[]): QualityGateConfig[] {
    const priorityOrder = [
      QualityGateType.LINT,
      QualityGateType.TYPES,
      QualityGateType.TESTS,
      QualityGateType.BUILD,
      QualityGateType.INTEGRATION,
      QualityGateType.DEPLOY
    ];
    
    return gates.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.type);
      const bPriority = priorityOrder.indexOf(b.type);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same type, sort by required status first
      if (a.required !== b.required) {
        return b.required ? 1 : -1;
      }
      
      // Finally sort by ID
      return a.id.localeCompare(b.id);
    });
  }

  private createTaskFromGate(gate: QualityGateConfig): Task {
    const config = gate.config || {};
    
    return {
      id: `gate-${gate.id}`,
      name: `Quality Gate: ${gate.name}`,
      description: gate.description,
      type: this.mapGateTypeToTaskType(gate.type),
      command: config.command || this.getDefaultCommandForGate(gate.type),
      workingDirectory: config.workingDirectory,
      environment: config.environment,
      timeout: config.timeout || this.getDefaultTimeoutForGate(gate.type),
      retry: {
        maxAttempts: 1,
        delay: 0
      }
    };
  }

  private mapGateTypeToTaskType(gateType: QualityGateType): TaskType {
    const mapping = {
      [QualityGateType.LINT]: TaskType.LINT,
      [QualityGateType.TYPES]: TaskType.TYPES,
      [QualityGateType.TESTS]: TaskType.TESTS,
      [QualityGateType.BUILD]: TaskType.BUILD,
      [QualityGateType.INTEGRATION]: TaskType.INTEGRATION,
      [QualityGateType.DEPLOY]: TaskType.DEPLOY
    };
    
    return mapping[gateType] || TaskType.SHELL;
  }

  private mapTaskTypeToGateType(taskType: TaskType): QualityGateType {
    const mapping = {
      [TaskType.LINT]: QualityGateType.LINT,
      [TaskType.TYPES]: QualityGateType.TYPES,
      [TaskType.TESTS]: QualityGateType.TESTS,
      [TaskType.BUILD]: QualityGateType.BUILD,
      [TaskType.INTEGRATION]: QualityGateType.INTEGRATION,
      [TaskType.DEPLOY]: QualityGateType.DEPLOY
    };
    
    return mapping[taskType] || QualityGateType.LINT;
  }

  private getDefaultCommandForGate(gateType: QualityGateType): string {
    const commands = {
      [QualityGateType.LINT]: 'npm run lint',
      [QualityGateType.TYPES]: 'npm run build',
      [QualityGateType.TESTS]: 'npm test',
      [QualityGateType.BUILD]: 'npm run build',
      [QualityGateType.INTEGRATION]: 'npm run test:integration',
      [QualityGateType.DEPLOY]: 'npm run deploy:validate'
    };
    
    return commands[gateType] || 'echo "No command configured"';
  }

  private getDefaultTimeoutForGate(gateType: QualityGateType): number {
    const timeouts = {
      [QualityGateType.LINT]: 60,
      [QualityGateType.TYPES]: 120,
      [QualityGateType.TESTS]: 300,
      [QualityGateType.BUILD]: 180,
      [QualityGateType.INTEGRATION]: 600,
      [QualityGateType.DEPLOY]: 300
    };
    
    return timeouts[gateType] || 60;
  }

  private evaluateGateResult(gate: QualityGateConfig, taskResult: TaskResult): boolean {
    // Basic evaluation: task must complete successfully
    if (taskResult.status !== TaskStatus.COMPLETED) {
      return false;
    }
    
    // Exit code must be 0 for success
    if (taskResult.exitCode !== 0) {
      return false;
    }
    
    // Type-specific evaluations can be added here
    switch (gate.type) {
      case QualityGateType.TESTS:
        return this.evaluateTestGate(taskResult);
      case QualityGateType.BUILD:
        return this.evaluateBuildGate(taskResult);
      case QualityGateType.LINT:
        return this.evaluateLintGate(taskResult);
      default:
        return true;
    }
  }

  private evaluateTestGate(taskResult: TaskResult): boolean {
    // Check for common test success indicators
    const output = (taskResult.stdout + taskResult.stderr).toLowerCase();
    
    // Look for test success patterns
    const successPatterns = [
      /passing/,
      /passed/,
      /✓/,
      /✔/,
      /all tests passed/,
      /test suite passed/
    ];
    
    // Look for test failure patterns
    const failurePatterns = [
      /failing/,
      /failed/,
      /✗/,
      /✘/,
      /test failed/,
      /tests failed/,
      /error:/,
      /exception/
    ];
    
    const hasSuccessPattern = successPatterns.some(pattern => pattern.test(output));
    const hasFailurePattern = failurePatterns.some(pattern => pattern.test(output));
    
    // If there are explicit success indicators, trust those
    if (hasSuccessPattern && !hasFailurePattern) {
      return true;
    }
    
    // If there are explicit failure indicators, fail
    if (hasFailurePattern) {
      return false;
    }
    
    // Default to exit code evaluation
    return taskResult.exitCode === 0;
  }

  private evaluateBuildGate(taskResult: TaskResult): boolean {
    // Build is successful if exit code is 0 and no obvious error patterns
    const output = (taskResult.stdout + taskResult.stderr).toLowerCase();
    
    const errorPatterns = [
      /build failed/,
      /compilation error/,
      /syntax error/,
      /type error/,
      /error:/
    ];
    
    const hasErrorPattern = errorPatterns.some(pattern => pattern.test(output));
    
    return !hasErrorPattern && taskResult.exitCode === 0;
  }

  private evaluateLintGate(taskResult: TaskResult): boolean {
    // Linting is successful if exit code is 0 and no error patterns
    const output = (taskResult.stdout + taskResult.stderr).toLowerCase();
    
    const errorPatterns = [
      /error/,
      /problem/,
      /warning/,
      /issue/
    ];
    
    const hasErrorPattern = errorPatterns.some(pattern => pattern.test(output));
    
    return !hasErrorPattern && taskResult.exitCode === 0;
  }

  private createResultMessage(
    gate: QualityGateConfig, 
    taskResult: TaskResult, 
    passed: boolean
  ): string {
    if (passed) {
      return `Quality gate "${gate.name}" passed successfully`;
    }
    
    if (taskResult.status === TaskStatus.FAILED) {
      return `Quality gate "${gate.name}" failed with exit code ${taskResult.exitCode}`;
    }
    
    if (taskResult.status === TaskStatus.SKIPPED) {
      return `Quality gate "${gate.name}" was skipped: ${taskResult.error}`;
    }
    
    return `Quality gate "${gate.name}" did not complete successfully`;
  }

  private static isQualityGateTask(task: Task): boolean {
    return [
      TaskType.LINT,
      TaskType.TYPES,
      TaskType.TESTS,
      TaskType.BUILD,
      TaskType.INTEGRATION,
      TaskType.DEPLOY
    ].includes(task.type);
  }

  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[QualityGateRunner] ${message}`);
    }
  }
}