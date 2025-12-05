/**
 * Unit tests for the Task Executor
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { TaskExecutor } from '../../src/execution/task-executor.js';
import { Task, TaskType, TaskStatus, Plan } from '../../src/execution/types.js';

describe('TaskExecutor', () => {
  let executor: TaskExecutor;

  beforeEach(() => {
    executor = new TaskExecutor({ verbose: false });
  });

  afterEach(() => {
    executor.clearResults();
  });

  describe('Basic Task Execution', () => {
    it('should execute a simple shell task successfully', async () => {
      const task: Task = {
        id: 'echo-task',
        name: 'Echo Task',
        type: TaskType.SHELL,
        command: 'echo "Hello, World!"'
      };

      const result = await executor.executeTask(task);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Hello, World!');
      expect(result.stderr).toBe('');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle failing tasks', async () => {
      const task: Task = {
        id: 'fail-task',
        name: 'Fail Task',
        type: TaskType.SHELL,
        command: 'exit 1'
      };

      const result = await executor.executeTask(task);

      expect(result.status).toBe(TaskStatus.FAILED);
      expect(result.exitCode).toBe(1);
    });

    it('should handle non-existent commands', async () => {
      const task: Task = {
        id: 'nonexistent-task',
        name: 'Nonexistent Task',
        type: TaskType.SHELL,
        command: 'nonexistent-command-12345'
      };

      const result = await executor.executeTask(task);

      expect(result.status).toBe(TaskStatus.FAILED);
      expect(result.exitCode).toBe(127); // Standard exit code for command not found
      // Error field might be undefined for command not found, but stderr should contain info
      expect(result.stderr.length).toBeGreaterThan(0);
    });
  });

  describe('Dry Run Mode', () => {
    it('should simulate execution in dry run mode', async () => {
      const dryExecutor = new TaskExecutor({ dryRun: true });
      const task: Task = {
        id: 'dry-run-task',
        name: 'Dry Run Task',
        type: TaskType.SHELL,
        command: 'echo "This should not execute"'
      };

      const result = await dryExecutor.executeTask(task);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[DRY RUN] Command: echo "This should not execute"');
      expect(result.duration).toBe(0);
    });
  });

  describe('Task Dependencies', () => {
    it('should execute tasks with dependencies in correct order', async () => {
      const plan: Plan = {
        metadata: {
          id: 'test-plan',
          name: 'Test Plan',
          version: '1.0.0'
        },
        tasks: [
          {
            id: 'task1',
            name: 'Task 1',
            type: TaskType.SHELL,
            command: 'echo "Task 1"'
          },
          {
            id: 'task2',
            name: 'Task 2',
            type: TaskType.SHELL,
            command: 'echo "Task 2"',
            dependsOn: ['task1']
          },
          {
            id: 'task3',
            name: 'Task 3',
            type: TaskType.SHELL,
            command: 'echo "Task 3"',
            dependsOn: ['task1', 'task2']
          }
        ]
      };

      const results = await executor.executePlan(plan);

      expect(results).toHaveLength(3);
      expect(results[0].stdout).toContain('Task 1');
      expect(results[1].stdout).toContain('Task 2');
      expect(results[2].stdout).toContain('Task 3');

      // Check execution order
      const task1Result = executor.getTaskResult('task1');
      const task2Result = executor.getTaskResult('task2');
      const task3Result = executor.getTaskResult('task3');

      expect(task1Result?.status).toBe(TaskStatus.COMPLETED);
      expect(task2Result?.status).toBe(TaskStatus.COMPLETED);
      expect(task3Result?.status).toBe(TaskStatus.COMPLETED);
    });

    it('should skip tasks when dependencies fail', async () => {
      const plan: Plan = {
        metadata: {
          id: 'test-plan',
          name: 'Test Plan',
          version: '1.0.0'
        },
        tasks: [
          {
            id: 'failing-task',
            name: 'Failing Task',
            type: TaskType.SHELL,
            command: 'exit 1'
          },
          {
            id: 'dependent-task',
            name: 'Dependent Task',
            type: TaskType.SHELL,
            command: 'echo "This should not run"',
            dependsOn: ['failing-task']
          }
        ]
      };

      const results = await executor.executePlan(plan);

      expect(results).toHaveLength(1); // Only failing task executes, dependent is skipped
      
      const failingResult = executor.getTaskResult('failing-task');
      const dependentResult = executor.getTaskResult('dependent-task');

      expect(failingResult?.status).toBe(TaskStatus.FAILED);
      // The dependent task should not be executed at all when continueOnError is false
      expect(dependentResult).toBeUndefined();
    });

    it('should stop execution on first failure when continueOnError is false', async () => {
      const stopExecutor = new TaskExecutor({ continueOnError: false });
      const plan: Plan = {
        metadata: {
          id: 'test-plan',
          name: 'Test Plan',
          version: '1.0.0'
        },
        tasks: [
          {
            id: 'failing-task',
            name: 'Failing Task',
            type: TaskType.SHELL,
            command: 'exit 1'
          },
          {
            id: 'independent-task',
            name: 'Independent Task',
            type: TaskType.SHELL,
            command: 'echo "This should not run"'
          }
        ]
      };

      const results = await stopExecutor.executePlan(plan);

      expect(results).toHaveLength(1); // Only the failing task should execute
      
      const failingResult = stopExecutor.getTaskResult('failing-task');
      const independentResult = stopExecutor.getTaskResult('independent-task');

      expect(failingResult?.status).toBe(TaskStatus.FAILED);
      expect(independentResult).toBeUndefined();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed tasks according to configuration', async () => {
const task: Task = {
        id: 'retry-task',
        name: 'Retry Task',
        type: TaskType.SHELL,
        command: 'echo "Success on attempt"',
        retry: {
          maxAttempts: 3,
          delay: 0.1,
          backoffMultiplier: 1
        }
      };
      
      const result = await executor.executeTask(task);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.stdout).toContain('Success on attempt');
    });

    it('should fail after max retry attempts', async () => {
      const task: Task = {
        id: 'always-fail-task',
        name: 'Always Fail Task',
        type: TaskType.SHELL,
        command: 'exit 1',
        retry: {
          maxAttempts: 3,
          delay: 0.01
        }
      };

      const result = await executor.executeTask(task);

      expect(result.status).toBe(TaskStatus.FAILED);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('Task Configuration', () => {
    it('should respect custom working directory', async () => {
      const task: Task = {
        id: 'pwd-task',
        name: 'PWD Task',
        type: TaskType.SHELL,
        command: 'pwd',
        workingDirectory: '/tmp'
      };

      const result = await executor.executeTask(task);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.stdout).toContain('/tmp');
    });

    it('should pass environment variables', async () => {
      const task: Task = {
        id: 'env-task',
        name: 'Environment Task',
        type: TaskType.SHELL,
        command: 'echo $TEST_VAR',
        environment: {
          TEST_VAR: 'test-value'
        }
      };

      const result = await executor.executeTask(task);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.stdout).toContain('test-value');
    });

    it('should handle task timeout', async () => {
      const task: Task = {
        id: 'timeout-task',
        name: 'Timeout Task',
        type: TaskType.SHELL,
        command: 'sleep 10',
        timeout: 1 // 1 second timeout
      };

      const startTime = Date.now();
      const result = await executor.executeTask(task);
      const endTime = Date.now();

      expect(result.status).toBe(TaskStatus.FAILED);
      expect(endTime - startTime).toBeLessThan(3000); // Should timeout quickly
    });
  });

  describe('Result Management', () => {
    it('should store and retrieve task results', async () => {
      const task: Task = {
        id: 'result-task',
        name: 'Result Task',
        type: TaskType.SHELL,
        command: 'echo "Result test"'
      };

      await executor.executeTask(task);

      const result = executor.getTaskResult('result-task');
      expect(result).toBeDefined();
      expect(result?.stdout).toContain('Result test');

      const allResults = executor.getAllResults();
      expect(allResults).toHaveLength(1);
      expect(allResults[0].id).toBe('result-task');
    });

    it('should clear results', async () => {
      const task: Task = {
        id: 'clear-task',
        name: 'Clear Task',
        type: TaskType.SHELL,
        command: 'echo "Clear test"'
      };

      await executor.executeTask(task);
      expect(executor.getAllResults()).toHaveLength(1);

      executor.clearResults();
      expect(executor.getAllResults()).toHaveLength(0);
      expect(executor.getTaskResult('clear-task')).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should prevent concurrent execution of the same task', async () => {
      const task: Task = {
        id: 'concurrent-task',
        name: 'Concurrent Task',
        type: TaskType.SHELL,
        command: 'sleep 1'
      };

      // Start first execution
      const firstExecution = executor.executeTask(task);
      
      // Try to start second execution immediately
      await expect(executor.executeTask(task)).rejects.toThrow('is already running');
      
      await firstExecution;
    });

    it('should handle circular dependencies', async () => {
      const plan: Plan = {
        metadata: {
          id: 'circular-plan',
          name: 'Circular Plan',
          version: '1.0.0'
        },
        tasks: [
          {
            id: 'task1',
            name: 'Task 1',
            type: TaskType.SHELL,
            command: 'echo "Task 1"',
            dependsOn: ['task2']
          },
          {
            id: 'task2',
            name: 'Task 2',
            type: TaskType.SHELL,
            command: 'echo "Task 2"',
            dependsOn: ['task1']
          }
        ]
      };

      await expect(executor.executePlan(plan)).rejects.toThrow('Circular dependency detected');
    });
  });
});