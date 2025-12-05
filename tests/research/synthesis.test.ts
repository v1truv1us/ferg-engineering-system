/**
 * Tests for research synthesis functionality
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { SynthesisHandlerImpl } from '../../src/research/synthesis.js';
import {
  AnalysisResult,
  ResearchQuery,
  ResearchScope,
  ResearchDepth,
  ConfidenceLevel,
  ResearchExportFormat,
  ResearchExportOptions
} from '../../src/research/types.js';

describe('SynthesisHandlerImpl', () => {
  let handler: SynthesisHandlerImpl;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      maxFileSize: 1024 * 1024,
      enableCaching: true
    };
    handler = new SynthesisHandlerImpl(mockConfig);
  });

  it('should create handler with config', () => {
    expect(handler).toBeInstanceOf(SynthesisHandlerImpl);
  });

  it('should synthesize research report from analysis results', async () => {
    const mockQuery: ResearchQuery = {
      id: 'test-query',
      query: 'test research query',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.MEDIUM
    };

    const mockAnalysisResults: AnalysisResult[] = [
      {
        source: 'codebase-analyzer',
        insights: [
          {
            id: 'insight1',
            type: 'finding',
            title: 'Complex file detected',
            description: 'File contains too many functions',
            evidence: ['evidence1', 'evidence2'],
            confidence: ConfidenceLevel.HIGH,
            impact: 'high',
            category: 'complexity-analysis'
          },
          {
            id: 'insight2',
            type: 'pattern',
            title: 'Common pattern found',
            description: 'Pattern appears frequently',
            evidence: ['evidence3'],
            confidence: ConfidenceLevel.MEDIUM,
            impact: 'medium',
            category: 'pattern-analysis'
          }
        ],
        evidence: [
          {
            id: 'evidence1',
            type: 'code',
            source: 'codebase-analyzer',
            content: 'export class TestClass {}',
            file: '/test/file.ts',
            line: 1,
            confidence: ConfidenceLevel.HIGH,
            relevance: 0.8
          },
          {
            id: 'evidence2',
            type: 'code',
            source: 'codebase-analyzer',
            content: 'function testFunction() {}',
            file: '/test/file.ts',
            line: 5,
            confidence: ConfidenceLevel.HIGH,
            relevance: 0.7
          }
        ],
        relationships: [
          {
            id: 'rel1',
            type: 'similarity',
            source: 'insight1',
            target: 'insight2',
            description: 'Insights are related',
            strength: 0.8,
            evidence: ['evidence1']
          }
        ],
        confidence: ConfidenceLevel.HIGH,
        executionTime: 200
      },
      {
        source: 'research-analyzer',
        insights: [
          {
            id: 'insight3',
            type: 'finding',
            title: 'Documentation missing',
            description: 'Key components lack documentation',
            evidence: ['evidence4'],
            confidence: ConfidenceLevel.MEDIUM,
            impact: 'medium',
            category: 'documentation-quality'
          }
        ],
        evidence: [
          {
            id: 'evidence4',
            type: 'documentation',
            source: 'research-analyzer',
            content: '# Missing Documentation',
            file: '/test/docs.md',
            line: 1,
            confidence: ConfidenceLevel.MEDIUM,
            relevance: 0.6
          }
        ],
        relationships: [],
        confidence: ConfidenceLevel.MEDIUM,
        executionTime: 150
      }
    ];

    const result = await handler.synthesize(mockQuery, mockAnalysisResults);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('query', mockQuery.query);
    expect(result).toHaveProperty('synopsis');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('codeReferences');
    expect(result).toHaveProperty('architectureInsights');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('risks');
    expect(result).toHaveProperty('openQuestions');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('agentsUsed');
    expect(result).toHaveProperty('executionTime');
    expect(result).toHaveProperty('generatedAt');
    expect(result).toHaveProperty('metadata');

    // Verify content
    expect(result.synopsis).toContain(mockQuery.query);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.codeReferences.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.openQuestions.length).toBeGreaterThan(0);
    expect(result.agentsUsed).toEqual(['codebase-analyzer', 'research-analyzer']);
    expect(result.metadata.totalInsights).toBe(3);
    expect(result.metadata.totalEvidence).toBe(3);
  });

  it('should handle empty analysis results', async () => {
    const mockQuery: ResearchQuery = {
      id: 'empty-query',
      query: 'empty query',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.SHALLOW
    };

    const result = await handler.synthesize(mockQuery, []);

    expect(result.query).toBe(mockQuery.query);
    expect(result.findings).toEqual([]);
    expect(result.codeReferences).toEqual([]);
    expect(result.architectureInsights).toEqual([]);
    expect(result.findings).toEqual([]);
    expect(result.codeReferences).toEqual([]);
    expect(result.architectureInsights).toEqual([]);
    expect(result.recommendations).toEqual([]);
    expect(result.risks).toEqual([]);
    expect(result.openQuestions.length).toBeGreaterThan(0); // Should still generate questions
  });

  it('should generate appropriate recommendations based on findings', async () => {
    const mockQuery: ResearchQuery = {
      id: 'rec-test',
      query: 'test recommendations',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.DEEP
    };

    const mockAnalysisResults: AnalysisResult[] = [
      {
        source: 'codebase-analyzer',
        insights: [
          {
            id: 'high-impact-insight',
            type: 'finding',
            title: 'Critical security issue',
            description: 'Security vulnerability detected',
            evidence: ['evidence1'],
            confidence: ConfidenceLevel.HIGH,
            impact: 'high',
            category: 'technical-debt'
          },
          {
            id: 'medium-impact-insight',
            type: 'finding',
            title: 'Medium complexity issue',
            description: 'Code complexity is moderate',
            evidence: ['evidence2'],
            confidence: ConfidenceLevel.MEDIUM,
            impact: 'medium',
            category: 'complexity-analysis'
          }
        ],
        evidence: [
          {
            id: 'evidence1',
            type: 'code',
            source: 'codebase-analyzer',
            content: 'security issue',
            file: '/test/security.ts',
            line: 1,
            confidence: ConfidenceLevel.HIGH,
            relevance: 0.9
          }
        ],
        relationships: [],
        confidence: ConfidenceLevel.HIGH,
        executionTime: 100
      }
    ];

    const result = await handler.synthesize(mockQuery, mockAnalysisResults);

    // Should have immediate recommendations for high-impact findings
    const immediateRecs = result.recommendations.filter(r => r.type === 'immediate');
    expect(immediateRecs.length).toBeGreaterThan(0);
    expect(immediateRecs[0].priority).toBe('critical');

    // Should have short-term recommendations for medium-impact findings
    const shortTermRecs = result.recommendations.filter(r => r.type === 'short-term');
    expect(shortTermRecs.length).toBeGreaterThan(0);
    expect(shortTermRecs[0].priority).toBe('medium');
  });

  it('should generate risks for high-impact findings', async () => {
    const mockQuery: ResearchQuery = {
      id: 'risk-test',
      query: 'test risk generation',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.DEEP
    };

    const mockAnalysisResults: AnalysisResult[] = [
      {
        source: 'codebase-analyzer',
        insights: [
          {
            id: 'risk-insight',
            type: 'finding',
            title: 'High risk issue',
            description: 'This poses a significant risk',
            evidence: ['evidence1'],
            confidence: ConfidenceLevel.HIGH,
            impact: 'high',
            category: 'technical-debt'
          }
        ],
        evidence: [
          {
            id: 'evidence1',
            type: 'code',
            source: 'codebase-analyzer',
            content: 'risky code',
            file: '/test/risk.ts',
            line: 1,
            confidence: ConfidenceLevel.HIGH,
            relevance: 0.9
          }
        ],
        relationships: [],
        confidence: ConfidenceLevel.HIGH,
        executionTime: 100
      }
    ];

    const result = await handler.synthesize(mockQuery, mockAnalysisResults);

    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.risks[0].severity).toBe('critical');
    expect(result.risks[0].type).toBe('technical');
    expect(result.risks[0].mitigation).toBeDefined();
  });

  it('should generate appropriate open questions', async () => {
    const mockQuery: ResearchQuery = {
      id: 'questions-test',
      query: 'test question generation',
      scope: ResearchScope.DOCUMENTATION,
      depth: ResearchDepth.SHALLOW
    };

    const result = await handler.synthesize(mockQuery, []);

    expect(result.openQuestions.length).toBeGreaterThan(0);
    expect(result.openQuestions.length).toBeLessThanOrEqual(5); // Should be limited
    
    // Should have scope-specific questions
    const hasScopeQuestion = result.openQuestions.some(q => 
      q.toLowerCase().includes('documentation')
    );
    expect(hasScopeQuestion).toBe(true);
  });

  it('should export report to markdown format', async () => {
    const mockReport = {
      id: 'test-report',
      query: 'test query',
      synopsis: 'Test synopsis',
      summary: ['Test summary point'],
      findings: [
        {
          id: 'finding1',
          category: 'test',
          title: 'Test Finding',
          description: 'Test description',
          evidence: ['evidence1'],
          confidence: ConfidenceLevel.HIGH,
          impact: 'high' as const,
          source: 'test'
        }
      ],
      codeReferences: [
        {
          path: '/test/file.ts',
          lines: [1, 10],
          description: 'Test code reference',
          relevance: 0.8,
          category: 'test'
        }
      ],
      architectureInsights: [],
      recommendations: [
        {
          id: 'rec1',
          type: 'immediate' as const,
          priority: 'critical' as const,
          title: 'Test Recommendation',
          description: 'Test recommendation description',
          rationale: 'Test rationale',
          effort: 'medium' as const,
          impact: 'high' as const
        }
      ],
      risks: [],
      openQuestions: ['Test question?'],
      confidence: ConfidenceLevel.HIGH,
      agentsUsed: ['test-analyzer'],
      executionTime: 100,
      generatedAt: new Date(),
      metadata: {
        totalFiles: 5,
        totalInsights: 3,
        totalEvidence: 10,
        scope: ResearchScope.CODEBASE,
        depth: ResearchDepth.MEDIUM
      }
    };

    const options: ResearchExportOptions = {
      format: ResearchExportFormat.MARKDOWN,
      includeEvidence: true,
      includeCodeReferences: true,
      includeMetadata: true,
      outputPath: '/tmp/test-report.md'
    };

    // Mock writeFile
    mock.module('fs/promises', () => ({
      writeFile: mock(() => Promise.resolve(undefined))
    }));

    const result = await handler.exportReport(mockReport, options);

    expect(result).toBe('/tmp/test-report.md');
  });

  it('should export report to JSON format', async () => {
    const mockReport = {
      id: 'json-test-report',
      query: 'JSON test query',
      synopsis: 'JSON test synopsis',
      summary: ['JSON test summary'],
      findings: [],
      codeReferences: [],
      architectureInsights: [],
      recommendations: [],
      risks: [],
      openQuestions: [],
      confidence: ConfidenceLevel.MEDIUM,
      agentsUsed: ['json-analyzer'],
      executionTime: 50,
      generatedAt: new Date(),
      metadata: {
        totalFiles: 2,
        totalInsights: 1,
        totalEvidence: 3,
        scope: ResearchScope.DOCUMENTATION,
        depth: ResearchDepth.SHALLOW
      }
    };

    const options: ResearchExportOptions = {
      format: ResearchExportFormat.JSON,
      includeEvidence: false,
      includeCodeReferences: false,
      includeMetadata: true,
      outputPath: '/tmp/test-report.json'
    };

    // Mock writeFile
    mock.module('fs/promises', () => ({
      writeFile: mock(() => Promise.resolve(undefined))
    }));

    const result = await handler.exportReport(mockReport, options);

    expect(result).toBe('/tmp/test-report.json');
  });

  it('should export report to HTML format', async () => {
    const mockReport = {
      id: 'html-test-report',
      query: 'HTML test query',
      synopsis: 'HTML test synopsis',
      summary: ['HTML test summary'],
      findings: [],
      codeReferences: [],
      architectureInsights: [],
      recommendations: [],
      risks: [],
      openQuestions: [],
      confidence: ConfidenceLevel.LOW,
      agentsUsed: ['html-analyzer'],
      executionTime: 25,
      generatedAt: new Date(),
      metadata: {
        totalFiles: 1,
        totalInsights: 0,
        totalEvidence: 1,
        scope: ResearchScope.ALL,
        depth: ResearchDepth.DEEP
      }
    };

    const options: ResearchExportOptions = {
      format: ResearchExportFormat.HTML,
      includeEvidence: true,
      includeCodeReferences: true,
      includeMetadata: true,
      outputPath: '/tmp/test-report.html'
    };

    // Mock writeFile
    mock.module('fs/promises', () => ({
      writeFile: mock(() => Promise.resolve(undefined))
    }));

    const result = await handler.exportReport(mockReport, options);

    expect(result).toBe('/tmp/test-report.html');
  });

  it('should handle unsupported export formats', async () => {
    const mockReport = {
      id: 'unsupported-report',
      query: 'unsupported query',
      synopsis: 'unsupported synopsis',
      summary: [],
      findings: [],
      codeReferences: [],
      architectureInsights: [],
      recommendations: [],
      risks: [],
      openQuestions: [],
      confidence: ConfidenceLevel.LOW,
      agentsUsed: [],
      executionTime: 0,
      generatedAt: new Date(),
      metadata: {
        totalFiles: 0,
        totalInsights: 0,
        totalEvidence: 0,
        scope: ResearchScope.CODEBASE,
        depth: ResearchDepth.SHALLOW
      }
    };

    const options: ResearchExportOptions = {
      format: ResearchExportFormat.PDF, // Not implemented
      includeEvidence: true,
      includeCodeReferences: true,
      includeMetadata: true
    };

    await expect(handler.exportReport(mockReport, options)).rejects.toThrow('PDF export not yet implemented');
  });

  it('should calculate overall confidence correctly', async () => {
    const mockQuery: ResearchQuery = {
      id: 'confidence-test',
      query: 'confidence test',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.MEDIUM
    };

    const mockAnalysisResults: AnalysisResult[] = [
      {
        source: 'test-analyzer',
        insights: [
          {
            id: 'high-confidence-insight',
            type: 'finding',
            title: 'High confidence insight',
            description: 'High confidence description',
            evidence: ['evidence1'],
            confidence: ConfidenceLevel.HIGH,
            impact: 'high',
            category: 'test'
          },
          {
            id: 'low-confidence-insight',
            type: 'finding',
            title: 'Low confidence insight',
            description: 'Low confidence description',
            evidence: ['evidence2'],
            confidence: ConfidenceLevel.LOW,
            impact: 'low',
            category: 'test'
          }
        ],
        evidence: [
          {
            id: 'evidence1',
            type: 'code',
            source: 'test-analyzer',
            content: 'high confidence evidence',
            file: '/test/high.ts',
            line: 1,
            confidence: ConfidenceLevel.HIGH,
            relevance: 0.9
          },
          {
            id: 'evidence2',
            type: 'code',
            source: 'test-analyzer',
            content: 'low confidence evidence',
            file: '/test/low.ts',
            line: 1,
            confidence: ConfidenceLevel.LOW,
            relevance: 0.3
          }
        ],
        relationships: [],
        confidence: ConfidenceLevel.MEDIUM,
        executionTime: 100
      }
    ];

    const result = await handler.synthesize(mockQuery, mockAnalysisResults);

    // Should calculate medium confidence (average of high and low)
    expect(result.confidence).toBe(ConfidenceLevel.MEDIUM);
  });

  it('should handle synthesis errors gracefully', async () => {
    const mockQuery: ResearchQuery = {
      id: 'error-test',
      query: 'error test',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.MEDIUM
    };

    // Create invalid analysis results that might cause errors
    const invalidAnalysisResults: AnalysisResult[] = [
      {
        source: 'error-analyzer',
        insights: [
          {
            id: 'invalid-insight',
            type: 'finding' as any,
            title: '', // Empty title might cause issues
            description: '',
            evidence: [], // Empty evidence
            confidence: ConfidenceLevel.LOW,
            impact: 'low',
            category: ''
          }
        ],
        evidence: [],
        relationships: [],
        confidence: ConfidenceLevel.LOW,
        executionTime: 0
      }
    ];

    // Should not throw, but handle gracefully
    const result = await handler.synthesize(mockQuery, invalidAnalysisResults);

    expect(result).toBeDefined();
    expect(result.query).toBe(mockQuery.query);
  });
});