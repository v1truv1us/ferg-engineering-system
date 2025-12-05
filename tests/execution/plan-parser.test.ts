/**
 * Unit tests for the Plan Parser
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { PlanParser } from '../../src/execution/plan-parser.js';
import { TaskType, QualityGateType, ValidationErrorType } from '../../src/execution/types.js';

describe('PlanParser', () => {
  let parser: PlanParser;

  beforeEach(() => {
    parser = new PlanParser();
  });

  describe('Basic Plan Parsing', () => {
    it('should parse a valid minimal plan', () => {
      const planContent = `
metadata:
  id: test-plan
  name: Test Plan
  version: 1.0.0
tasks: []
`;

      const plan = parser.parseContent(planContent);
      
      expect(plan.metadata.id).toBe('test-plan');
      expect(plan.metadata.name).toBe('Test Plan');
      expect(plan.metadata.version).toBe('1.0.0');
      expect(plan.tasks).toEqual([]);
      expect(parser.getErrors()).toHaveLength(0);
    });

    it('should parse a complete plan with tasks and quality gates', () => {
      const planContent = `
metadata:
  id: complete-plan
  name: Complete Plan
  version: 1.0.0
  author: Test Author
  description: A complete test plan
  tags:
    - test
    - example

tasks:
  - id: build
    name: Build Project
    type: build
    command: npm run build
    timeout: 300
    retry:
      maxAttempts: 3
      delay: 5

  - id: test
    name: Run Tests
    type: tests
    command: npm test
    dependsOn:
      - build

qualityGates:
  - id: lint-gate
    name: Code Linting
    type: lint
    required: true
    config:
      files: "src/**/*.ts"
`;

      const plan = parser.parseContent(planContent);
      
      expect(plan.metadata.id).toBe('complete-plan');
      expect(plan.tasks).toHaveLength(2);
      expect(plan.qualityGates).toHaveLength(1);
      
      const buildTask = plan.tasks.find(t => t.id === 'build');
      expect(buildTask?.type).toBe(TaskType.BUILD);
      expect(buildTask?.timeout).toBe(300);
      expect(buildTask?.retry?.maxAttempts).toBe(3);
      
      const testTask = plan.tasks.find(t => t.id === 'test');
      expect(testTask?.dependsOn).toEqual(['build']);
      
      const lintGate = plan.qualityGates?.find(g => g.id === 'lint-gate');
      expect(lintGate?.type).toBe(QualityGateType.LINT);
      expect(lintGate?.required).toBe(true);
      
      expect(parser.getErrors()).toHaveLength(0);
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid YAML syntax', () => {
      const invalidYaml = `
