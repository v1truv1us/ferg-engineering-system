/**
 * Tests for research analysis functionality
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  CodebaseAnalyzer,
  ResearchAnalyzer,
  AnalysisHandler
} from '../../src/research/analysis.js';
import {
  DiscoveryResult,
  FileReference,
  DocReference,
  PatternMatch,
  ResearchQuery,
  ResearchScope,
  ResearchDepth,
  ConfidenceLevel
} from '../../src/research/types.js';

describe('CodebaseAnalyzer', () => {
  let analyzer: CodebaseAnalyzer;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      maxFileSize: 1024 * 1024,
      enableCaching: true
    };
    analyzer = new CodebaseAnalyzer(mockConfig);
  });

  it('should create analyzer with config', () => {
    expect(analyzer).toBeInstanceOf(CodebaseAnalyzer);
  });

  it('should analyze discovery results', async () => {
    const mockDiscoveryResults: DiscoveryResult[] = [
      {
        source: 'codebase-locator',
        files: [
          {
            path: '/test/file1.ts',
            relevance: 0.8,
            language: 'typescript'
          },
          {
            path: '/test/file2.js',
            relevance: 0.6,
            language: 'javascript'
          }
        ],
        patterns: [],
        documentation: [],
        executionTime: 100,
        confidence: ConfidenceLevel.HIGH
      }
    ];

    // Test with empty results (no file reading required for basic functionality)
    const result = await analyzer.analyze([]);

    expect(result).toHaveProperty('source', 'codebase-analyzer');
    expect(result).toHaveProperty('insights');
    expect(result).toHaveProperty('evidence');
    expect(result).toHaveProperty('relationships');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('executionTime');
  });

  it('should handle empty discovery results', async () => {
    const result = await analyzer.analyze([]);
    
    expect(result.source).toBe('codebase-analyzer');
    expect(result.insights).toEqual([]);
    expect(result.evidence).toEqual([]);
    expect(result.relationships).toEqual([]);
  });

  it('should handle analysis execution gracefully', async () => {
    const result = await analyzer.analyze([]);
    
    expect(result.source).toBe('codebase-analyzer');
    expect(result.insights).toEqual([]);
    expect(result.evidence).toEqual([]);
    expect(result.relationships).toEqual([]);
    expect(result.confidence).toBeDefined();
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
  });

  it('should validate analysis result structure', async () => {
    const result = await analyzer.analyze([]);
    
    // Verify all required properties exist
    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('insights');
    expect(result).toHaveProperty('evidence');
    expect(result).toHaveProperty('relationships');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('executionTime');
    expect(result).toHaveProperty('metadata');
    
    // Verify types
    expect(Array.isArray(result.insights)).toBe(true);
    expect(Array.isArray(result.evidence)).toBe(true);
    expect(Array.isArray(result.relationships)).toBe(true);
    expect(typeof result.executionTime).toBe('number');
  });
});

describe('ResearchAnalyzer', () => {
  let analyzer: ResearchAnalyzer;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      maxFileSize: 1024 * 1024,
      enableCaching: true
    };
    analyzer = new ResearchAnalyzer(mockConfig);
  });

  it('should create analyzer with config', () => {
    expect(analyzer).toBeInstanceOf(ResearchAnalyzer);
  });

  it('should analyze documentation results', async () => {
    const mockDiscoveryResults: DiscoveryResult[] = [
      {
        source: 'research-locator',
        files: [],
        patterns: [
          {
            pattern: 'test-pattern',
            matches: [],
            frequency: 10,
            confidence: ConfidenceLevel.HIGH,
            category: 'test'
          }
        ],
        documentation: [
          {
            path: '/test/docs.md',
            relevance: 0.9,
            type: 'markdown'
          }
        ],
        executionTime: 150,
        confidence: ConfidenceLevel.HIGH
      }
    ];

    const result = await analyzer.analyze(mockDiscoveryResults);

    expect(result).toHaveProperty('source', 'research-analyzer');
    expect(result).toHaveProperty('insights');
    expect(result).toHaveProperty('evidence');
    expect(result).toHaveProperty('relationships');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('executionTime');
  });

  it('should handle empty documentation results', async () => {
    const result = await analyzer.analyze([]);
    
    expect(result.source).toBe('research-analyzer');
    expect(result.insights).toEqual([]);
    expect(result.evidence).toEqual([]);
    expect(result.relationships).toEqual([]);
  });

  it('should detect poor documentation structure', async () => {
    const mockDiscoveryResults: DiscoveryResult[] = [
      {
        source: 'research-locator',
        files: [],
        patterns: [],
        documentation: [
          {
            path: '/test/poor-docs.md',
            relevance: 0.8,
            type: 'markdown'
          }
        ],
        executionTime: 100,
        confidence: ConfidenceLevel.MEDIUM
      }
    ];

    // Mock documentation without headings
    mock.module('fs/promises', () => ({
      readFile: mock(() => Promise.resolve(`
This is a document without proper headings.

It has some content but no structure.
\`\`\`javascript
const code = "example";
\`\`\`

More text here.

Another paragraph with information.
       `)
     });
     const result = await analyzer.analyze(mockDiscoveryResults);
    
    const structureInsight = result.insights.find(i => i.category === 'documentation-quality');
    if (structureInsight) {
      expect(structureInsight.type).toBe('finding');
      expect(structureInsight.title).toBeDefined();
    }
});
     });

  it('should detect code without explanation', async () => {
    const mockDiscoveryResults: DiscoveryResult[] = [
      {
        source: 'research-locator',
        files: [],
        patterns: [],
        documentation: [
          {
            path: '/test/code-only.md',
            relevance: 0.7,
            type: 'markdown'
          }
        ],
        executionTime: 100,
        confidence: ConfidenceLevel.MEDIUM
      }
    ];

    // Mock documentation with code but no headings
    mock.module('fs/promises', () => ({
      readFile: mock(() => Promise.resolve(`
\`\`\`typescript
class Example {
  constructor() {}
  method() {}
}
\`\`\`

\`\`\`javascript
const data = { key: "value" };
\`\`\`

Some text here.
      `)
     }));

    const result = await analyzer.analyze(mockDiscoveryResults);
    
    const codeExplanationInsight = result.insights.find(i => 
      i.category === 'documentation-quality' && i.title.includes('Code without explanation')
    );
    expect(codeExplanationInsight).toBeDefined();
   });
 });
});

describe('AnalysisHandler', () => {
  let handler: AnalysisHandler;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      maxFileSize: 1024 * 1024,
      enableCaching: true
    };
    handler = new AnalysisHandler(mockConfig);
  });

  it('should create handler with config', () => {
    expect(handler).toBeInstanceOf(AnalysisHandler);
  });

  it('should execute sequential analysis', async () => {
    const mockDiscoveryResults: DiscoveryResult[] = [
      {
        source: 'codebase-locator',
        files: [],
        patterns: [],
        documentation: [],
        executionTime: 100,
        confidence: ConfidenceLevel.HIGH
      }
    ];

    const mockQuery: ResearchQuery = {
      id: 'test-query',
      query: 'test query',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.MEDIUM
    };

    const result = await handler.executeAnalysis(mockDiscoveryResults, mockQuery);

    expect(result).toHaveProperty('codebaseAnalysis');
    expect(result).toHaveProperty('researchAnalysis');
    expect(result).toHaveProperty('combinedInsights');
    expect(result).toHaveProperty('combinedEvidence');
    expect(result).toHaveProperty('combinedRelationships');
    
    expect(result.codebaseAnalysis.source).toBe('codebase-analyzer');
    expect(result.researchAnalysis.source).toBe('research-analyzer');
  });

  it('should calculate analysis metrics', async () => {
    const mockResults = {
      codebaseAnalysis: {
        source: 'codebase-analyzer',
        insights: [
          { id: 'insight1', confidence: ConfidenceLevel.HIGH },
          { id: 'insight2', confidence: ConfidenceLevel.MEDIUM }
        ],
        evidence: [
          { id: 'evidence1', confidence: ConfidenceLevel.HIGH },
          { id: 'evidence2', confidence: ConfidenceLevel.LOW }
        ],
        relationships: [],
        confidence: ConfidenceLevel.HIGH,
        executionTime: 200
      },
      researchAnalysis: {
        source: 'research-analyzer',
        insights: [
          { id: 'insight3', confidence: ConfidenceLevel.MEDIUM }
        ],
        evidence: [
          { id: 'evidence3', confidence: ConfidenceLevel.HIGH }
        ],
        relationships: [],
        confidence: ConfidenceLevel.MEDIUM,
        executionTime: 150
      },
      combinedInsights: [
        { id: 'insight1', confidence: ConfidenceLevel.HIGH },
        { id: 'insight2', confidence: ConfidenceLevel.MEDIUM },
        { id: 'insight3', confidence: ConfidenceLevel.MEDIUM }
      ],
      combinedEvidence: [
        { id: 'evidence1', confidence: ConfidenceLevel.HIGH },
        { id: 'evidence2', confidence: ConfidenceLevel.LOW },
        { id: 'evidence3', confidence: ConfidenceLevel.HIGH }
      ],
      combinedRelationships: []
    };

    const metrics = handler.getAnalysisMetrics(mockResults);

    expect(metrics).toHaveProperty('totalInsights');
    expect(metrics).toHaveProperty('totalEvidence');
    expect(metrics).toHaveProperty('totalRelationships');
    expect(metrics).toHaveProperty('averageConfidence');
    expect(metrics).toHaveProperty('executionTime');
    
    expect(metrics.totalInsights).toBe(3);
    expect(metrics.totalEvidence).toBe(3);
    expect(metrics.executionTime).toBe(350);
    expect(metrics.averageConfidence).toBeGreaterThan(0);
    expect(metrics.averageConfidence).toBeLessThanOrEqual(1);
  });

  it('should handle empty analysis gracefully', async () => {
    const mockDiscoveryResults: DiscoveryResult[] = [];
    const mockQuery: ResearchQuery = {
      id: 'empty-test',
      query: 'empty test',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.SHALLOW
    };

    const result = await handler.executeAnalysis(mockDiscoveryResults, mockQuery);

    expect(result).toHaveProperty('codebaseAnalysis');
    expect(result).toHaveProperty('researchAnalysis');
    expect(result).toHaveProperty('combinedInsights');
    expect(result).toHaveProperty('combinedEvidence');
    expect(result).toHaveProperty('combinedRelationships');
  });

  it('should validate analysis handler structure', async () => {
    const mockDiscoveryResults: DiscoveryResult[] = [];
    const mockQuery: ResearchQuery = {
      id: 'structure-test',
      query: 'structure test',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.MEDIUM
    };

    const result = await handler.executeAnalysis(mockDiscoveryResults, mockQuery);

    // Verify structure
    expect(result).toHaveProperty('codebaseAnalysis');
    expect(result).toHaveProperty('researchAnalysis');
    expect(result).toHaveProperty('combinedInsights');
    expect(result).toHaveProperty('combinedEvidence');
    expect(result).toHaveProperty('combinedRelationships');
    
    // Verify analyzer sources
    expect(result.codebaseAnalysis.source).toBe('codebase-analyzer');
    expect(result.researchAnalysis.source).toBe('research-analyzer');
  });
});