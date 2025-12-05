# Phase 1 Implementation Guide: Core Execution Engine

**Duration**: 2 weeks  
**Target**: Build plan parsing, task execution, and quality gates  
**Deliverable**: v0.3.0-alpha with working execution engine

---

## Overview

Phase 1 focuses on building the **core execution infrastructure** that can:
1. Parse plan files (YAML format)
2. Validate plan structure and dependencies
3. Execute tasks in order
4. Run quality gates sequentially
5. Generate execution reports

By the end of Phase 1, you should be able to:
```bash
# Parse and execute a plan
ferg-exec execute plan.yaml

# Run quality gates
ferg-exec gates

# Generate report
ferg-exec report
```

---

## Week 1: Plan Parser & Task Executor

### Day 1-2: Plan Parser Implementation

#### Step 1: Create Type Definitions
**File**: `src/execution/types.ts`

```typescript
// Plan structure types
export interface Plan {
  id: string;
  title: string;
  description: string;
  phases: Phase[];
  metadata?: {
    created: string;
    updated: string;
    author?: string;
  };
}

export interface Phase {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dependencies: string[]; // Task IDs this depends on
  files: string[]; // Files affected by this task
  acceptance_criteria: string[];
  time_estimate_minutes: number;
  complexity: 'low' | 'medium' | 'high';
  command?: string; // Optional command to execute
  agent?: string; // Optional agent to call
}

// Execution types
export interface ParsedPlan extends Plan {
  executionOrder: Task[];
  dependencyMap: Map<string, string[]>;
  validation: ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'missing_field' | 'invalid_type' | 'circular_dependency' | 'missing_dependency';
  taskId?: string;
  message: string;
}

export interface ValidationWarning {
  type: 'missing_estimate' | 'no_acceptance_criteria';
  taskId?: string;
  message: string;
}

export interface TaskResult {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  duration_ms: number;
  timestamp: string;
}

export interface ExecutionReport {
  planId: string;
  startTime: string;
  endTime: string;
  totalDuration_ms: number;
  status: 'success' | 'failed' | 'partial';
  tasksCompleted: number;
  tasksFailed: number;
  tasksSkipped: number;
  results: TaskResult[];
  errors: string[];
}
```

#### Step 2: Implement Plan Parser
**File**: `src/execution/plan-parser.ts`

