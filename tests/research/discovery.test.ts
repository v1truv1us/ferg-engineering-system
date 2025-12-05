import { describe, it, expect, beforeEach } from 'bun:test';
import { 
  DiscoveryHandler, 
  CodebaseLocator, 
  ResearchLocator, 
  PatternFinder 
} from '../../src/research/discovery.js';
import {
  ResearchQuery,
  ResearchScope,
  ResearchDepth,
  ResearchConstraints,
  ConfidenceLevel
} from '../../src/research/types.js';

describe('Discovery Phase', () => {
  let config: any;
  let handler: DiscoveryHandler;
  let query: ResearchQuery;

  beforeEach(() => {
    config = {
      maxConcurrency: 3,
      defaultTimeout: 30000,
      enableCaching: true,
      logLevel: 'info'
    };
    
    handler = new DiscoveryHandler(config);
    
    query = {
      id: 'test-discovery-1',
      query: 'authentication class implementation',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.MEDIUM,
      constraints: {
        maxFiles: 50,
        maxDepth: 3,
        fileTypes: ['typescript', 'javascript']
      }
    };
  });

  describe('DiscoveryHandler', () => {
    it('should initialize with config', () => {
      expect(handler).toBeDefined();
    });

    it('should execute discovery in parallel', async () => {
      const startTime = Date.now();
      const results = await handler.discover(query);
      const duration = Date.now() - startTime;
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle discovery agent failures gracefully', async () => {
      // Mock a locator that fails
      const mockConfig = { ...config };
      const mockHandler = new DiscoveryHandler(mockConfig);
      
      // This test would require mocking the individual locators
      // For now, just test that it doesn't crash
      const results = await mockHandler.discover(query);
      expect(results).toBeDefined();
    });
  });

  describe('CodebaseLocator', () => {
    let locator: CodebaseLocator;

    beforeEach(() => {
      locator = new CodebaseLocator(config);
    });

    it('should initialize with config', () => {
      expect(locator).toBeDefined();
    });

    it('should parse query to patterns', async () => {
      const patterns = (locator as any).parseQueryToPatterns('authentication service');
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should find relevant files', async () => {
      const result = await locator.discover('authentication', ResearchScope.CODEBASE);
      
      expect(result).toBeDefined();
      expect(result.source).toBe('codebase-locator');
      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
    });

    it('should score file relevance', async () => {
      const result = await locator.discover('typescript', ResearchScope.CODEBASE);
      
      expect(result.files.length).toBeGreaterThan(0);
      
      // Check that files have relevance scores
      const hasRelevance = result.files.every(file => 
        typeof file.relevance === 'number' && 
        file.relevance >= 0 && 
        file.relevance <= 1
      );
      expect(hasRelevance).toBe(true);
    });

    it('should extract snippets for top files', async () => {
      const result = await locator.discover('component', ResearchScope.CODEBASE);
      
      const filesWithSnippets = result.files.filter(file => file.snippet);
      expect(filesWithSnippets.length).toBeGreaterThan(0);
      
      // Check snippet format
      const hasValidSnippets = filesWithSnippets.every(file => 
        typeof file.snippet === 'string' && 
        file.snippet.length > 0
      );
      expect(hasValidSnippets).toBe(true);
    });

    it('should detect file languages', async () => {
      const result = await locator.discover('code', ResearchScope.CODEBASE);
      
      const hasLanguages = result.files.every(file => 
        typeof file.language === 'string' && 
        file.language.length > 0
      );
      expect(hasLanguages).toBe(true);
    });

    it('should apply constraints', async () => {
      const constrainedQuery: ResearchQuery = {
        ...query,
        constraints: {
          maxFiles: 5,
          fileTypes: ['typescript']
        }
      };
      
      const result = await locator.discover('test', ResearchScope.CODEBASE, constrainedQuery.constraints);
      
      expect(result.files.length).toBeLessThanOrEqual(5);
      
      if (result.files.length > 0) {
        const allTsFiles = result.files.every(file => file.language === 'typescript');
        expect(allTsFiles).toBe(true);
      }
    });
  });

  describe('ResearchLocator', () => {
    let locator: ResearchLocator;

    beforeEach(() => {
      locator = new ResearchLocator(config);
    });

    it('should initialize with config', () => {
      expect(locator).toBeDefined();
    });

    it('should find documentation files', async () => {
      const result = await locator.discover('authentication', ResearchScope.DOCUMENTATION);
      
      expect(result).toBeDefined();
      expect(result.source).toBe('research-locator');
      expect(result.documentation).toBeDefined();
      expect(Array.isArray(result.documentation)).toBe(true);
    });

    it('should parse document titles and sections', async () => {
      const result = await locator.discover('README', ResearchScope.DOCUMENTATION);
      
      const hasTitles = result.documentation.every(doc => 
        typeof doc.title === 'string' && 
        doc.title.length > 0
      );
      expect(hasTitles).toBe(true);
    });

    it('should score document relevance', async () => {
      const result = await locator.discover('authentication', ResearchScope.DOCUMENTATION);
      
      const hasRelevance = result.documentation.every(doc => 
        typeof doc.relevance === 'number' && 
        doc.relevance >= 0 && 
        doc.relevance <= 1
      );
      expect(hasRelevance).toBe(true);
    });

    it('should detect document types', async () => {
      const result = await locator.discover('docs', ResearchScope.DOCUMENTATION);
      
      const hasTypes = result.documentation.every(doc => 
        typeof doc.type === 'string' && 
        ['markdown', 'text', 'json', 'yaml'].includes(doc.type)
      );
      expect(hasTypes).toBe(true);
    });

    it('should apply date constraints', async () => {
      const constrainedQuery: ResearchQuery = {
        ...query,
        constraints: {
          dateRange: {
            from: new Date('2024-01-01'),
            to: new Date('2024-12-31')
          }
        }
      };
      
      const result = await locator.discover('test', ResearchScope.DOCUMENTATION, constrainedQuery.constraints);
      
      // All docs should be within date range
      const allInDateRange = result.documentation.every(doc => {
        if (!doc.lastModified) return true;
        return doc.lastModified >= constrainedQuery.constraints!.dateRange!.from! &&
               doc.lastModified <= constrainedQuery.constraints!.dateRange!.to!;
      });
      expect(allInDateRange).toBe(true);
    });
  });

  describe('PatternFinder', () => {
    let locator: PatternFinder;

    beforeEach(() => {
      locator = new PatternFinder(config);
    });

    it('should initialize with config', () => {
      expect(locator).toBeDefined();
    });

    it('should identify patterns from query', async () => {
      const patterns = (locator as any).identifyPatterns('class component service');
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should find similar code implementations', async () => {
      const result = await locator.discover('component', ResearchScope.CODEBASE);
      
      expect(result).toBeDefined();
      expect(result.source).toBe('pattern-finder');
      expect(result.patterns).toBeDefined();
      expect(Array.isArray(result.patterns)).toBe(true);
    });

    it('should categorize patterns', async () => {
      const result = await locator.discover('factory', ResearchScope.CODEBASE);
      
      const hasCategories = result.patterns.every(pattern => 
        typeof pattern.category === 'string' && 
        pattern.category.length > 0
      );
      expect(hasCategories).toBe(true);
    });

    it('should calculate pattern frequency', async () => {
      const result = await locator.discover('function', ResearchScope.CODEBASE);
      
      const hasFrequency = result.patterns.every(pattern => 
        typeof pattern.frequency === 'number' && 
        pattern.frequency >= 0
      );
      expect(hasFrequency).toBe(true);
    });

    it('should calculate pattern confidence', async () => {
      const result = await locator.discover('interface', ResearchScope.CODEBASE);
      
      const hasConfidence = result.patterns.every(pattern => 
        ['low', 'medium', 'high'].includes(pattern.confidence)
      );
      expect(hasConfidence).toBe(true);
    });
  });

  describe('Result Integration', () => {
    it('should merge results from all agents', async () => {
      const results = await handler.discover(query);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // Should have results from different sources
      const sources = results.map(r => r.source);
      expect(sources).toContain('codebase-locator');
      expect(sources).toContain('research-locator');
      expect(sources).toContain('pattern-finder');
    });

    it('should deduplicate overlapping results', async () => {
      const results = await handler.discover(query);
      
      // Check that no duplicate file paths exist
      const allFilePaths = results.flatMap(r => r.files.map(f => f.path));
      const uniqueFilePaths = [...new Set(allFilePaths)];
      
      expect(allFilePaths.length).toBe(uniqueFilePaths.length);
    });

    it('should calculate execution time', async () => {
      const results = await handler.discover(query);
      
      const allHaveExecutionTime = results.every(result => 
        typeof result.executionTime === 'number' && 
        result.executionTime > 0
      );
      expect(allHaveExecutionTime).toBe(true);
    });

    it('should calculate confidence levels', async () => {
      const results = await handler.discover(query);
      
      const allHaveConfidence = results.every(result => 
        ['low', 'medium', 'high'].includes(result.confidence)
      );
      expect(allHaveConfidence).toBe(true);
    });
  });
});