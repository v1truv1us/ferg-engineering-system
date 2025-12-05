/**
 * Tests for enhanced execution components (task executor and plan parser)
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { TaskExecutor } from '../../src/execution/task-executor.js';
import { PlanParser } from '../../src/execution/plan-parser.js';
import { AgentCoordinator } from '../../src/agents/coordinator.js';
import { 
  TaskStatus,
  ExecutionOptions,
  TaskType
} from '../../src/execution/types.js';
import { 
  AgentTask,
  AgentTaskStatus,
  AgentType,
  ExecutionStrategy,
  AgentCoordinatorConfig
} from '../../src/agents/types.js';

describe('Enhanced Task Executor', () => {
  let taskExecutor: TaskExecutor;
  let coordinator: AgentCoordinator;
  let config: AgentCoordinatorConfig;

  beforeEach(() => {
    config = {
      maxConcurrency: 3,
      defaultTimeout: 5000,
      retryAttempts: 1,
      retryDelay: 100,
      enableCaching: false,
      logLevel: 'error'
    };
    coordinator = new AgentCoordinator(config);
    taskExecutor = new TaskExecutor({
      verbose: false,
      dryRun: false
    });
    taskExecutor.setAgentCoordinator(coordinator);
  });

  afterEach(() => {
    coordinator.reset();
  });

  describe('Agent Task Execution', () => {
    it('should execute a single agent task', async () => {
      const agentTask: AgentTask = {
        id: 'agent-test-1',
        type: AgentType.CODE_REVIEWER,
        name: 'Agent Test Task',
        description: 'Test agent task execution',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      const result = await taskExecutor.executeTask(agentTask as any);

      expect(result).toBeDefined();
      expect(result.id).toBe(agentTask.id);
      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.stdout).toContain('Mock result from code-reviewer agent');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle agent task failures', async () => {
      const failingAgentTask: AgentTask = {
        id: 'agent-fail-1',
        type: AgentType.SECURITY_SCANNER,
        name: 'Failing Agent Task',
        description: 'Test agent task failure',
        input: {
          type: AgentType.SECURITY_SCANNER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL,
        timeout: 1 // Very short timeout to force failure
      };

      const result = await taskExecutor.executeTask(failingAgentTask as any);

      expect(result).toBeDefined();
      expect(result.id).toBe(failingAgentTask.id);
      expect(result.status).toBe(TaskStatus.FAILED);
      expect(result.error).toContain('timed out');
    });

    it('should execute multiple agent tasks', async () => {
      const agentTasks: AgentTask[] = [
        {
          id: 'agent-multi-1',
          type: AgentType.CODE_REVIEWER,
          name: 'Agent Multi Task 1',
          description: 'First multi agent task',
          input: {
            type: AgentType.CODE_REVIEWER,
            context: { files: ['test1.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        },
        {
          id: 'agent-multi-2',
          type: AgentType.FRONTEND_REVIEWER,
          name: 'Agent Multi Task 2',
          description: 'Second multi agent task',
          input: {
            type: AgentType.FRONTEND_REVIEWER,
            context: { files: ['test2.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        }
      ];

      const results = await taskExecutor.executeAgentTasks(agentTasks);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === TaskStatus.COMPLETED)).toBe(true);
      expect(results[0].id).toBe('agent-multi-1');
      expect(results[1].id).toBe('agent-multi-2');
    });

    it('should handle agent task dependencies', async () => {
      const agentTasks: AgentTask[] = [
        {
          id: 'agent-dep-1',
          type: AgentType.CODE_REVIEWER,
          name: 'Agent Dependency Task 1',
          description: 'First agent task with dependency',
          input: {
            type: AgentType.CODE_REVIEWER,
            context: { files: ['test1.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        },
        {
          id: 'agent-dep-2',
          type: AgentType.FRONTEND_REVIEWER,
          name: 'Agent Dependency Task 2',
          description: 'Second agent task with dependency',
          input: {
            type: AgentType.FRONTEND_REVIEWER,
            context: { files: ['test2.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL,
          dependsOn: ['agent-dep-1']
        }
      ];

      const results = await taskExecutor.executeAgentTasks(agentTasks, {
        type: 'sequential'
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === TaskStatus.COMPLETED)).toBe(true);
    });
  });

  describe('Mixed Task Execution', () => {
    it('should execute mixed shell and agent tasks', async () => {
      const plan = {
        metadata: {
          id: 'mixed-plan',
          name: 'Mixed Execution Plan',
          description: 'Plan with both shell and agent tasks',
          version: '1.0.0',
          author: 'test'
        },
        tasks: [
          {
            id: 'shell-task',
            name: 'Shell Task',
            description: 'A regular shell task',
            type: TaskType.SHELL,
            command: 'echo "shell task completed"'
          },
          {
            id: 'agent-task',
            type: AgentType.CODE_REVIEWER,
            name: 'Agent Task',
            description: 'An agent task',
            input: {
              type: AgentType.CODE_REVIEWER,
              context: { files: ['test.js'] }
            },
            strategy: ExecutionStrategy.SEQUENTIAL
          }
        ]
      };

      const results = await taskExecutor.executePlan(plan);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === TaskStatus.COMPLETED)).toBe(true);
    });
  });

  describe('Agent Progress and Metrics', () => {
    it('should provide agent execution progress', async () => {
      const agentTask: AgentTask = {
        id: 'agent-progress',
        type: AgentType.CODE_REVIEWER,
        name: 'Agent Progress Task',
        description: 'Test agent progress tracking',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      // Start execution
      const executionPromise = taskExecutor.executeTask(agentTask as any);
      
      // Check progress during execution
      const progress = taskExecutor.getAgentProgress();
      expect(progress).toBeDefined();
      
      // Wait for completion
      await executionPromise;
      
      // Check final progress
      const finalProgress = taskExecutor.getAgentProgress();
      expect(finalProgress).toBeDefined();
    });

    it('should provide agent execution metrics', async () => {
      const agentTask: AgentTask = {
        id: 'agent-metrics',
        type: AgentType.CODE_REVIEWER,
        name: 'Agent Metrics Task',
        description: 'Test agent metrics collection',
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: ['test.js'] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      };

      await taskExecutor.executeTask(agentTask as any);
      
      const metrics = taskExecutor.getAgentMetrics();
      expect(metrics).toBeDefined();
      expect(metrics!.size).toBeGreaterThan(0);
    });
  });
});

describe('Enhanced Plan Parser', () => {
  let planParser: PlanParser;

  beforeEach(() => {
    planParser = new PlanParser();
  });

  describe('Agent Task Validation', () => {
    it('should parse valid agent tasks', () => {
      const planContent = `
metadata:
  id: test-plan
  name: Test Plan
  version: 1.0.0

tasks:
  - id: agent-task-1
    name: Agent Task 1
    description: First agent task
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - test.js
    strategy: sequential
    timeout: 15000
  `;

      const plan = planParser.parseContent(planContent);
      expect(plan.errors).toEqual([]);
      expect(plan.tasks).toHaveLength(1);
      
      const agentTask = plan.tasks[0];
      expect(agentTask.type).toBe('code-reviewer');
      expect(agentTask.input).toBeDefined();
      expect(agentTask.strategy).toBe('sequential');
    });

    it('should validate agent task requirements', () => {
      const planContent = `
metadata:
  id: invalid-agent-plan
  name: Invalid Agent Plan
  version: 1.0.0

tasks:
  - id: invalid-agent-task
    name: Invalid Agent Task
    description: Missing required fields
    type: code-reviewer
    # Missing input field
    strategy: sequential
  `;

      expect(() => planParser.parseContent(planContent)).toThrow();
      try {
        planParser.parseContent(planContent);
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain('input');
      }
    });

    it('should validate agent task input structure', () => {
      const planContent = `
metadata:
  id: invalid-input-plan
  name: Invalid Input Plan
  version: 1.0.0

tasks:
  - id: invalid-input-task
    name: Invalid Input Task
    description: Invalid input structure
    type: code-reviewer
    input:
      # Missing type field
      context:
        files:
          - test.js
    strategy: sequential
  `;

      const plan = planParser.parseContent(planContent);

      expect(plan.errors.length).toBeGreaterThan(0);
      expect(plan.errors.some(e => e.message.includes('type'))).toBe(true);
    });

    it('should validate agent task execution strategy', () => {
      const planContent = `
metadata:
  id: invalid-strategy-plan
  name: Invalid Strategy Plan
  version: 1.0.0

tasks:
  - id: invalid-strategy-task
    name: Invalid Strategy Task
    description: Invalid execution strategy
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - test.js
    strategy: invalid-strategy
  `;

      expect(() => planParser.parseContent(planContent)).toThrow();
      try {
        planParser.parseContent(planContent);
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain('strategy');
      }
    });

    it('should set default timeout for agent tasks', () => {
      const planContent = `
metadata:
  id: no-timeout-plan
  name: No Timeout Plan
  version: 1.0.0

tasks:
  - id: no-timeout-task
    name: No Timeout Task
    description: Agent task without timeout
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - test.js
    strategy: sequential
  `;

      const plan = planParser.parseContent(planContent);
      expect(plan.errors).toEqual([]);
      expect(plan.tasks[0].timeout).toBe(30000); // Default 30 seconds
    });
  });

  describe('Agent Task Utilities', () => {
    it('should extract agent tasks from plan', () => {
      const planContent = `
metadata:
  id: mixed-plan
  name: Mixed Plan
  version: 1.0.0

tasks:
  - id: shell-task
    name: Shell Task
    description: Regular shell task
    type: shell
    command: echo "shell"
  - id: agent-task
    name: Agent Task
    description: Agent task
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - test.js
    strategy: sequential
  `;

      expect(() => planParser.parseContent(planContent)).not.toThrow();
      const plan = planParser.parseContent(planContent);
      const agentTasks = planParser.getAgentTasks(plan);
      const shellTasks = planParser.getShellTasks(plan);

      expect(agentTasks).toHaveLength(1);
      expect(shellTasks).toHaveLength(1);
      expect(agentTasks[0].id).toBe('agent-task');
      expect(shellTasks[0].id).toBe('shell-task');
    });

    it('should validate agent task configuration', () => {
      const planContent = `
metadata:
  id: config-validation-plan
  name: Config Validation Plan
  version: 1.0.0

tasks:
  - id: agent-task-no-timeout
    name: Agent Task No Timeout
    description: Agent task with short timeout
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - test.js
    strategy: sequential
    timeout: 1000
  - id: agent-task-no-retry
    name: Agent Task No Retry
    description: Agent task without retry
    type: security-scanner
    input:
      type: security-scanner
      context:
        files:
          - test.js
    strategy: sequential
  `;

      expect(() => planParser.parseContent(planContent)).not.toThrow();
      const plan = planParser.parseContent(planContent);
      const validation = planParser.validateAgentTaskConfiguration(plan);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('timeout'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('retry'))).toBe(true);
    });
  });

  describe('Agent Task Dependencies', () => {
    it('should validate agent task dependencies', () => {
      const planContent = `
metadata:
  id: agent-deps-plan
  name: Agent Dependencies Plan
  version: 1.0.0

tasks:
  - id: agent-task-1
    name: Agent Task 1
    description: First agent task
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - test1.js
    strategy: sequential
  - id: agent-task-2
    name: Agent Task 2
    description: Second agent task with dependency
    type: frontend-reviewer
    input:
      type: frontend-reviewer
      context:
        files:
          - test2.js
    strategy: sequential
    dependsOn:
      - agent-task-1
  `;

      const plan = planParser.parseContent(planContent);
      expect(plan.errors).toEqual([]);
      expect(plan.tasks).toHaveLength(2);
      expect(plan.tasks[1].dependsOn).toContain('agent-task-1');
    });

    it('should detect invalid agent task dependencies', () => {
      const planContent = `
metadata:
  id: invalid-deps-plan
  name: Invalid Dependencies Plan
  version: 1.0.0

tasks:
  - id: agent-task
    name: Agent Task
    description: Agent task with invalid dependency
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - test.js
    strategy: sequential
    dependsOn:
      - non-existent-task
  `;

      expect(() => planParser.parseContent(planContent)).toThrow();
      try {
        planParser.parseContent(planContent);
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain('unknown task');
      }
    });
  });
});

describe('Integration Tests', () => {
  let taskExecutor: TaskExecutor;
  let planParser: PlanParser;
  let coordinator: AgentCoordinator;

  beforeEach(() => {
    const config: AgentCoordinatorConfig = {
      maxConcurrency: 3,
      defaultTimeout: 5000,
      retryAttempts: 1,
      retryDelay: 100,
      enableCaching: false,
      logLevel: 'error'
    };
    coordinator = new AgentCoordinator(config);
    taskExecutor = new TaskExecutor({ verbose: false });
    taskExecutor.setAgentCoordinator(coordinator);
    planParser = new PlanParser();
  });

  afterEach(() => {
    coordinator.reset();
  });

  it('should execute complete plan with agent tasks', async () => {
    const planContent = `
metadata:
  id: integration-plan
  name: Integration Test Plan
  description: Plan with agent and shell tasks
  version: 1.0.0

tasks:
  - id: setup-task
    name: Setup Task
    description: Initial setup
    type: shell
    command: echo "Setup complete"
  - id: review-task
    name: Code Review Task
    description: Review the code
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - src/app.js
    strategy: sequential
    dependsOn:
      - setup-task
  - id: cleanup-task
    name: Cleanup Task
    description: Final cleanup
    type: shell
    command: echo "Cleanup complete"
    dependsOn:
      - review-task
  `;

      const plan = planParser.parseContent(planContent);
      expect(plan.errors).toEqual([]);

    const results = await taskExecutor.executePlan(plan);

    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === TaskStatus.COMPLETED)).toBe(true);
    expect(results[0].id).toBe('setup-task');
    expect(results[1].id).toBe('review-task');
    expect(results[2].id).toBe('cleanup-task');
  });
});