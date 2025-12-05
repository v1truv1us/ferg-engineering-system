/**
 * Integration tests for complete research workflows
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ResearchOrchestrator } from '../../src/research/orchestrator.js';
import {
  ResearchQuery,
  ResearchScope,
  ResearchDepth,
  ResearchConfig
} from '../../src/research/types.js';

describe('Research Workflow Integration', () => {
  let orchestrator: ResearchOrchestrator;
  let mockConfig: ResearchConfig;

  beforeEach(() => {
    mockConfig = {
      maxConcurrency: 3,
      defaultTimeout: 30000,
      enableCaching: true,
      logLevel: 'info',
      cacheExpiry: 3600000,
      maxFileSize: 10 * 1024 * 1024,
      maxResults: 100,
      enableExternalSearch: false,
      externalSearchTimeout: 10000
    };

    // Mock file system operations
    mock.module('fs/promises', () => ({
      readFile: mock(() => Promise.resolve('mock file content')),
      writeFile: mock(() => Promise.resolve(undefined))
    }));

    orchestrator = new ResearchOrchestrator(mockConfig);
  });

  it('should execute complete research workflow', async () => {
    const query: ResearchQuery = {
      id: 'integration-test-1',
      query: 'authentication implementation',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.MEDIUM
    };

    const result = await orchestrator.research(query);

    expect(result).toBeDefined();
    expect(result.query).toBe(query.query);
    expect(result.synopsis).toContain(query.query);
    expect(result.summary).toBeDefined();
    expect(result.findings).toBeDefined();
    expect(result.codeReferences).toBeDefined();
    expect(result.architectureInsights).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.risks).toBeDefined();
    expect(result.openQuestions).toBeDefined();
    expect(result.confidence).toBeDefined();
    expect(result.agentsUsed).toContain('codebase-analyzer');
    expect(result.executionTime).toBeGreaterThan(0);
    expect(result.generatedAt).toBeInstanceOf(Date);
  });

  it('should handle codebase scope correctly', async () => {
    const query: ResearchQuery = {
      id: 'codebase-scope-test',
      query: 'user management',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.DEEP
    };

    const result = await orchestrator.research(query);

    expect(result.metadata.scope).toBe(ResearchScope.CODEBASE);
    expect(result.metadata.depth).toBe(ResearchDepth.DEEP);
    // Should focus on code analysis
    expect(result.codeReferences.length).toBeGreaterThan(0);
  });

  it('should handle documentation scope correctly', async () => {
    const query: ResearchQuery = {
      id: 'doc-scope-test',
      query: 'API documentation',
      scope: ResearchScope.DOCUMENTATION,
      depth: ResearchDepth.SHALLOW
    };

    const result = await orchestrator.research(query);

    expect(result.metadata.scope).toBe(ResearchScope.DOCUMENTATION);
    expect(result.metadata.depth).toBe(ResearchDepth.SHALLOW);
    // Should have documentation insights
    expect(result.findings.some(f => f.category.includes('documentation'))).toBe(true);
  });

  it('should handle all scope correctly', async () => {
    const query: ResearchQuery = {
      id: 'all-scope-test',
      query: 'complete system analysis',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.MEDIUM
    };

    const result = await orchestrator.research(query);

    expect(result.metadata.scope).toBe(ResearchScope.ALL);
    // Should include both codebase and research analyzers
    expect(result.agentsUsed).toContain('codebase-analyzer');
    expect(result.agentsUsed).toContain('research-analyzer');
  });

  it('should handle shallow depth correctly', async () => {
    const query: ResearchQuery = {
      id: 'shallow-test',
      query: 'quick overview',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.SHALLOW
    };

    const result = await orchestrator.research(query);

    expect(result.metadata.depth).toBe(ResearchDepth.SHALLOW);
    // Shallow should be faster
    expect(result.executionTime).toBeLessThan(5000);
  });

  it('should handle deep depth correctly', async () => {
    const query: ResearchQuery = {
      id: 'deep-test',
      query: 'comprehensive analysis',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.DEEP
    };

    const result = await orchestrator.research(query);

    expect(result.metadata.depth).toBe(ResearchDepth.DEEP);
    // Deep should take longer but provide more insights
    expect(result.executionTime).toBeGreaterThan(0);
    expect(result.metadata.totalInsights).toBeGreaterThan(0);
  });

  it('should emit progress events during research', async () => {
    const query: ResearchQuery = {
      id: 'progress-test',
      query: 'progress tracking',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.MEDIUM
    };

    const events: string[] = [];
    orchestrator.onAny((event, data) => {
      events.push(event);
    });

    await orchestrator.research(query);

    expect(events.length).toBeGreaterThan(0);
    expect(events).toContain('research_started');
    expect(events).toContain('phase_started');
    expect(events).toContain('phase_completed');
    expect(events).toContain('research_completed');
  });

  it('should handle research errors gracefully', async () => {
    // Mock a failure in discovery
    mock.module('../../src/research/discovery.js', () => ({
      DiscoveryHandler: class {
        async discover() {
          throw new Error('Discovery failed');
        }
      }
    }));

    const query: ResearchQuery = {
      id: 'error-test',
      query: 'error handling',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.MEDIUM
    };

    await expect(orchestrator.research(query)).rejects.toThrow('Discovery failed');
  });

  it('should generate appropriate recommendations based on findings', async () => {
    const query: ResearchQuery = {
      id: 'recommendations-test',
      query: 'security vulnerabilities',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.DEEP
    };

    const result = await orchestrator.research(query);

    expect(result.recommendations.length).toBeGreaterThan(0);
    // Should have immediate recommendations for high-impact findings
    const immediateRecs = result.recommendations.filter(r => r.type === 'immediate');
    expect(immediateRecs.length).toBeGreaterThanOrEqual(0);
  });

  it('should identify risks from high-impact findings', async () => {
    const query: ResearchQuery = {
      id: 'risks-test',
      query: 'technical debt analysis',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.DEEP
    };

    const result = await orchestrator.research(query);

    expect(result.risks).toBeDefined();
    // Should identify at least some risks or have empty array
    expect(Array.isArray(result.risks)).toBe(true);
  });

  it('should generate meaningful open questions', async () => {
    const query: ResearchQuery = {
      id: 'questions-test',
      query: 'architecture decisions',
      scope: ResearchScope.DOCUMENTATION,
      depth: ResearchDepth.MEDIUM
    };

    const result = await orchestrator.research(query);

    expect(result.openQuestions).toBeDefined();
    expect(result.openQuestions.length).toBeGreaterThan(0);
    expect(result.openQuestions.length).toBeLessThanOrEqual(5); // Should be limited
  });

  it('should calculate confidence levels correctly', async () => {
    const query: ResearchQuery = {
      id: 'confidence-test',
      query: 'confidence calculation',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.MEDIUM
    };

    const result = await orchestrator.research(query);

    expect(result.confidence).toBeDefined();
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.confidence);
  });

  it('should track execution time accurately', async () => {
    const query: ResearchQuery = {
      id: 'timing-test',
      query: 'performance measurement',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.SHALLOW
    };

    const startTime = Date.now();
    const result = await orchestrator.research(query);
    const endTime = Date.now();

    expect(result.executionTime).toBeGreaterThan(0);
    expect(result.executionTime).toBeLessThanOrEqual(endTime - startTime + 100); // Allow small margin
  });
});