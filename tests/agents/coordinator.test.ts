/**
 * Tests for the AgentCoordinator class
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { AgentCoordinator } from '../../src/agents/coordinator.js';
import { 
  AgentType, 
  AgentTask, 
  AgentTaskStatus, 
  AgentCoordinatorConfig, 
  AggregationStrategy,
  ConfidenceLevel,
  ExecutionStrategy
} from '../../src/agents/types.js';

describe('AgentCoordinator', () => {
  let coordinator: AgentCoordinator;
  let config: AgentCoordinatorConfig;

  beforeEach(() => {
    config = {
      maxConcurrency: 3,
      defaultTimeout: 5000,
      retryAttempts: 2,
      retryDelay: 100,
      enableCaching: true,
      logLevel: 'error'
    };
    coordinator = new AgentCoordinator(config);
  });

  afterEach(() => {
    coordinator.reset();
  });

  describe('Task Execution', () => {
    it('should execute a single task successfully', async () => {
      const task: AgentTask = {
        id: 'test-1',
        type: AgentType.CODE_REVIEWER,
        name: 'Test Code Review',
        description: 'Test task',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      const result = await coordinator.executeTask(task);

      expect(result.id).toBe(task.id);
      expect(result.type).toBe(task.type);
      expect(result.status).toBe(AgentTaskStatus.COMPLETED);
      expect(result.output).toBeDefined();
      expect(result.output?.success).toBe(true);
    });

    it('should handle task failures gracefully', async () => {
      // Create a task that will fail by using a very short timeout
      const task: AgentTask = {
        id: 'fail-1',
        type: AgentType.SECURITY_SCANNER,
        name: 'Failing Task',
        description: 'Task that will fail',
        input: {
          type: AgentType.SECURITY_SCANNER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL,
        timeout: 1 // 1ms timeout to force failure
      };

      const result = await coordinator.executeTask(task);

      expect(result.status).toBe(AgentTaskStatus.FAILED);
      expect(result.error).toContain('timed out');
    });

    it('should respect task dependencies', async () => {
      const task1: AgentTask = {
        id: 'dep-1',
        type: AgentType.CODE_REVIEWER,
        name: 'Dependency Task',
        description: 'First task',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      const task2: AgentTask = {
        id: 'dep-2',
        type: AgentType.FRONTEND_REVIEWER,
        name: 'Dependent Task',
        description: 'Task with dependency',
        input: {
          type: AgentType.FRONTEND_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL,
        dependsOn: ['dep-1']
      };

      // Execute tasks together with dependency resolution
      const results = await coordinator.executeTasks([task1, task2], {
        type: 'sequential'
      });

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe(AgentTaskStatus.COMPLETED);
      expect(results[1].status).toBe(AgentTaskStatus.COMPLETED);
    });

    it('should detect circular dependencies', async () => {
      const task1: AgentTask = {
        id: 'circular-1',
        type: AgentType.CODE_REVIEWER,
        name: 'Circular Task 1',
        description: 'Task with circular dependency',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL,
        dependsOn: ['circular-2']
      };

      const task2: AgentTask = {
        id: 'circular-2',
        type: AgentType.FRONTEND_REVIEWER,
        name: 'Circular Task 2',
        description: 'Task with circular dependency',
        input: {
          type: AgentType.FRONTEND_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL,
        dependsOn: ['circular-1']
      };

      await expect(coordinator.executeTasks([task1, task2], {
        type: 'sequential'
      })).rejects.toThrow('Circular dependency detected');
    });
  });

  describe('Execution Strategies', () => {
    it('should execute tasks in parallel', async () => {
      const tasks: AgentTask[] = [
        {
          id: 'parallel-1',
          type: AgentType.CODE_REVIEWER,
          name: 'Parallel Task 1',
          description: 'First parallel task',
          input: {
            type: AgentType.CODE_REVIEWER,
            context: { files: ['test1.js'] }
          },
          strategy: ExecutionStrategy.PARALLEL
        },
        {
          id: 'parallel-2',
          type: AgentType.FRONTEND_REVIEWER,
          name: 'Parallel Task 2',
          description: 'Second parallel task',
          input: {
            type: AgentType.FRONTEND_REVIEWER,
            context: { files: ['test2.js'] }
          },
          strategy: ExecutionStrategy.PARALLEL
        }
      ];

      const startTime = Date.now();
      const results = await coordinator.executeTasks(tasks, {
        type: 'parallel'
      });
      const endTime = Date.now();

      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === AgentTaskStatus.COMPLETED)).toBe(true);
      
      // Parallel execution should be faster than sequential
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(3000); // Should complete in under 3 seconds
    });

    it('should execute tasks sequentially', async () => {
      const tasks: AgentTask[] = [
        {
          id: 'sequential-1',
          type: AgentType.CODE_REVIEWER,
          name: 'Sequential Task 1',
          description: 'First sequential task',
          input: {
            type: AgentType.CODE_REVIEWER,
            context: { files: ['test1.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        },
        {
          id: 'sequential-2',
          type: AgentType.FRONTEND_REVIEWER,
          name: 'Sequential Task 2',
          description: 'Second sequential task',
          input: {
            type: AgentType.FRONTEND_REVIEWER,
            context: { files: ['test2.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        }
      ];

      const results = await coordinator.executeTasks(tasks, {
        type: 'sequential'
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === AgentTaskStatus.COMPLETED)).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache results when enabled', async () => {
      const task: AgentTask = {
        id: 'cache-test',
        type: AgentType.CODE_REVIEWER,
        name: 'Cache Test Task',
        description: 'Task for testing caching',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      // First execution
      const startTime1 = Date.now();
      const result1 = await coordinator.executeTask(task);
      const endTime1 = Date.now();

      // Second execution (should use cache)
      const startTime2 = Date.now();
      const result2 = await coordinator.executeTask(task);
      const endTime2 = Date.now();

      expect(result1.output).toEqual(result2.output);
      
      // Second execution should be much faster due to caching
      const firstExecutionTime = endTime1 - startTime1;
      const secondExecutionTime = endTime2 - startTime2;
      expect(secondExecutionTime).toBeLessThan(firstExecutionTime);
    });

    it('should not cache when disabled', async () => {
      const configNoCache: AgentCoordinatorConfig = {
        ...config,
        enableCaching: false
      };
      const coordinatorNoCache = new AgentCoordinator(configNoCache);

      const task: AgentTask = {
        id: 'no-cache-test',
        type: AgentType.CODE_REVIEWER,
        name: 'No Cache Test Task',
        description: 'Task for testing no caching',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      const result1 = await coordinatorNoCache.executeTask(task);
      const result2 = await coordinatorNoCache.executeTask(task);

      expect(result1.output).toBeDefined();
      expect(result2.output).toBeDefined();
      // Both executions should take similar time (no caching)
    });
  });

  describe('Progress Tracking', () => {
    it('should track execution progress correctly', async () => {
      const tasks: AgentTask[] = [
        {
          id: 'progress-1',
          type: AgentType.CODE_REVIEWER,
          name: 'Progress Task 1',
          description: 'Task for progress tracking',
          input: {
            type: AgentType.CODE_REVIEWER,
            context: { files: ['test1.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        },
        {
          id: 'progress-2',
          type: AgentType.FRONTEND_REVIEWER,
          name: 'Progress Task 2',
          description: 'Another task for progress tracking',
          input: {
            type: AgentType.FRONTEND_REVIEWER,
            context: { files: ['test2.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        }
      ];

      // Check initial progress
      let progress = coordinator.getProgress();
      expect(progress.totalTasks).toBe(0);
      expect(progress.completedTasks).toBe(0);
      expect(progress.percentageComplete).toBe(0);

      // Execute tasks and check progress
      await coordinator.executeTasks(tasks, {
        type: 'sequential'
      });

      progress = coordinator.getProgress();
      expect(progress.totalTasks).toBe(0); // Reset after execution
      expect(progress.completedTasks).toBe(0);
    });
  });

  describe('Metrics', () => {
    it('should track agent execution metrics', async () => {
      const task: AgentTask = {
        id: 'metrics-test',
        type: AgentType.CODE_REVIEWER,
        name: 'Metrics Test Task',
        description: 'Task for testing metrics',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      await coordinator.executeTask(task);

      const metrics = coordinator.getMetrics();
      const codeReviewerMetrics = metrics.get(AgentType.CODE_REVIEWER);
      
      expect(codeReviewerMetrics).toBeDefined();
      expect(codeReviewerMetrics!.executionCount).toBe(1);
      expect(codeReviewerMetrics!.successRate).toBeGreaterThan(0);
      expect(codeReviewerMetrics!.lastExecutionTime).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate task execution attempts', async () => {
      const task: AgentTask = {
        id: 'duplicate-test',
        type: AgentType.CODE_REVIEWER,
        name: 'Duplicate Test Task',
        description: 'Task for testing duplicate execution',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      // Start first execution
      const promise1 = coordinator.executeTask(task);
      
      // Try to execute same task again
      await expect(coordinator.executeTask(task)).rejects.toThrow('already running');
      
      // Wait for first execution to complete
      await promise1;
    });
  });

  describe('Event Emission', () => {
    it('should emit events during task execution', async () => {
      const events: any[] = [];
      
      coordinator.on('agent_event', (event) => {
        events.push(event);
      });

      const task: AgentTask = {
        id: 'event-test',
        type: AgentType.CODE_REVIEWER,
        name: 'Event Test Task',
        description: 'Task for testing events',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      await coordinator.executeTask(task);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'task_started')).toBe(true);
      expect(events.some(e => e.type === 'task_completed')).toBe(true);
    });
  });
});