metadata:
  id: test
  name: Test
  invalid: [unclosed array
`;

      expect(() => parser.parseContent(invalidYaml)).toThrow('Invalid YAML syntax');
    });

    it('should require metadata section', () => {
      const planContent = `
tasks: []
`;

      expect(() => parser.parseContent(planContent)).toThrow('metadata section is required');
    });

    it('should require required metadata fields', () => {
      const planContent = `
metadata:
  name: Test Plan
tasks: []
`;

      expect(() => parser.parseContent(planContent)).toThrow('metadata.id is required');
    });

    it('should validate task structure', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks:
  - id: valid-task
    name: Valid Task
    command: echo "hello"
  - id: invalid-task
    name: Invalid Task
    # Missing command field
`;

      expect(() => parser.parseContent(planContent)).toThrow('requires a valid command');
    });

    it('should validate task types', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks:
  - id: task
    name: Task
    command: echo "test"
    type: invalid-type
`;

      expect(() => parser.parseContent(planContent)).toThrow('Invalid task type "invalid-type"');
    });

    it('should validate quality gate types', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks: []
qualityGates:
  - id: gate
    name: Gate
    type: invalid-gate-type
`;

      expect(() => parser.parseContent(planContent)).toThrow('Invalid quality gate type "invalid-gate-type"');
    });

    it('should detect duplicate task IDs', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks:
  - id: duplicate
    name: First Task
    command: echo "first"
  - id: duplicate
    name: Second Task
    command: echo "second"
`;

      expect(() => parser.parseContent(planContent)).toThrow('Duplicate task ID: duplicate');
    });
  });

  describe('Dependency Validation', () => {
    it('should validate task dependencies', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks:
  - id: task1
    name: Task 1
    command: echo "task1"
    dependsOn:
      - nonexistent-task
`;

      expect(() => parser.parseContent(planContent)).toThrow('depends on unknown task "nonexistent-task"');
    });

    it('should detect circular dependencies', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks:
  - id: task1
    name: Task 1
    command: echo "task1"
    dependsOn:
      - task2
  - id: task2
    name: Task 2
    command: echo "task2"
    dependsOn:
      - task1
`;

      expect(() => parser.parseContent(planContent)).toThrow('Circular dependency detected');
    });

    it('should handle complex dependency chains', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks:
  - id: task1
    name: Task 1
    command: echo "task1"
  - id: task2
    name: Task 2
    command: echo "task2"
    dependsOn:
      - task1
  - id: task3
    name: Task 3
    command: echo "task3"
    dependsOn:
      - task2
  - id: task4
    name: Task 4
    command: echo "task4"
    dependsOn:
      - task1
      - task3
`;

      const plan = parser.parseContent(planContent);
      expect(plan.tasks).toHaveLength(4);
      expect(parser.getErrors()).toHaveLength(0);
    });
  });

  describe('Field Validation', () => {
    it('should validate timeout values', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks:
  - id: task
    name: Task
    command: echo "test"
    timeout: -10
`;

      expect(() => parser.parseContent(planContent)).toThrow('timeout must be a positive number');
    });

    it('should validate retry configuration', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks:
  - id: task
    name: Task
    command: echo "test"
    retry:
      maxAttempts: -1
      delay: -5
`;

      expect(() => parser.parseContent(planContent)).toThrow('retry.maxAttempts must be a positive number');
    });

    it('should provide warnings for version format', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: "invalid-version"
tasks: []
`;

      parser.parseContent(planContent);
      const warnings = parser.getWarnings();
      expect(warnings.some(w => w.includes('should follow semantic versioning'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should collect multiple errors', () => {
      const planContent = `
metadata:
  # Missing id and name
  version: 1.0.0
tasks:
  - id: task1
    # Missing name and command
  - id: task2
    name: Task 2
    command: echo "test"
    type: invalid-type
`;

      try {
        parser.parseContent(planContent);
        expect.fail('Should have thrown validation errors');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('metadata.id is required');
        expect(errorMessage).toContain('metadata.name is required');
        expect(errorMessage).toContain('requires a valid name');
        expect(errorMessage).toContain('Invalid task type');
      }
    });

    it('should handle non-object tasks array', () => {
      const planContent = `
metadata:
  id: test
  name: Test
  version: 1.0.0
tasks:
  - "not an object"
  - id: valid
    name: Valid
    command: echo "valid"
`;

      expect(() => parser.parseContent(planContent)).toThrow('Task at index 0 must be an object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty plan', () => {
      const planContent = `
metadata:
  id: empty
  name: Empty Plan
  version: 1.0.0
tasks: []
qualityGates: []
`;

      const plan = parser.parseContent(planContent);
      expect(plan.tasks).toHaveLength(0);
      expect(plan.qualityGates).toHaveLength(0);
      expect(parser.getErrors()).toHaveLength(0);
    });

    it('should handle optional fields gracefully', () => {
      const planContent = `
metadata:
  id: minimal
  name: Minimal Plan
  version: 1.0.0
tasks:
  - id: task
    name: Task
    command: echo "test"
    # All optional fields omitted
`;

      const plan = parser.parseContent(planContent);
      const task = plan.tasks[0];
      expect(task.description).toBeUndefined();
      expect(task.workingDirectory).toBeUndefined();
      expect(task.timeout).toBeUndefined();
      expect(task.retry).toBeUndefined();
      expect(task.dependsOn).toEqual([]);
      expect(task.environment).toEqual({});
    });
  });
});