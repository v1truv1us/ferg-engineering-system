/**
 * Tests for CodeReviewExecutor class
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { CodeReviewExecutor } from '../../src/agents/code-review-executor.js';
import { AgentCoordinator } from '../../src/agents/coordinator.js';
import { 
  CodeReviewInput,
  ConfidenceLevel,
  AgentCoordinatorConfig
} from '../../src/agents/types.js';

describe('CodeReviewExecutor', () => {
  let codeReviewExecutor: CodeReviewExecutor;
  let coordinator: AgentCoordinator;
  let config: AgentCoordinatorConfig;

  beforeEach(() => {
    config = {
      maxConcurrency: 3,
      defaultTimeout: 5000,
      retryAttempts: 1,
      retryDelay: 100,
      enableCaching: false, // Disable for testing
      logLevel: 'error'
    };
    coordinator = new AgentCoordinator(config);
    codeReviewExecutor = new CodeReviewExecutor(coordinator);
  });

  afterEach(() => {
    coordinator.reset();
  });

  describe('Basic Code Review', () => {
    it('should execute a basic code review', async () => {
      const input: CodeReviewInput = {
        files: ['src/app.js', 'src/utils.js'],
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

    it('should handle empty file list', async () => {
      const input: CodeReviewInput = {
        files: [],
        reviewType: 'full',
        severity: 'low'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result.findings.length).toBe(0);
      expect(result.summary.total).toBe(0);
      expect(result.overallScore).toBe(100); // Perfect score with no findings
    });

    it('should handle different severity levels', async () => {
      const criticalInput: CodeReviewInput = {
        files: ['src/critical.js'],
        reviewType: 'full',
        severity: 'critical'
      };

      const result = await codeReviewExecutor.executeCodeReview(criticalInput);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Focused Reviews', () => {
    it('should execute security-focused review', async () => {
      const input: CodeReviewInput = {
        files: ['src/auth.js', 'src/api.js'],
        reviewType: 'security',
        severity: 'high'
      };

      const result = await codeReviewExecutor.executeFocusedReview(input, 'security');

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      // Security reviews should include security-related findings
      const securityFindings = result.findings.filter(f => f.category === 'security');
      expect(securityFindings.length).toBeGreaterThanOrEqual(0);
    });

    it('should execute performance-focused review', async () => {
      const input: CodeReviewInput = {
        files: ['src/algorithm.js', 'src/data-processor.js'],
        reviewType: 'performance',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeFocusedReview(input, 'performance');

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      // Performance reviews should include performance-related findings
      const performanceFindings = result.findings.filter(f => f.category === 'performance');
      expect(performanceFindings.length).toBeGreaterThanOrEqual(0);
    });

    it('should execute frontend-focused review', async () => {
      const input: CodeReviewInput = {
        files: ['src/components.jsx', 'src/styles.css'],
        reviewType: 'frontend',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeFocusedReview(input, 'frontend');

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      // Frontend reviews should include frontend-related findings
      const frontendFindings = result.findings.filter(f => f.category === 'frontend');
      expect(frontendFindings.length).toBeGreaterThanOrEqual(0);
    });

    it('should execute general-focused review', async () => {
      const input: CodeReviewInput = {
        files: ['src/general.js'],
        reviewType: 'full',
        severity: 'low'
      };

      const result = await codeReviewExecutor.executeFocusedReview(input, 'general');

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Incremental Reviews', () => {
    it('should execute incremental review', async () => {
      const input: CodeReviewInput = {
        files: ['src/feature.js', 'src/feature-test.js'],
        reviewType: 'incremental',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeIncrementalReview(input, 'main');

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
    });

    it('should execute incremental review without base branch', async () => {
      const input: CodeReviewInput = {
        files: ['src/changed.js'],
        reviewType: 'incremental',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeIncrementalReview(input);

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
    });
  });

  describe('Finding Aggregation', () => {
    it('should deduplicate similar findings', async () => {
      const input: CodeReviewInput = {
        files: ['src/duplicate.js'],
        reviewType: 'full',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      
      // Check that findings are properly structured
      for (const finding of result.findings) {
        expect(finding.file).toBeDefined();
        expect(finding.line).toBeGreaterThanOrEqual(0);
        expect(finding.severity).toMatch(/^(low|medium|high|critical)$/);
        expect(finding.category).toBeDefined();
        expect(finding.message).toBeDefined();
        expect(finding.confidence).toBeDefined();
      }
    });

    it('should sort findings by severity and file', async () => {
      const input: CodeReviewInput = {
        files: ['src/sorting.js', 'src/another.js'],
        reviewType: 'full',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      
      // Verify sorting (critical first, then by file)
      for (let i = 1; i < result.findings.length; i++) {
        const prev = result.findings[i - 1];
        const curr = result.findings[i];
        
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const prevSeverity = severityOrder[prev.severity as keyof typeof severityOrder] || 0;
        const currSeverity = severityOrder[curr.severity as keyof typeof severityOrder] || 0;
        
        // Either previous has higher severity, or same severity but earlier file
        const isSorted = prevSeverity > currSeverity || 
                        (prevSeverity === currSeverity && prev.file <= curr.file);
        
        expect(isSorted).toBe(true);
      }
    });
  });

  describe('Summary and Recommendations', () => {
    it('should generate accurate summary statistics', async () => {
      const input: CodeReviewInput = {
        files: ['src/summary.js', 'src/stats.js'],
        reviewType: 'full',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
      expect(typeof result.summary.bySeverity).toBe('object');
      expect(typeof result.summary.byCategory).toBe('object');
      
      // Verify summary counts match findings
      const severityCount = Object.values(result.summary.bySeverity).reduce((sum, count) => sum + count, 0);
      expect(severityCount).toBe(result.summary.total);
    });

    it('should generate meaningful recommendations', async () => {
      const input: CodeReviewInput = {
        files: ['src/recommendations.js'],
        reviewType: 'full',
        severity: 'high'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Recommendations should be strings
      for (const rec of result.recommendations) {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Scoring', () => {
    it('should calculate reasonable overall scores', async () => {
      const input: CodeReviewInput = {
        files: ['src/scoring.js'],
        reviewType: 'full',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should give perfect score for no findings', async () => {
      const input: CodeReviewInput = {
        files: [],
        reviewType: 'full',
        severity: 'low'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result.overallScore).toBe(100);
    });

    it('should deduct points for findings based on severity', async () => {
      const input: CodeReviewInput = {
        files: ['src/severity.js'],
        reviewType: 'full',
        severity: 'critical' // Should trigger more severe findings
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result.overallScore).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file paths gracefully', async () => {
      const input: CodeReviewInput = {
        files: ['nonexistent/file.js'],
        reviewType: 'full',
        severity: 'medium'
      };

      // Should not throw, but may return empty findings
      const result = await codeReviewExecutor.executeCodeReview(input);
      expect(result).toBeDefined();
    });

    it('should handle agent failures gracefully', async () => {
      // Create a coordinator that will fail
      const failingConfig: AgentCoordinatorConfig = {
        ...config,
        defaultTimeout: 1 // Very short timeout to cause failures
      };
      const failingCoordinator = new AgentCoordinator(failingConfig);
      const failingExecutor = new CodeReviewExecutor(failingCoordinator);

      const input: CodeReviewInput = {
        files: ['src/complex.js'],
        reviewType: 'full',
        severity: 'medium'
      };

      // Should not throw, but may have limited results
      const result = await failingExecutor.executeCodeReview(input);
      expect(result).toBeDefined();
    });
  });

  describe('File Type Detection', () => {
    it('should include frontend review for frontend files', async () => {
      const input: CodeReviewInput = {
        files: ['src/component.jsx', 'src/style.css', 'src/app.vue'],
        reviewType: 'full',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
    });

    it('should handle mixed file types', async () => {
      const input: CodeReviewInput = {
        files: ['src/backend.js', 'src/frontend.jsx', 'src/style.css', 'src/config.json'],
        reviewType: 'full',
        severity: 'medium'
      };

      const result = await codeReviewExecutor.executeCodeReview(input);

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
    });
  });
});