```typescript
import * as fs from 'fs';
import * as yaml from 'yaml';
import { Plan, ParsedPlan, ValidationResult, ValidationError, ValidationWarning } from './types';

export class PlanParser {
  /**
   * Parse a plan from YAML file
   */
  static parsePlanFile(filePath: string): ParsedPlan {
    const content = fs.readFileSync(filePath, 'utf-8');
    const plan = yaml.parse(content) as Plan;
    return this.parsePlan(plan);
  }

  /**
   * Parse a plan object
   */
  static parsePlan(plan: Plan): ParsedPlan {
    // Validate plan
    const validation = this.validatePlan(plan);
    
    if (!validation.valid) {
      throw new Error(`Invalid plan: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Build dependency map
    const dependencyMap = this.buildDependencyMap(plan);

    // Resolve execution order
    const executionOrder = this.resolveExecutionOrder(plan, dependencyMap);

    return {
      ...plan,
      executionOrder,
      dependencyMap,
      validation,
    };
  }

  /**
   * Validate plan structure
   */
  private static validatePlan(plan: Plan): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!plan.id) {
      errors.push({
        type: 'missing_field',
        message: 'Plan must have an id',
      });
    }

    if (!plan.title) {
      errors.push({
        type: 'missing_field',
        message: 'Plan must have a title',
      });
    }

    if (!plan.phases || plan.phases.length === 0) {
      errors.push({
        type: 'missing_field',
        message: 'Plan must have at least one phase',
      });
    }

    // Validate phases and tasks
    const taskIds = new Set<string>();
    
    plan.phases?.forEach((phase) => {
      if (!phase.id || !phase.title) {
        errors.push({
          type: 'missing_field',
          message: `Phase must have id and title`,
        });
      }

      phase.tasks?.forEach((task) => {
        // Check required fields
        if (!task.id || !task.title) {
          errors.push({
            type: 'missing_field',
            message: `Task must have id and title`,
          });
        }

        if (!task.acceptance_criteria || task.acceptance_criteria.length === 0) {
          warnings.push({
            type: 'no_acceptance_criteria',
            taskId: task.id,
            message: `Task ${task.id} has no acceptance criteria`,
          });
        }

        if (!task.time_estimate_minutes) {
          warnings.push({
            type: 'missing_estimate',
            taskId: task.id,
            message: `Task ${task.id} has no time estimate`,
          });
        }

        taskIds.add(task.id);

        // Validate dependencies
        task.dependencies?.forEach((depId) => {
          if (!taskIds.has(depId)) {
            errors.push({
              type: 'missing_dependency',
              taskId: task.id,
              message: `Task ${task.id} depends on unknown task ${depId}`,
            });
          }
        });
      });
    });

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(plan);
    circularDeps.forEach((taskId) => {
      errors.push({
        type: 'circular_dependency',
        taskId,
        message: `Task ${taskId} has circular dependency`,
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Build dependency map
   */
  private static buildDependencyMap(plan: Plan): Map<string, string[]> {
    const map = new Map<string, string[]>();

    plan.phases?.forEach((phase) => {
      phase.tasks?.forEach((task) => {
        map.set(task.id, task.dependencies || []);
      });
    });

    return map;
  }

  /**
   * Resolve execution order using topological sort
   */
  private static resolveExecutionOrder(plan: Plan, dependencyMap: Map<string, string[]>): Task[] {
    const allTasks = new Map<string, Task>();
    const visited = new Set<string>();
    const result: Task[] = [];

    // Collect all tasks
    plan.phases?.forEach((phase) => {
      phase.tasks?.forEach((task) => {
        allTasks.set(task.id, task);
      });
    });

    // Topological sort using DFS
    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = allTasks.get(taskId);
      if (!task) return;

      // Visit dependencies first
      task.dependencies?.forEach((depId) => {
        visit(depId);
      });

      result.push(task);
    };

    allTasks.forEach((task) => {
      visit(task.id);
    });

    return result;
  }

  /**
   * Detect circular dependencies
   */
  private static detectCircularDependencies(plan: Plan): string[] {
    const circular: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const allTasks = new Map<string, Task>();
    plan.phases?.forEach((phase) => {
      phase.tasks?.forEach((task) => {
        allTasks.set(task.id, task);
      });
    });

    const dfs = (taskId: string): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = allTasks.get(taskId);
      task?.dependencies?.forEach((depId) => {
        if (!visited.has(depId)) {
          if (dfs(depId)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          circular.push(taskId);
          return true;
        }
      });

      recursionStack.delete(taskId);
      return false;
    };

    allTasks.forEach((task) => {
      if (!visited.has(task.id)) {
        dfs(task.id);
      }
    });

    return circular;
  }
}
```

#### Step 3: Write Parser Tests
**File**: `tests/execution/plan-parser.test.ts`

```typescript
import { describe, it, expect } from 'bun:test';
import { PlanParser } from '../../src/execution/plan-parser';
import { Plan } from '../../src/execution/types';

describe('PlanParser', () => {
  describe('parsePlan', () => {
    it('should parse valid plan', () => {
      const plan: Plan = {
        id: 'PLAN-001',
        title: 'Test Plan',
        description: 'A test plan',
        phases: [
          {
            id: 'PHASE-1',
            title: 'Setup',
            tasks: [
              {
                id: 'TASK-1',
                title: 'Initialize',
                dependencies: [],
                files: [],
                acceptance_criteria: ['Initialized'],
                time_estimate_minutes: 30,
                complexity: 'low',
              },
            ],
          },
        ],
      };

      const parsed = PlanParser.parsePlan(plan);
      expect(parsed.valid).toBe(true);
      expect(parsed.executionOrder.length).toBe(1);
      expect(parsed.executionOrder[0].id).toBe('TASK-1');
    });

    it('should detect missing required fields', () => {
      const plan: Plan = {
        id: 'PLAN-001',
        title: '',
        description: '',
        phases: [],
      };

      expect(() => PlanParser.parsePlan(plan)).toThrow();
    });

    it('should resolve task dependencies', () => {
      const plan: Plan = {
        id: 'PLAN-001',
        title: 'Test Plan',
        description: '',
        phases: [
          {
            id: 'PHASE-1',
            title: 'Work',
            tasks: [
              {
                id: 'TASK-1',
                title: 'First',
                dependencies: [],
                files: [],
                acceptance_criteria: ['Done'],
                time_estimate_minutes: 30,
                complexity: 'low',
              },
              {
                id: 'TASK-2',
                title: 'Second',
                dependencies: ['TASK-1'],
                files: [],
                acceptance_criteria: ['Done'],
                time_estimate_minutes: 30,
                complexity: 'low',
              },
            ],
          },
        ],
      };

      const parsed = PlanParser.parsePlan(plan);
      expect(parsed.executionOrder[0].id).toBe('TASK-1');
      expect(parsed.executionOrder[1].id).toBe('TASK-2');
    });

    it('should detect circular dependencies', () => {
      const plan: Plan = {
        id: 'PLAN-001',
        title: 'Test Plan',
        description: '',
        phases: [
          {
            id: 'PHASE-1',
            title: 'Work',
            tasks: [
              {
                id: 'TASK-1',
                title: 'First',
                dependencies: ['TASK-2'],
                files: [],
                acceptance_criteria: ['Done'],
                time_estimate_minutes: 30,
                complexity: 'low',
              },
              {
                id: 'TASK-2',
                title: 'Second',
                dependencies: ['TASK-1'],
                files: [],
                acceptance_criteria: ['Done'],
                time_estimate_minutes: 30,
                complexity: 'low',
              },
            ],
          },
        ],
      };

      expect(() => PlanParser.parsePlan(plan)).toThrow();
    });
  });
});
```

### Day 3-4: Task Executor Implementation

#### Step 4: Implement Task Executor
**File**: `src/execution/task-executor.ts`

```typescript
import { execSync } from 'child_process';
import { ParsedPlan, Task, TaskResult, ExecutionReport } from './types';

export class TaskExecutor {
  private results: Map<string, TaskResult> = new Map();
  private startTime: Date = new Date();

  /**
   * Execute all tasks in a plan
   */
  async executePlan(plan: ParsedPlan, dryRun: boolean = false): Promise<ExecutionReport> {
    this.startTime = new Date();
    this.results.clear();

    console.log(`\n📋 Executing plan: ${plan.title}`);
    console.log(`📊 Total tasks: ${plan.executionOrder.length}\n`);

    let completed = 0;
    let failed = 0;
    let skipped = 0;

    for (const task of plan.executionOrder) {
      try {
        const result = await this.executeTask(task, dryRun);
        this.results.set(task.id, result);

        if (result.status === 'completed') {
          completed++;
          console.log(`✅ ${task.id}: ${task.title}`);
        } else if (result.status === 'failed') {
          failed++;
          console.log(`❌ ${task.id}: ${task.title}`);
          console.log(`   Error: ${result.error}`);
        } else if (result.status === 'skipped') {
          skipped++;
          console.log(`⏭️  ${task.id}: ${task.title}`);
        }
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.results.set(task.id, {
          taskId: task.id,
          status: 'failed',
          error: errorMsg,
          duration_ms: 0,
          timestamp: new Date().toISOString(),
        });
        console.log(`❌ ${task.id}: ${task.title}`);
        console.log(`   Error: ${errorMsg}`);
      }
    }

    const endTime = new Date();
    const totalDuration = endTime.getTime() - this.startTime.getTime();

    const report: ExecutionReport = {
      planId: plan.id,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration_ms: totalDuration,
      status: failed === 0 ? 'success' : 'failed',
      tasksCompleted: completed,
      tasksFailed: failed,
      tasksSkipped: skipped,
      results: Array.from(this.results.values()),
      errors: Array.from(this.results.values())
        .filter(r => r.error)
        .map(r => `${r.taskId}: ${r.error}`),
    };

    this.printReport(report);
    return report;
  }

  /**
   * Execute a single task
   */
  async executeTask(task: Task, dryRun: boolean = false): Promise<TaskResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Check dependencies
      for (const depId of task.dependencies || []) {
        const depResult = this.results.get(depId);
        if (!depResult || depResult.status !== 'completed') {
          return {
            taskId: task.id,
            status: 'skipped',
            error: `Dependency ${depId} not completed`,
            duration_ms: Date.now() - startTime,
            timestamp,
          };
        }
      }

      if (dryRun) {
        return {
          taskId: task.id,
          status: 'completed',
          output: `[DRY RUN] Would execute: ${task.command || task.agent || 'no command'}`,
          duration_ms: Date.now() - startTime,
          timestamp,
        };
      }

      // Execute command if provided
      if (task.command) {
        const output = execSync(task.command, { encoding: 'utf-8' });
        return {
          taskId: task.id,
          status: 'completed',
          output,
          duration_ms: Date.now() - startTime,
          timestamp,
        };
      }

      // Execute agent if provided
      if (task.agent) {
        // TODO: Implement agent execution in Phase 2
        return {
          taskId: task.id,
          status: 'completed',
          output: `[AGENT] Would call: ${task.agent}`,
          duration_ms: Date.now() - startTime,
          timestamp,
        };
      }

      // No command or agent, just mark as completed
      return {
        taskId: task.id,
        status: 'completed',
        output: 'Task completed (no action required)',
        duration_ms: Date.now() - startTime,
        timestamp,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        taskId: task.id,
        status: 'failed',
        error: errorMsg,
        duration_ms: Date.now() - startTime,
        timestamp,
      };
    }
  }

  /**
   * Print execution report
   */
  private printReport(report: ExecutionReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTION REPORT');
    console.log('='.repeat(60));
    console.log(`Plan ID: ${report.planId}`);
    console.log(`Status: ${report.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Duration: ${(report.totalDuration_ms / 1000).toFixed(2)}s`);
    console.log(`\nResults:`);
    console.log(`  ✅ Completed: ${report.tasksCompleted}`);
    console.log(`  ❌ Failed: ${report.tasksFailed}`);
    console.log(`  ⏭️  Skipped: ${report.tasksSkipped}`);

    if (report.errors.length > 0) {
      console.log(`\nErrors:`);
      report.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Get current progress
   */
  getProgress() {
    const total = this.results.size;
    const completed = Array.from(this.results.values()).filter(r => r.status === 'completed').length;
    const failed = Array.from(this.results.values()).filter(r => r.status === 'failed').length;

    return {
      total,
      completed,
      failed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
```

#### Step 5: Write Executor Tests
**File**: `tests/execution/task-executor.test.ts`

```typescript
import { describe, it, expect } from 'bun:test';
import { TaskExecutor } from '../../src/execution/task-executor';
import { PlanParser } from '../../src/execution/plan-parser';
import { Plan } from '../../src/execution/types';

describe('TaskExecutor', () => {
  describe('executePlan', () => {
    it('should execute tasks in order', async () => {
      const plan: Plan = {
        id: 'PLAN-001',
        title: 'Test Plan',
        description: '',
        phases: [
          {
            id: 'PHASE-1',
            title: 'Work',
            tasks: [
              {
                id: 'TASK-1',
                title: 'First',
                dependencies: [],
                files: [],
                acceptance_criteria: ['Done'],
                time_estimate_minutes: 1,
                complexity: 'low',
                command: 'echo "Task 1"',
              },
              {
                id: 'TASK-2',
                title: 'Second',
                dependencies: ['TASK-1'],
                files: [],
                acceptance_criteria: ['Done'],
                time_estimate_minutes: 1,
                complexity: 'low',
                command: 'echo "Task 2"',
              },
            ],
          },
        ],
      };

      const parsed = PlanParser.parsePlan(plan);
      const executor = new TaskExecutor();
      const report = await executor.executePlan(parsed, true); // dry run

      expect(report.status).toBe('success');
      expect(report.tasksCompleted).toBe(2);
      expect(report.tasksFailed).toBe(0);
    });

    it('should skip tasks with failed dependencies', async () => {
      const plan: Plan = {
        id: 'PLAN-001',
        title: 'Test Plan',
        description: '',
        phases: [
          {
            id: 'PHASE-1',
            title: 'Work',
            tasks: [
              {
                id: 'TASK-1',
                title: 'First',
                dependencies: [],
                files: [],
                acceptance_criteria: ['Done'],
                time_estimate_minutes: 1,
                complexity: 'low',
                command: 'false', // Will fail
              },
              {
                id: 'TASK-2',
                title: 'Second',
                dependencies: ['TASK-1'],
                files: [],
                acceptance_criteria: ['Done'],
                time_estimate_minutes: 1,
                complexity: 'low',
                command: 'echo "Task 2"',
              },
            ],
          },
        ],
      };

      const parsed = PlanParser.parsePlan(plan);
      const executor = new TaskExecutor();
      const report = await executor.executePlan(parsed);

      expect(report.tasksFailed).toBeGreaterThan(0);
      expect(report.tasksSkipped).toBeGreaterThan(0);
    });
  });
});
```

### Day 5: Quality Gates Implementation

#### Step 6: Implement Quality Gates
**File**: `src/execution/quality-gates.ts`

```typescript
import { execSync } from 'child_process';

export interface QualityGate {
  id: string;
  name: string;
  command: string;
  timeout: number;
  required: boolean;
  onFailure: 'stop' | 'warn' | 'skip';
}

export interface GateResult {
  gateId: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  duration_ms: number;
  timestamp: string;
}

export interface GatesReport {
  startTime: string;
  endTime: string;
  totalDuration_ms: number;
  status: 'passed' | 'failed' | 'partial';
  results: GateResult[];
  failedGates: string[];
}

export const DEFAULT_GATES: QualityGate[] = [
  {
    id: 'lint',
    name: 'Linting',
    command: 'npm run lint',
    timeout: 60000,
    required: true,
    onFailure: 'stop',
  },
  {
    id: 'types',
    name: 'Type Check',
    command: 'npm run types',
    timeout: 60000,
    required: true,
    onFailure: 'stop',
  },
  {
    id: 'test',
    name: 'Unit Tests',
    command: 'npm run test',
    timeout: 120000,
    required: true,
    onFailure: 'stop',
  },
  {
    id: 'build',
    name: 'Build',
    command: 'npm run build',
    timeout: 120000,
    required: true,
    onFailure: 'stop',
  },
  {
    id: 'integration',
    name: 'Integration Tests',
    command: 'npm run test:integration',
    timeout: 120000,
    required: false,
    onFailure: 'warn',
  },
  {
    id: 'deploy',
    name: 'Deploy Check',
    command: 'npm run deploy:check',
    timeout: 60000,
    required: false,
    onFailure: 'warn',
  },
];

export class QualityGateRunner {
  /**
   * Run all quality gates
   */
  async runGates(gates: QualityGate[] = DEFAULT_GATES): Promise<GatesReport> {
    const startTime = new Date();
    const results: GateResult[] = [];
    const failedGates: string[] = [];

    console.log('\n🚪 Running Quality Gates\n');

    for (const gate of gates) {
      const result = await this.runGate(gate);
      results.push(result);

      if (result.status === 'passed') {
        console.log(`✅ ${gate.name}`);
      } else if (result.status === 'failed') {
        console.log(`❌ ${gate.name}`);
        failedGates.push(gate.id);

        if (gate.onFailure === 'stop') {
          console.log(`\n⛔ Stopping at required gate: ${gate.name}`);
          break;
        } else if (gate.onFailure === 'warn') {
          console.log(`⚠️  Warning: ${gate.name} failed (non-required)`);
        }
      } else if (result.status === 'skipped') {
        console.log(`⏭️  ${gate.name} (skipped)`);
      }
    }

    const endTime = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();

    const report: GatesReport = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration_ms: totalDuration,
      status: failedGates.length === 0 ? 'passed' : 'failed',
      results,
      failedGates,
    };

    this.printReport(report);
    return report;
  }

  /**
   * Run a single gate
   */
  private async runGate(gate: QualityGate): Promise<GateResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const output = execSync(gate.command, {
        encoding: 'utf-8',
        timeout: gate.timeout,
      });

      return {
        gateId: gate.id,
        name: gate.name,
        status: 'passed',
        output,
        duration_ms: Date.now() - startTime,
        timestamp,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        gateId: gate.id,
        name: gate.name,
        status: 'failed',
        error: errorMsg,
        duration_ms: Date.now() - startTime,
        timestamp,
      };
    }
  }

  /**
   * Print gates report
   */
  private printReport(report: GatesReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🚪 QUALITY GATES REPORT');
    console.log('='.repeat(60));
    console.log(`Status: ${report.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Duration: ${(report.totalDuration_ms / 1000).toFixed(2)}s`);
    console.log(`\nGates: ${report.results.length}`);
    console.log(`Passed: ${report.results.filter(r => r.status === 'passed').length}`);
    console.log(`Failed: ${report.results.filter(r => r.status === 'failed').length}`);

    if (report.failedGates.length > 0) {
      console.log(`\nFailed Gates:`);
      report.failedGates.forEach(gateId => {
        console.log(`  - ${gateId}`);
      });
    }

    console.log('='.repeat(60) + '\n');
  }
}
```

---

## Week 2: Integration & Testing

### Day 1-2: CLI Integration

#### Step 7: Create CLI Commands
**File**: `src/cli/executor.ts`

```typescript
import { program } from 'commander';
import { PlanParser } from '../execution/plan-parser';
import { TaskExecutor } from '../execution/task-executor';
import { QualityGateRunner } from '../execution/quality-gates';
import * as fs from 'fs';

export function setupExecutorCommands() {
  const executor = program.command('execute').description('Execute plans and tasks');

  executor
    .command('plan <file>')
    .description('Execute a plan from YAML file')
    .option('--dry-run', 'Run in dry-run mode')
    .action(async (file: string, options) => {
      try {
        const plan = PlanParser.parsePlanFile(file);
        const taskExecutor = new TaskExecutor();
        await taskExecutor.executePlan(plan, options.dryRun);
      } catch (error) {
        console.error('Error executing plan:', error);
        process.exit(1);
      }
    });

  executor
    .command('gates')
    .description('Run quality gates')
    .action(async () => {
      try {
        const runner = new QualityGateRunner();
        const report = await runner.runGates();
        if (report.status === 'failed') {
          process.exit(1);
        }
      } catch (error) {
        console.error('Error running gates:', error);
        process.exit(1);
      }
    });

  executor
    .command('report <file>')
    .description('Generate execution report')
    .action((file: string) => {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const report = JSON.parse(content);
        console.log(JSON.stringify(report, null, 2));
      } catch (error) {
        console.error('Error reading report:', error);
        process.exit(1);
      }
    });
}
```

### Day 3-4: Comprehensive Testing

#### Step 8: Write Integration Tests
**File**: `tests/integration/phase-1.test.ts`

```typescript
import { describe, it, expect } from 'bun:test';
import { PlanParser } from '../../src/execution/plan-parser';
import { TaskExecutor } from '../../src/execution/task-executor';
import { QualityGateRunner } from '../../src/execution/quality-gates';
import { Plan } from '../../src/execution/types';

describe('Phase 1 Integration Tests', () => {
  describe('End-to-end workflow', () => {
    it('should parse, execute, and report', async () => {
      const plan: Plan = {
        id: 'PLAN-001',
        title: 'Integration Test Plan',
        description: 'Test the full workflow',
        phases: [
          {
            id: 'PHASE-1',
            title: 'Setup',
            tasks: [
              {
                id: 'TASK-1',
                title: 'Initialize',
                dependencies: [],
                files: [],
                acceptance_criteria: ['Initialized'],
                time_estimate_minutes: 1,
                complexity: 'low',
                command: 'echo "Setup"',
              },
            ],
          },
          {
            id: 'PHASE-2',
            title: 'Work',
            tasks: [
              {
                id: 'TASK-2',
                title: 'Build',
                dependencies: ['TASK-1'],
                files: [],
                acceptance_criteria: ['Built'],
                time_estimate_minutes: 1,
                complexity: 'medium',
                command: 'echo "Build"',
              },
            ],
          },
        ],
      };

      // Parse
      const parsed = PlanParser.parsePlan(plan);
      expect(parsed.valid).toBe(true);

      // Execute
      const executor = new TaskExecutor();
      const report = await executor.executePlan(parsed, true);
      expect(report.status).toBe('success');
      expect(report.tasksCompleted).toBe(2);
    });
  });
});
```

### Day 5: Documentation & Release

#### Step 9: Create Usage Documentation
**File**: `docs/PHASE-1-USAGE.md`

```markdown
# Phase 1: Core Execution Engine - Usage Guide

## Installation

```bash
npm install
npm run build
```

## Creating a Plan

Create a `plan.yaml` file:

```yaml
plan:
  id: PLAN-001
  title: "My Implementation Plan"
  description: "A detailed plan for implementing features"
  phases:
    - id: PHASE-1
      title: "Setup"
      tasks:
        - id: TASK-1
          title: "Initialize project"
          dependencies: []
          files:
            - package.json
            - tsconfig.json
          acceptance_criteria:
            - "Project initialized"
            - "Dependencies installed"
          time_estimate_minutes: 30
          complexity: low
          command: "npm install"

    - id: PHASE-2
      title: "Development"
      tasks:
        - id: TASK-2
          title: "Implement feature"
          dependencies: [TASK-1]
          files:
            - src/feature.ts
          acceptance_criteria:
            - "Feature implemented"
            - "Tests passing"
          time_estimate_minutes: 120
          complexity: high
          command: "npm run build"
```

## Executing Plans

```bash
# Execute plan
npm run exec plan plan.yaml

# Dry run
npm run exec plan plan.yaml --dry-run

# Run quality gates
npm run exec gates

# View report
npm run exec report report.json
```

## Plan Structure

### Required Fields
- `plan.id` - Unique plan identifier
- `plan.title` - Plan title
- `plan.phases` - Array of phases
- `phase.id` - Unique phase identifier
- `phase.title` - Phase title
- `phase.tasks` - Array of tasks
- `task.id` - Unique task identifier
- `task.title` - Task title
- `task.dependencies` - Array of task IDs this depends on
- `task.files` - Files affected by this task
- `task.acceptance_criteria` - List of acceptance criteria
- `task.time_estimate_minutes` - Time estimate in minutes
- `task.complexity` - low | medium | high

### Optional Fields
- `task.command` - Command to execute
- `task.agent` - Agent to call (Phase 2)
- `plan.metadata` - Plan metadata

## Quality Gates

The system runs 6 quality gates in sequence:

1. **Lint** - Code style checking
2. **Types** - TypeScript type checking
3. **Test** - Unit tests
4. **Build** - Build process
5. **Integration** - Integration tests (optional)
6. **Deploy** - Deployment check (optional)

Gates stop on first failure (unless marked as optional).

## Examples

See `test-data/plans/` for example plans.
```

#### Step 10: Create Release Notes
**File**: `RELEASE-v0.3.0-alpha.md`

```markdown
# v0.3.0-alpha: Core Execution Engine

**Release Date**: [DATE]  
**Status**: Alpha - Ready for testing

## What's New

### Core Execution Engine
- ✅ Plan parser with YAML support
- ✅ Task executor with dependency resolution
- ✅ Quality gate runner (6 gates)
- ✅ Execution reports and progress tracking

### Features
- Parse and validate plan files
- Execute tasks in dependency order
- Run quality gates sequentially
- Generate detailed execution reports
- Dry-run mode for testing
- Comprehensive error handling

### Testing
- 80%+ unit test coverage
- Integration tests for full workflow
- Example plans in test-data/

## Installation

```bash
npm install
npm run build
npm run install:global
```

## Usage

```bash
# Execute a plan
ferg-exec plan plan.yaml

# Run quality gates
ferg-exec gates

# Dry run
ferg-exec plan plan.yaml --dry-run
```

## Known Limitations

- Agent execution not yet implemented (Phase 2)
- No UI dashboard (Phase 4)
- No advanced caching (Phase 4)

## Next Steps

Phase 2 will add:
- Agent orchestration
- Plan generation from descriptions
- Code review execution

## Feedback

Please report issues and feedback on GitHub.
```

---

## Checklist for Phase 1 Completion

### Code Implementation
- [ ] `src/execution/types.ts` - Type definitions
- [ ] `src/execution/plan-parser.ts` - Plan parser
- [ ] `src/execution/task-executor.ts` - Task executor
- [ ] `src/execution/quality-gates.ts` - Quality gates
- [ ] `src/cli/executor.ts` - CLI commands

### Testing
- [ ] `tests/execution/plan-parser.test.ts` - Parser tests
- [ ] `tests/execution/task-executor.test.ts` - Executor tests
- [ ] `tests/execution/quality-gates.test.ts` - Gates tests
- [ ] `tests/integration/phase-1.test.ts` - Integration tests
- [ ] 80%+ test coverage

### Documentation
- [ ] `docs/PHASE-1-USAGE.md` - Usage guide
- [ ] `RELEASE-v0.3.0-alpha.md` - Release notes
- [ ] Example plans in `test-data/plans/`
- [ ] API documentation

### Release
- [ ] All tests passing
- [ ] Build successful
- [ ] Version bumped to 0.3.0-alpha
- [ ] Tag created
- [ ] GitHub release published
- [ ] Global installation tested

---

## Success Criteria

✅ **Phase 1 is complete when:**
1. All code files are implemented and tested
2. 80%+ test coverage achieved
3. All tests passing
4. Build completes in < 100ms
5. Documentation is comprehensive
6. v0.3.0-alpha released and installable
7. Example plans execute successfully

---

## Next: Phase 2

Once Phase 1 is complete, move to Phase 2: Agent Orchestration

See `IMPLEMENTATION-ROADMAP.md` for Phase 2 details.
