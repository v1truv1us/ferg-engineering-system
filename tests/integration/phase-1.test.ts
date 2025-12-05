/**
 * Integration tests for the complete execution engine
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { PlanParser } from '../../src/execution/plan-parser.js';
import { TaskExecutor } from '../../src/execution/task-executor.js';
import { QualityGateRunner } from '../../src/execution/quality-gates.js';
import { TaskType, QualityGateType, TaskStatus } from '../../src/execution/types.js';

describe('Execution Engine Integration', () => {
  const testDir = '/tmp/ferg-test';
  let planParser: PlanParser;
  let taskExecutor: TaskExecutor;
  let gateRunner: QualityGateRunner;

  beforeEach(() => {
    // Create test directory
    try {
      mkdirSync(testDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    planParser = new PlanParser();
    taskExecutor = new TaskExecutor({ workingDirectory: testDir, verbose: false });
    gateRunner = new QualityGateRunner({ workingDirectory: testDir, verbose: false });
  });

  afterEach(() => {
    // Clean up test directory
    try {
      rmdirSync(testDir, { recursive: true });
    } catch (error) {
      // Directory might not exist or be in use
    }
  });

  describe('Complete Workflow', () => {
    it('should execute a complete plan with tasks and quality gates', async () => {
      // Create a test plan file
      const planContent = `
metadata:
  id: integration-test
  name: Integration Test Plan
  version: 1.0.0
  description: A complete integration test plan

tasks:
  - id: setup
    name: Setup Environment
    type: shell
    command: echo "Setting up environment"
    timeout: 30

  - id: build
    name: Build Project
    type: build
    command: echo "Building project"
    dependsOn:
      - setup
    timeout: 60

  - id: test
    name: Run Tests
    type: tests
    command: echo "Running tests ✓ All tests passed"
    dependsOn:
      - build
    timeout: 120

qualityGates:
  - id: lint-gate
    name: Code Linting
    type: lint
    required: true
    config:
      command: echo "Linting passed"

  - id: test-gate
    name: Test Validation
    type: tests
    required: true
    config:
      command: echo "Test validation passed"

  - id: build-gate
    name: Build Validation
    type: build
    required: true
    config:
      command: echo "Build validation passed"
`;

      const planFile = join(testDir, 'test-plan.yaml');
      writeFileSync(planFile, planContent);

      // Parse and execute plan
      const plan = planParser.parseFile(planFile);
      expect(plan.tasks).toHaveLength(3);
      expect(plan.qualityGates).toHaveLength(3);

      // Execute tasks
      const taskResults = await taskExecutor.executePlan(plan);
      expect(taskResults).toHaveLength(3);

      // Check task execution order
      const setupResult = taskResults.find(r => r.id === 'setup');
      const buildResult = taskResults.find(r => r.id === 'build');
      const testResult = taskResults.find(r => r.id === 'test');

      expect(setupResult?.status).toBe(TaskStatus.COMPLETED);
      expect(buildResult?.status).toBe(TaskStatus.COMPLETED);
      expect(testResult?.status).toBe(TaskStatus.COMPLETED);

      // Execute quality gates
      const gateResults = await gateRunner.executeQualityGates(plan.qualityGates!);
      expect(gateResults).toHaveLength(3);

      // All gates should pass
      gateResults.forEach(result => {
        expect(result.passed).toBe(true);
        expect(result.status).toBe(TaskStatus.COMPLETED);
      });

      // Verify execution order
      expect(setupResult?.startTime.getTime()).toBeLessThan(buildResult!.startTime.getTime());
      expect(buildResult?.startTime.getTime()).toBeLessThan(testResult!.startTime.getTime());
    });

    it('should handle plan with failing tasks and dependencies', async () => {
      const planContent = `
metadata:
  id: failure-test
  name: Failure Test Plan
  version: 1.0.0

tasks:
  - id: failing-task
    name: Failing Task
    type: shell
    command: exit 1

  - id: dependent-task
    name: Dependent Task
    type: shell
    command: echo "This should not run"
    dependsOn:
      - failing-task

  - id: independent-task
    name: Independent Task
    type: shell
    command: echo "This should run"
`;

      const planFile = join(testDir, 'failure-plan.yaml');
      writeFileSync(planFile, planContent);

      const plan = planParser.parseFile(planFile);
      const results = await taskExecutor.executePlan(plan);

      expect(results).toHaveLength(1); // Only failing task executes with continueOnError=false

      const failingResult = results.find(r => r.id === 'failing-task');
      expect(failingResult?.status).toBe(TaskStatus.FAILED);

      const dependentResult = taskExecutor.getTaskResult('dependent-task');
      const independentResult = taskExecutor.getTaskResult('independent-task');

      expect(dependentResult).toBeUndefined(); // Should not execute
      expect(independentResult).toBeUndefined(); // Should not execute
    });

    it('should handle quality gate failures correctly', async () => {
      const gates = [
        {
          id: 'passing-gate',
          name: 'Passing Gate',
          type: QualityGateType.LINT,
          required: true,
          config: { command: 'echo "Lint passed"' }
        },
        {
          id: 'failing-gate',
          name: 'Failing Gate',
          type: QualityGateType.TESTS,
          required: true,
          config: { command: 'exit 1' }
        },
        {
          id: 'subsequent-gate',
          name: 'Subsequent Gate',
          type: QualityGateType.BUILD,
          required: false,
          config: { command: 'echo "Should not run"' }
        }
      ];

      const results = await gateRunner.executeQualityGates(gates);

      expect(results).toHaveLength(2); // Should stop after required gate failure

      const passingResult = results.find(r => r.gateId === 'passing-gate');
      const failingResult = results.find(r => r.gateId === 'failing-gate');

      expect(passingResult?.passed).toBe(true);
      expect(failingResult?.passed).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid plan files gracefully', () => {
      const invalidPlan = `
metadata:
  # Missing required fields
  name: Invalid Plan

tasks:
  - id: task1
    # Missing name and command
`;

      const planFile = join(testDir, 'invalid-plan.yaml');
      writeFileSync(planFile, invalidPlan);

      expect(() => planParser.parseFile(planFile)).toThrow();
    });

    it('should handle circular dependencies', () => {
      const circularPlan = `
metadata:
  id: circular-test
  name: Circular Test
  version: 1.0.0

tasks:
  - id: task1
    name: Task 1
    type: shell
    command: echo "Task 1"
    dependsOn:
      - task2

  - id: task2
    name: Task 2
    type: shell
    command: echo "Task 2"
    dependsOn:
      - task1
`;

      const planFile = join(testDir, 'circular-plan.yaml');
      writeFileSync(planFile, circularPlan);

      expect(() => planParser.parseFile(planFile)).toThrow('Circular dependency');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle plans with many tasks efficiently', async () => {
      const tasks = [];
      for (let i = 0; i < 20; i++) {
        tasks.push({
          id: `task-${i}`,
          name: `Task ${i}`,
          type: 'shell',
          command: `echo "Task ${i} completed"`
        });
      }

      const planContent = `
metadata:
  id: performance-test
  name: Performance Test
  version: 1.0.0

tasks:
${tasks.map(task => `  - id: ${task.id}
    name: ${task.name}
    type: ${task.type}
    command: ${task.command}`).join('\n')}
`;

      const planFile = join(testDir, 'performance-plan.yaml');
      writeFileSync(planFile, planContent);

      const startTime = Date.now();
      const plan = planParser.parseFile(planFile);
      const parseTime = Date.now() - startTime;

      expect(plan.tasks).toHaveLength(20);
      expect(parseTime).toBeLessThan(1000); // Should parse quickly

      const executionStart = Date.now();
      const results = await taskExecutor.executePlan(plan);
      const executionTime = Date.now() - executionStart;

      expect(results).toHaveLength(20);
      expect(executionTime).toBeLessThan(5000); // Should execute reasonably fast

      // All tasks should complete successfully
      results.forEach(result => {
        expect(result.status).toBe(TaskStatus.COMPLETED);
      });
    });
  });

  describe('Configuration and Options', () => {
    it('should respect dry run mode', async () => {
      const dryExecutor = new TaskExecutor({ dryRun: true, workingDirectory: testDir });
      const dryRunner = new QualityGateRunner({ dryRun: true, workingDirectory: testDir });

      const planContent = `
metadata:
  id: dry-run-test
  name: Dry Run Test
  version: 1.0.0

tasks:
  - id: dry-task
    name: Dry Task
    type: shell
    command: echo "Should not execute"

qualityGates:
  - id: dry-gate
    name: Dry Gate
    type: lint
    required: true
    config:
      command: echo "Should not execute"
`;

      const planFile = join(testDir, 'dry-run-plan.yaml');
      writeFileSync(planFile, planContent);

      const plan = planParser.parseFile(planFile);

      const taskResults = await dryExecutor.executePlan(plan);
      const gateResults = await dryRunner.executeQualityGates(plan.qualityGates!);

      expect(taskResults).toHaveLength(1);
      expect(gateResults).toHaveLength(1);

      expect(taskResults[0].stdout).toContain('[DRY RUN]');
      expect(gateResults[0].details?.taskResult?.stdout).toContain('[DRY RUN]');
    });
  });
});