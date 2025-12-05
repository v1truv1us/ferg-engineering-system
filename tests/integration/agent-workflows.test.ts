/**
 * Integration tests for agent workflows
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { AgentCoordinator } from '../../src/agents/coordinator.js';
import { PlanGenerator } from '../../src/agents/plan-generator.js';
import { CodeReviewExecutor } from '../../src/agents/code-review-executor.js';
import { TaskExecutor } from '../../src/execution/task-executor.js';
import { PlanParser } from '../../src/execution/plan-parser.js';
import { ExecutorCLI } from '../../src/cli/executor.js';
import { 
  AgentType,
  AgentTaskStatus,
  AgentCoordinatorConfig,
  PlanGenerationInput,
  CodeReviewInput,
  ExecutionStrategy,
  ConfidenceLevel
} from '../../src/agents/types.js';
import { TaskStatus } from '../../src/execution/types.js';

describe('Agent Workflow Integration', () => {
  let coordinator: AgentCoordinator;
  let planGenerator: PlanGenerator;
  let codeReviewExecutor: CodeReviewExecutor;
  let taskExecutor: TaskExecutor;
  let planParser: PlanParser;
  let config: AgentCoordinatorConfig;

  beforeEach(() => {
    config = {
      maxConcurrency: 3,
      defaultTimeout: 10000,
      retryAttempts: 2,
      retryDelay: 500,
      enableCaching: false,
      logLevel: 'error'
    };
    
    coordinator = new AgentCoordinator(config);
    planGenerator = new PlanGenerator(coordinator);
    codeReviewExecutor = new CodeReviewExecutor(coordinator);
    taskExecutor = new TaskExecutor({ verbose: false });
    taskExecutor.setAgentCoordinator(coordinator);
    planParser = new PlanParser();
  });

  afterEach(() => {
    coordinator.reset();
  });

  describe('End-to-End Plan Generation', () => {
    it('should generate complete plan from description', async () => {
      const input: PlanGenerationInput = {
        description: 'Create a REST API for user management with authentication',
        requirements: [
          'User registration and login',
          'JWT authentication',
          'CRUD operations for users',
          'Input validation and error handling'
        ],
        constraints: [
          'Use Node.js and Express',
          'MongoDB for data storage',
          'Follow REST conventions'
        ]
      };

      const result = await planGenerator.generatePlan(input);

      expect(result).toBeDefined();
      expect(result.plan).toBeDefined();
      expect(result.plan.name).toContain('implementation-plan');
      expect(result.plan.tasks.length).toBeGreaterThan(0);
      expect(result.confidence).toBeDefined();
      expect(result.reasoning).toContain('REST API for user management');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should generate scoped architecture plan', async () => {
      const input: PlanGenerationInput = {
        description: 'Microservices architecture for e-commerce platform',
        scope: 'architecture',
        requirements: [
          'Service discovery',
          'API gateway',
          'Inter-service communication',
          'Data consistency'
        ]
      };

      const result = await planGenerator.generateScopedPlan(input, 'architecture');

      expect(result).toBeDefined();
      expect(result.plan.tasks.length).toBeGreaterThan(0);
      expect(result.reasoning).toContain('architecture');
    });
  });

  describe('End-to-End Code Review', () => {
    it('should execute comprehensive code review', async () => {
      const input: CodeReviewInput = {
        files: ['src/api/user.js', 'src/auth/jwt.js', 'src/models/user.js'],
        reviewType: 'full',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
      expect(result.summary.bySeverity).toBeDefined();
      expect(result.summary.byCategory).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should execute focused security review', async () => {
      const input: CodeReviewInput = {
        files: ['src/auth/login.js', 'src/middleware/auth.js'],
        reviewType: 'security',
        severity: 'high'
      };

      const result = await codeReviewExecutor.executeFocusedReview(input, 'security');

      expect(result).toBeDefined();
      expect(result.findings.length).toBeGreaterThanOrEqual(0);
      
      // Should include security-related findings
      const securityFindings = result.findings.filter(f => 
        f.category === 'security' || f.message.toLowerCase().includes('security')
      );
      expect(securityFindings.length).toBeGreaterThanOrEqual(0);
    });

    it('should execute incremental review', async () => {
      const input: CodeReviewInput = {
        files: ['src/feature/new-endpoint.js'],
        reviewType: 'incremental',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeIncrementalReview(input, 'main');

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Agent Coordination', () => {
    it('should coordinate multiple agents successfully', async () => {
      const tasks = [
        {
          id: 'coord-test-1',
          type: AgentType.CODE_REVIEWER,
          name: 'Coordination Test 1',
          description: 'First agent task',
          input: {
            type: AgentType.CODE_REVIEWER,
            context: { files: ['test1.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        },
        {
          id: 'coord-test-2',
          type: AgentType.FRONTEND_REVIEWER,
          name: 'Coordination Test 2',
          description: 'Second agent task',
          input: {
            type: AgentType.FRONTEND_REVIEWER,
            context: { files: ['test2.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        }
      ];

      const results = await coordinator.executeTasks(tasks, {
        type: 'parallel'
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === AgentTaskStatus.COMPLETED)).toBe(true);
      expect(results.every(r => r.output?.success)).toBe(true);
    });

    it('should handle agent task dependencies', async () => {
      const tasks = [
        {
          id: 'dep-test-1',
          type: AgentType.ARCHITECT_ADVISOR,
          name: 'Dependency Test 1',
          description: 'First agent task',
          input: {
            type: AgentType.ARCHITECT_ADVISOR,
            context: { files: ['test1.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        },
        {
          id: 'dep-test-2',
          type: AgentType.CODE_REVIEWER,
          name: 'Dependency Test 2',
          description: 'Second agent task with dependency',
          input: {
            type: AgentType.CODE_REVIEWER,
            context: { files: ['test2.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL,
          dependsOn: ['dep-test-1']
        }
      ];

      const results = await coordinator.executeTasks(tasks, {
        type: 'sequential'
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === AgentTaskStatus.COMPLETED)).toBe(true);
    });

    it('should track agent execution progress', async () => {
      const tasks = [
        {
          id: 'progress-test',
          type: AgentType.CODE_REVIEWER,
          name: 'Progress Test',
          description: 'Test progress tracking',
          input: {
            type: AgentType.CODE_REVIEWER,
            context: { files: ['test.js'] }
          },
          strategy: ExecutionStrategy.SEQUENTIAL
        }
      ];

      // Start execution
      const executionPromise = coordinator.executeTasks(tasks, {
        type: 'sequential'
      });

      // Check progress during execution
      const progress = coordinator.getProgress();
      expect(progress).toBeDefined();
      expect(progress.totalTasks).toBe(1);
      expect(progress.percentageComplete).toBeGreaterThanOrEqual(0);
      expect(progress.percentageComplete).toBeLessThanOrEqual(100);

      // Wait for completion
      await executionPromise;

      // Check final progress
      const finalProgress = coordinator.getProgress();
      expect(finalProgress.completedTasks).toBe(1);
    });
  });

  describe('Plan Execution with Agent Tasks', () => {
    it('should execute plan containing agent tasks', async () => {
      const planContent = `
metadata:
  id: agent-integration-plan
  name: Agent Integration Test Plan
  description: Plan for testing agent integration
  version: 1.0.0

tasks:
  - id: setup-task
    name: Setup Task
    description: Initial setup
    type: shell
    command: echo "Setup complete"
  - id: agent-review-task
    name: Agent Review Task
    description: Code review using agents
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - src/test.js
    strategy: sequential
    dependsOn:
      - setup-task
  - id: cleanup-task
    name: Cleanup Task
    description: Final cleanup
    type: shell
    command: echo "Cleanup complete"
    dependsOn:
      - agent-review-task
  `;

      const plan = planParser.parseContent(planContent);
      expect(plan.errors).toEqual([]);

      const results = await taskExecutor.executePlan(plan);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === TaskStatus.COMPLETED)).toBe(true);
      
      // Check agent task was executed properly
      const agentTaskResult = results.find(r => r.id === 'agent-review-task');
      expect(agentTaskResult).toBeDefined();
      expect(agentTaskResult!.stdout).toContain('Mock result from code-reviewer agent');
    });

    it('should handle mixed agent and shell tasks', async () => {
      const planContent = `
metadata:
  id: mixed-tasks-plan
  name: Mixed Tasks Test Plan
  description: Plan with both agent and shell tasks
  version: 1.0.0

tasks:
  - id: shell-task-1
    name: Shell Task 1
    description: First shell task
    type: shell
    command: echo "Shell task 1"
  - id: agent-task-1
    name: Agent Task 1
    description: First agent task
    type: security-scanner
    input:
      type: security-scanner
      context:
        files:
          - src/secure.js
    strategy: sequential
  - id: agent-task-2
    name: Agent Task 2
    description: Second agent task
    type: performance-engineer
    input:
      type: performance-engineer
      context:
        files:
          - src/performance.js
    strategy: sequential
  - id: shell-task-2
    name: Shell Task 2
    description: Final shell task
    type: shell
    command: echo "Shell task 2"
    dependsOn:
      - agent-task-1
      - agent-task-2
  `;

      const plan = planParser.parseContent(planContent);
      expect(plan.errors).toEqual([]);

      const results = await taskExecutor.executePlan(plan);

      expect(results).toHaveLength(4);
      expect(results.every(r => r.status === TaskStatus.COMPLETED)).toBe(true);
      
      // Check agent tasks were executed
      const agentTask1Result = results.find(r => r.id === 'agent-task-1');
      const agentTask2Result = results.find(r => r.id === 'agent-task-2');
      
      expect(agentTask1Result).toBeDefined();
      expect(agentTask2Result).toBeDefined();
      expect(agentTask1Result!.stdout).toContain('security-scanner');
      expect(agentTask2Result!.stdout).toContain('performance-engineer');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle agent failures gracefully', async () => {
      // Create a coordinator with short timeout to force failures
      const failingConfig: AgentCoordinatorConfig = {
        ...config,
        defaultTimeout: 1
      };
      const failingCoordinator = new AgentCoordinator(failingConfig);
      const failingPlanGenerator = new PlanGenerator(failingCoordinator);

      const input: PlanGenerationInput = {
        description: 'Complex task that will fail',
        requirements: ['Many requirements']
      };

      const result = await failingPlanGenerator.generatePlan(input);

      expect(result).toBeDefined();
      expect(result.confidence).toBe(ConfidenceLevel.LOW);
    });

    it('should continue execution on non-critical failures', async () => {
      const planContent = `
metadata:
  id: error-handling-plan
  name: Error Handling Test Plan
  description: Plan for testing error handling
  version: 1.0.0

tasks:
  - id: failing-task
    name: Failing Task
    description: Task that will fail
    type: code-reviewer
    input:
      type: code-reviewer
      context:
        files:
          - test.js
    strategy: sequential
    timeout: 1
  - id: recovery-task
    name: Recovery Task
    description: Task that should still run
    type: shell
    command: echo "Recovery successful"
    dependsOn:
      - failing-task
  `;

      const plan = planParser.parseContent(planContent);
      expect(plan.errors).toEqual([]);

      const executor = new TaskExecutor({ 
        continueOnError: true,
        verbose: false 
      });
      executor.setAgentCoordinator(coordinator);

      const results = await executor.executePlan(plan);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe(TaskStatus.FAILED);
      expect(results[1].status).toBe(TaskStatus.COMPLETED);
    });
  });

  describe('CLI Integration', () => {
    it('should initialize CLI with agent support', () => {
      const cli = new ExecutorCLI();
      const program = cli.getProgram();

      expect(program).toBeDefined();
      expect(program.commands.length).toBeGreaterThan(5); // Original commands + agent commands
    });

    it('should have agent orchestration commands', () => {
      const cli = new ExecutorCLI();
      const program = cli.getProgram();

      const commandNames = program.commands.map(cmd => cmd.name());
      
      expect(commandNames).toContain('generate-plan');
      expect(commandNames).toContain('code-review');
      expect(commandNames).toContain('agent-status');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent agent execution', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent-test-${i}`,
        type: AgentType.CODE_REVIEWER,
        name: `Concurrent Test ${i}`,
        description: `Concurrent test task ${i}`,
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: [`test${i}.js`] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      }));

      const startTime = Date.now();
      const results = await coordinator.executeTasks(tasks, {
        type: 'parallel'
      });
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(results.every(r => r.status === AgentTaskStatus.COMPLETED)).toBe(true);
      
      // Should complete faster than sequential execution
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(15000); // Should complete in under 15 seconds
    });

    it('should maintain reasonable memory usage', async () => {
      const initialMemory = process.memoryUsage();
      
      // Execute multiple agent tasks
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `memory-test-${i}`,
        type: AgentType.CODE_REVIEWER,
        name: `Memory Test ${i}`,
        description: `Memory test task ${i}`,
        input: {
          type: AgentType.CODE_REVIEWER,
          context: { files: [`test${i}.js`] }
        },
        strategy: ExecutionStrategy.SEQUENTIAL
      }));

      await coordinator.executeTasks(tasks, {
        type: 'parallel'
      });

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});