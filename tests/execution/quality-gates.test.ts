/**
 * Unit tests for Quality Gates
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { QualityGateRunner } from '../../src/execution/quality-gates.js';
import { QualityGateConfig, QualityGateType, TaskStatus } from '../../src/execution/types.js';

describe('QualityGateRunner', () => {
  let runner: QualityGateRunner;

  beforeEach(() => {
    runner = new QualityGateRunner({ verbose: false });
  });

  describe('Default Gates', () => {
    it('should provide default quality gates configuration', () => {
      const defaultGates = QualityGateRunner.getDefaultGates();
      
      expect(defaultGates).toHaveLength(6);
      
      const gateTypes = defaultGates.map(g => g.type);
      expect(gateTypes).toContain(QualityGateType.LINT);
      expect(gateTypes).toContain(QualityGateType.TYPES);
      expect(gateTypes).toContain(QualityGateType.TESTS);
      expect(gateTypes).toContain(QualityGateType.BUILD);
      expect(gateTypes).toContain(QualityGateType.INTEGRATION);
      expect(gateTypes).toContain(QualityGateType.DEPLOY);
      
      // Check required status
      const lintGate = defaultGates.find(g => g.type === QualityGateType.LINT);
      const integrationGate = defaultGates.find(g => g.type === QualityGateType.INTEGRATION);
      
      expect(lintGate?.required).toBe(true);
      expect(integrationGate?.required).toBe(false);
    });
  });

  describe('Gate Execution', () => {
    it('should execute a simple quality gate successfully', async () => {
      const gate: QualityGateConfig = {
        id: 'test-gate',
        name: 'Test Gate',
        type: QualityGateType.LINT,
        required: true,
        config: {
          command: 'echo "Linting passed"'
        }
      };

      const result = await runner.executeQualityGate(gate);

      expect(result.gateId).toBe('test-gate');
      expect(result.passed).toBe(true);
      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.message).toContain('passed successfully');
    });

    it('should handle failing quality gates', async () => {
      const gate: QualityGateConfig = {
        id: 'fail-gate',
        name: 'Fail Gate',
        type: QualityGateType.LINT,
        required: true,
        config: {
          command: 'exit 1'
        }
      };

      const result = await runner.executeQualityGate(gate);

      expect(result.gateId).toBe('fail-gate');
      expect(result.passed).toBe(false);
      expect(result.status).toBe(TaskStatus.FAILED);
      expect(result.message).toContain('failed with exit code 1');
    });

    it('should handle gate execution errors', async () => {
      const gate: QualityGateConfig = {
        id: 'error-gate',
        name: 'Error Gate',
        type: QualityGateType.LINT,
        required: true,
        config: {
          command: 'nonexistent-command'
        }
      };

      const result = await runner.executeQualityGate(gate);

      expect(result.gateId).toBe('error-gate');
      expect(result.passed).toBe(false);
      expect(result.status).toBe(TaskStatus.FAILED);
      expect(result.message).toContain('failed with exit code 127');
    });
  });

  describe('Multiple Gates Execution', () => {
    it('should execute multiple gates in priority order', async () => {
      const gates: QualityGateConfig[] = [
        {
          id: 'deploy-gate',
          name: 'Deploy Gate',
          type: QualityGateType.DEPLOY,
          required: false,
          config: { command: 'echo "Deploy check"' }
        },
        {
          id: 'lint-gate',
          name: 'Lint Gate',
          type: QualityGateType.LINT,
          required: true,
          config: { command: 'echo "Lint check"' }
        },
        {
          id: 'test-gate',
          name: 'Test Gate',
          type: QualityGateType.TESTS,
          required: true,
          config: { command: 'echo "Test check"' }
        }
      ];

      const results = await runner.executeQualityGates(gates);

      expect(results).toHaveLength(3);
      
      // Should be ordered by priority: LINT -> TESTS -> DEPLOY
      expect(results[0].gateId).toBe('lint-gate');
      expect(results[1].gateId).toBe('test-gate');
      expect(results[2].gateId).toBe('deploy-gate');
      
      // All should pass
      results.forEach(result => {
        expect(result.passed).toBe(true);
      });
    });

    it('should stop on required gate failure', async () => {
      const gates: QualityGateConfig[] = [
        {
          id: 'failing-gate',
          name: 'Failing Gate',
          type: QualityGateType.LINT,
          required: true,
          config: { command: 'exit 1' }
        },
        {
          id: 'subsequent-gate',
          name: 'Subsequent Gate',
          type: QualityGateType.TESTS,
          required: false,
          config: { command: 'echo "Should not run"' }
        }
      ];

      const results = await runner.executeQualityGates(gates);

      expect(results).toHaveLength(1); // Only the failing gate should execute
      expect(results[0].gateId).toBe('failing-gate');
      expect(results[0].passed).toBe(false);
    });

    it('should continue on optional gate failure', async () => {
      const gates: QualityGateConfig[] = [
        {
          id: 'failing-optional-gate',
          name: 'Failing Optional Gate',
          type: QualityGateType.INTEGRATION,
          required: false,
          config: { command: 'exit 1' }
        },
        {
          id: 'subsequent-gate',
          name: 'Subsequent Gate',
          type: QualityGateType.DEPLOY,
          required: false,
          config: { command: 'echo "Should run"' }
        }
      ];

      const results = await runner.executeQualityGates(gates);

      expect(results).toHaveLength(2); // Both gates should execute
      expect(results[0].gateId).toBe('failing-optional-gate');
      expect(results[0].passed).toBe(false);
      expect(results[1].gateId).toBe('subsequent-gate');
      expect(results[1].passed).toBe(true);
    });
  });

  describe('Gate Evaluation Logic', () => {
    it('should evaluate test gates correctly', async () => {
      const successGate: QualityGateConfig = {
        id: 'test-success',
        name: 'Test Success',
        type: QualityGateType.TESTS,
        required: true,
        config: {
          command: 'echo "All tests passed ✓"'
        }
      };

      const failureGate: QualityGateConfig = {
        id: 'test-failure',
        name: 'Test Failure',
        type: QualityGateType.TESTS,
        required: true,
        config: {
          command: 'echo "Tests failed ✗"; exit 1'
        }
      };

      const successResult = await runner.executeQualityGate(successGate);
      const failureResult = await runner.executeQualityGate(failureGate);

      expect(successResult.passed).toBe(true);
      expect(failureResult.passed).toBe(false);
    });

    it('should evaluate build gates correctly', async () => {
      const successGate: QualityGateConfig = {
        id: 'build-success',
        name: 'Build Success',
        type: QualityGateType.BUILD,
        required: true,
        config: {
          command: 'echo "Build completed successfully"'
        }
      };

      const failureGate: QualityGateConfig = {
        id: 'build-failure',
        name: 'Build Failure',
        type: QualityGateType.BUILD,
        required: true,
        config: {
          command: 'echo "Build failed: error"; exit 1'
        }
      };

      const successResult = await runner.executeQualityGate(successGate);
      const failureResult = await runner.executeQualityGate(failureGate);

      expect(successResult.passed).toBe(true);
      expect(failureResult.passed).toBe(false);
    });
  });

  describe('Dry Run Mode', () => {
    it('should simulate gate execution in dry run mode', async () => {
      const dryRunner = new QualityGateRunner({ dryRun: true });
      const gate: QualityGateConfig = {
        id: 'dry-run-gate',
        name: 'Dry Run Gate',
        type: QualityGateType.LINT,
        required: true,
        config: {
          command: 'echo "Should not execute"'
        }
      };

      const result = await dryRunner.executeQualityGate(gate);

      expect(result.passed).toBe(true);
      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.details?.taskResult?.stdout).toContain('[DRY RUN]');
    });
  });

  describe('Configuration', () => {
    it('should use custom timeout and command from config', async () => {
      const gate: QualityGateConfig = {
        id: 'custom-gate',
        name: 'Custom Gate',
        type: QualityGateType.LINT,
        required: true,
        config: {
          command: 'echo "Custom command"',
          timeout: 30
        }
      };

      const result = await runner.executeQualityGate(gate);

      expect(result.passed).toBe(true);
      expect(result.details?.taskResult?.stdout).toContain('Custom command');
    });
  });
});